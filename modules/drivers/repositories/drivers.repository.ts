import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

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
    include: {
      pricingRules: { where: { deletedAt: null }, orderBy: { validFrom: "desc" } },
      documents: { where: { deletedAt: null }, orderBy: { expiresAt: "asc" } },
    },
  });
}

export async function listDrivers(
  input: { companyId: string; agencyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.driver.findMany({
    where: {
      companyId: input.companyId,
      homeAgencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
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

export async function findCurrentDriverPricingRule(
  input: { companyId: string; driverId: string },
  db: DatabaseClient = prisma,
) {
  return db.driverPricingRule.findFirst({
    where: { companyId: input.companyId, driverId: input.driverId, isCurrent: true, deletedAt: null },
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

export async function createDriverReservationAssignment(
  data: Prisma.DriverReservationAssignmentUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.driverReservationAssignment.create({ data });
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
  listDrivers,
  createDriver,
  updateDriver,
  softDeleteDriver,
  findCurrentDriverPricingRule,
  listDriverPricingRules,
  createDriverPricingRule,
  updateDriverPricingRule,
  listDriverDocuments,
  createDriverDocument,
  createDriverReservationAssignment,
  listDriverReservationAssignments,
};
