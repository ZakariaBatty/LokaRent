import type { Prisma } from "@lokarent/db";
import {
  createId,
  createNotFoundError,
  publishDomainEvent,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import { enforcePlanLimitService } from "@/modules/workspace/billing/services/billing.service";
import {
  createAgency,
  createCompany,
  findAgencyById,
  findCompanyById,
  findCompanyBySlug,
  getCompanyUsageCounts,
  listActiveAgencies,
  listWorkspaceAgencies,
  softDeleteAgency,
  softDeleteCompany,
  updateAgency,
  updateCompany,
} from "../repositories/agencies.repository";

export type WorkspaceActor = {
  userId?: string | null;
  actorName?: string;
};

type CompanyCreateData = Omit<Parameters<typeof createCompany>[0], "id">;
type AgencyCreateData = Omit<Parameters<typeof createAgency>[0], "id" | "companyId">;

function toJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function safeAgencySnapshot(agency: {
  id: string;
  name: string;
  code: string;
  status: string;
  phone?: string | null;
  email?: string | null;
  address?: unknown;
}): Prisma.InputJsonObject {
  return {
    id: agency.id,
    name: agency.name,
    code: agency.code,
    status: agency.status,
    phone: agency.phone ?? null,
    email: agency.email ?? null,
    address: toJsonValue(agency.address),
  };
}

async function writeWorkspaceAgencyLogs(
  input: WorkspaceActor & {
    companyId: string;
    agencyId: string;
    action: "AgencyCreated" | "AgencyUpdated" | "AgencyDeactivated";
    changes: Prisma.InputJsonObject;
    db: Parameters<typeof writeAuditLog>[1];
  },
) {
  await writeAuditLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      action: input.action,
      entityType: "agency",
      entityId: input.agencyId,
      changes: input.changes,
    },
    input.db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "agency",
      entityId: input.agencyId,
      verb: input.action,
      metadata: input.changes,
    },
    input.db,
  );
}

export async function getCompanyService(input: { companyId: string }) {
  const company = await findCompanyById(input);
  if (!company) throw createNotFoundError("Company", input);
  return company;
}

export async function getCompanyBySlugService(slug: string) {
  const company = await findCompanyBySlug({ slug });
  if (!company) throw createNotFoundError("Company", { slug });
  return company;
}

export async function createCompanyService(
  input: WorkspaceActor & { data: CompanyCreateData },
) {
  const company = await createCompany({ ...input.data, id: createId() });
  await publishDomainEvent({
    name: "CompanyCreated",
    companyId: company.id,
    entityType: "company",
    entityId: company.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return company;
}

export async function updateCompanyService(
  input: WorkspaceActor & {
    companyId: string;
    data: Parameters<typeof updateCompany>[0]["data"];
  },
) {
  await getCompanyService(input);
  await updateCompany(input);
  return getCompanyService(input);
}

export async function deactivateCompanyService(
  input: WorkspaceActor & { companyId: string },
) {
  await getCompanyService(input);
  const result = await softDeleteCompany({
    companyId: input.companyId,
    deletedBy: input.userId ?? null,
  });
  await publishDomainEvent({
    name: "CompanyDeactivated",
    companyId: input.companyId,
    entityType: "company",
    entityId: input.companyId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function getAgencyService(input: { companyId: string; agencyId: string }) {
  const agency = await findAgencyById(input);
  if (!agency) throw createNotFoundError("Agency", input);
  return agency;
}

export async function listActiveAgenciesService(companyId: string) {
  await getCompanyService({ companyId });
  return listActiveAgencies(companyId);
}

export async function listWorkspaceAgenciesService(companyId: string) {
  await getCompanyService({ companyId });
  return listWorkspaceAgencies(companyId);
}

export async function createAgencyService(
  input: WorkspaceActor & {
    data: AgencyCreateData;
    companyId: string;
    maxAgencies?: number;
  },
) {
  const [company, usage] = await Promise.all([
    getCompanyService({ companyId: input.companyId }),
    getCompanyUsageCounts(input.companyId),
  ]);
  await enforcePlanLimitService({
    planId: company.planId,
    limitKey: "max_agencies",
    currentUsage: usage.agencies,
    requestedIncrement: 1,
  });

  const agency = await runInTransaction(async (db) => {
    const created = await createAgency({
      ...input.data,
      id: createId(),
      companyId: input.companyId,
    }, db);
    await writeWorkspaceAgencyLogs({
      companyId: created.companyId,
      agencyId: created.id,
      userId: input.userId,
      actorName: input.actorName,
      action: "AgencyCreated",
      changes: { after: safeAgencySnapshot(created) },
      db,
    });
    return created;
  });

  await publishDomainEvent({
    name: "AgencyCreated",
    companyId: agency.companyId,
    agencyId: agency.id,
    entityType: "agency",
    entityId: agency.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return agency;
}

export async function updateAgencyService(
  input: WorkspaceActor & {
    companyId: string;
    agencyId: string;
    data: Parameters<typeof updateAgency>[0]["data"];
  },
) {
  const result = await runInTransaction(async (db) => {
    const before = await findAgencyById(input, db);
    if (!before) throw createNotFoundError("Agency", input);
    await updateAgency(input, db);
    const after = await findAgencyById(input, db);
    if (!after) throw createNotFoundError("Agency", input);
    await writeWorkspaceAgencyLogs({
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "AgencyUpdated",
      changes: {
        before: safeAgencySnapshot(before),
        after: safeAgencySnapshot(after),
      },
      db,
    });
    return after;
  });
  return result;
}

export async function deactivateAgencyService(
  input: WorkspaceActor & { companyId: string; agencyId: string },
) {
  const result = await runInTransaction(async (db) => {
    const before = await findAgencyById(input, db);
    if (!before) throw createNotFoundError("Agency", input);
    const deleted = await softDeleteAgency({
      ...input,
      deletedBy: input.userId ?? null,
    }, db);
    const after = await findAgencyById({ ...input, includeDeleted: true }, db);
    await writeWorkspaceAgencyLogs({
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "AgencyDeactivated",
      changes: {
        before: safeAgencySnapshot(before),
        after: after
          ? {
              ...safeAgencySnapshot(after),
              deletedAt: after.deletedAt?.toISOString() ?? null,
            }
          : null,
      },
      db,
    });
    return deleted;
  });

  await publishDomainEvent({
    name: "AgencyDeactivated",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "agency",
    entityId: input.agencyId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function getCompanyUsageCountsService(companyId: string) {
  await getCompanyService({ companyId });
  return getCompanyUsageCounts(companyId);
}

export const agenciesService = {
  getCompanyService,
  getCompanyBySlugService,
  createCompanyService,
  updateCompanyService,
  deactivateCompanyService,
  getAgencyService,
  listActiveAgenciesService,
  listWorkspaceAgenciesService,
  createAgencyService,
  updateAgencyService,
  deactivateAgencyService,
  getCompanyUsageCountsService,
};
