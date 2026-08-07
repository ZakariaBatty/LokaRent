import { createId, createNotFoundError, publishDomainEvent } from "@/shared";
import { enforcePlanLimitService } from "@/modules/workspace/billing/services/billing.service";
import {
  createAgency,
  createCompany,
  findAgencyById,
  findCompanyById,
  findCompanyBySlug,
  getCompanyUsageCounts,
  listActiveAgencies,
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

  const agency = await createAgency({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
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
  await getAgencyService(input);
  await updateAgency(input);
  return getAgencyService(input);
}

export async function deactivateAgencyService(
  input: WorkspaceActor & { companyId: string; agencyId: string },
) {
  await getAgencyService(input);
  const result = await softDeleteAgency({
    ...input,
    deletedBy: input.userId ?? null,
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
  createAgencyService,
  updateAgencyService,
  deactivateAgencyService,
  getCompanyUsageCountsService,
};
