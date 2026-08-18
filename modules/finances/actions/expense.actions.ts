"use server";

import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@lokarent/db";
import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { can, PERMISSIONS, requirePermission } from "@/shared/permissions";
import { uploadFileService, type UploadResult } from "@/shared/storage";
import type { ExpenseRecord } from "@/lib/expenses-data";
import {
  createExpenseService,
  deleteExpenseService,
  getExpenseDefaultsService,
  getExpenseService,
  listExpenseCategoriesService,
  listExpenseReservationOptionsService,
  listExpenseVehicleOptionsService,
  listExpensesService,
  summarizeExpensesService,
  updateExpenseService,
  type FinanceServiceContext,
} from "../services/finances.service";
import {
  mapExpenseCategoryToOption,
  mapExpenseReservationToOption,
  mapExpenseToUi,
  mapExpenseVehicleToOption,
} from "../mappers/expense.mapper";

const listExpensesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  reservationId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["date", "amount"]).optional(),
});

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

const expenseMutationSchema = z.object({
  categoryId: z.string().uuid(),
  vehicleId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  reservationId: z.preprocess(emptyToUndefined, z.string().uuid().optional().nullable()),
  description: z.string().trim().min(1).max(500),
  amount: z.preprocess(emptyToUndefined, z.coerce.number().positive()),
  currency: z.string().trim().length(3).default("MAD"),
  occurredAt: z.coerce.date(),
  method: z.nativeEnum(PaymentMethod).optional().nullable(),
  reference: z.string().trim().max(120).optional().nullable(),
  provider: z.string().trim().max(160).optional().nullable(),
  internalNote: z.string().trim().max(1000).optional().nullable(),
  documentUrl: z.string().trim().max(1000).optional().nullable(),
});

const updateExpenseSchema = expenseMutationSchema.extend({
  expenseId: z.string().uuid(),
});

const deleteExpenseSchema = z.object({
  expenseId: z.string().uuid(),
});

type ExpenseActionResult =
  | { success: true; expense: ExpenseRecord }
  | { success: false; messageKey: string; code?: string; issues?: Record<string, string[] | undefined> };

type UploadActionResult =
  | { success: true; upload: UploadResult }
  | { success: false; messageKey: string; code?: string };

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "expenses.errors.generic";
  if (error.code === "FORBIDDEN") return "expenses.errors.forbidden";
  if (error.code === "NOT_FOUND") return "expenses.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "EXPENSE_ACTOR_REQUIRED") return "expenses.errors.actorRequired";
    if (error.message === "EXPENSE_AMOUNT_INVALID") return "expenses.errors.amountInvalid";
    if (error.message === "EXPENSE_DATE_INVALID") return "expenses.errors.dateInvalid";
    if (error.message === "EXPENSE_CURRENCY_INVALID") return "expenses.errors.currencyInvalid";
    if (error.message === "EXPENSE_CATEGORY_NOT_FOUND") return "expenses.errors.categoryNotFound";
    if (error.message === "EXPENSE_VEHICLE_NOT_FOUND") return "expenses.errors.vehicleNotFound";
    if (error.message === "EXPENSE_RESERVATION_NOT_FOUND") return "expenses.errors.reservationNotFound";
    if (error.message === "EXPENSE_RESERVATION_VEHICLE_MISMATCH") return "expenses.errors.reservationVehicleMismatch";
    return "expenses.errors.validation";
  }
  return "expenses.errors.generic";
}

