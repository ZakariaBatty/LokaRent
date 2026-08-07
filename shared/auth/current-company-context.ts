import type { CompanyStatus } from "@lokarent/db";
import { redirect } from "next/navigation";
import { getCompanyService } from "@/modules/workspace/agencies/services/agencies.service";
import { getCompanyMembershipService } from "@/modules/workspace/members/services/members.service";
import { createForbiddenError } from "@/shared/errors";
import { getCurrentSession } from "./get-session";

export type CurrentCompanyContext = {
  authUserId: string;
  userId: string;
  companyId: string;
  companyStatus: CompanyStatus;
  companyMembershipId: string;
  companyRoleId: string;
  isOwner: boolean;
};

function isOwnerRole(role: { name: string; scope: string }) {
  return role.scope === "company" && role.name.toLowerCase() === "owner";
}

export async function getCurrentCompanyContext(): Promise<CurrentCompanyContext | null> {
  const current = await getCurrentSession();
  if (!current) return null;

  if (current.user.status !== "active" || current.user.deletedAt) {
    throw createForbiddenError("User account is not active", {
      authUserId: current.authUser.id,
      userId: current.user.id,
      userStatus: current.user.status,
    });
  }

  const company = await getCompanyService({ companyId: current.user.companyId });
  const membership = await getCompanyMembershipService({
    companyId: company.id,
    userId: current.user.id,
  });

  if (membership.status !== "active") {
    throw createForbiddenError("Company membership is not active", {
      companyId: company.id,
      userId: current.user.id,
      membershipId: membership.id,
      membershipStatus: membership.status,
    });
  }

  return {
    authUserId: current.authUser.id,
    userId: current.user.id,
    companyId: company.id,
    companyStatus: company.status,
    companyMembershipId: membership.id,
    companyRoleId: membership.roleId,
    isOwner: isOwnerRole(membership.role),
  };
}

export async function requireCurrentCompanyContext() {
  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireCurrentCompanyOwnerContext() {
  const context = await requireCurrentCompanyContext();
  if (!context.isOwner) {
    throw createForbiddenError("Company owner access required", {
      companyId: context.companyId,
      userId: context.userId,
      companyMembershipId: context.companyMembershipId,
    });
  }
  return context;
}
