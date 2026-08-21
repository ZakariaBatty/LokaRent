import type { Prisma } from "@lokarent/db";
import {
  createId,
  createNotFoundError,
  createValidationError,
  publishDomainEvent,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import { getCompanyService } from "@/modules/workspace/agencies/services/agencies.service";
import { enforcePlanLimitService } from "@/modules/workspace/billing/services/billing.service";
import {
  createAgencyMembership,
  createCompanyMembership,
  findAgencyMembership,
  findCompanyMembership,
  listCompanyAgencyMemberships,
  listAgencyMemberships,
  listCompanyMemberships,
  listUserAgencyMemberships,
  softDeleteAgencyMembership,
  softDeleteCompanyMembership,
  updateAgencyMembership,
  updateCompanyMembership,
} from "../repositories/members.repository";

export type MemberActor = {
  userId?: string | null;
  actorName?: string;
};

type CompanyMembershipCreateData = Omit<Parameters<typeof createCompanyMembership>[0], "id" | "companyId">;
type AgencyMembershipCreateData = Omit<Parameters<typeof createAgencyMembership>[0], "id" | "companyId" | "agencyId">;

function safeAgencyMembershipSnapshot(membership: {
  id: string;
  companyId: string;
  agencyId: string;
  userId: string;
  roleId: string;
  roleScope: string;
  status: string;
  isPrimary: boolean;
  joinedAt?: Date | null;
  deletedAt?: Date | null;
}) {
  return {
    id: membership.id,
    companyId: membership.companyId,
    agencyId: membership.agencyId,
    userId: membership.userId,
    roleId: membership.roleId,
    roleScope: membership.roleScope,
    status: membership.status,
    isPrimary: membership.isPrimary,
    joinedAt: membership.joinedAt?.toISOString() ?? null,
    deletedAt: membership.deletedAt?.toISOString() ?? null,
  } satisfies Prisma.InputJsonObject;
}

function safeCompanyMembershipSnapshot(membership: {
  id: string;
  companyId: string;
  userId: string;
  roleId: string;
  roleScope: string;
  status: string;
  deletedAt?: Date | null;
}) {
  return {
    id: membership.id,
    companyId: membership.companyId,
    userId: membership.userId,
    roleId: membership.roleId,
    roleScope: membership.roleScope,
    status: membership.status,
    deletedAt: membership.deletedAt?.toISOString() ?? null,
  } satisfies Prisma.InputJsonObject;
}

async function writeWorkspaceAgencyMembershipLogs(
  input: MemberActor & {
    companyId: string;
    agencyId: string;
    membershipId: string;
    action:
      | "AgencyMembershipCreated"
      | "AgencyMembershipRoleUpdated"
      | "AgencyMembershipRemoved";
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
      entityType: "agency_membership",
      entityId: input.membershipId,
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
      entityType: "agency_membership",
      entityId: input.membershipId,
      verb: input.action,
      metadata: input.changes,
    },
    input.db,
  );
}

async function writeWorkspaceCompanyMembershipLogs(
  input: MemberActor & {
    companyId: string;
    membershipId: string;
    action: "CompanyMembershipRemoved";
    changes: Prisma.InputJsonObject;
    db: Parameters<typeof writeAuditLog>[1];
  },
) {
  await writeAuditLog(
    {
      id: createId(),
      companyId: input.companyId,
      userId: input.userId,
      action: input.action,
      entityType: "company_membership",
      entityId: input.membershipId,
      changes: input.changes,
    },
    input.db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.companyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "company_membership",
      entityId: input.membershipId,
      verb: input.action,
      metadata: input.changes,
    },
    input.db,
  );
}

export async function getCompanyMembershipService(input: {
  companyId: string;
  userId: string;
}) {
  const membership = await findCompanyMembership(input);
  if (!membership) throw createNotFoundError("Company membership", input);
  return membership;
}

export async function listCompanyMembershipsService(input: {
  companyId: string;
  includeDeleted?: boolean;
}) {
  return listCompanyMemberships(input);
}

export async function listWorkspaceMembersService(input: {
  companyId: string;
  includeDeleted?: boolean;
}) {
  const [companyMemberships, agencyMemberships] = await Promise.all([
    listCompanyMemberships(input),
    listCompanyAgencyMemberships(input),
  ]);

  return { companyMemberships, agencyMemberships };
}

