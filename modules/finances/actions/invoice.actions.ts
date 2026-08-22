"use server";

import { revalidatePath } from "next/cache";
import { InvoiceStatus, InvoiceType, PaymentMethod } from "@lokarent/db";
import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  generateInvoiceFromReservationService,
  issueInvoiceService,
  voidInvoiceService,
  recordInvoicePaymentService,
  updateInvoiceService,
  deleteInvoiceService,
  listInvoiceCustomersService,
  listInvoiceableReservationsService,
  listInvoicesService,
  type FinanceServiceContext,
} from "../services/finances.service";
import {
  mapInvoiceableReservationToOption,
  mapInvoiceToUi,
} from "../mappers/invoice.mapper";

const listInvoicesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  type: z.nativeEnum(InvoiceType).optional(),
  customerId: z.string().uuid().optional(),
  customerType: z.enum(["individual", "company"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["recent", "amount_desc", "due_asc"]).optional(),
});

const listInvoiceableReservationsSchema = z.object({
  search: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});

const listInvoiceCustomersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
});

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

const generateInvoiceSchema = z.object({
  type: z.nativeEnum(InvoiceType).default(InvoiceType.rental),
  reservationId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  customerId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  taxRate: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(100).optional().nullable()),
  manualLines: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number(),
        source: z.enum(["system", "manual"]).optional(),
      }),
    )
    .optional(),
  issueAt: z.preprocess(emptyToUndefined, z.coerce.date().optional().nullable()),
  dueAt: z.preprocess(emptyToUndefined, z.coerce.date().optional().nullable()),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const updateInvoiceSchema = generateInvoiceSchema.extend({
  invoiceId: z.string().uuid(),
});

const deleteInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

const issueInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

const voidInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

const recordInvoicePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.preprocess(emptyToUndefined, z.coerce.number().positive()),
  method: z.nativeEnum(PaymentMethod),
  paidAt: z.coerce.date(),
  reference: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "invoices.errors.generic";
  if (error.code === "FORBIDDEN") return "invoices.errors.forbidden";
  if (error.code === "NOT_FOUND") return "invoices.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "INVOICE_ALREADY_EXISTS_FOR_RESERVATION")
      return "invoices.errors.alreadyExists";
    if (error.message === "INVOICE_PRICING_SNAPSHOT_MISSING")
      return "invoices.errors.pricingSnapshotMissing";
    if (error.message === "INVOICE_RESERVATION_REQUIRED")
      return "invoices.errors.reservationRequired";
    if (error.message === "INVOICE_CUSTOMER_REQUIRED")
      return "invoices.errors.customerRequired";
    if (error.message === "INVOICE_LINE_REQUIRED")
      return "invoices.errors.lineRequired";
    if (error.message === "INVOICE_TAX_RATE_REQUIRED")
      return "invoices.errors.taxRateRequired";
    if (error.message === "INVOICE_TAX_RATE_INVALID")
      return "invoices.errors.taxRateInvalid";
    if (error.message === "INVOICE_MANUAL_RESERVATION_NOT_ALLOWED")
      return "invoices.errors.manualReservationNotAllowed";
    if (error.message === "FINANCE_INVOICE_IMMUTABLE")
      return "invoices.errors.immutable";
    if (error.message === "INVOICE_TYPE_IMMUTABLE")
      return "invoices.errors.typeImmutable";
    if (error.message === "INVOICE_DELETE_REQUIRES_DRAFT")
      return "invoices.errors.deleteRequiresDraft";
    if (error.message === "INVOICE_ISSUE_REQUIRES_DRAFT")
      return "invoices.errors.issueRequiresDraft";
    if (error.message === "INVOICE_ALREADY_VOIDED")
      return "invoices.errors.alreadyVoided";
    if (error.message === "INVOICE_VOID_ACTOR_REQUIRED")
      return "invoices.errors.voidActorRequired";
    if (error.message === "INVOICE_VOID_NOT_ALLOWED")
      return "invoices.errors.voidNotAllowed";
    if (error.message === "INVOICE_CREDIT_NOTE_ALREADY_EXISTS")
      return "invoices.errors.creditNoteAlreadyExists";
    if (error.message === "INVOICE_PAYMENT_REQUIRES_ISSUED")
      return "invoices.errors.paymentRequiresIssued";
    if (error.message === "INVOICE_PAYMENT_NOT_ALLOWED")
      return "invoices.errors.paymentNotAllowed";
    if (error.message === "INVOICE_PAYMENT_INVALID_AMOUNT")
      return "invoices.errors.paymentInvalidAmount";
    if (error.message === "INVOICE_PAYMENT_OVERPAYMENT")
      return "invoices.errors.paymentOverpayment";
    if (error.message === "INVOICE_ALREADY_PAID")
      return "invoices.errors.alreadyPaid";
    if (error.message === "INVOICE_PAYMENT_DATE_INVALID")
      return "invoices.errors.paymentDateInvalid";
    if (error.message === "INVOICE_PAYMENT_ACTOR_REQUIRED")
      return "invoices.errors.paymentActorRequired";
    return "invoices.errors.validation";
  }
  return "invoices.errors.generic";
}

