import { FuelType, Prisma, Transmission, VehicleStatus, prisma } from "@lokarent/db";
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
  fuelType?: FuelType;
  transmission?: Transmission;
  availableFrom?: Date;
  availableTo?: Date;
  search?: string;
  includeDeleted?: boolean;
  orderBy?: "createdAt" | "code" | "plate" | "brand" | "updatedAt";
  direction?: "asc" | "desc";
};

function vehicleListInclude(agencyId: string) {
  return {
    category: {
      include: {
        pricingRules: {
          where: { agencyId, deletedAt: null, isCurrent: true },
          orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
        },
      },
    },
    vehiclePricingRules: {
      where: { deletedAt: null, isCurrent: true },
      orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
      take: 1,
    },
    vehiclePhotos: {
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    },
    vehicleInsurances: {
      where: { deletedAt: null },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
      take: 1,
    },
    vehicleRegistrations: {
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
      take: 1,
    },
    vehicleVignettes: {
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
      take: 1,
    },
    vehicleInspections: {
      where: { deletedAt: null },
      orderBy: [{ expiresAt: "desc" }, { createdAt: "desc" }],
      take: 1,
    },
    vehicleMileageLogs: {
      orderBy: { recordedAt: "desc" },
      take: 1,
    },
    vehicleMaintenances: {
      where: { deletedAt: null },
      orderBy: { performedAt: "desc" },
      take: 5,
    },
    vehicleAvailabilityBlocks: {
      where: { deletedAt: null },
      orderBy: { startsAt: "desc" },
      take: 5,
    },
    reservations: {
      where: { deletedAt: null },
      orderBy: { startsAt: "desc" },
      take: 5,
      include: { customer: { include: { individual: true, business: true } } },
    },
  } satisfies Prisma.VehicleInclude;
}

export type VehicleWithFleetDetails = Prisma.VehicleGetPayload<{ include: ReturnType<typeof vehicleListInclude> }>;

function vehicleWhere(input: VehicleListInput): Prisma.VehicleWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    categoryId: input.categoryId,
    fuelType: input.fuelType,
    transmission: input.transmission,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.availableFrom && input.availableTo
      ? {
          status: VehicleStatus.available,
          reservations: {
            none: {
              deletedAt: null,
              status: { in: ["confirmed", "active"] },
              startsAt: { lt: input.availableTo },
              endsAt: { gt: input.availableFrom },
            },
          },
          vehicleAvailabilityBlocks: {
            none: {
              deletedAt: null,
              startsAt: { lt: input.availableTo },
              endsAt: { gt: input.availableFrom },
            },
          },
        }
      : {}),
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
    include: vehicleListInclude(input.agencyId),
  });
}

