import { createId, createNotFoundError, createValidationError, publishDomainEvent } from "@/shared";
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
  const activeMembers = await listCompanyMemberships({ companyId: input.companyId });
  if (activeMembers.length <= 1) {
    throw createValidationError("A company must keep at least one active member");
  }
  return softDeleteCompanyMembership({
    ...input,
    deletedBy: input.userId ?? null,
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
  const existing = await findAgencyMembership({
    companyId: input.companyId,
    agencyId: input.agencyId,
    userId: input.data.userId,
    includeDeleted: true,
  });
  if (existing && !existing.deletedAt) {
    throw createValidationError("User is already assigned to this agency");
  }
  const membership = await createAgencyMembership({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    agencyId: input.agencyId,
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
  input: {
    companyId: string;
    agencyId: string;
    membershipId: string;
    data: Parameters<typeof updateAgencyMembership>[0]["data"];
  },
) {
  return updateAgencyMembership(input);
}

export async function removeAgencyMembershipService(
  input: MemberActor & { companyId: string; agencyId: string; membershipId: string },
) {
  const result = await softDeleteAgencyMembership({
    ...input,
    deletedBy: input.userId ?? null,
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
