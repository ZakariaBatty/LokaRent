"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@lokarent/db";
import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
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
    return "reservations.errors.validation";
  }
  return "reservations.errors.generic";
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

function daysBetween(startsAt: Date, endsAt: Date) {
  return Math.max(1, Math.ceil((endsAt.getTime() - startsAt.getTime()) / 86_400_000));
}

function revalidateReservationPaths() {
  revalidatePath("/reservations");
  revalidatePath("/calendar");
}

export async function createReservationAction(input: unknown): Promise<ReservationActionResult> {
  const parsed = createReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "reservations.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.RESERVATIONS_CREATE);
    const extrasTotal = parsed.data.extras?.reduce((sum, extra) => sum + extra.unitPrice * extra.quantity, 0) ?? parsed.data.extrasTotal ?? 0;
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
        extrasTotal: decimal(extrasTotal),
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
        totalPrice: decimal(extra.unitPrice * extra.quantity),
      })),
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
    const { reservationId, ...data } = parsed.data;
    const extrasTotal = data.extras?.reduce((sum, extra) => sum + extra.unitPrice * extra.quantity, 0);
    await updateReservationService({
      context,
      reservationId,
      data: {
        ...data,
        pricePerDay: data.pricePerDay === undefined ? undefined : decimal(data.pricePerDay),
        extrasTotal: extrasTotal === undefined ? (data.extrasTotal === undefined ? undefined : decimal(data.extrasTotal)) : decimal(extrasTotal),
        discountAmount: data.discountAmount === undefined ? undefined : decimal(data.discountAmount),
        depositAmount: data.depositAmount === undefined ? undefined : decimal(data.depositAmount),
        advanceAmount: data.advanceAmount === undefined ? undefined : decimal(data.advanceAmount),
      },
      extras: data.extras?.map((extra) => ({
        label: extra.label,
        unitPrice: decimal(extra.unitPrice),
        quantity: extra.quantity,
        totalPrice: decimal(extra.unitPrice * extra.quantity),
      })),
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
