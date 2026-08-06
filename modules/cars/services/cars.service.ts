import {
  createId,
  createNotFoundError,
  createValidationError,
  publishDomainEvent,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import {
  countActiveVehiclesByCategory,
  countBlockingVehicleContracts,
  countBlockingVehicleReservations,
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
  findVehicleByCode,
  findVehicleById,
  findVehicleByPlate,
  findVehicleCategoryByName,
  listAvailableVehicles,
  listVehicleCategories,
  paginateVehicles,
  restoreVehicle,
  softDeleteVehicle,
  updateAvailabilityBlock,
  updateVehicle,
  updateVehicleCategory,
  softDeleteVehicleCategory,
  updateVehicleInspection,
  updateVehicleInsurance,
  updateVehicleMaintenance,
  findCurrentVehicleMileage,
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

type VehicleCreateData = Omit<Parameters<typeof createVehicle>[0], "id" | "companyId" | "agencyId" | "code"> & {
  code?: string | null;
};
type VehicleUpdateData = Parameters<typeof updateVehicle>[0]["data"];
type VehicleCategoryCreateData = Omit<Parameters<typeof createVehicleCategory>[0], "id" | "companyId">;
type VehicleRegistrationCreateData = Omit<Parameters<typeof createVehicleRegistration>[0], "id" | "companyId" | "agencyId">;
type VehicleInsuranceCreateData = Omit<Parameters<typeof createVehicleInsurance>[0], "id" | "companyId" | "agencyId">;
type VehicleInspectionCreateData = Omit<Parameters<typeof createVehicleInspection>[0], "id" | "companyId" | "agencyId">;
type VehicleVignetteCreateData = Omit<Parameters<typeof createVehicleVignette>[0], "id" | "companyId" | "agencyId">;
type VehicleMileageLogCreateData = Omit<Parameters<typeof createVehicleMileageLog>[0], "id" | "companyId" | "recordedBy">;
type VehicleMaintenanceCreateData = Omit<Parameters<typeof createVehicleMaintenance>[0], "id" | "companyId" | "agencyId" | "recordedBy">;
type AvailabilityBlockCreateData = Omit<Parameters<typeof createAvailabilityBlock>[0], "id" | "companyId" | "agencyId" | "createdBy">;

const ALLOWED_VEHICLE_STATUS_TRANSITIONS = {
  available: ["available", "rented", "maintenance", "inactive", "retired"],
  rented: ["rented", "available", "maintenance"],
  maintenance: ["maintenance", "available", "inactive"],
  inactive: ["inactive", "available", "retired"],
  retired: ["retired"],
} as const;

const ALLOWED_MAINTENANCE_STATUS_TRANSITIONS = {
  scheduled: ["scheduled", "in_progress", "cancelled"],
  in_progress: ["in_progress", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
} as const;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function normalizeCode(value?: string | null) {
  if (!value) return `VEH-${createId().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  return value.trim().toUpperCase();
}

function assertVehicleStatusTransition(from: keyof typeof ALLOWED_VEHICLE_STATUS_TRANSITIONS, to: string) {
  if (!ALLOWED_VEHICLE_STATUS_TRANSITIONS[from].includes(to as never)) {
    throw createValidationError("FLEET_INVALID_STATUS_TRANSITION", { from, to });
  }
}

function assertMaintenanceStatusTransition(
  from: keyof typeof ALLOWED_MAINTENANCE_STATUS_TRANSITIONS,
  to: string,
) {
  if (!ALLOWED_MAINTENANCE_STATUS_TRANSITIONS[from].includes(to as never)) {
    throw createValidationError("FLEET_INVALID_MAINTENANCE_STATUS_TRANSITION", { from, to });
  }
}

async function assertUniqueVehicleIdentity(input: {
  companyId: string;
  plate: string;
  code: string;
  excludeVehicleId?: string;
}) {
  const [plateMatch, codeMatch] = await Promise.all([
    findVehicleByPlate({ companyId: input.companyId, plate: input.plate, includeDeleted: true }),
    findVehicleByCode({ companyId: input.companyId, code: input.code, includeDeleted: true }),
  ]);
  if (plateMatch && plateMatch.id !== input.excludeVehicleId) {
    throw createValidationError("FLEET_DUPLICATE_PLATE", { plate: input.plate });
  }
  if (codeMatch && codeMatch.id !== input.excludeVehicleId) {
    throw createValidationError("FLEET_DUPLICATE_CODE", { code: input.code });
  }
}

async function assertVehicleBelongsToScope(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
}) {
  return getVehicleService(input);
}

async function assertMileageDoesNotDecrease(input: {
  companyId: string;
  vehicleId: string;
  mileage?: number | null;
}) {
  if (input.mileage === undefined || input.mileage === null) return;
  const current = await findCurrentVehicleMileage({
    companyId: input.companyId,
    vehicleId: input.vehicleId,
  });
  if (current && input.mileage < current.mileage) {
    throw createValidationError("FLEET_MILEAGE_CANNOT_DECREASE", {
      currentMileage: current.mileage,
      nextMileage: input.mileage,
    });
  }
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
  const code = normalizeCode(typeof input.data.code === "string" ? input.data.code : null);
  await assertUniqueVehicleIdentity({
    companyId: input.context.companyId,
    plate: String(input.data.plate),
    code,
  });
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

  const vehicle = await runInTransaction(async (tx) => {
    const created = await createVehicle(
      {
        ...input.data,
        code,
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      },
      tx,
    );
    await writeAuditLog(
      {
        id: createId(),
        companyId: created.companyId,
        agencyId: created.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "VehicleCreated",
        entityType: "vehicle",
        entityId: created.id,
        changes: { created: true, status: created.status },
      },
      tx,
    );
    await writeActivityLog({
      id: input.activityLogId ?? createId(),
      companyId: created.companyId,
      agencyId: created.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      entityType: "vehicle",
      entityId: created.id,
      verb: "VehicleAdded",
    }, tx);
    return created;
  });
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
  const nextStatus = typeof input.data.status === "string" ? input.data.status : existing.status;
  assertVehicleStatusTransition(existing.status, nextStatus);
  const code = typeof input.data.code === "string" ? String(input.data.code) : existing.code;
  const plate = typeof input.data.plate === "string" ? String(input.data.plate) : existing.plate;
  await assertUniqueVehicleIdentity({
    companyId: input.context.companyId,
    plate,
    code,
    excludeVehicleId: input.vehicleId,
  });
  if ((nextStatus === "retired" || nextStatus === "inactive") && existing.status === "rented") {
    throw createValidationError("FLEET_STATUS_BLOCKED_BY_RENTAL", { from: existing.status, to: nextStatus });
  }
  await runInTransaction(async (tx) => {
    await updateVehicle({ ...scope, data: { ...input.data, code, plate } }, tx);
    await writeAuditLog({
      id: input.auditLogId ?? createId(),
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      action: existing.status === nextStatus ? "VehicleUpdated" : "VehicleStatusChanged",
      entityType: "vehicle",
      entityId: input.vehicleId,
      changes: { beforeStatus: existing.status, afterStatus: nextStatus, updated: true },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      entityType: "vehicle",
      entityId: input.vehicleId,
      verb: existing.status === nextStatus ? "VehicleUpdated" : "VehicleStatusChanged",
    }, tx);
  });
  return getVehicleService(scope);
}

export async function deactivateVehicleService(input: FleetServiceContext & { vehicleId: string }) {
  await getVehicleService(input);
  const [reservations, contracts] = await Promise.all([
    countBlockingVehicleReservations(input),
    countBlockingVehicleContracts(input),
  ]);
  if (reservations > 0 || contracts > 0) {
    throw createValidationError("FLEET_DELETE_BLOCKED_BY_ACTIVE_RECORDS", { reservations, contracts });
  }
  await runInTransaction(async (tx) => {
    await softDeleteVehicle({ ...input, deletedBy: input.userId ?? null }, tx);
    await writeAuditLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "VehicleDeleted",
      entityType: "vehicle",
      entityId: input.vehicleId,
      changes: { deleted: true },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "vehicle",
      entityId: input.vehicleId,
      verb: "VehicleDeleted",
    }, tx);
  });
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
  userId?: string | null;
  actorName?: string;
}) {
  return runInTransaction(async (tx) => {
    const result = await restoreVehicle(input, tx);
    await writeAuditLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "VehicleRestored",
      entityType: "vehicle",
      entityId: input.vehicleId,
      changes: { restored: true },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "vehicle",
      entityId: input.vehicleId,
      verb: "VehicleRestored",
    }, tx);
    return result;
  });
}

export async function createVehicleCategoryService(input: {
  companyId: string;
  data: VehicleCategoryCreateData;
}) {
  const existing = await findVehicleCategoryByName({
    companyId: input.companyId,
    name: String(input.data.name),
    includeDeleted: true,
  });
  if (existing) throw createValidationError("FLEET_DUPLICATE_CATEGORY", { name: input.data.name });
  return createVehicleCategory({ ...input.data, id: createId(), companyId: input.companyId });
}

export async function updateVehicleCategoryService(input: {
  companyId: string;
  categoryId: string;
  data: Parameters<typeof updateVehicleCategory>[0]["data"];
}) {
  const result = await updateVehicleCategory(input);
  if (result.count === 0) throw createNotFoundError("Vehicle category", input);
  return result;
}

export async function deleteVehicleCategoryService(input: FleetServiceContext & { categoryId: string }) {
  const used = await countActiveVehiclesByCategory(input);
  if (used > 0) throw createValidationError("FLEET_CATEGORY_IN_USE", { activeVehicles: used });
  return softDeleteVehicleCategory({ ...input, deletedBy: input.userId ?? null });
}

export async function listVehicleCategoriesService(companyId: string) {
  return listVehicleCategories(companyId);
}

export async function createVehicleRegistrationService(input: {
  context: FleetServiceContext;
  data: VehicleRegistrationCreateData;
}) {
  await assertVehicleBelongsToScope({ ...input.context, vehicleId: input.data.vehicleId });
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
  await assertVehicleBelongsToScope({ ...input.context, vehicleId: input.data.vehicleId });
  if (toDate(input.data.startsAt) >= toDate(input.data.expiresAt)) {
    throw createValidationError("FLEET_INVALID_INSURANCE_DATES");
  }
  return createVehicleInsurance({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
}

export async function updateVehicleInsuranceService(input: {
  companyId: string;
  agencyId: string;
  insuranceId: string;
  data: Parameters<typeof updateVehicleInsurance>[0]["data"];
}) {
  const result = await updateVehicleInsurance(input);
  if (result.count === 0) throw createNotFoundError("Vehicle insurance", input);
  return result;
}

export async function createVehicleInspectionService(input: {
  context: FleetServiceContext;
  data: VehicleInspectionCreateData;
}) {
  await assertVehicleBelongsToScope({ ...input.context, vehicleId: input.data.vehicleId });
  if (toDate(input.data.inspectedAt) >= toDate(input.data.expiresAt)) {
    throw createValidationError("FLEET_INVALID_INSPECTION_DATES");
  }
  return createVehicleInspection({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
}

export async function updateVehicleInspectionService(input: {
  companyId: string;
  agencyId: string;
  inspectionId: string;
  data: Parameters<typeof updateVehicleInspection>[0]["data"];
}) {
  const result = await updateVehicleInspection(input);
  if (result.count === 0) throw createNotFoundError("Vehicle inspection", input);
  return result;
}

export async function createVehicleVignetteService(input: {
  context: FleetServiceContext;
  data: VehicleVignetteCreateData;
}) {
  await assertVehicleBelongsToScope({ ...input.context, vehicleId: input.data.vehicleId });
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
  await assertMileageDoesNotDecrease({
    companyId: input.context.companyId,
    vehicleId: input.data.vehicleId,
    mileage: Number(input.data.mileage),
  });
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
  await assertVehicleBelongsToScope({ ...input.context, vehicleId: input.data.vehicleId });
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
  existingStatus?: "scheduled" | "in_progress" | "completed" | "cancelled";
}) {
  if (input.existingStatus && typeof input.data.status === "string") {
    assertMaintenanceStatusTransition(input.existingStatus, input.data.status);
  }
  const result = await updateVehicleMaintenance(input);
  if (result.count === 0) throw createNotFoundError("Vehicle maintenance", input);
  return result;
}

export async function createAvailabilityBlockService(input: {
  context: FleetServiceContext;
  data: AvailabilityBlockCreateData;
}) {
  await assertVehicleBelongsToScope({ ...input.context, vehicleId: input.data.vehicleId });
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
  if (overlaps.blocks.length > 0 || overlaps.reservations.length > 0) {
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
  if (input.data.startsAt && input.data.endsAt && toDate(input.data.startsAt as Date) >= toDate(input.data.endsAt as Date)) {
    throw createValidationError("FLEET_INVALID_AVAILABILITY_BLOCK_DATES");
  }
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
  updateVehicleCategoryService,
  deleteVehicleCategoryService,
  listVehicleCategoriesService,
  createVehicleRegistrationService,
  createVehicleInsuranceService,
  updateVehicleInsuranceService,
  createVehicleInspectionService,
  updateVehicleInspectionService,
  createVehicleVignetteService,
  createVehicleMileageLogService,
  createVehicleMaintenanceService,
  updateVehicleMaintenanceService,
  createAvailabilityBlockService,
  updateAvailabilityBlockService,
  retireVehicleService,
};
