import { Prisma, ReservationStatus, prisma } from "@lokarent/db";
import {
  createPaginationMeta,
  getPagination,
  type DatabaseClient,
  type PaginationInput,
} from "@/shared/database";

export type ReservationListInput = PaginationInput & {
  companyId: string;
  agencyId: string;
  status?: ReservationStatus;
  customerId?: string;
  vehicleId?: string;
  startsFrom?: Date;
  startsTo?: Date;
  includeDeleted?: boolean;
};

function reservationWhere(input: ReservationListInput): Prisma.ReservationWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    customerId: input.customerId,
    vehicleId: input.vehicleId,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.startsFrom || input.startsTo
      ? { startsAt: { gte: input.startsFrom, lte: input.startsTo } }
      : {}),
  };
}

export async function findReservationById(
  input: { companyId: string; agencyId: string; reservationId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findFirst({
    where: {
      id: input.reservationId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: {
      customer: { include: { individual: true, business: true } },
      vehicle: true,
      source: true,
      pricingSnapshots: { orderBy: { createdAt: "desc" } },
      extras: true,
      timelineEvents: { orderBy: { createdAt: "desc" } },
      contract: true,
      invoice: true,
      driverAssignments: { include: { driver: true } },
    },
  });
}

export async function paginateReservations(input: ReservationListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = reservationWhere(input);
  const [data, total] = await Promise.all([
    db.reservation.findMany({
      where,
      include: { customer: true, vehicle: true, source: true },
      orderBy: { startsAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.reservation.count({ where }),
  ]);

  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function createReservation(
  data: Prisma.ReservationUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.reservation.create({ data });
}

export async function updateReservation(
  input: {
    companyId: string;
    agencyId: string;
    reservationId: string;
    data: Prisma.ReservationUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.reservation.updateMany({
    where: {
      id: input.reservationId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function softDeleteReservation(
  input: { companyId: string; agencyId: string; reservationId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.reservation.updateMany({
    where: {
      id: input.reservationId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreReservation(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservation.updateMany({
    where: { id: input.reservationId, companyId: input.companyId, agencyId: input.agencyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function findOverlappingReservations(
  input: {
    companyId: string;
    agencyId: string;
    vehicleId: string;
    startsAt: Date;
    endsAt: Date;
    excludeReservationId?: string;
  },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      id: input.excludeReservationId ? { not: input.excludeReservationId } : undefined,
      deletedAt: null,
      status: { in: ["confirmed", "active"] },
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function listReservationSources(db: DatabaseClient = prisma) {
  return db.reservationSource.findMany({ orderBy: { label: "asc" } });
}

export async function createReservationPricingSnapshot(
  data: Prisma.ReservationPricingSnapshotUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.reservationPricingSnapshot.create({ data });
}

export async function findCurrentPricingSnapshot(
  input: { companyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservationPricingSnapshot.findFirst({
    where: {
      companyId: input.companyId,
      reservationId: input.reservationId,
      isCurrent: true,
    },
  });
}

export async function markPricingSnapshotsNotCurrent(
  input: { companyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservationPricingSnapshot.updateMany({
    where: { companyId: input.companyId, reservationId: input.reservationId, isCurrent: true },
    data: { isCurrent: false },
  });
}

export async function listReservationExtras(
  input: { companyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservationExtra.findMany({
    where: { companyId: input.companyId, reservationId: input.reservationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createReservationExtra(
  data: Prisma.ReservationExtraUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.reservationExtra.create({ data });
}

export async function createReservationTimelineEvent(
  data: Prisma.ReservationTimelineEventUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.reservationTimelineEvent.create({ data });
}

export async function listReservationTimeline(
  input: { companyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservationTimelineEvent.findMany({
    where: { companyId: input.companyId, reservationId: input.reservationId },
    orderBy: { createdAt: "desc" },
  });
}

export const reservationsRepository = {
  findReservationById,
  paginateReservations,
  createReservation,
  updateReservation,
  softDeleteReservation,
  restoreReservation,
  findOverlappingReservations,
  listReservationSources,
  createReservationPricingSnapshot,
  findCurrentPricingSnapshot,
  markPricingSnapshotsNotCurrent,
  listReservationExtras,
  createReservationExtra,
  createReservationTimelineEvent,
  listReservationTimeline,
};
