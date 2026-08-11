"use server";

import { revalidatePath } from "next/cache";
import { InvoiceStatus } from "@lokarent/db";
import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  generateInvoiceFromReservationService,
  listInvoiceableReservationsService,
  listInvoicesService,
  type FinanceServiceContext,
} from "../services/finances.service";
import { mapInvoiceableReservationToOption, mapInvoiceToUi } from "../mappers/invoice.mapper";

const listInvoicesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  customerId: z.string().uuid().optional(),
  sort: z.enum(["recent", "amount_desc", "due_asc"]).optional(),
});

const listInvoiceableReservationsSchema = z.object({
  search: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});

const generateInvoiceSchema = z.object({
  reservationId: z.string().uuid(),
  dueAt: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "invoices.errors.generic";
  if (error.code === "FORBIDDEN") return "invoices.errors.forbidden";
  if (error.code === "NOT_FOUND") return "invoices.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "FINANCE_INVOICE_ALREADY_EXISTS") return "invoices.errors.alreadyExists";
    if (error.message === "FINANCE_PRICING_SNAPSHOT_MISSING") return "invoices.errors.pricingSnapshotMissing";
    if (error.message === "FINANCE_HISTORICAL_TAX_RATE_MISSING") return "invoices.errors.historicalTaxMissing";
    return "invoices.errors.validation";
  }
  return "invoices.errors.generic";
}

async function getActionContext(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(permission, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies FinanceServiceContext;
}

function revalidateInvoicePaths() {
  revalidatePath("/invoices");
  revalidatePath("/finances");
  revalidatePath("/reservations");
}

export async function listInvoicesAction(input: unknown) {
  const parsed = listInvoicesSchema.safeParse(input ?? {});
  if (!parsed.success) return { success: false as const, messageKey: "invoices.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const result = await listInvoicesService({ ...context, ...parsed.data });
    return {
      success: true as const,
      invoices: result.data.map(mapInvoiceToUi),
      pagination: result.pagination,
    };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function listInvoiceableReservationsAction(input: unknown) {
  const parsed = listInvoiceableReservationsSchema.safeParse(input ?? {});
  if (!parsed.success) return { success: false as const, messageKey: "invoices.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const reservations = await listInvoiceableReservationsService({ ...context, ...parsed.data });
    return {
      success: true as const,
      reservations: reservations.map(mapInvoiceableReservationToOption),
    };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function generateInvoiceAction(input: unknown) {
  const parsed = generateInvoiceSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, messageKey: "invoices.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const invoice = await generateInvoiceFromReservationService({ context, ...parsed.data });
    revalidateInvoicePaths();
    return { success: true as const, invoice: mapInvoiceToUi(invoice) };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
