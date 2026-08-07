import { redirect } from "next/navigation";
import { getAgencyService } from "@/modules/workspace/agencies/services/agencies.service";
import { listUserAgencyMembershipsService } from "@/modules/workspace/members/services/members.service";
import { createForbiddenError } from "@/shared/errors";
import { getCurrentCompanyContext } from "./current-company-context";

export type CurrentAgencyContext = {
  authUserId: string;
  userId: string;
  companyId: string;
  agencyId: string;
  agencyMembershipId: string;
  agencyRoleId: string;
  companyRoleId: string;
  isOwner: boolean;
  isPrimaryAgency: boolean;
};

export async function getCurrentAgencyContext(): Promise<CurrentAgencyContext | null> {
  const companyContext = await getCurrentCompanyContext();
  if (!companyContext) return null;

  const memberships = await listUserAgencyMembershipsService({
    companyId: companyContext.companyId,
    userId: companyContext.userId,
  });
  const agencyMembership = memberships.find(
    (membership) => membership.status === "active" && membership.agency.status === "active",
  );

  if (!agencyMembership) {
    throw createForbiddenError("Active agency membership required", {
      companyId: companyContext.companyId,
      userId: companyContext.userId,
    });
  }

  await getAgencyService({
    companyId: companyContext.companyId,
    agencyId: agencyMembership.agencyId,
  });

  return {
    authUserId: companyContext.authUserId,
    userId: companyContext.userId,
    companyId: companyContext.companyId,
    agencyId: agencyMembership.agencyId,
    agencyMembershipId: agencyMembership.id,
    agencyRoleId: agencyMembership.roleId,
    companyRoleId: companyContext.companyRoleId,
    isOwner: companyContext.isOwner,
    isPrimaryAgency: agencyMembership.isPrimary,
  };
}

export async function requireCurrentAgencyContext() {
  const context = await getCurrentAgencyContext();
  if (!context) redirect("/login");
  return context;
}
