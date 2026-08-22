"use server";

import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  getReportsOverviewService,
  type ReportsPeriod,
} from "../services/reports.service";

const reportsOverviewSchema = z.object({
  range: z.enum(["this_month", "last_month", "quarter", "year", "custom"]).optional(),
  customFrom: z.coerce.date().optional().nullable(),
  customTo: z.coerce.date().optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
});

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "reports.errors.generic";
  if (error.code === "FORBIDDEN") return "reports.errors.forbidden";
  if (error.code === "VALIDATION_ERROR") return "reports.errors.validation";
  return "reports.errors.generic";
}

async function getActionContext() {
  const context = await requireCurrentAgencyContext();
  await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  };
}

export async function getReportsOverviewAction(input: unknown) {
  const parsed = reportsOverviewSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      success: false as const,
      messageKey: "reports.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const context = await getActionContext();
    const report = await getReportsOverviewService({
      ...context,
      ...parsed.data,
      range: parsed.data.range as ReportsPeriod | undefined,
    });
    return { success: true as const, report };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[reports] Failed to load reports overview", error);
    }

    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
