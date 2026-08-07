import { Prisma, ReservationStatus, VehicleStatus, prisma } from "@lokarent/db";
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
  sourceId?: string;
  customerId?: string;
  vehicleId?: string;
  startsFrom?: Date;
  startsTo?: Date;
  search?: string;
  includeDeleted?: boolean;
  orderBy?: "createdAt" | "startsAt" | "code" | "status" | "totalAmount";
  direction?: "asc" | "desc";
};

function reservationWhere(input: ReservationListInput): Prisma.ReservationWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    sourceId: input.sourceId,
    customerId: input.customerId,
    vehicleId: input.vehicleId,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.startsFrom || input.startsTo
      ? { startsAt: { gte: input.startsFrom, lte: input.startsTo } }
      : {}),
    ...(input.search
      ? {
          OR: [
            { code: { contains: input.search, mode: "insensitive" } },
            { customer: { email: { contains: input.search, mode: "insensitive" } } },
            { customer: { phone: { contains: input.search, mode: "insensitive" } } },
            { customer: { individual: { is: { firstName: { contains: input.search, mode: "insensitive" } } } } },
            { customer: { individual: { is: { lastName: { contains: input.search, mode: "insensitive" } } } } },
            { customer: { business: { is: { companyName: { contains: input.search, mode: "insensitive" } } } } },
            { vehicle: { plate: { contains: input.search, mode: "insensitive" } } },
            { vehicle: { brand: { contains: input.search, mode: "insensitive" } } },
            { vehicle: { model: { contains: input.search, mode: "insensitive" } } },
          ],
        }
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
      vehicle: { include: { category: true } },
      source: true,
      pricingSnapshots: { orderBy: { createdAt: "desc" } },
      extras: true,
      timelineEvents: { orderBy: { createdAt: "desc" } },
      contract: true,
      invoice: true,
      driverAssignments: { where: { deletedAt: null }, include: { driver: true } },
    },
  });
}

export async function paginateReservations(input: ReservationListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = reservationWhere(input);
  const orderField = input.orderBy ?? "createdAt";
  const direction = input.direction ?? "desc";
  const [data, total] = await Promise.all([
    db.reservation.findMany({
      where,
      include: {
        customer: { include: { individual: true, business: true } },
        vehicle: { include: { category: true } },
        source: true,
        pricingSnapshots: { where: { isCurrent: true }, take: 1 },
        extras: true,
        timelineEvents: { orderBy: { createdAt: "desc" }, take: 5 },
        driverAssignments: { where: { deletedAt: null }, include: { driver: true } },
        contract: true,
      },
      orderBy: [{ [orderField]: direction }, { id: "asc" }],
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

export async function findReservationSourceById(sourceId: string, db: DatabaseClient = prisma) {
  return db.reservationSource.findUnique({ where: { id: sourceId } });
}

export async function findReservationCustomer(
  input: { companyId: string; agencyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.customer.findFirst({
    where: {
      id: input.customerId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    include: { individual: true, business: true },
  });
}

export async function findReservationVehicle(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      id: input.vehicleId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    include: { category: true },
  });
}

export async function lockReservationVehicle(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  await db.$queryRaw`
    SELECT id
    FROM vehicles
    WHERE id = ${input.vehicleId}::uuid
      AND company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
    FOR UPDATE
  `;
}

export async function countBlockingReservations(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservation.count({
    where: {
      id: input.reservationId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      OR: [{ status: { in: [ReservationStatus.confirmed, ReservationStatus.active] } }, { contract: { isNot: null } }],
    },
  });
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
      status: { in: [ReservationStatus.confirmed, ReservationStatus.active] },
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function listReservationSources(db: DatabaseClient = prisma) {
  return db.reservationSource.findMany({ orderBy: { label: "asc" } });
}

export async function findReservableVehicleStatus(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      id: input.vehicleId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      status: VehicleStatus.available,
      deletedAt: null,
    },
    select: { id: true },
  });
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
  findReservationSourceById,
  findReservationCustomer,
  findReservationVehicle,
  lockReservationVehicle,
  countBlockingReservations,
  updateReservation,
  softDeleteReservation,
  restoreReservation,
  findOverlappingReservations,
  listReservationSources,
  findReservableVehicleStatus,
  createReservationPricingSnapshot,
  findCurrentPricingSnapshot,
  markPricingSnapshotsNotCurrent,
  listReservationExtras,
  createReservationExtra,
  createReservationTimelineEvent,
  listReservationTimeline,
};
