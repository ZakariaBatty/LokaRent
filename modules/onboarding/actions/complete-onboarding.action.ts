"use server";

import { redirect } from "next/navigation";
import { listUserAgencyMembershipsService } from "@/modules/workspace/members/services/members.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { completeOnboardingService } from "../services/onboarding.service";
import { completeOnboardingSchema } from "../validators/complete-onboarding.schema";

export type CompleteOnboardingActionResult =
  | { success: true; redirectTo: string }
  | { success: false; messageKey: string };

export async function completeOnboardingAction(
  input: unknown,
): Promise<CompleteOnboardingActionResult> {
  const companyContext = await requireCurrentCompanyContext();

  if (companyContext.companyStatus === "active") {
    redirect("/dashboard");
  }
  if (
    companyContext.companyStatus === "suspended" ||
    companyContext.companyStatus === "cancelled"
  ) {
    redirect("/blocked-account");
  }

  const agencyMemberships = await listUserAgencyMembershipsService({
    companyId: companyContext.companyId,
    userId: companyContext.userId,
  });
  const agencyMembership = agencyMemberships.find(
    (membership) => membership.status === "active" && membership.agency.status === "active",
  );
  if (!agencyMembership) {
    return { success: false, messageKey: "onboarding.errors.validation" };
  }

  await requirePermission(PERMISSIONS.WORKSPACE_VIEW, companyContext);

  const parsed = completeOnboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, messageKey: "onboarding.errors.validation" };
  }

  try {
    await completeOnboardingService({
      context: {
        ...companyContext,
        agencyId: agencyMembership.agencyId,
        agencyMembershipId: agencyMembership.id,
        agencyRoleId: agencyMembership.roleId,
        isPrimaryAgency: agencyMembership.isPrimary,
      },
      data: parsed.data,
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    if (isAppError(error) && error.code === "FORBIDDEN") {
      return { success: false, messageKey: "onboarding.errors.forbidden" };
    }
    if (isAppError(error) && error.code === "PLAN_LIMIT_EXCEEDED") {
      return { success: false, messageKey: "onboarding.errors.planLimitExceeded" };
    }
    if (isAppError(error) && error.code === "VALIDATION_ERROR") {
      return {
        success: false,
        messageKey:
          error.message === "Onboarding is already complete"
            ? "onboarding.errors.alreadyComplete"
            : "onboarding.errors.validation",
      };
    }
    return { success: false, messageKey: "onboarding.errors.generic" };
  }
}
