"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@lokarent/db";
import { z } from "zod";
import {
  createDocumentMetadataService,
  deleteDocumentService,
  getDocumentService,
  listDocumentsByEntityService,
} from "@/modules/documents/services/documents.service";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { uploadFileService, type UploadResult } from "@/shared/storage";
import {
  activateReservationService,
  assignReservationDriverService,
  cancelReservationService,
  completeReservationStatusService,
  confirmReservationService,
  createReservationService,
  deleteReservationService,
  listAssignableReservationDriversService,
  markReservationNoShowService,
  restoreReservationService,
  updateReservationService,
  checkReservationAvailabilityService,
  createReservationExtraDefinitionService,
  deleteReservationExtraDefinitionService,
  getReservationService,
  listReservationExtraDefinitionsService,
  repriceReservationService,
  updateReservationExtraDefinitionService,
  type ReservationServiceContext,
} from "../services/reservations.service";
import { createReservationSchema } from "../validators/create-reservation.schema";
import {
  cancelReservationSchema,
  noShowReservationSchema,
  reservationIdSchema,
  updateReservationSchema,
} from "../validators/update-reservation.schema";

export type ReservationActionResult =
  | { success: true; reservationId?: string }
  | { success: false; messageKey: string; code?: string };

type ReservationDocumentResult =
  | {
      success: true;
      documents: {
        id: string;
        filename: string;
        mimeType: string | null;
        sizeBytes: number | null;
        storageUrl: string;
        createdAt: string;
      }[];
    }
  | { success: false; messageKey: string; code?: string };

type ReservationUploadResult =
  | { success: true; upload: UploadResult; documentId: string }
  | { success: false; messageKey: string; code?: string };

type ReservationExtraDefinitionDto = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "reservations.errors.generic";
  if (error.code === "FORBIDDEN") return "reservations.errors.forbidden";
  if (error.code === "NOT_FOUND") return "reservations.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "RESERVATION_INVALID_DATE_RANGE") return "reservations.errors.invalidDateRange";
    if (error.message === "RESERVATION_CUSTOMER_NOT_FOUND") return "reservations.errors.customerNotFound";
    if (error.message === "RESERVATION_VEHICLE_NOT_FOUND") return "reservations.errors.vehicleNotFound";
    if (error.message === "RESERVATION_SOURCE_NOT_FOUND") return "reservations.errors.sourceNotFound";
    if (error.message === "RESERVATION_VEHICLE_NOT_AVAILABLE") return "reservations.errors.vehicleNotAvailable";
    if (error.message === "RESERVATION_VEHICLE_UNAVAILABLE") return "reservations.errors.vehicleUnavailable";
    if (error.message === "RESERVATION_CUSTOMER_BLACKLISTED") return "reservations.errors.customerBlacklisted";
    if (error.message === "RESERVATION_INVALID_STATUS_TRANSITION") return "reservations.errors.invalidStatusTransition";
    if (error.message === "RESERVATION_CANCELLATION_REASON_REQUIRED") return "reservations.errors.cancellationReasonRequired";
    if (error.message === "RESERVATION_EDIT_BLOCKED_BY_STATUS") return "reservations.errors.editBlockedByStatus";
    if (error.message === "RESERVATION_DELETE_BLOCKED_BY_STATUS") return "reservations.errors.deleteBlockedByStatus";
    if (error.message === "RESERVATION_CONFIRMATION_ACTOR_REQUIRED") return "reservations.errors.confirmationActorRequired";
    if (error.message === "RESERVATION_DRIVER_NOT_ASSIGNABLE") return "reservations.errors.driverNotAssignable";
    if (error.message === "RESERVATION_EXTRA_DEFINITION_NOT_FOUND") return "reservations.errors.extraDefinitionNotFound";
    if (error.message === "RESERVATION_LIFECYCLE_CONFLICT") return "reservations.errors.lifecycleConflict";
    if (error.message === "RESERVATION_REPRICING_REQUIRED") return "reservations.errors.repricingRequired";
    if (error.message === "RESERVATION_REPRICING_NOT_ALLOWED") return "reservations.errors.repricingNotAllowed";
    return "reservations.errors.validation";
  }
  return "reservations.errors.generic";
}

function messageKeyForUploadError(error: unknown) {
  if (!isAppError(error)) return "reservations.upload.errors.generic";
  if (error.message === "UPLOAD_FILE_TOO_LARGE") return "reservations.upload.errors.fileTooLarge";
  if (error.message === "UPLOAD_UNSUPPORTED_FILE_TYPE") return "reservations.upload.errors.unsupportedFile";
  if (error.message === "UPLOAD_PROVIDER_NOT_CONFIGURED") return "reservations.upload.errors.providerNotConfigured";
  return "reservations.upload.errors.generic";
}