export async function createCompanyMembershipService(
  input: MemberActor & { companyId: string; data: CompanyMembershipCreateData },
) {
  const [company, activeMembers] = await Promise.all([
    getCompanyService({ companyId: input.companyId }),
    listCompanyMemberships({ companyId: input.companyId }),
  ]);
  await enforcePlanLimitService({
    planId: company.planId,
    limitKey: "max_users",
    currentUsage: activeMembers.length,
    requestedIncrement: 1,
  });

  const membership = await createCompanyMembership({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
  });
  await publishDomainEvent({
    name: "MemberAdded",
    companyId: membership.companyId,
    entityType: "company_membership",
    entityId: membership.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return membership;
}

export async function updateCompanyMembershipService(
  input: {
    companyId: string;
    membershipId: string;
    data: Parameters<typeof updateCompanyMembership>[0]["data"];
  },
) {
  return updateCompanyMembership(input);
}

export async function removeCompanyMembershipService(
  input: MemberActor & { companyId: string; membershipId: string },
) {
  return runInTransaction(async (db) => {
    const activeMembers = await listCompanyMemberships({ companyId: input.companyId }, db);
    if (activeMembers.length <= 1) {
      throw createValidationError("A company must keep at least one active member");
    }
    const before = await db.companyMembership.findFirst({
      where: { id: input.membershipId, companyId: input.companyId, deletedAt: null },
    });
    if (!before) throw createNotFoundError("Company membership", input);
    const removed = await softDeleteCompanyMembership({
      ...input,
      deletedBy: input.userId ?? null,
    }, db);
    const after = await db.companyMembership.findFirst({
      where: { id: input.membershipId, companyId: input.companyId },
    });
    await writeWorkspaceCompanyMembershipLogs({
      companyId: input.companyId,
      membershipId: input.membershipId,
      userId: input.userId,
      actorName: input.actorName,
      action: "CompanyMembershipRemoved",
      changes: {
        before: safeCompanyMembershipSnapshot(before),
        after: after ? safeCompanyMembershipSnapshot(after) : null,
      },
      db,
    });
    return removed;
  });
}

export async function getAgencyMembershipService(input: {
  companyId: string;
  agencyId: string;
  userId: string;
}) {
  const membership = await findAgencyMembership(input);
  if (!membership) throw createNotFoundError("Agency membership", input);
  return membership;
}

export async function listAgencyMembershipsService(input: {
  companyId: string;
  agencyId: string;
  includeDeleted?: boolean;
}) {
  return listAgencyMemberships(input);
}

export async function listUserAgencyMembershipsService(input: {
  companyId: string;
  userId: string;
  includeDeleted?: boolean;
}) {
  return listUserAgencyMemberships(input);
}

export async function assignUserToAgencyService(
  input: MemberActor & { companyId: string; agencyId: string; data: AgencyMembershipCreateData },
) {
  const membership = await runInTransaction(async (db) => {
    const existing = await findAgencyMembership({
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.data.userId,
      includeDeleted: true,
    }, db);
    if (existing && !existing.deletedAt) {
      throw createValidationError("User is already assigned to this agency");
    }
    const created = await createAgencyMembership({
      ...input.data,
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
    }, db);
    await writeWorkspaceAgencyMembershipLogs({
      companyId: created.companyId,
      agencyId: created.agencyId,
      membershipId: created.id,
      userId: input.userId,
      actorName: input.actorName,
      action: "AgencyMembershipCreated",
      changes: { after: safeAgencyMembershipSnapshot(created) },
      db,
    });
    return created;
  });

  await publishDomainEvent({
    name: "MemberAssignedToAgency",
    companyId: membership.companyId,
    agencyId: membership.agencyId,
    entityType: "agency_membership",
    entityId: membership.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return membership;
}

export async function updateAgencyMembershipService(
  input: MemberActor & {
    companyId: string;
    agencyId: string;
    membershipId: string;
    data: Parameters<typeof updateAgencyMembership>[0]["data"];
  },
) {
  return runInTransaction(async (db) => {
    const before = await db.agencyMembership.findFirst({
      where: {
        id: input.membershipId,
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
      },
    });
    if (!before) throw createNotFoundError("Agency membership", input);
    await updateAgencyMembership(input, db);
    const after = await db.agencyMembership.findFirst({
      where: {
        id: input.membershipId,
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
      },
    });
    if (!after) throw createNotFoundError("Agency membership", input);
    await writeWorkspaceAgencyMembershipLogs({
      companyId: input.companyId,
      agencyId: input.agencyId,
      membershipId: input.membershipId,
      userId: input.userId,
      actorName: input.actorName,
      action: "AgencyMembershipRoleUpdated",
      changes: {
        before: safeAgencyMembershipSnapshot(before),
        after: safeAgencyMembershipSnapshot(after),
      },
      db,
    });
    return { count: 1 };
  });
}

export async function removeAgencyMembershipService(
  input: MemberActor & { companyId: string; agencyId: string; membershipId: string },
) {
  const result = await runInTransaction(async (db) => {
    const before = await db.agencyMembership.findFirst({
      where: {
        id: input.membershipId,
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
      },
    });
    if (!before) throw createNotFoundError("Agency membership", input);
    const removed = await softDeleteAgencyMembership({
      ...input,
      deletedBy: input.userId ?? null,
    }, db);
    const after = await db.agencyMembership.findFirst({
      where: { id: input.membershipId, companyId: input.companyId, agencyId: input.agencyId },
    });
    await writeWorkspaceAgencyMembershipLogs({
      companyId: input.companyId,
      agencyId: input.agencyId,
      membershipId: input.membershipId,
      userId: input.userId,
      actorName: input.actorName,
      action: "AgencyMembershipRemoved",
      changes: {
        before: safeAgencyMembershipSnapshot(before),
        after: after ? safeAgencyMembershipSnapshot(after) : null,
      },
      db,
    });
    return removed;
  });

  await publishDomainEvent({
    name: "MemberRemovedFromAgency",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "agency_membership",
    entityId: input.membershipId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export const membersService = {
  getCompanyMembershipService,
  listCompanyMembershipsService,
  listWorkspaceMembersService,
  createCompanyMembershipService,
  updateCompanyMembershipService,
  removeCompanyMembershipService,
  getAgencyMembershipService,
  listAgencyMembershipsService,
  listUserAgencyMembershipsService,
  assignUserToAgencyService,
  updateAgencyMembershipService,
  removeAgencyMembershipService,
};
