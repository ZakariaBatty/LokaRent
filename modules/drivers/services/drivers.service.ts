import { createId, createNotFoundError, publishDomainEvent } from "@/shared";
import {
  createDriver,
  createDriverDocument,
  createDriverPricingRule,
  createDriverReservationAssignment,
  findCurrentDriverPricingRule,
  findDriverById,
  listDriverDocuments,
  listDriverPricingRules,
  listDriverReservationAssignments,
  listDrivers,
  softDeleteDriver,
  updateDriver,
  updateDriverPricingRule,
} from "../repositories/drivers.repository";

export type DriverActor = {
  userId?: string | null;
  actorName?: string;
};

type DriverCreateData = Omit<Parameters<typeof createDriver>[0], "id" | "companyId" | "homeAgencyId">;
type DriverUpdateData = Parameters<typeof updateDriver>[0]["data"];
type DriverPricingRuleCreateData = Omit<Parameters<typeof createDriverPricingRule>[0], "id" | "companyId" | "driverId">;
type DriverDocumentCreateData = Omit<Parameters<typeof createDriverDocument>[0], "id" | "companyId" | "driverId">;
type DriverAssignmentCreateData = Omit<Parameters<typeof createDriverReservationAssignment>[0], "id" | "companyId">;

export async function getDriverService(input: {
  companyId: string;
  agencyId: string;
  driverId: string;
}) {
  const driver = await findDriverById(input);
  if (!driver) throw createNotFoundError("Driver", input);
  return driver;
}

export async function listDriversService(input: {
  companyId: string;
  agencyId: string;
  includeDeleted?: boolean;
}) {
  return listDrivers(input);
}

export async function createDriverService(
  input: DriverActor & { companyId: string; agencyId: string; data: DriverCreateData },
) {
  const driver = await createDriver({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    homeAgencyId: input.agencyId,
  });
  await publishDomainEvent({
    name: "DriverCreated",
    companyId: driver.companyId,
    agencyId: driver.homeAgencyId,
    entityType: "driver",
    entityId: driver.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return driver;
}

export async function updateDriverService(input: {
  companyId: string;
  agencyId: string;
  driverId: string;
  data: DriverUpdateData;
}) {
  await getDriverService(input);
  await updateDriver(input);
  return getDriverService(input);
}

export async function deactivateDriverService(
  input: DriverActor & { companyId: string; agencyId: string; driverId: string },
) {
  await getDriverService(input);
  const result = await softDeleteDriver({ ...input, deletedBy: input.userId ?? null });
  await publishDomainEvent({
    name: "DriverDeactivated",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "driver",
    entityId: input.driverId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function getCurrentDriverPricingRuleService(input: {
  companyId: string;
  driverId: string;
}) {
  const rule = await findCurrentDriverPricingRule(input);
  if (!rule) throw createNotFoundError("Driver pricing rule", input);
  return rule;
}

export async function listDriverPricingRulesService(input: {
  companyId: string;
  driverId: string;
  includeDeleted?: boolean;
}) {
  return listDriverPricingRules(input);
}

export async function createDriverPricingRuleService(
  input: DriverActor & { companyId: string; driverId: string; data: DriverPricingRuleCreateData },
) {
  const rule = await createDriverPricingRule({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    driverId: input.driverId,
  });
  await publishDomainEvent({
    name: "DriverPricingModelUpdated",
    companyId: rule.companyId,
    entityType: "driver_pricing_rule",
    entityId: rule.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return rule;
}

export async function updateDriverPricingRuleService(input: {
  companyId: string;
  ruleId: string;
  data: Parameters<typeof updateDriverPricingRule>[0]["data"];
}) {
  return updateDriverPricingRule(input);
}

export async function createDriverDocumentService(
  input: { companyId: string; driverId: string; data: DriverDocumentCreateData },
) {
  return createDriverDocument({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    driverId: input.driverId,
  });
}

export async function listDriverDocumentsService(input: {
  companyId: string;
  driverId: string;
  includeDeleted?: boolean;
}) {
  return listDriverDocuments(input);
}

export async function assignDriverToReservationService(
  input: DriverActor & { companyId: string; data: DriverAssignmentCreateData },
) {
  const assignment = await createDriverReservationAssignment({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
  });
  await publishDomainEvent({
    name: "DriverAssignedToReservation",
    companyId: assignment.companyId,
    entityType: "driver_reservation_assignment",
    entityId: assignment.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return assignment;
}

export async function listDriverReservationAssignmentsService(input: {
  companyId: string;
  reservationId?: string;
  driverId?: string;
  includeDeleted?: boolean;
}) {
  return listDriverReservationAssignments(input);
}

export const driversService = {
  getDriverService,
  listDriversService,
  createDriverService,
  updateDriverService,
  deactivateDriverService,
  getCurrentDriverPricingRuleService,
  listDriverPricingRulesService,
  createDriverPricingRuleService,
  updateDriverPricingRuleService,
  createDriverDocumentService,
  listDriverDocumentsService,
  assignDriverToReservationService,
  listDriverReservationAssignmentsService,
};