async function getActionContext(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(permission, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies ReservationServiceContext;
}

function decimal(value?: number) {
  return new Prisma.Decimal(value ?? 0);
}

function decimalLineTotal(unitPrice: number, quantity: number) {
  return decimal(unitPrice).mul(quantity);
}

function daysBetween(startsAt: Date, endsAt: Date) {
  return Math.max(1, Math.ceil((endsAt.getTime() - startsAt.getTime()) / 86_400_000));
}

function revalidateReservationPaths() {
  revalidatePath("/reservations");
  revalidatePath("/calendar");
  revalidatePath("/settings/pricing");
}

const reservationExtraDefinitionSchema = z.object({
  definitionId: z.string().uuid().optional(),
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().length(3).default("MAD"),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export async function listActiveReservationExtraDefinitionsAction(): Promise<
  | {
      success: true;
      definitions: ReservationExtraDefinitionDto[];
    }
  | { success: false; messageKey: string; code?: string }
> {
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_VIEW);
    const definitions = await listReservationExtraDefinitionsService(context);
    return {
      success: true,
      definitions: definitions.map((definition) => ({
        id: definition.id,
        key: definition.key,
        label: definition.label,
        description: definition.description,
        price: Number(definition.price),
        currency: definition.currency,
        isActive: definition.isActive,
        sortOrder: definition.sortOrder,
      })),
    };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function listReservationExtraDefinitionsAction(): Promise<
  | { success: true; definitions: ReservationExtraDefinitionDto[] }
  | { success: false; messageKey: string; code?: string }
> {
  try {
    const context = await getActionContext(PERMISSIONS.SETTINGS_PRICING_MANAGE);
    const definitions = await listReservationExtraDefinitionsService({ ...context, includeInactive: true });
    return {
      success: true,
      definitions: definitions.map((definition) => ({
        id: definition.id,
        key: definition.key,
        label: definition.label,
        description: definition.description,
        price: Number(definition.price),
        currency: definition.currency,
        isActive: definition.isActive,
        sortOrder: definition.sortOrder,
      })),
    };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function upsertReservationExtraDefinitionAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = reservationExtraDefinitionSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.SETTINGS_PRICING_MANAGE);
    if (parsed.data.definitionId) {
      await updateReservationExtraDefinitionService({
        context,
        definitionId: parsed.data.definitionId,
        data: parsed.data,
      });
    } else {
      await createReservationExtraDefinitionService({ context, data: parsed.data });
    }
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.definitionId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteReservationExtraDefinitionAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = z.object({ definitionId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.SETTINGS_PRICING_MANAGE);
    await deleteReservationExtraDefinitionService({ ...context, definitionId: parsed.data.definitionId });
    revalidateReservationPaths();
    return { success: true };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function listReservationDocumentsAction(input: unknown): Promise<ReservationDocumentResult> {
  const parsed = reservationIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_VIEW);
    await getReservationService({ ...context, reservationId: parsed.data.reservationId });
    const documents = await listDocumentsByEntityService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      entityType: "reservation",
      entityId: parsed.data.reservationId,
    });
    return {
      success: true,
      documents: documents.map((document) => ({
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        storageUrl: document.storageUrl,
        createdAt: document.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function uploadReservationDocumentAction(formData: FormData): Promise<ReservationUploadResult> {
  const file = formData.get("file");
  const reservationId = formData.get("reservationId");
  if (!(file instanceof File) || typeof reservationId !== "string") {
    return { success: false, messageKey: "reservations.upload.errors.validation" };
  }
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    if (!context.userId) return { success: false, messageKey: "reservations.upload.errors.validation" };
    await getReservationService({ ...context, reservationId });
    const upload = await uploadFileService({ file, kind: "document", folder: `reservations/${reservationId}` });
    const document = await createDocumentMetadataService({
      ...context,
      data: {
        entityType: "reservation",
        entityId: reservationId,
        filename: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
        storageUrl: upload.url,
      },
    });
    revalidateReservationPaths();
    return { success: true, upload, documentId: document.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForUploadError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteReservationDocumentAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = z.object({ reservationId: z.string().uuid(), documentId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    await getReservationService({ ...context, reservationId: parsed.data.reservationId });
    const document = await getDocumentService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      documentId: parsed.data.documentId,
    });
    if (document.entityType !== "reservation" || document.entityId !== parsed.data.reservationId) {
      return { success: false, messageKey: "reservations.errors.notFound" };
    }
    await deleteDocumentService({ ...context, documentId: parsed.data.documentId });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = createReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_CREATE);
    const reservation = await createReservationService({
      context,
      reservation: {
        customerId: parsed.data.customerId,
        vehicleId: parsed.data.vehicleId,
        sourceId: parsed.data.sourceId,
        assignedAgentId: parsed.data.assignedAgentId,
        status: "enquiry",
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        days: daysBetween(parsed.data.startsAt, parsed.data.endsAt),
        pickupLocation: parsed.data.pickupLocation,
        returnLocation: parsed.data.returnLocation,
        pricePerDay: decimal(parsed.data.pricePerDay),
        extrasTotal: decimal(0),
        discountAmount: decimal(parsed.data.discountAmount),
        discountReason: parsed.data.discountReason,
        totalAmount: decimal(0),
        currency: parsed.data.currency,
        depositAmount: decimal(parsed.data.depositAmount),
        advanceAmount: decimal(parsed.data.advanceAmount),
        internalNotes: parsed.data.internalNotes,
      },
      extras: parsed.data.extras?.map((extra) => ({
        label: extra.label,
        unitPrice: decimal(extra.unitPrice),
        quantity: extra.quantity,
        totalPrice: decimalLineTotal(extra.unitPrice, extra.quantity),
      })),
      selectedExtras: parsed.data.selectedExtras,
      authorizedDrivers: parsed.data.authorizedDrivers,
    });
    revalidateReservationPaths();
    return { success: true, reservationId: reservation.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = updateReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    const { reservationId, selectedExtras, authorizedDrivers, extras, ...data } = parsed.data;
    await updateReservationService({
      context,
      reservationId,
      data: {
        ...data,
        pricePerDay: data.pricePerDay === undefined ? undefined : decimal(data.pricePerDay),
        extrasTotal: data.extrasTotal === undefined ? undefined : decimal(data.extrasTotal),
        discountAmount: data.discountAmount === undefined ? undefined : decimal(data.discountAmount),
        depositAmount: data.depositAmount === undefined ? undefined : decimal(data.depositAmount),
        advanceAmount: data.advanceAmount === undefined ? undefined : decimal(data.advanceAmount),
      },
      extras: extras?.map((extra) => ({
        label: extra.label,
        unitPrice: decimal(extra.unitPrice),
        quantity: extra.quantity,
        totalPrice: decimalLineTotal(extra.unitPrice, extra.quantity),
      })),
      selectedExtras,
      authorizedDrivers,
    });
    revalidateReservationPaths();
    return { success: true, reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function repriceReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = updateReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    const { reservationId, selectedExtras, authorizedDrivers: _authorizedDrivers, extras, ...data } = parsed.data;
    await repriceReservationService({
      context,
      reservationId,
      data: {
        ...data,
        pricePerDay: data.pricePerDay === undefined ? undefined : decimal(data.pricePerDay),
        extrasTotal: data.extrasTotal === undefined ? undefined : decimal(data.extrasTotal),
        discountAmount: data.discountAmount === undefined ? undefined : decimal(data.discountAmount),
        depositAmount: data.depositAmount === undefined ? undefined : decimal(data.depositAmount),
        advanceAmount: data.advanceAmount === undefined ? undefined : decimal(data.advanceAmount),
      },
      extras: extras?.map((extra) => ({
        label: extra.label,
        unitPrice: decimal(extra.unitPrice),
        quantity: extra.quantity,
        totalPrice: decimalLineTotal(extra.unitPrice, extra.quantity),
      })),
      selectedExtras,
    });
    revalidateReservationPaths();
    return { success: true, reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function checkReservationAvailabilityAction(input: unknown): Promise<
  | { success: true; available: boolean }
  | { success: false; messageKey: string; code?: string }
> {
  const parsed = z.object({
    vehicleId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reservationId: z.string().uuid().optional(),
  }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_CREATE);
    const result = await checkReservationAvailabilityService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      vehicleId: parsed.data.vehicleId,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      excludeReservationId: parsed.data.reservationId,
    });
    return { success: true, available: result.available };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function listAssignableReservationDriversAction(): Promise<
  | {
      success: true;
      drivers: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
      }[];
    }
  | { success: false; messageKey: string; code?: string }
> {
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    const drivers = await listAssignableReservationDriversService(context);
    return { success: true, drivers };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function assignReservationDriverAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = z.object({
    reservationId: z.string().uuid(),
    driverId: z.string().uuid().nullable().optional(),
  }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    await assignReservationDriverService({
      context,
      reservationId: parsed.data.reservationId,
      driverId: parsed.data.driverId ?? null,
    });
    revalidateReservationPaths();
    revalidatePath("/drivers");
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function confirmReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = reservationIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    await confirmReservationService({ context, reservationId: parsed.data.reservationId });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function activateReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = reservationIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    await activateReservationService({ context, reservationId: parsed.data.reservationId });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function completeReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = reservationIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_EDIT);
    await completeReservationStatusService({ context, reservationId: parsed.data.reservationId });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function cancelReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = cancelReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_CANCEL);
    await cancelReservationService({ context, reservationId: parsed.data.reservationId, reason: parsed.data.reason });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function markReservationNoShowAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = noShowReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_CANCEL);
    await markReservationNoShowService({ context, reservationId: parsed.data.reservationId, reason: parsed.data.reason });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = reservationIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_DELETE);
    await deleteReservationService({ ...context, reservationId: parsed.data.reservationId });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function restoreReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = reservationIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_DELETE);
    await restoreReservationService({ ...context, reservationId: parsed.data.reservationId });
    revalidateReservationPaths();
    return { success: true, reservationId: parsed.data.reservationId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}
