import { createId, createNotFoundError, createValidationError, publishDomainEvent, runInTransaction } from "@/shared";
import { findVehicleAvailabilityOverlaps } from "@/modules/cars/repositories/cars.repository";
import { findActiveCustomerBlacklist } from "@/modules/clients/repositories/clients.repository";
import { listPayments } from "@/modules/finances/repositories/finances.repository";
import {
  createReservation,
  createReservationExtra,
  createReservationPricingSnapshot,
  createReservationTimelineEvent,
  findCurrentPricingSnapshot,
  findOverlappingReservations,
  findReservationById,
  listReservationSources,
  markPricingSnapshotsNotCurrent,
  paginateReservations,
  restoreReservation,
  softDeleteReservation,
  updateReservation,
  type ReservationListInput,
} from "../repositories/reservations.repository";

export type ReservationServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

type ReservationCreateData = Omit<Parameters<typeof createReservation>[0], "id" | "companyId" | "agencyId">;
type ReservationExtraCreateData = Omit<Parameters<typeof createReservationExtra>[0], "id" | "companyId" | "reservationId">;
type PricingSnapshotCreateData = Omit<
  Parameters<typeof createReservationPricingSnapshot>[0],
  "id" | "companyId" | "reservationId" | "lockedBy"
>;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export async function getReservationService(input: {
  companyId: string;
  agencyId: string;
  reservationId: string;
}) {
  const reservation = await findReservationById(input);
  if (!reservation) throw createNotFoundError("Reservation", input);
  return reservation;
}

export async function listReservationsService(input: ReservationListInput) {
  return paginateReservations(input);
}

export async function listReservationSourcesService() {
  return listReservationSources();
}

export async function checkReservationAvailabilityService(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
  startsAt: Date;
  endsAt: Date;
  excludeReservationId?: string;
}) {
  if (input.startsAt >= input.endsAt) {
    throw createValidationError("Reservation date range is invalid");
  }
  const [reservations, fleet] = await Promise.all([
    findOverlappingReservations(input),
    findVehicleAvailabilityOverlaps(input),
  ]);

  return {
    available: reservations.length === 0 && fleet.blocks.length === 0,
    reservations,
    blocks: fleet.blocks,
  };
}