async function getActionContext(
  permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
) {
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
  revalidatePath("/reports");
  revalidatePath("/reservations");
  revalidatePath("/cars");
  revalidatePath("/clients");
}

export async function listInvoicesAction(input: unknown) {
  const parsed = listInvoicesSchema.safeParse(input ?? {});
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
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

export async function updateInvoiceAction(input: unknown) {
  const parsed = updateInvoiceSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const invoice = await updateInvoiceService({
      context,
      ...parsed.data,
    });
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

export async function deleteInvoiceAction(input: unknown) {
  const parsed = deleteInvoiceSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const deleted = await deleteInvoiceService({ ...context, invoiceId: parsed.data.invoiceId });
    revalidateInvoicePaths();
    return { success: true as const, invoiceId: deleted.invoiceId };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function issueInvoiceAction(input: unknown) {
  const parsed = issueInvoiceSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const invoice = await issueInvoiceService({ ...context, invoiceId: parsed.data.invoiceId });
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

export async function voidInvoiceAction(input: unknown) {
  const parsed = voidInvoiceSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const invoice = await voidInvoiceService({ ...context, invoiceId: parsed.data.invoiceId });
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

export async function recordInvoicePaymentAction(input: unknown) {
  const parsed = recordInvoicePaymentSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_PAYMENTS_RECORD);
    const invoice = await recordInvoicePaymentService({
      context,
      payment: parsed.data,
    });
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

export async function listInvoiceableReservationsAction(input: unknown) {
  const parsed = listInvoiceableReservationsSchema.safeParse(input ?? {});
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const reservations = await listInvoiceableReservationsService({
      ...context,
      ...parsed.data,
    });
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

export async function listInvoiceCustomersAction(input: unknown) {
  const parsed = listInvoiceCustomersSchema.safeParse(input ?? {});
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const customers = await listInvoiceCustomersService({
      ...context,
      ...parsed.data,
    });
    return {
      success: true as const,
      customers: customers.map((customer) => ({
        id: customer.id,
        name:
          customer.type === "company"
            ? (customer.business?.companyName ??
              customer.email ??
              customer.code)
            : [customer.individual?.firstName, customer.individual?.lastName]
                .filter(Boolean)
                .join(" ") ||
              customer.email ||
              customer.code,
        type:
          customer.type === "company"
            ? ("company" as const)
            : ("individual" as const),
        phone: customer.phone ?? "",
        email: customer.email ?? "",
      })),
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
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "invoices.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_INVOICES_VIEW);
    const invoice = await generateInvoiceFromReservationService({
      context,
      ...parsed.data,
    });
    revalidateInvoicePaths();
    return { success: true as const, invoice: mapInvoiceToUi(invoice) };
  } catch (error) {
    console.error("Error generating invoice:", error);
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
