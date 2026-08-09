import { DriverPricingType, DriverRole, DriverStatus, Prisma, prisma } from "@lokarent/db";
import {
  createPaginationMeta,
  getPagination,
  type DatabaseClient,
  type PaginationInput,
} from "@/shared/database";

export type DriverListInput = PaginationInput & {
  companyId: string;
  agencyId: string;
  status?: DriverStatus;
  pricingType?: DriverPricingType;
  search?: string;
  includeDeleted?: boolean;
  orderBy?: "createdAt" | "lastName" | "status" | "updatedAt";
  direction?: "asc" | "desc";
};

function driverInclude() {
  return {
    homeAgency: { select: { id: true, name: true, code: true } },
    pricingRules: {
      where: { deletedAt: null },
      orderBy: [{ isCurrent: "desc" }, { validFrom: "desc" }, { createdAt: "desc" }],
    },
    documents: { where: { deletedAt: null }, orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }] },
    reservationAssignments: {
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        reservation: {
          include: {
            vehicle: true,
            customer: { include: { individual: true, business: true } },
          },
        },
      },
      take: 10,
    },
    payments: { orderBy: { createdAt: "desc" }, take: 10 },
    _count: {
      select: {
        reservationAssignments: { where: { deletedAt: null } },
      },
    },
  } satisfies Prisma.DriverInclude;
}

export type DriverWithDetails = Prisma.DriverGetPayload<{ include: ReturnType<typeof driverInclude> }>;

function driverWhere(input: DriverListInput): Prisma.DriverWhereInput {
  return {
    companyId: input.companyId,
    homeAgencyId: input.agencyId,
    status: input.status,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.pricingType
      ? { pricingRules: { some: { pricingType: input.pricingType, isCurrent: true, deletedAt: null } } }
      : {}),
    ...(input.search
      ? {
          OR: [
            { reference: { contains: input.search, mode: "insensitive" } },
            { firstName: { contains: input.search, mode: "insensitive" } },
            { lastName: { contains: input.search, mode: "insensitive" } },
            { phone: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            {
              documents: {
                some: { documentNumber: { contains: input.search, mode: "insensitive" }, deletedAt: null },
              },
            },
          ],
        }
      : {}),
  };
}

