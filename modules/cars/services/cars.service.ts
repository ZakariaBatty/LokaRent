import {
  createId,
  createNotFoundError,
  createValidationError,
  publishDomainEvent,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import {
  countVehicles,
  createAvailabilityBlock,
  createVehicle,
  createVehicleCategory,
  createVehicleInspection,
  createVehicleInsurance,
  createVehicleMaintenance,
  createVehicleMileageLog,
  createVehicleRegistration,
  createVehicleVignette,
  findVehicleAvailabilityOverlaps,
  findVehicleById,
  listAvailableVehicles,
  listVehicleCategories,
  paginateVehicles,
  restoreVehicle,
  softDeleteVehicle,
  updateAvailabilityBlock,
  updateVehicle,
  updateVehicleMaintenance,
  type VehicleListInput,
} from "../repositories/cars.repository";
import { getCompanyService } from "@/modules/workspace/agencies/services/agencies.service";
import { enforcePlanLimitService } from "@/modules/workspace/billing/services/billing.service";

export type FleetServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

type VehicleCreateData = Omit<Parameters<typeof createVehicle>[0], "id" | "companyId" | "agencyId">;
type VehicleUpdateData = Parameters<typeof updateVehicle>[0]["data"];
type VehicleCategoryCreateData = Omit<Parameters<typeof createVehicleCategory>[0], "id" | "companyId">;
type VehicleRegistrationCreateData = Omit<Parameters<typeof createVehicleRegistration>[0], "id" | "companyId" | "agencyId">;
type VehicleInsuranceCreateData = Omit<Parameters<typeof createVehicleInsurance>[0], "id" | "companyId" | "agencyId">;
type VehicleInspectionCreateData = Omit<Parameters<typeof createVehicleInspection>[0], "id" | "companyId" | "agencyId">;
type VehicleVignetteCreateData = Omit<Parameters<typeof createVehicleVignette>[0], "id" | "companyId" | "agencyId">;
type VehicleMileageLogCreateData = Omit<Parameters<typeof createVehicleMileageLog>[0], "id" | "companyId" | "recordedBy">;
type VehicleMaintenanceCreateData = Omit<Parameters<typeof createVehicleMaintenance>[0], "id" | "companyId" | "agencyId" | "recordedBy">;
type AvailabilityBlockCreateData = Omit<Parameters<typeof createAvailabilityBlock>[0], "id" | "companyId" | "agencyId" | "createdBy">;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export async function getVehicleService(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
}) {
  const vehicle = await findVehicleById(input);
  if (!vehicle) throw createNotFoundError("Vehicle", input);
  return vehicle;
}

export async function listVehiclesService(input: VehicleListInput) {
  return paginateVehicles(input);
}

export async function listAvailableVehiclesService(input: {
  companyId: string;
  agencyId: string;
  startsAt?: Date;
  endsAt?: Date;
}) {
  if ((input.startsAt && !input.endsAt) || (!input.startsAt && input.endsAt)) {
    throw createValidationError("Availability checks require both startsAt and endsAt");
  }
  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt) {
    throw createValidationError("Vehicle availability date range is invalid");
  }
  return listAvailableVehicles(input);
}

