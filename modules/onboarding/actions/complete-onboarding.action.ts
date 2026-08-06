"use server";

import { redirect } from "next/navigation";
import { requireCurrentAgencyContext, requireCurrentCompanyContext } from "@/shared/auth";
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
  const agencyContext = await requireCurrentAgencyContext();

  if (companyContext.companyStatus === "active") {
    redirect("/dashboard");
  }
  if (
    companyContext.companyStatus === "suspended" ||
    companyContext.companyStatus === "cancelled"
  ) {
    redirect("/blocked-account");
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
        ...agencyContext,
      },
      data: parsed.data,
    });

    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    if (isAppError(error) && error.code === "FORBIDDEN") {
      return { success: false, messageKey: "onboarding.errors.forbidden" };
    }
    if (isAppError(error) && error.code === "VALIDATION_ERROR") {
      return { success: false, messageKey: "onboarding.errors.alreadyComplete" };
    }
    return { success: false, messageKey: "onboarding.errors.generic" };
  }
}
