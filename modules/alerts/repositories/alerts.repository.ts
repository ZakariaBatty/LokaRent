import { prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function listExpiringVehicleDocuments(
  input: { companyId: string; agencyId: string; from: Date; to: Date },
  db: DatabaseClient = prisma,
) {
  const [registrations, insurances, inspections, vignettes] = await Promise.all([
    db.vehicleRegistration.findMany({
      where: { companyId: input.companyId, agencyId: input.agencyId, expiresAt: { gte: input.from, lte: input.to } },
      include: { vehicle: true },
      orderBy: { expiresAt: "asc" },
    }),
    db.vehicleInsurance.findMany({
      where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null, expiresAt: { gte: input.from, lte: input.to } },
      include: { vehicle: true },
      orderBy: { expiresAt: "asc" },
    }),
    db.vehicleInspection.findMany({
      where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null, expiresAt: { gte: input.from, lte: input.to } },
      include: { vehicle: true },
      orderBy: { expiresAt: "asc" },
    }),
    db.vehicleVignette.findMany({
      where: { companyId: input.companyId, agencyId: input.agencyId, expiresAt: { gte: input.from, lte: input.to } },
      include: { vehicle: true },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  return { registrations, insurances, inspections, vignettes };
}

export async function listExpiringCustomerDocuments(
  input: { companyId: string; from: Date; to: Date },
  db: DatabaseClient = prisma,
) {
  return db.customerDocument.findMany({
    where: { companyId: input.companyId, expiresAt: { gte: input.from, lte: input.to } },
    include: { customer: true },
    orderBy: { expiresAt: "asc" },
  });
}

export async function listExpiringDriverDocuments(
  input: { companyId: string; from: Date; to: Date },
  db: DatabaseClient = prisma,
) {
  return db.driverDocument.findMany({
    where: { companyId: input.companyId, deletedAt: null, expiresAt: { gte: input.from, lte: input.to } },
    include: { driver: true },
    orderBy: { expiresAt: "asc" },
  });
}

export const alertsRepository = {
  listExpiringVehicleDocuments,
  listExpiringCustomerDocuments,
  listExpiringDriverDocuments,
};
