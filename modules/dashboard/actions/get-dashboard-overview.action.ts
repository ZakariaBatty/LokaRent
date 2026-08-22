"use server";

import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { getDashboardOverviewService } from "../services/dashboard.service";

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "dashboard.errors.generic";
  if (error.code === "FORBIDDEN") return "dashboard.errors.forbidden";
  return "dashboard.errors.generic";
}

export async function getDashboardOverviewAction() {
  try {
    const context = await requireCurrentAgencyContext();
    await Promise.all([
      requirePermission(PERMISSIONS.RESERVATIONS_VIEW, context),
      requirePermission(PERMISSIONS.FLEET_VIEW, context),
      requirePermission(PERMISSIONS.CLIENTS_VIEW, context),
    ]);

    const report = await getDashboardOverviewService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      userId: context.userId,
    });

    return { success: true as const, report };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[dashboard] Failed to load overview", error);
    }

    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
