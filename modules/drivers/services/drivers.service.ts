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
  countActiveDriverAssignments,
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
  markCurrentDriverPricingRulesInactive,
  paginateDrivers,
  restoreDriver,
  softDeleteDriver,
  softDeleteDriverDocument,
  updateDriver,
  updateDriverDocument,
  updateDriverPricingRule,
  type DriverListInput,
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

const ALLOWED_DRIVER_STATUS_TRANSITIONS = {
  active: ["active", "inactive", "suspended"],
  inactive: ["inactive", "active", "suspended"],
  suspended: ["suspended", "inactive", "active"],
} as const;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function assertDriverStatusTransition(from: keyof typeof ALLOWED_DRIVER_STATUS_TRANSITIONS, to: string) {
  if (!ALLOWED_DRIVER_STATUS_TRANSITIONS[from].includes(to as never)) {
    throw createValidationError("DRIVERS_INVALID_STATUS_TRANSITION", { from, to });
  }
}

function assertPricingRule(data: DriverPricingRuleCreateData) {
  const amount =
    data.pricingType === "monthly"
      ? data.monthlyRate
      : data.pricingType === "hourly"
        ? data.hourlyRate
        : data.missionRate;
  if (amount === undefined || amount === null || Number(amount) < 0) {
    throw createValidationError("DRIVERS_PRICING_AMOUNT_REQUIRED", { pricingType: data.pricingType });
  }
  if (data.monthlyRate !== undefined && data.monthlyRate !== null && Number(data.monthlyRate) < 0) {
    throw createValidationError("DRIVERS_PRICING_AMOUNT_REQUIRED");
  }
  if (data.hourlyRate !== undefined && data.hourlyRate !== null && Number(data.hourlyRate) < 0) {
    throw createValidationError("DRIVERS_PRICING_AMOUNT_REQUIRED");
  }
  if (data.missionRate !== undefined && data.missionRate !== null && Number(data.missionRate) < 0) {
    throw createValidationError("DRIVERS_PRICING_AMOUNT_REQUIRED");
  }
}

function assertDocumentDates(data: DriverDocumentCreateData) {
  if (data.issuedAt && data.expiresAt && toDate(data.issuedAt) > toDate(data.expiresAt)) {
    throw createValidationError("DRIVERS_DOCUMENT_INVALID_DATES");
  }
}

function sameDate(left?: Date | string | null, right?: Date | string | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return toDate(left).toISOString().slice(0, 10) === toDate(right).toISOString().slice(0, 10);
}

function sameOptionalText(left?: string | null, right?: string | null) {
  return (left ?? "") === (right ?? "");
}

function sameDriverDocument(
  existing: Awaited<ReturnType<typeof listDriverDocuments>>[number],
  next: DriverDocumentCreateData,
) {
  return (
    existing.type === next.type &&
    sameOptionalText(existing.documentNumber, next.documentNumber as string | null | undefined) &&
    sameDate(existing.issuedAt, next.issuedAt as Date | string | null | undefined) &&
    sameDate(existing.expiresAt, next.expiresAt as Date | string | null | undefined) &&
    sameOptionalText(existing.documentUrl, next.documentUrl as string | null | undefined)
  );
}

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

export async function paginateDriversService(input: DriverListInput) {
  return paginateDrivers(input);
}

export async function createDriverService(
  input: DriverActor & { companyId: string; agencyId: string; data: DriverCreateData },
) {
  const driver = await runInTransaction(async (tx) => {
    const created = await createDriver(
      {
        ...input.data,
        id: createId(),
        companyId: input.companyId,
        homeAgencyId: input.agencyId,
      },
      tx,
    );
    await writeAuditLog({
      id: createId(),
      companyId: created.companyId,
      agencyId: created.homeAgencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "DriverCreated",
      entityType: "driver",
      entityId: created.id,
      changes: { created: true, status: created.status },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: created.companyId,
      agencyId: created.homeAgencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "driver",
      entityId: created.id,
      verb: "DriverCreated",
    }, tx);
    return created;
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
  userId?: string | null;
  actorName?: string;
  companyId: string;
  agencyId: string;
  driverId: string;
  data: DriverUpdateData;
}) {
  const existing = await getDriverService(input);
  const nextStatus = typeof input.data.status === "string" ? input.data.status : existing.status;
  assertDriverStatusTransition(existing.status, nextStatus);
  await runInTransaction(async (tx) => {
    await updateDriver(input, tx);
    await writeAuditLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: existing.status === nextStatus ? "DriverUpdated" : "DriverStatusChanged",
      entityType: "driver",
      entityId: input.driverId,
      changes: { beforeStatus: existing.status, afterStatus: nextStatus, updated: true },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "driver",
      entityId: input.driverId,
      verb: existing.status === nextStatus ? "DriverUpdated" : "DriverStatusChanged",
    }, tx);
  });
  return getDriverService(input);
}

