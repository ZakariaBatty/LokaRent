"use server";

import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  getFinanceOverviewReportService,
  type FinanceReportingRange,
  type FinanceServiceContext,
} from "../services/finances.service";

const financeReportSchema = z.object({
  range: z.enum(["this_month", "last_month", "quarter", "year", "custom"]).optional(),
  customFrom: z.coerce.date().optional().nullable(),
  customTo: z.coerce.date().optional().nullable(),
  currency: z.string().trim().length(3).optional().nullable(),
});

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "finances.errors.generic";
  if (error.code === "FORBIDDEN") return "finances.errors.forbidden";
  if (error.code === "VALIDATION_ERROR") return "finances.errors.validation";
  return "finances.errors.generic";
}

async function getActionContext() {
  const context = await requireCurrentAgencyContext();
  await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies FinanceServiceContext;
}

export async function getFinanceOverviewReportAction(input: unknown) {
  const parsed = financeReportSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      success: false as const,
      messageKey: "finances.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const context = await getActionContext();
    const report = await getFinanceOverviewReportService({
      ...context,
      ...parsed.data,
      range: parsed.data.range as FinanceReportingRange | undefined,
    });
    return { success: true as const, report };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[finances.reporting] Failed to load finance overview report", error);
    }

    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