function messageKeyForUploadError(error: unknown) {
  if (!isAppError(error)) return "expenses.upload.errors.generic";
  if (error.message === "UPLOAD_FILE_TOO_LARGE") return "expenses.upload.errors.fileTooLarge";
  if (error.message === "UPLOAD_UNSUPPORTED_FILE_TYPE") return "expenses.upload.errors.unsupportedFile";
  if (error.message === "UPLOAD_PROVIDER_NOT_CONFIGURED") return "expenses.upload.errors.providerNotConfigured";
  return "expenses.upload.errors.generic";
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

async function getExpenseUploadContext() {
  const context = await requireCurrentAgencyContext();
  const [canCreate, canEdit] = await Promise.all([
    can(PERMISSIONS.FINANCE_EXPENSES_CREATE, context),
    can(PERMISSIONS.FINANCE_EXPENSES_EDIT, context),
  ]);
  if (!canCreate && !canEdit) await requirePermission(PERMISSIONS.FINANCE_EXPENSES_CREATE, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies FinanceServiceContext;
}

function revalidateExpensePaths() {
  revalidatePath("/finances");
  revalidatePath("/finances/expenses");
  revalidatePath("/cars");
}

export async function listExpensesAction(input: unknown) {
  const parsed = listExpensesSchema.safeParse(input ?? {});
  if (!parsed.success)
    return {
      success: false as const,
      messageKey: "expenses.errors.validation",
      issues: parsed.error.flatten().fieldErrors,
    };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_VIEW);
    const [result, totals] = await Promise.all([
      listExpensesService({ ...context, ...parsed.data }),
      summarizeExpensesService({ ...context, ...parsed.data }),
    ]);
    return {
      success: true as const,
      expenses: result.data.map(mapExpenseToUi),
      pagination: result.pagination,
      totals: totals.map((row) => ({
        currency: row.currency,
        amount: Number((row._sum.amount ?? 0).toString()),
        count: row._count._all,
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

export async function listExpenseCategoriesAction() {
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_VIEW);
    const categories = await listExpenseCategoriesService(context.companyId);
    return { success: true as const, categories: categories.map(mapExpenseCategoryToOption) };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function listExpenseVehiclesAction(input: unknown) {
  const parsed = z
    .object({ search: z.string().trim().max(120).optional(), take: z.coerce.number().int().min(1).max(100).optional() })
    .safeParse(input ?? {});
  if (!parsed.success) return { success: false as const, messageKey: "expenses.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_VIEW);
    const vehicles = await listExpenseVehicleOptionsService({ ...context, ...parsed.data });
    return { success: true as const, vehicles: vehicles.map(mapExpenseVehicleToOption) };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function listExpenseReservationsAction(input: unknown) {
  const parsed = z
    .object({ search: z.string().trim().max(120).optional(), take: z.coerce.number().int().min(1).max(100).optional() })
    .safeParse(input ?? {});
  if (!parsed.success) return { success: false as const, messageKey: "expenses.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_VIEW);
    const reservations = await listExpenseReservationOptionsService({ ...context, ...parsed.data });
    return { success: true as const, reservations: reservations.map(mapExpenseReservationToOption) };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function getExpenseDefaultsAction() {
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_VIEW);
    const defaults = await getExpenseDefaultsService(context);
    return { success: true as const, defaults };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function createExpenseAction(input: unknown): Promise<ExpenseActionResult> {
  const parsed = expenseMutationSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, messageKey: "expenses.errors.validation", issues: parsed.error.flatten().fieldErrors };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_CREATE);
    const expense = await createExpenseService({ context, data: parsed.data });
    revalidateExpensePaths();
    const readback = await getExpenseService({ ...context, expenseId: expense.id });
    return { success: true, expense: mapExpenseToUi(readback) };
  } catch (error) {
    return {
      success: false,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function updateExpenseAction(input: unknown): Promise<ExpenseActionResult> {
  const parsed = updateExpenseSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, messageKey: "expenses.errors.validation", issues: parsed.error.flatten().fieldErrors };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_EDIT);
    const { expenseId, ...data } = parsed.data;
    const expense = await updateExpenseService({ context, expenseId, data });
    revalidateExpensePaths();
    return { success: true, expense: mapExpenseToUi(expense) };
  } catch (error) {
    return {
      success: false,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function deleteExpenseAction(input: unknown) {
  const parsed = deleteExpenseSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, messageKey: "expenses.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FINANCE_EXPENSES_DELETE);
    const deleted = await deleteExpenseService({ context, expenseId: parsed.data.expenseId });
    revalidateExpensePaths();
    return { success: true as const, expenseId: deleted.expenseId };
  } catch (error) {
    return {
      success: false as const,
      messageKey: messageKeyForError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function uploadExpenseDocumentAction(formData: FormData): Promise<UploadActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, messageKey: "expenses.upload.errors.validation" };

  try {
    await getExpenseUploadContext();
    const upload = await uploadFileService({
      file,
      kind: "document",
      folder: "finance/expenses",
    });
    return { success: true, upload };
  } catch (error) {
    return {
      success: false,
      messageKey: messageKeyForUploadError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