export async function paginateVehicles(input: VehicleListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = vehicleWhere(input);
  const orderField = input.orderBy ?? "createdAt";
  const direction = input.direction ?? "desc";
  const [data, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: vehicleListInclude(input.agencyId),
      orderBy: [{ [orderField]: direction }, { id: "asc" }],
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

export async function findVehicleByCode(
  input: { companyId: string; code: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findFirst({
    where: {
      companyId: input.companyId,
      code: input.code,
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

export async function findVehicleCategoryById(
  input: { companyId: string; categoryId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehicleCategory.findFirst({
    where: {
      id: input.categoryId,
      companyId: input.companyId,
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
    include: vehicleListInclude(input.agencyId),
    orderBy: { code: "asc" },
  });
}

export async function createVehicle(data: Prisma.VehicleUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.vehicle.create({ data });
}

export async function listVehiclePhotos(
  input: { companyId: string; agencyId: string; vehicleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePhoto.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createVehiclePhoto(
  data: Prisma.VehiclePhotoUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehiclePhoto.create({ data });
}

export async function updateVehiclePhoto(
  input: {
    companyId: string;
    agencyId: string;
    photoId: string;
    data: Prisma.VehiclePhotoUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePhoto.updateMany({
    where: { id: input.photoId, companyId: input.companyId, agencyId: input.agencyId },
    data: input.data,
  });
}

export async function softDeleteVehiclePhotosAfterOrder(
  input: { companyId: string; agencyId: string; vehicleId: string; sortOrder: number; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePhoto.updateMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      sortOrder: { gte: input.sortOrder },
      deletedAt: null,
    },
    data: { isPrimary: false, deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
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

export async function updateVehicleCategory(
  input: { companyId: string; categoryId: string; data: Prisma.VehicleCategoryUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.vehicleCategory.updateMany({
    where: { id: input.categoryId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteVehicleCategory(
  input: { companyId: string; categoryId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.vehicleCategory.updateMany({
    where: { id: input.categoryId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function countActiveVehiclesByCategory(
  input: { companyId: string; categoryId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.count({
    where: { companyId: input.companyId, categoryId: input.categoryId, deletedAt: null },
  });
}

export async function createVehicleCategory(
  data: Prisma.VehicleCategoryUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehicleCategory.create({ data });
}

export async function findCurrentVehiclePricingRule(
  input: {
    companyId: string;
    agencyId: string;
    vehicleId?: string | null;
    vehicleCategoryId?: string | null;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePricingRule.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId ?? null,
      vehicleCategoryId: input.vehicleCategoryId ?? null,
      isCurrent: true,
      deletedAt: null,
    },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
  });
}

export async function listVehiclePricingRules(
  input: {
    companyId: string;
    agencyId: string;
    vehicleId?: string | null;
    vehicleCategoryId?: string | null;
    includeDeleted?: boolean;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePricingRule.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId ?? null,
      vehicleCategoryId: input.vehicleCategoryId ?? null,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
  });
}

export async function markCurrentVehiclePricingRulesInactive(
  input: {
    companyId: string;
    agencyId: string;
    vehicleId?: string | null;
    vehicleCategoryId?: string | null;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePricingRule.updateMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId ?? null,
      vehicleCategoryId: input.vehicleCategoryId ?? null,
      isCurrent: true,
      deletedAt: null,
    },
    data: { isCurrent: false, validTo: new Date() },
  });
}

export async function createVehiclePricingRule(
  data: Prisma.VehiclePricingRuleUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.vehiclePricingRule.create({ data });
}

export async function softDeleteVehiclePricingRule(
  input: { companyId: string; agencyId: string; pricingRuleId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.vehiclePricingRule.updateMany({
    where: {
      id: input.pricingRuleId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { isCurrent: false, deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
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

export async function updateVehicleInsurance(
  input: {
    companyId: string;
    agencyId: string;
    insuranceId: string;
    data: Prisma.VehicleInsuranceUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehicleInsurance.updateMany({
    where: { id: input.insuranceId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    data: input.data,
  });
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

export async function updateVehicleInspection(
  input: {
    companyId: string;
    agencyId: string;
    inspectionId: string;
    data: Prisma.VehicleInspectionUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehicleInspection.updateMany({
    where: { id: input.inspectionId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    data: input.data,
  });
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

export async function updateVehicleVignette(
  input: {
    companyId: string;
    agencyId: string;
    vignetteId: string;
    data: Prisma.VehicleVignetteUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.vehicleVignette.updateMany({
    where: { id: input.vignetteId, companyId: input.companyId, agencyId: input.agencyId },
    data: input.data,
  });
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

export async function countBlockingVehicleReservations(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservation.count({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      deletedAt: null,
      status: { in: ["enquiry", "confirmed", "active"] },
    },
  });
}

export async function countBlockingVehicleContracts(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.contract.count({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      vehicleId: input.vehicleId,
      deletedAt: null,
      status: { in: ["draft", "active", "disputed"] },
    },
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
  findVehicleByCode,
  findVehicleCategoryByName,
  findVehicleCategoryById,
  listAvailableVehicles,
  createVehicle,
  listVehiclePhotos,
  createVehiclePhoto,
  updateVehiclePhoto,
  softDeleteVehiclePhotosAfterOrder,
  updateVehicle,
  softDeleteVehicle,
  restoreVehicle,
  listVehicleCategories,
  createVehicleCategory,
  updateVehicleCategory,
  softDeleteVehicleCategory,
  countActiveVehiclesByCategory,
  findCurrentVehiclePricingRule,
  listVehiclePricingRules,
  markCurrentVehiclePricingRulesInactive,
  createVehiclePricingRule,
  softDeleteVehiclePricingRule,
  listVehicleRegistrations,
  createVehicleRegistration,
  listVehicleInsurances,
  createVehicleInsurance,
  updateVehicleInsurance,
  listVehicleInspections,
  createVehicleInspection,
  updateVehicleInspection,
  listVehicleVignettes,
  createVehicleVignette,
  updateVehicleVignette,
  listVehicleMaintenances,
  createVehicleMaintenance,
  updateVehicleMaintenance,
  countBlockingVehicleReservations,
  countBlockingVehicleContracts,
  createVehicleMileageLog,
  findCurrentVehicleMileage,
  listAvailabilityBlocks,
  findVehicleAvailabilityOverlaps,
  createAvailabilityBlock,
  updateAvailabilityBlock,
};