export async function deactivateDriverService(
  input: DriverActor & { companyId: string; agencyId: string; driverId: string },
) {
  await getDriverService(input);
  const activeAssignments = await countActiveDriverAssignments(input);
  if (activeAssignments > 0) {
    throw createValidationError("DRIVERS_DELETE_BLOCKED_BY_ACTIVE_ASSIGNMENTS", { activeAssignments });
  }
  const result = await runInTransaction(async (tx) => {
    const deleted = await softDeleteDriver({ ...input, deletedBy: input.userId ?? null }, tx);
    await writeAuditLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "DriverDeleted",
      entityType: "driver",
      entityId: input.driverId,
      changes: { deleted: true },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "driver",
      entityId: input.driverId,
      verb: "DriverDeleted",
    }, tx);
    return deleted;
  });
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

export async function restoreDriverService(
  input: DriverActor & { companyId: string; agencyId: string; driverId: string },
) {
  return runInTransaction(async (tx) => {
    const result = await restoreDriver(input, tx);
    await writeAuditLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: "DriverRestored",
      entityType: "driver",
      entityId: input.driverId,
      changes: { restored: true },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "driver",
      entityId: input.driverId,
      verb: "DriverRestored",
    }, tx);
    return result;
  });
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
  assertPricingRule(input.data);
  const rule = await runInTransaction(async (tx) => {
    const previous = await findCurrentDriverPricingRule(
      { companyId: input.companyId, driverId: input.driverId },
      tx,
    );
    if (previous) {
      await markCurrentDriverPricingRulesInactive({ companyId: input.companyId, driverId: input.driverId }, tx);
    }
    const created = await createDriverPricingRule(
      {
        ...input.data,
        id: createId(),
        companyId: input.companyId,
        driverId: input.driverId,
        isCurrent: true,
      },
      tx,
    );
    await writeAuditLog({
      id: createId(),
      companyId: created.companyId,
      userId: input.userId,
      actorName: input.actorName,
      action: previous ? "DriverPricingRuleUpdated" : "DriverPricingRuleCreated",
      entityType: "driver_pricing_rule",
      entityId: created.id,
      changes: { previousPricingRuleId: previous?.id ?? null, driverId: input.driverId },
    }, tx);
    await writeActivityLog({
      id: createId(),
      companyId: created.companyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "driver_pricing_rule",
      entityId: created.id,
      verb: previous ? "DriverPricingUpdated" : "DriverPricingCreated",
    }, tx);
    return created;
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
  input: DriverActor & { companyId: string; agencyId: string; driverId: string; data: DriverDocumentCreateData },
) {
  await getDriverService(input);
  assertDocumentDates(input.data);
  return createDriverDocument({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    driverId: input.driverId,
  });
}

export async function upsertDriverDocumentByTypeService(
  input: DriverActor & { companyId: string; agencyId: string; driverId: string; data: DriverDocumentCreateData },
) {
  await getDriverService(input);
  assertDocumentDates(input.data);
  return runInTransaction(async (tx) => {
    const existing = (await listDriverDocuments(
      { companyId: input.companyId, driverId: input.driverId, includeDeleted: false },
      tx,
    )).find((document) => document.type === input.data.type);
    if (existing) {
      if (sameDriverDocument(existing, input.data)) return existing;
      await softDeleteDriverDocument(
        {
          companyId: input.companyId,
          driverId: input.driverId,
          documentId: existing.id,
          deletedBy: input.userId ?? null,
        },
        tx,
      );
      const created = await createDriverDocument(
        {
          ...input.data,
          id: createId(),
          companyId: input.companyId,
          driverId: input.driverId,
        },
        tx,
      );
      await writeActivityLog({
        id: createId(),
        companyId: input.companyId,
        agencyId: input.agencyId,
        userId: input.userId,
        actorName: input.actorName,
        entityType: "driver_document",
        entityId: created.id,
        verb: "DriverDocumentReplaced",
      }, tx);
      return created;
    }
    const created = await createDriverDocument(
      {
        ...input.data,
        id: createId(),
        companyId: input.companyId,
        driverId: input.driverId,
      },
      tx,
    );
    await writeActivityLog({
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "driver_document",
      entityId: created.id,
      verb: "DriverDocumentCreated",
    }, tx);
    return created;
  });
}

export async function deleteDriverDocumentService(
  input: DriverActor & { companyId: string; agencyId: string; driverId: string; documentId: string },
) {
  await getDriverService(input);
  const result = await softDeleteDriverDocument({ ...input, deletedBy: input.userId ?? null });
  if (result.count === 0) throw createNotFoundError("Driver document", input);
  return result;
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
  paginateDriversService,
  createDriverService,
  updateDriverService,
  deactivateDriverService,
  restoreDriverService,
  getCurrentDriverPricingRuleService,
  listDriverPricingRulesService,
  createDriverPricingRuleService,
  updateDriverPricingRuleService,
  createDriverDocumentService,
  upsertDriverDocumentByTypeService,
  deleteDriverDocumentService,
  listDriverDocumentsService,
  assignDriverToReservationService,
  listDriverReservationAssignmentsService,
};