export async function createReservationService(input: {
  context: ReservationServiceContext;
  reservation: ReservationCreateData;
  extras?: ReservationExtraCreateData[];
}) {
  if (toDate(input.reservation.startsAt) >= toDate(input.reservation.endsAt)) {
    throw createValidationError("Reservation date range is invalid");
  }
  const availability = await checkReservationAvailabilityService({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    vehicleId: input.reservation.vehicleId,
    startsAt: toDate(input.reservation.startsAt),
    endsAt: toDate(input.reservation.endsAt),
  });
  if (!availability.available) {
    throw createValidationError("Vehicle is not available for the requested dates", availability);
  }

  const reservation = await runInTransaction(async (tx) => {
    const created = await createReservation(
      {
        ...input.reservation,
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      },
      tx,
    );
    for (const extra of input.extras ?? []) {
      await createReservationExtra(
        {
          ...extra,
          id: createId(),
          companyId: input.context.companyId,
          reservationId: created.id,
        },
        tx,
      );
    }
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: created.companyId,
        reservationId: created.id,
        eventType: "created",
        toStatus: created.status,
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
    return created;
  });

  await publishDomainEvent({
    name: "ReservationCreated",
    companyId: reservation.companyId,
    agencyId: reservation.agencyId,
    entityType: "reservation",
    entityId: reservation.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return reservation;
}

export async function confirmReservationService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  pricingSnapshot: PricingSnapshotCreateData;
  blacklistAcknowledged?: boolean;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.reservationId,
  };
  const reservation = await getReservationService(scope);
  const blacklist = await findActiveCustomerBlacklist({
    companyId: input.context.companyId,
    customerId: reservation.customerId,
  });
  if (blacklist.length > 0 && !input.blacklistAcknowledged) {
    throw createValidationError("Customer has active blacklist entries", blacklist);
  }
  const availability = await checkReservationAvailabilityService({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    vehicleId: reservation.vehicleId,
    startsAt: reservation.startsAt,
    endsAt: reservation.endsAt,
    excludeReservationId: reservation.id,
  });
  if (!availability.available) {
    throw createValidationError("Vehicle is not available for the requested dates", availability);
  }

  const snapshotId = createId();
  await runInTransaction(async (tx) => {
    await markPricingSnapshotsNotCurrent(
      { companyId: input.context.companyId, reservationId: input.reservationId },
      tx,
    );
    await createReservationPricingSnapshot(
      {
        ...input.pricingSnapshot,
        id: snapshotId,
        companyId: input.context.companyId,
        reservationId: input.reservationId,
        lockedBy: input.context.userId ?? "",
      },
      tx,
    );
    await updateReservation(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        reservationId: input.reservationId,
        data: { status: "confirmed", confirmedAt: new Date() },
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: input.context.companyId,
        reservationId: input.reservationId,
        eventType: "status_changed",
        fromStatus: reservation.status,
        toStatus: "confirmed",
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
  });

  await publishDomainEvent({
    name: "ReservationConfirmed",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation",
    entityId: input.reservationId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  await publishDomainEvent({
    name: "PricingSnapshotLocked",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation_pricing_snapshot",
    entityId: snapshotId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getReservationService(scope);
}

export async function cancelReservationService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  reason: string;
}) {
  if (!input.reason.trim()) throw createValidationError("Cancellation reason is required");
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.reservationId,
  };
  const reservation = await getReservationService(scope);
  await runInTransaction(async (tx) => {
    await updateReservation(
      {
        ...scope,
        data: {
          status: "cancelled",
          cancellationReason: input.reason,
          cancelledAt: new Date(),
          cancelledBy: input.context.userId ?? null,
        },
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: input.context.companyId,
        reservationId: input.reservationId,
        eventType: "status_changed",
        fromStatus: reservation.status,
        toStatus: "cancelled",
        description: input.reason,
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
  });
  await publishDomainEvent({
    name: "ReservationCancelled",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation",
    entityId: input.reservationId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getReservationService(scope);
}

export async function completeReservationStatusService(input: {
  context: ReservationServiceContext;
  reservationId: string;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.reservationId,
  };
  await getReservationService(scope);
  const payments = await listPayments({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.reservationId,
  });
  if (payments.length < 1) {
    throw createValidationError("At least one payment is required to complete reservation");
  }
  await runInTransaction(async (tx) => {
    await updateReservation(
      {
        ...scope,
        data: { status: "completed", completedAt: new Date() },
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: input.context.companyId,
        reservationId: input.reservationId,
        eventType: "status_changed",
        toStatus: "completed",
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
  });
  await publishDomainEvent({
    name: "ReservationCompleted",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation",
    entityId: input.reservationId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getReservationService(scope);
}

export async function getCurrentPricingSnapshotService(input: {
  companyId: string;
  reservationId: string;
}) {
  const snapshot = await findCurrentPricingSnapshot(input);
  if (!snapshot) throw createNotFoundError("Reservation pricing snapshot", input);
  return snapshot;
}

export async function deleteReservationService(input: ReservationServiceContext & { reservationId: string }) {
  await getReservationService(input);
  return softDeleteReservation({ ...input, deletedBy: input.userId ?? null });
}

export async function restoreReservationService(input: {
  companyId: string;
  agencyId: string;
  reservationId: string;
}) {
  return restoreReservation(input);
}

export const reservationsService = {
  getReservationService,
  listReservationsService,
  listReservationSourcesService,
  checkReservationAvailabilityService,
  createReservationService,
  confirmReservationService,
  cancelReservationService,
  completeReservationStatusService,
  getCurrentPricingSnapshotService,
  deleteReservationService,
  restoreReservationService,
};
