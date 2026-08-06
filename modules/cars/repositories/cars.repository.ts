import { Prisma, VehicleStatus, prisma } from "@lokarent/db";
import {
  createPaginationMeta,
  getPagination,
  type DatabaseClient,
  type PaginationInput,
} from "@/shared/database";

export type VehicleListInput = PaginationInput & {
  companyId: string;
  agencyId: string;
  status?: VehicleStatus;
  categoryId?: string;
  search?: string;
  includeDeleted?: boolean;
};

function vehicleWhere(input: VehicleListInput): Prisma.VehicleWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    categoryId: input.categoryId,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.search
      ? {
          OR: [
            { code: { contains: input.search, mode: "insensitive" } },
            { plate: { contains: input.search, mode: "insensitive" } },
            { brand: { contains: input.search, mode: "insensitive" } },
            { model: { contains: input.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function findVehicleById(
  input: { companyId: string; agencyId: string; vehicleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      id: input.vehicleId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { category: true },
  });
}

export async function paginateVehicles(input: VehicleListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = vehicleWhere(input);
  const [data, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: { category: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.vehicle.count({ where }),
  ]);

  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function countVehicles(
  input: { companyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.count({
    where: {
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findVehicleByPlate(
  input: { companyId: string; plate: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      companyId: input.companyId,
      plate: input.plate,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findVehicleCategoryByName(
  input: { companyId: string; name: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicleCategory.findFirst({
    where: {
      companyId: input.companyId,
      name: input.name,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function listAvailableVehicles(
  input: { companyId: string; agencyId: string; startsAt?: Date; endsAt?: Date },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      status: VehicleStatus.available,
      deletedAt: null,
      ...(input.startsAt && input.endsAt
        ? {
            reservations: {
              none: {
                deletedAt: null,
                status: { in: ["confirmed", "active"] },
                startsAt: { lt: input.endsAt },
                endsAt: { gt: input.startsAt },
              },
            },
            vehicleAvailabilityBlocks: {
              none: {
                deletedAt: null,
                startsAt: { lt: input.endsAt },
                endsAt: { gt: input.startsAt },
              },
            },
          }
        : {}),
    },
    include: { category: true },
    orderBy: { code: "asc" },
  });
}

export async function createVehicle(data: Prisma.VehicleUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.vehicle.create({ data });
}

export async function updateVehicle(
  input: {
    companyId: string;
    agencyId: string;
    vehicleId: string;
    data: Prisma.VehicleUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.updateMany({
    where: {
      id: input.vehicleId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function softDeleteVehicle(
  input: { companyId: string; agencyId: string; vehicleId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.updateMany({
    where: {
      id: input.vehicleId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreVehicle(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.updateMany({
    where: { id: input.vehicleId, companyId: input.companyId, agencyId: input.agencyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function listVehicleCategories(companyId: string, db: DatabaseClient = prisma) {
  return db.vehicleCategory.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function createVehicleCategory(
  data: Prisma.VehicleCategoryUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleCategory.create({ data });
}

export async function listVehicleRegistrations(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicleRegistration.findMany({
    where: { companyId: input.companyId, agencyId: input.agencyId, vehicleId: input.vehicleId },
    orderBy: { expiresAt: "desc" },
  });
}

export async function createVehicleRegistration(
  data: Prisma.VehicleRegistrationUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleRegistration.create({ data });
}

export async function listVehicleInsurances(
  input: { companyId: string; agencyId: string; vehicleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicleInsurance.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { expiresAt: "desc" },
  });
}

export async function createVehicleInsurance(
  data: Prisma.VehicleInsuranceUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleInsurance.create({ data });
}

export async function listVehicleInspections(
  input: { companyId: string; agencyId: string; vehicleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicleInspection.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { expiresAt: "desc" },
  });
}

export async function createVehicleInspection(
  data: Prisma.VehicleInspectionUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleInspection.create({ data });
}

export async function listVehicleVignettes(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicleVignette.findMany({
    where: { companyId: input.companyId, agencyId: input.agencyId, vehicleId: input.vehicleId },
    orderBy: { expiresAt: "desc" },
  });
}

export async function createVehicleVignette(
  data: Prisma.VehicleVignetteUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleVignette.create({ data });
}

export async function listVehicleMaintenances(
  input: { companyId: string; agencyId: string; vehicleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicleMaintenance.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { performedAt: "desc" },
  });
}

export async function createVehicleMaintenance(
  data: Prisma.VehicleMaintenanceUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleMaintenance.create({ data });
}

export async function updateVehicleMaintenance(
  input: {
    companyId: string;
    agencyId: string;
    maintenanceId: string;
    data: Prisma.VehicleMaintenanceUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehicleMaintenance.updateMany({
    where: {
      id: input.maintenanceId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function createVehicleMileageLog(
  data: Prisma.VehicleMileageLogUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleMileageLog.create({ data });
}

export async function findCurrentVehicleMileage(
  input: { companyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicleMileageLog.findFirst({
    where: { companyId: input.companyId, vehicleId: input.vehicleId },
    orderBy: { recordedAt: "desc" },
  });
}

export async function listAvailabilityBlocks(
  input: { companyId: string; agencyId: string; vehicleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicleAvailabilityBlock.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function findVehicleAvailabilityOverlaps(
  input: { companyId: string; agencyId: string; vehicleId: string; startsAt: Date; endsAt: Date },
  db: DatabaseClient = prisma,
) {
  const [reservations, blocks] = await Promise.all([
    db.reservation.findMany({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        vehicleId: input.vehicleId,
        deletedAt: null,
        status: { in: ["confirmed", "active"] },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      orderBy: { startsAt: "asc" },
    }),
    db.vehicleAvailabilityBlock.findMany({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        vehicleId: input.vehicleId,
        deletedAt: null,
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return { reservations, blocks };
}

export async function createAvailabilityBlock(
  data: Prisma.VehicleAvailabilityBlockUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleAvailabilityBlock.create({ data });
}

export async function updateAvailabilityBlock(
  input: {
    companyId: string;
    agencyId: string;
    blockId: string;
    data: Prisma.VehicleAvailabilityBlockUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehicleAvailabilityBlock.updateMany({
    where: { id: input.blockId, companyId: input.companyId, agencyId: input.agencyId },
    data: input.data,
  });
}

export const carsRepository = {
  findVehicleById,
  paginateVehicles,
  countVehicles,
  findVehicleByPlate,
  findVehicleCategoryByName,
  listAvailableVehicles,
  createVehicle,
  updateVehicle,
  softDeleteVehicle,
  restoreVehicle,
  listVehicleCategories,
  createVehicleCategory,
  listVehicleRegistrations,
  createVehicleRegistration,
  listVehicleInsurances,
  createVehicleInsurance,
  listVehicleInspections,
  createVehicleInspection,
  listVehicleVignettes,
  createVehicleVignette,
  listVehicleMaintenances,
  createVehicleMaintenance,
  updateVehicleMaintenance,
  createVehicleMileageLog,
  findCurrentVehicleMileage,
  listAvailabilityBlocks,
  findVehicleAvailabilityOverlaps,
  createAvailabilityBlock,
  updateAvailabilityBlock,
};