export async function createVehicleService(input: {
  context: FleetServiceContext;
  data: VehicleCreateData;
  activityLogId?: string;
}) {
  const [company, currentVehicleCount] = await Promise.all([
    getCompanyService({ companyId: input.context.companyId }),
    countVehicles({ companyId: input.context.companyId }),
  ]);
  await enforcePlanLimitService({
    planId: company.planId,
    limitKey: "max_vehicles",
    currentUsage: currentVehicleCount,
    requestedIncrement: 1,
  });

  const vehicle = await createVehicle({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
  if (input.activityLogId) {
    await writeActivityLog({
      id: input.activityLogId,
      companyId: vehicle.companyId,
      agencyId: vehicle.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      entityType: "vehicle",
      entityId: vehicle.id,
      verb: "VehicleAdded",
    });
  }
  await publishDomainEvent({
    name: "VehicleAdded",
    companyId: vehicle.companyId,
    agencyId: vehicle.agencyId,
    entityType: "vehicle",
    entityId: vehicle.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return vehicle;
}

export async function updateVehicleService(input: {
  context: FleetServiceContext;
  vehicleId: string;
  data: VehicleUpdateData;
  auditLogId?: string;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    vehicleId: input.vehicleId,
  };
  const existing = await getVehicleService(scope);
  await updateVehicle({ ...scope, data: input.data });
  if (input.auditLogId) {
    await writeAuditLog({
      id: input.auditLogId,
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      action: "VehicleUpdated",
      entityType: "vehicle",
      entityId: input.vehicleId,
      changes: { beforeStatus: existing.status, updated: true },
    });
  }
  return getVehicleService(scope);
}

export async function deactivateVehicleService(input: FleetServiceContext & { vehicleId: string }) {
  await getVehicleService(input);
  await softDeleteVehicle({ ...input, deletedBy: input.userId ?? null });
  await publishDomainEvent({
    name: "VehicleDeactivated",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "vehicle",
    entityId: input.vehicleId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
}

export async function restoreVehicleService(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
}) {
  return restoreVehicle(input);
}

export async function createVehicleCategoryService(input: {
  companyId: string;
  data: VehicleCategoryCreateData;
}) {
  return createVehicleCategory({ ...input.data, id: createId(), companyId: input.companyId });
}

export async function listVehicleCategoriesService(companyId: string) {
  return listVehicleCategories(companyId);
}

export async function createVehicleRegistrationService(input: {
  context: FleetServiceContext;
  data: VehicleRegistrationCreateData;
}) {
  return createVehicleRegistration({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
}

export async function createVehicleInsuranceService(input: {
  context: FleetServiceContext;
  data: VehicleInsuranceCreateData;
}) {
  return createVehicleInsurance({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
}

export async function createVehicleInspectionService(input: {
  context: FleetServiceContext;
  data: VehicleInspectionCreateData;
}) {
  return createVehicleInspection({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
}

export async function createVehicleVignetteService(input: {
  context: FleetServiceContext;
  data: VehicleVignetteCreateData;
}) {
  return createVehicleVignette({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
}

export async function createVehicleMileageLogService(input: {
  context: Pick<FleetServiceContext, "companyId" | "userId">;
  data: VehicleMileageLogCreateData;
}) {
  return createVehicleMileageLog({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    recordedBy: input.context.userId ?? null,
  });
}

export async function createVehicleMaintenanceService(input: {
  context: FleetServiceContext;
  data: VehicleMaintenanceCreateData;
}) {
  const maintenance = await createVehicleMaintenance({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    recordedBy: input.context.userId ?? "",
  });
  await publishDomainEvent({
    name: "VehicleMaintenanceStarted",
    companyId: maintenance.companyId,
    agencyId: maintenance.agencyId,
    entityType: "vehicle_maintenance",
    entityId: maintenance.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return maintenance;
}

export async function updateVehicleMaintenanceService(input: {
  companyId: string;
  agencyId: string;
  maintenanceId: string;
  data: Parameters<typeof updateVehicleMaintenance>[0]["data"];
}) {
  const result = await updateVehicleMaintenance(input);
  if (result.count === 0) throw createNotFoundError("Vehicle maintenance", input);
  return result;
}

export async function createAvailabilityBlockService(input: {
  context: FleetServiceContext;
  data: AvailabilityBlockCreateData;
}) {
  if (toDate(input.data.startsAt) >= toDate(input.data.endsAt)) {
    throw createValidationError("Availability block date range is invalid");
  }
  const overlaps = await findVehicleAvailabilityOverlaps({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    vehicleId: input.data.vehicleId,
    startsAt: toDate(input.data.startsAt),
    endsAt: toDate(input.data.endsAt),
  });
  if (overlaps.blocks.length > 0) {
    throw createValidationError("Vehicle already has an overlapping availability block");
  }
  const block = await createAvailabilityBlock({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    createdBy: input.context.userId ?? null,
  });
  await publishDomainEvent({
    name: "VehicleBlockedManually",
    companyId: block.companyId,
    agencyId: block.agencyId,
    entityType: "vehicle_availability_block",
    entityId: block.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return block;
}

export async function updateAvailabilityBlockService(input: {
  companyId: string;
  agencyId: string;
  blockId: string;
  data: Parameters<typeof updateAvailabilityBlock>[0]["data"];
}) {
  return updateAvailabilityBlock(input);
}

export async function retireVehicleService(input: FleetServiceContext & { vehicleId: string }) {
  return updateVehicleService({
    context: input,
    vehicleId: input.vehicleId,
    data: { status: "retired" },
  });
}

export const carsService = {
  getVehicleService,
  listVehiclesService,
  listAvailableVehiclesService,
  createVehicleService,
  updateVehicleService,
  deactivateVehicleService,
  restoreVehicleService,
  createVehicleCategoryService,
  listVehicleCategoriesService,
  createVehicleRegistrationService,
  createVehicleInsuranceService,
  createVehicleInspectionService,
  createVehicleVignetteService,
  createVehicleMileageLogService,
  createVehicleMaintenanceService,
  updateVehicleMaintenanceService,
  createAvailabilityBlockService,
  updateAvailabilityBlockService,
  retireVehicleService,
};