export async function findDriverById(
  input: { companyId: string; agencyId: string; driverId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.driver.findFirst({
    where: {
      id: input.driverId,
      companyId: input.companyId,
      homeAgencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: driverInclude(),
  });
}

export async function paginateDrivers(input: DriverListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = driverWhere(input);
  const orderField = input.orderBy ?? "createdAt";
  const direction = input.direction ?? "desc";
  const [data, total] = await Promise.all([
    db.driver.findMany({
      where,
      include: driverInclude(),
      orderBy: [{ [orderField]: direction }, { id: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.driver.count({ where }),
  ]);

  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function listDrivers(
  input: { companyId: string; agencyId: string; includeDeleted?: boolean; status?: DriverStatus },
  db: DatabaseClient = prisma,
) {
  return db.driver.findMany({
    where: {
      companyId: input.companyId,
      homeAgencyId: input.agencyId,
      status: input.status,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: driverInclude(),
    orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function listAssignableDrivers(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  return db.driver.findMany({
    where: {
      companyId: input.companyId,
      homeAgencyId: input.agencyId,
      status: DriverStatus.active,
      deletedAt: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      status: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
  });
}

export async function createDriver(data: Prisma.DriverUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.driver.create({ data });
}

export async function updateDriver(
  input: { companyId: string; agencyId: string; driverId: string; data: Prisma.DriverUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.driver.updateMany({
    where: {
      id: input.driverId,
      companyId: input.companyId,
      homeAgencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function softDeleteDriver(
  input: { companyId: string; agencyId: string; driverId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.driver.updateMany({
    where: {
      id: input.driverId,
      companyId: input.companyId,
      homeAgencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreDriver(
  input: { companyId: string; agencyId: string; driverId: string },
  db: DatabaseClient = prisma,
) {
  return db.driver.updateMany({
    where: { id: input.driverId, companyId: input.companyId, homeAgencyId: input.agencyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function countActiveDriverAssignments(
  input: { companyId: string; driverId: string },
  db: DatabaseClient = prisma,
) {
  return db.driverReservationAssignment.count({
    where: {
      companyId: input.companyId,
      driverId: input.driverId,
      deletedAt: null,
      reservation: { deletedAt: null, status: { in: ["confirmed", "active"] } },
    },
  });
}

export async function findCurrentDriverPricingRule(
  input: { companyId: string; driverId: string },
  db: DatabaseClient = prisma,
) {
  return db.driverPricingRule.findFirst({
    where: { companyId: input.companyId, driverId: input.driverId, isCurrent: true, deletedAt: null },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
  });
}

export async function listDriverPricingRules(
  input: { companyId: string; driverId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.driverPricingRule.findMany({
    where: {
      companyId: input.companyId,
      driverId: input.driverId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { validFrom: "desc" },
  });
}

export async function createDriverPricingRule(
  data: Prisma.DriverPricingRuleUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.driverPricingRule.create({ data });
}

export async function updateDriverPricingRule(
  input: { companyId: string; ruleId: string; data: Prisma.DriverPricingRuleUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.driverPricingRule.updateMany({
    where: { id: input.ruleId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function markCurrentDriverPricingRulesInactive(
  input: { companyId: string; driverId: string },
  db: DatabaseClient = prisma,
) {
  return db.driverPricingRule.updateMany({
    where: { companyId: input.companyId, driverId: input.driverId, isCurrent: true, deletedAt: null },
    data: { isCurrent: false },
  });
}

export async function listDriverDocuments(
  input: { companyId: string; driverId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.driverDocument.findMany({
    where: {
      companyId: input.companyId,
      driverId: input.driverId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { expiresAt: "asc" },
  });
}

export async function createDriverDocument(
  data: Prisma.DriverDocumentUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.driverDocument.create({ data });
}

export async function updateDriverDocument(
  input: { companyId: string; driverId: string; documentId: string; data: Prisma.DriverDocumentUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.driverDocument.updateMany({
    where: { id: input.documentId, companyId: input.companyId, driverId: input.driverId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteDriverDocument(
  input: { companyId: string; driverId: string; documentId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.driverDocument.updateMany({
    where: { id: input.documentId, companyId: input.companyId, driverId: input.driverId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function createDriverReservationAssignment(
  data: Prisma.DriverReservationAssignmentUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.driverReservationAssignment.create({ data });
}

export async function softDeleteReservationDriverAssignments(
  input: {
    companyId: string;
    reservationId: string;
    role?: DriverRole;
    deletedBy?: string | null;
  },
  db: DatabaseClient = prisma,
) {
  return db.driverReservationAssignment.updateMany({
    where: {
      companyId: input.companyId,
      reservationId: input.reservationId,
      role: input.role,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      deletedBy: input.deletedBy ?? null,
    },
  });
}

export async function listDriverReservationAssignments(
  input: { companyId: string; reservationId?: string; driverId?: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.driverReservationAssignment.findMany({
    where: {
      companyId: input.companyId,
      reservationId: input.reservationId,
      driverId: input.driverId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { driver: true, reservation: true },
    orderBy: { createdAt: "desc" },
  });
}

export const driversRepository = {
  findDriverById,
  paginateDrivers,
  listDrivers,
  listAssignableDrivers,
  createDriver,
  updateDriver,
  softDeleteDriver,
  restoreDriver,
  countActiveDriverAssignments,
  findCurrentDriverPricingRule,
  listDriverPricingRules,
  createDriverPricingRule,
  updateDriverPricingRule,
  markCurrentDriverPricingRulesInactive,
  listDriverDocuments,
  createDriverDocument,
  updateDriverDocument,
  softDeleteDriverDocument,
  createDriverReservationAssignment,
  softDeleteReservationDriverAssignments,
  listDriverReservationAssignments,
};
