import { DriverRole, DriverStatus, Prisma, ReservationStatus } from "@lokarent/db";
import { createId, createNotFoundError, createValidationError, publishDomainEvent, runInTransaction } from "@/shared";
import { writeActivityLog, writeAuditLog } from "@/shared/audit";
import { findVehicleAvailabilityOverlaps, findCurrentVehiclePricingRule } from "@/modules/cars/repositories/cars.repository";
import { findActiveCustomerBlacklist } from "@/modules/clients/repositories/clients.repository";
import {
  createDriverReservationAssignment,
  findDriverById,
  listAssignableDrivers,
  softDeleteReservationDriverAssignments,
} from "@/modules/drivers/repositories/drivers.repository";
import { incrementNumberSequence } from "@/modules/workspace/billing/repositories/billing.repository";
import {
  countBlockingReservations,
  createReservation,
  createReservationExtra,
  createReservationPricingSnapshot,
  createReservationTimelineEvent,
  findCurrentPricingSnapshot,
  findOverlappingReservations,
  findReservationById,
  findReservationCustomer,
  findReservationSourceById,
  findReservationVehicle,
  findReservableVehicleStatus,
  listReservationSources,
  lockReservationRow,
  lockReservationVehicle,
  markPricingSnapshotsNotCurrent,
  paginateReservations,
  restoreReservation,
  softDeleteReservation,
  updateReservation,
  updateReservationStatusConditionally,
  deleteReservationExtras,
  createReservationAuthorizedDriver,
  createReservationExtraDefinition,
  findReservationExtraDefinitionById,
  listReservationExtraDefinitions,
  softDeleteReservationAuthorizedDrivers,
  softDeleteReservationExtraDefinition,
  updateReservationExtraDefinition,
  type ReservationListInput,
} from "../repositories/reservations.repository";

export type ReservationServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

type ReservationCreateData = Omit<Parameters<typeof createReservation>[0], "id" | "companyId" | "agencyId" | "code"> & {
  code?: string;
};
type ReservationExtraCreateData = Omit<Parameters<typeof createReservationExtra>[0], "id" | "companyId" | "reservationId">;
type ReservationSelectedExtraData = {
  definitionId: string;
  quantity?: number;
};
type ReservationAuthorizedDriverData = {
  fullName: string;
  licenseNumber: string;
  licenseIssuedAt?: Date | string | null;
  licenseExpiresAt?: Date | string | null;
  documentUrl?: string | null;
};
type ReservationExtraDefinitionData = {
  key: string;
  label: string;
  description?: string | null;
  price: Prisma.Decimal.Value;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
  agencyId?: string | null;
};
type ReservationUpdateData = Partial<
  Pick<
    ReservationCreateData,
    | "customerId"
    | "vehicleId"
    | "sourceId"
    | "assignedAgentId"
    | "startsAt"
    | "endsAt"
    | "pickupLocation"
    | "returnLocation"
    | "days"
    | "pricePerDay"
    | "extrasTotal"
    | "discountAmount"
    | "discountReason"
    | "totalAmount"
    | "currency"
    | "depositAmount"
    | "advanceAmount"
    | "internalNotes"
  >
>;

const reservingStatuses: ReservationStatus[] = [ReservationStatus.confirmed, ReservationStatus.active];
const cancellableStatuses: ReservationStatus[] = [ReservationStatus.enquiry, ReservationStatus.confirmed];
function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function decimal(value: unknown) {
  return new Prisma.Decimal(value as Prisma.Decimal.Value);
}

function assertDateRange(startsAt: Date, endsAt: Date) {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
    throw createValidationError("RESERVATION_INVALID_DATE_RANGE");
  }
}

function calculateDays(startsAt: Date, endsAt: Date) {
  return Math.max(1, Math.ceil((endsAt.getTime() - startsAt.getTime()) / 86_400_000));
}

function calculateTotals(input: {
  days: number;
  pricePerDay: unknown;
  extrasTotal?: unknown;
  discountAmount?: unknown;
}) {
  const base = decimal(input.pricePerDay).mul(input.days);
  const extras = decimal(input.extrasTotal ?? 0);
  const discount = decimal(input.discountAmount ?? 0);
  return { extras, discount, total: Prisma.Decimal.max(base.plus(extras).minus(discount), 0) };
}

function sameDecimal(left: unknown, right: unknown) {
  return decimal(left ?? 0).eq(decimal(right ?? 0));
}

function sameNullableText(left: unknown, right: unknown) {
  const normalize = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : null);
  return normalize(left) === normalize(right);
}

function sameDateTime(left: Date | string | undefined, right: Date) {
  return left === undefined || toDate(left).getTime() === right.getTime();
}

function sameSelectedExtras(
  selectedExtras: ReservationSelectedExtraData[] | undefined,
  reservation: Awaited<ReturnType<typeof getReservationService>>,
) {
  if (selectedExtras === undefined) return true;
  const current = reservation.extras
    .map((extra) => ({ definitionId: extra.definitionId, quantity: extra.quantity }))
    .filter((extra): extra is { definitionId: string; quantity: number } => Boolean(extra.definitionId))
    .sort((a, b) => a.definitionId.localeCompare(b.definitionId));
  const next = selectedExtras
    .map((extra) => ({ definitionId: extra.definitionId, quantity: extra.quantity ?? reservation.days }))
    .sort((a, b) => a.definitionId.localeCompare(b.definitionId));
  return (
    current.length === next.length &&
    current.every((extra, index) => extra.definitionId === next[index]?.definitionId && extra.quantity === next[index]?.quantity)
  );
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeOptionalDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return toDate(value).toISOString();
}

function sameAuthorizedDrivers(
  nextDrivers: ReservationAuthorizedDriverData[] | undefined,
  reservation: Awaited<ReturnType<typeof getReservationService>>,
) {
  if (nextDrivers === undefined) return true;
  const normalize = (driver: ReservationAuthorizedDriverData | Awaited<ReturnType<typeof getReservationService>>["authorizedDrivers"][number]) => ({
    fullName: normalizeOptionalText(driver.fullName),
    licenseNumber: normalizeOptionalText(driver.licenseNumber),
    licenseIssuedAt: normalizeOptionalDate(driver.licenseIssuedAt),
    licenseExpiresAt: normalizeOptionalDate(driver.licenseExpiresAt),
    documentUrl: normalizeOptionalText(driver.documentUrl),
  });
  const current = reservation.authorizedDrivers.map(normalize).sort((a, b) => `${a.fullName}:${a.licenseNumber}`.localeCompare(`${b.fullName}:${b.licenseNumber}`));
  const next = nextDrivers.map(normalize).sort((a, b) => `${a.fullName}:${a.licenseNumber}`.localeCompare(`${b.fullName}:${b.licenseNumber}`));
  return current.length === next.length && current.every((driver, index) => JSON.stringify(driver) === JSON.stringify(next[index]));
}

function hasContractDetailsUpdate(input: {
  data: ReservationUpdateData;
  authorizedDrivers?: ReservationAuthorizedDriverData[];
  reservation: Awaited<ReturnType<typeof getReservationService>>;
}) {
  const { data, reservation } = input;
  if (data.pickupLocation !== undefined && normalizeOptionalText(data.pickupLocation) !== normalizeOptionalText(reservation.pickupLocation)) return true;
  if (data.returnLocation !== undefined && normalizeOptionalText(data.returnLocation) !== normalizeOptionalText(reservation.returnLocation)) return true;
  return !sameAuthorizedDrivers(input.authorizedDrivers, reservation);
}

function hasMeaningfulPricingRelevantUpdate(input: {
  data: ReservationUpdateData;
  selectedExtras?: ReservationSelectedExtraData[];
  legacyExtras?: ReservationExtraCreateData[];
  reservation: Awaited<ReturnType<typeof getReservationService>>;
}) {
  const { data, reservation } = input;
  if (data.customerId !== undefined && data.customerId !== reservation.customerId) return true;
  if (data.vehicleId !== undefined && data.vehicleId !== reservation.vehicleId) return true;
  if (!sameDateTime(data.startsAt, reservation.startsAt)) return true;
  if (!sameDateTime(data.endsAt, reservation.endsAt)) return true;
  if (data.days !== undefined && data.days !== reservation.days) return true;
  if (data.pricePerDay !== undefined && !sameDecimal(data.pricePerDay, reservation.pricePerDay)) return true;
  if (data.extrasTotal !== undefined && !sameDecimal(data.extrasTotal, reservation.extrasTotal)) return true;
  if (data.discountAmount !== undefined && !sameDecimal(data.discountAmount, reservation.discountAmount)) return true;
  if (data.discountReason !== undefined && !sameNullableText(data.discountReason, reservation.discountReason)) return true;
  if (data.totalAmount !== undefined && !sameDecimal(data.totalAmount, reservation.totalAmount)) return true;
  if (data.currency !== undefined && data.currency !== reservation.currency) return true;
  if (data.depositAmount !== undefined && !sameDecimal(data.depositAmount, reservation.depositAmount)) return true;
  if (input.legacyExtras !== undefined) return true;
  return !sameSelectedExtras(input.selectedExtras, reservation);
}

function assertActiveExtensionAllowed(input: {
  reservation: Awaited<ReturnType<typeof getReservationService>>;
  nextCustomerId: string;
  nextVehicleId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  if (input.reservation.status !== ReservationStatus.active) return;
  if (
    input.nextCustomerId !== input.reservation.customerId ||
    input.nextVehicleId !== input.reservation.vehicleId ||
    input.startsAt.getTime() !== input.reservation.startsAt.getTime() ||
    input.endsAt.getTime() < input.reservation.endsAt.getTime()
  ) {
    throw createValidationError("RESERVATION_EXTENSION_CONFLICT");
  }
}

function hasAvailabilityRelevantUpdate(input: {
  reservation: Awaited<ReturnType<typeof getReservationService>>;
  vehicleId: string;
  startsAt: Date;
  endsAt: Date;
}) {
  return (
    input.vehicleId !== input.reservation.vehicleId ||
    input.startsAt.getTime() !== input.reservation.startsAt.getTime() ||
    input.endsAt.getTime() !== input.reservation.endsAt.getTime()
  );
}

async function buildPricingSnapshotData(input: {
  context: ReservationServiceContext;
  reservation: Awaited<ReturnType<typeof getReservationService>>;
  snapshotId: string;
  supersedesId?: string | null;
}, db: Parameters<typeof findCurrentVehiclePricingRule>[1]) {
  const pricingRule = await resolveReservationPricingService({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    vehicleId: input.reservation.vehicleId,
  }, db);
  return {
    id: input.snapshotId,
    companyId: input.context.companyId,
    reservationId: input.reservation.id,
    supersedesId: input.supersedesId ?? null,
    isCurrent: true,
    pricingRuleId: pricingRule?.id ?? null,
    startsAt: input.reservation.startsAt,
    endsAt: input.reservation.endsAt,
    durationValue: input.reservation.days,
    durationUnit: "day",
    pricePerDay: input.reservation.pricePerDay,
    days: input.reservation.days,
    extrasTotal: input.reservation.extrasTotal,
    discountAmount: input.reservation.discountAmount,
    discountReason: input.reservation.discountReason,
    totalAmount: input.reservation.totalAmount,
    mileageLimit: pricingRule?.mileageLimit ?? null,
    extraMileageRate: pricingRule?.extraMileageRate ?? null,
    depositAmount: input.reservation.depositAmount,
    currency: input.reservation.currency,
    lockedAt: new Date(),
    lockedBy: input.context.userId as string,
  };
}

function uniqueByKey<T extends { key: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

async function buildExtraSnapshots(input: {
  context: ReservationServiceContext;
  selectedExtras?: ReservationSelectedExtraData[];
  legacyExtras?: ReservationExtraCreateData[];
  days: number;
}, db: Parameters<typeof findReservationExtraDefinitionById>[1]) {
  if (input.selectedExtras) {
    const snapshots: ReservationExtraCreateData[] = [];
    for (const selected of input.selectedExtras) {
      const definition = await findReservationExtraDefinitionById({
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        definitionId: selected.definitionId,
      }, db);
      if (!definition) throw createValidationError("RESERVATION_EXTRA_DEFINITION_NOT_FOUND");
      const quantity = selected.quantity ?? input.days;
      const unitPrice = decimal(definition.price);
      snapshots.push({
        definitionId: definition.id,
        label: definition.label,
        unitPrice,
        quantity,
        totalPrice: unitPrice.mul(quantity),
        currency: definition.currency,
      });
    }
    const extrasTotal = snapshots.reduce((sum, extra) => sum.plus(decimal(extra.totalPrice)), new Prisma.Decimal(0));
    return { snapshots, extrasTotal };
  }

  const snapshots = input.legacyExtras ?? [];
  const extrasTotal = snapshots.reduce((sum, extra) => sum.plus(decimal(extra.totalPrice)), new Prisma.Decimal(0));
  return { snapshots, extrasTotal };
}

async function syncAuthorizedDrivers(input: {
  context: ReservationServiceContext;
  reservationId: string;
  drivers?: ReservationAuthorizedDriverData[];
}, db: Parameters<typeof createReservationAuthorizedDriver>[1]) {
  if (!input.drivers) return;
  await softDeleteReservationAuthorizedDrivers({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.reservationId,
    deletedBy: input.context.userId ?? null,
  }, db);
  for (const driver of input.drivers) {
    await createReservationAuthorizedDriver({
      id: createId(),
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      reservationId: input.reservationId,
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber,
      licenseIssuedAt: driver.licenseIssuedAt ? toDate(driver.licenseIssuedAt) : null,
      licenseExpiresAt: driver.licenseExpiresAt ? toDate(driver.licenseExpiresAt) : null,
      documentUrl: driver.documentUrl ?? null,
    }, db);
  }
}

async function assertReservationScope(input: ReservationServiceContext & { customerId: string; vehicleId: string; sourceId: string }, db?: Parameters<typeof findReservationCustomer>[1]) {
  const [customer, vehicle, source] = await Promise.all([
    findReservationCustomer(input, db),
    findReservationVehicle(input, db),
    findReservationSourceById(input.sourceId, db),
  ]);
  if (!customer) throw createValidationError("RESERVATION_CUSTOMER_NOT_FOUND");
  if (!vehicle) throw createValidationError("RESERVATION_VEHICLE_NOT_FOUND");
  if (!source) throw createValidationError("RESERVATION_SOURCE_NOT_FOUND");
  return { customer, vehicle, source };
}

async function assertVehicleAvailable(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
  startsAt: Date;
  endsAt: Date;
  excludeReservationId?: string;
}, db?: Parameters<typeof findOverlappingReservations>[1]) {
  assertDateRange(input.startsAt, input.endsAt);
  const [vehicle, reservations, fleet] = await Promise.all([
    findReservableVehicleStatus(input, db),
    findOverlappingReservations(input, db),
    findVehicleAvailabilityOverlaps(input, db),
  ]);
  if (!vehicle) throw createValidationError("RESERVATION_VEHICLE_STATUS_INVALID");
  if (reservations.length > 0 || fleet.blocks.length > 0) {
    throw createValidationError("RESERVATION_VEHICLE_UNAVAILABLE", { reservations, blocks: fleet.blocks });
  }
  return { available: true, reservations, blocks: fleet.blocks };
}

async function appendTimeline(input: {
  companyId: string;
  reservationId: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  description?: string | null;
  performedBy?: string | null;
}, db: Parameters<typeof createReservationTimelineEvent>[1]) {
  return createReservationTimelineEvent({ id: createId(), ...input }, db);
}

async function writeReservationLogs(input: {
  context: ReservationServiceContext;
  reservationId: string;
  action: string;
  verb: string;
  changes?: Prisma.InputJsonValue;
}, db: Parameters<typeof writeAuditLog>[1]) {
  await writeAuditLog({
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    action: input.action,
    entityType: "reservation",
    entityId: input.reservationId,
    changes: input.changes,
  }, db);
  await writeActivityLog({
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    entityType: "reservation",
    entityId: input.reservationId,
    verb: input.verb,
    metadata: input.changes,
  }, db);
}

async function writeReservationExtraDefinitionLogs(input: {
  context: ReservationServiceContext;
  definitionId: string;
  action: string;
  verb: string;
  changes?: Prisma.InputJsonValue;
}) {
  await writeAuditLog({
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    action: input.action,
    entityType: "reservation_extra_definition",
    entityId: input.definitionId,
    changes: input.changes,
  });
  await writeActivityLog({
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    entityType: "reservation_extra_definition",
    entityId: input.definitionId,
    verb: input.verb,
    metadata: input.changes,
  });
}

async function generateReservationCode(context: ReservationServiceContext, db: Parameters<typeof incrementNumberSequence>[1]) {
  const year = String(new Date().getFullYear());
  return incrementNumberSequence(
    {
      id: createId(),
      companyId: context.companyId,
      agencyId: context.agencyId,
      sequenceKey: "reservation",
      periodKey: year,
      prefix: `RES-${year}-`,
    },
    db,
  );
}

export async function resolveReservationPricingService(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
}, db?: Parameters<typeof findReservationVehicle>[1]) {
  const vehicle = await findReservationVehicle(input, db);
  if (!vehicle) throw createValidationError("RESERVATION_VEHICLE_NOT_FOUND");
  const vehicleRule = await findCurrentVehiclePricingRule({
    companyId: input.companyId,
    agencyId: input.agencyId,
    vehicleId: input.vehicleId,
  }, db);
  if (vehicleRule) return vehicleRule;
  if (!vehicle.categoryId) return null;
  return findCurrentVehiclePricingRule({
    companyId: input.companyId,
    agencyId: input.agencyId,
    vehicleCategoryId: vehicle.categoryId,
  }, db);
}

export async function getReservationService(input: {
  companyId: string;
  agencyId: string;
  reservationId: string;
  includeDeleted?: boolean;
}, db?: Parameters<typeof findReservationById>[1]) {
  const reservation = await findReservationById(input, db);
  if (!reservation) throw createNotFoundError("Reservation", input);
  return reservation;
}

export async function listReservationsService(input: ReservationListInput) {
  return paginateReservations(input);
}

export async function listReservationSourcesService() {
  return listReservationSources();
}

export async function listReservationExtraDefinitionsService(input: {
  companyId: string;
  agencyId: string;
  includeInactive?: boolean;
}) {
  const definitions = await listReservationExtraDefinitions(input);
  return uniqueByKey(definitions);
}

export async function createReservationExtraDefinitionService(input: {
  context: ReservationServiceContext;
  data: ReservationExtraDefinitionData;
}) {
  const definition = await createReservationExtraDefinition({
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.data.agencyId === undefined ? input.context.agencyId : input.data.agencyId,
    key: input.data.key,
    label: input.data.label,
    description: input.data.description ?? null,
    price: decimal(input.data.price),
    currency: input.data.currency ?? "MAD",
    isActive: input.data.isActive ?? true,
    sortOrder: input.data.sortOrder ?? 0,
  });
  await writeReservationExtraDefinitionLogs({
    context: input.context,
    definitionId: definition.id,
    action: "ReservationExtraDefinitionCreated",
    verb: "ReservationExtraDefinitionCreated",
    changes: { key: definition.key },
  });
  return definition;
}

export async function updateReservationExtraDefinitionService(input: {
  context: ReservationServiceContext;
  definitionId: string;
  data: Partial<ReservationExtraDefinitionData>;
}) {
  const result = await updateReservationExtraDefinition({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    definitionId: input.definitionId,
    data: {
      key: input.data.key,
      label: input.data.label,
      description: input.data.description,
      price: input.data.price === undefined ? undefined : decimal(input.data.price),
      currency: input.data.currency,
      isActive: input.data.isActive,
      sortOrder: input.data.sortOrder,
    },
  });
  if (result.count === 0) throw createNotFoundError("ReservationExtraDefinition", input);
  await writeReservationExtraDefinitionLogs({
    context: input.context,
    definitionId: input.definitionId,
    action: "ReservationExtraDefinitionUpdated",
    verb: "ReservationExtraDefinitionUpdated",
    changes: input.data as Prisma.InputJsonValue,
  });
  return findReservationExtraDefinitionById({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    definitionId: input.definitionId,
    includeInactive: true,
  });
}

export async function deleteReservationExtraDefinitionService(input: ReservationServiceContext & { definitionId: string }) {
  const result = await softDeleteReservationExtraDefinition({
    companyId: input.companyId,
    agencyId: input.agencyId,
    definitionId: input.definitionId,
    deletedBy: input.userId ?? null,
  });
  if (result.count === 0) throw createNotFoundError("ReservationExtraDefinition", input);
  await writeReservationExtraDefinitionLogs({
    context: input,
    definitionId: input.definitionId,
    action: "ReservationExtraDefinitionDeleted",
    verb: "ReservationExtraDefinitionDeleted",
  });
  return { id: input.definitionId };
}

export async function listAssignableReservationDriversService(input: {
  companyId: string;
  agencyId: string;
}) {
  return listAssignableDrivers(input);
}

export async function checkReservationAvailabilityService(input: {
  companyId: string;
  agencyId: string;
  vehicleId: string;
  startsAt: Date;
  endsAt: Date;
  excludeReservationId?: string;
}) {
  assertDateRange(input.startsAt, input.endsAt);
  const [vehicle, reservations, fleet] = await Promise.all([
    findReservableVehicleStatus(input),
    findOverlappingReservations(input),
    findVehicleAvailabilityOverlaps(input),
  ]);

  return {
    available: Boolean(vehicle) && reservations.length === 0 && fleet.blocks.length === 0,
    vehicleStatusAvailable: Boolean(vehicle),
    reservations,
    blocks: fleet.blocks,
  };
}

export async function createReservationService(input: {
  context: ReservationServiceContext;
  reservation: ReservationCreateData;
  extras?: ReservationExtraCreateData[];
  selectedExtras?: ReservationSelectedExtraData[];
  authorizedDrivers?: ReservationAuthorizedDriverData[];
}) {
  const startsAt = toDate(input.reservation.startsAt);
  const endsAt = toDate(input.reservation.endsAt);
  assertDateRange(startsAt, endsAt);
  await assertReservationScope({ ...input.context, customerId: input.reservation.customerId, vehicleId: input.reservation.vehicleId, sourceId: input.reservation.sourceId });

  const reservation = await runInTransaction(async (tx) => {
    await lockReservationVehicle({ ...input.context, vehicleId: input.reservation.vehicleId }, tx);
    await assertVehicleAvailable({ ...input.context, vehicleId: input.reservation.vehicleId, startsAt, endsAt }, tx);
    const sequence = input.reservation.code ? null : await generateReservationCode(input.context, tx);
    const days = input.reservation.days ?? calculateDays(startsAt, endsAt);
    const extraSnapshots = await buildExtraSnapshots({
      context: input.context,
      selectedExtras: input.selectedExtras,
      legacyExtras: input.extras,
      days,
    }, tx);
    const totals = calculateTotals({
      days,
      pricePerDay: input.reservation.pricePerDay,
      extrasTotal: extraSnapshots.extrasTotal,
      discountAmount: input.reservation.discountAmount,
    });
    const created = await createReservation(
      {
        ...input.reservation,
        id: createId(),
        code: input.reservation.code ?? sequence!.formatted,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        startsAt,
        endsAt,
        days,
        extrasTotal: totals.extras,
        discountAmount: totals.discount,
        totalAmount: totals.total,
        status: ReservationStatus.enquiry,
        currency: input.reservation.currency ?? "MAD",
      },
      tx,
    );
    for (const extra of extraSnapshots.snapshots) {
      await createReservationExtra(
        {
          ...extra,
          id: createId(),
          companyId: input.context.companyId,
          reservationId: created.id,
        },
        tx,
      );
    }
    await syncAuthorizedDrivers({
      context: input.context,
      reservationId: created.id,
      drivers: input.authorizedDrivers,
    }, tx);
    await appendTimeline({
      companyId: created.companyId,
      reservationId: created.id,
      eventType: "created",
      toStatus: created.status,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({
      context: input.context,
      reservationId: created.id,
      action: "ReservationCreated",
      verb: "ReservationCreated",
    }, tx);
    return created;
  });

  await publishDomainEvent({
    name: "ReservationCreated",
    companyId: reservation.companyId,
    agencyId: reservation.agencyId,
    entityType: "reservation",
    entityId: reservation.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return reservation;
}

export async function updateReservationService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  data: ReservationUpdateData;
  extras?: ReservationExtraCreateData[];
  selectedExtras?: ReservationSelectedExtraData[];
  authorizedDrivers?: ReservationAuthorizedDriverData[];
}) {
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };
  const reservation = await getReservationService(scope);
  if (
    reservation.status !== ReservationStatus.enquiry &&
    reservation.status !== ReservationStatus.confirmed &&
    reservation.status !== ReservationStatus.active
  ) {
    throw createValidationError("RESERVATION_EDIT_BLOCKED_BY_STATUS");
  }
  const meaningfulPricingUpdate = hasMeaningfulPricingRelevantUpdate({
    data: input.data,
    selectedExtras: input.selectedExtras,
    legacyExtras: input.extras,
    reservation,
  });
  const contractDetailsUpdate = hasContractDetailsUpdate({
    data: input.data,
    authorizedDrivers: input.authorizedDrivers,
    reservation,
  });
  if (
    (reservation.status === ReservationStatus.confirmed || reservation.status === ReservationStatus.active) &&
    meaningfulPricingUpdate
  ) {
    throw createValidationError("RESERVATION_REPRICING_REQUIRED");
  }
  const nextCustomerId = input.data.customerId ?? reservation.customerId;
  const nextVehicleId = input.data.vehicleId ?? reservation.vehicleId;
  const nextSourceId = input.data.sourceId ?? reservation.sourceId;
  const startsAt = input.data.startsAt ? toDate(input.data.startsAt) : reservation.startsAt;
  const endsAt = input.data.endsAt ? toDate(input.data.endsAt) : reservation.endsAt;
  assertDateRange(startsAt, endsAt);
  await assertReservationScope({ ...input.context, customerId: nextCustomerId, vehicleId: nextVehicleId, sourceId: nextSourceId });
  const availabilityChanged = hasAvailabilityRelevantUpdate({ reservation, vehicleId: nextVehicleId, startsAt, endsAt });

  await runInTransaction(async (tx) => {
    if (availabilityChanged) {
      await lockReservationVehicle({ ...input.context, vehicleId: nextVehicleId }, tx);
      await assertVehicleAvailable({ ...input.context, vehicleId: nextVehicleId, startsAt, endsAt, excludeReservationId: input.reservationId }, tx);
    }
    const days = input.data.days ?? calculateDays(startsAt, endsAt);
    const pricePerDay = input.data.pricePerDay ?? reservation.pricePerDay;
    const extraSnapshots = await buildExtraSnapshots({
      context: input.context,
      selectedExtras: input.selectedExtras,
      legacyExtras: input.extras,
      days,
    }, tx);
    const totals = calculateTotals({
      days,
      pricePerDay,
      extrasTotal: input.selectedExtras || input.extras ? extraSnapshots.extrasTotal : reservation.extrasTotal,
      discountAmount: input.data.discountAmount ?? reservation.discountAmount,
    });
    const updateData: Prisma.ReservationUncheckedUpdateInput = meaningfulPricingUpdate
      ? {
          ...input.data,
          customerId: nextCustomerId,
          vehicleId: nextVehicleId,
          sourceId: nextSourceId,
          startsAt,
          endsAt,
          days,
          pricePerDay,
          extrasTotal: totals.extras,
          discountAmount: totals.discount,
          totalAmount: totals.total,
        }
      : {
          sourceId: input.data.sourceId,
          assignedAgentId: input.data.assignedAgentId,
          pickupLocation: input.data.pickupLocation,
          returnLocation: input.data.returnLocation,
          internalNotes: input.data.internalNotes,
          advanceAmount: input.data.advanceAmount,
        };
    const result = await updateReservationStatusConditionally(
      {
        ...scope,
        expectedStatuses: [reservation.status],
        data: updateData,
      },
      tx,
    );
    if (result.count !== 1) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    if (meaningfulPricingUpdate && (input.selectedExtras || input.extras)) {
      await deleteReservationExtras({ companyId: input.context.companyId, reservationId: input.reservationId }, tx);
      for (const extra of extraSnapshots.snapshots) {
        await createReservationExtra(
          {
            ...extra,
            id: createId(),
            companyId: input.context.companyId,
            reservationId: input.reservationId,
          },
          tx,
        );
      }
    }
    await syncAuthorizedDrivers({
      context: input.context,
      reservationId: input.reservationId,
      drivers: input.authorizedDrivers,
    }, tx);
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: "updated",
      description: "reservation_updated",
      performedBy: input.context.userId ?? null,
    }, tx);
    if (contractDetailsUpdate) {
      await appendTimeline({
        companyId: input.context.companyId,
        reservationId: input.reservationId,
        eventType: "contract_details_updated",
        description: "reservation_contract_details_updated",
        performedBy: input.context.userId ?? null,
      }, tx);
    }
    await writeReservationLogs({
      context: input.context,
      reservationId: input.reservationId,
      action: "ReservationUpdated",
      verb: "ReservationUpdated",
    }, tx);
  });

  return getReservationService(scope);
}

export async function repriceReservationService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  data: ReservationUpdateData;
  extras?: ReservationExtraCreateData[];
  selectedExtras?: ReservationSelectedExtraData[];
}) {
  if (!input.context.userId) throw createValidationError("RESERVATION_CONFIRMATION_ACTOR_REQUIRED");
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };

  await runInTransaction(async (tx) => {
    await lockReservationRow(scope, tx);
    const reservation = await getReservationService(scope, tx);
    if (reservation.status !== ReservationStatus.confirmed && reservation.status !== ReservationStatus.active) {
      throw createValidationError("RESERVATION_REPRICING_NOT_ALLOWED");
    }

    const nextCustomerId = input.data.customerId ?? reservation.customerId;
    const nextVehicleId = input.data.vehicleId ?? reservation.vehicleId;
    const nextSourceId = input.data.sourceId ?? reservation.sourceId;
    const startsAt = input.data.startsAt ? toDate(input.data.startsAt) : reservation.startsAt;
    const endsAt = input.data.endsAt ? toDate(input.data.endsAt) : reservation.endsAt;
    assertDateRange(startsAt, endsAt);
    assertActiveExtensionAllowed({ reservation, nextCustomerId, nextVehicleId, startsAt, endsAt });
    await assertReservationScope({ ...input.context, customerId: nextCustomerId, vehicleId: nextVehicleId, sourceId: nextSourceId }, tx);
    await lockReservationVehicle({ ...input.context, vehicleId: nextVehicleId }, tx);
    await assertVehicleAvailable({ ...input.context, vehicleId: nextVehicleId, startsAt, endsAt, excludeReservationId: input.reservationId }, tx);

    const days = input.data.days ?? calculateDays(startsAt, endsAt);
    const pricePerDay = input.data.pricePerDay ?? reservation.pricePerDay;
    const extraSnapshots = await buildExtraSnapshots({
      context: input.context,
      selectedExtras: input.selectedExtras,
      legacyExtras: input.extras,
      days,
    }, tx);
    const totals = calculateTotals({
      days,
      pricePerDay,
      extrasTotal: input.selectedExtras || input.extras ? extraSnapshots.extrasTotal : reservation.extrasTotal,
      discountAmount: input.data.discountAmount ?? reservation.discountAmount,
    });
    const result = await updateReservationStatusConditionally({
      ...scope,
      expectedStatuses: [reservation.status],
      data: {
        ...input.data,
        customerId: nextCustomerId,
        vehicleId: nextVehicleId,
        sourceId: nextSourceId,
        startsAt,
        endsAt,
        days,
        pricePerDay,
        extrasTotal: totals.extras,
        discountAmount: totals.discount,
        totalAmount: totals.total,
      },
    }, tx);
    if (result.count !== 1) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");

    if (input.selectedExtras || input.extras) {
      await deleteReservationExtras({ companyId: input.context.companyId, reservationId: input.reservationId }, tx);
      for (const extra of extraSnapshots.snapshots) {
        await createReservationExtra({
          ...extra,
          id: createId(),
          companyId: input.context.companyId,
          reservationId: input.reservationId,
        }, tx);
      }
    }

    const previousSnapshot = await findCurrentPricingSnapshot({ companyId: input.context.companyId, reservationId: input.reservationId }, tx);
    if (!previousSnapshot) throw createNotFoundError("Reservation pricing snapshot", scope);
    await markPricingSnapshotsNotCurrent({ companyId: input.context.companyId, reservationId: input.reservationId }, tx);
    const updatedReservation = await getReservationService(scope, tx);
    const snapshotId = createId();
    const snapshotData = await buildPricingSnapshotData({
      context: input.context,
      reservation: updatedReservation,
      snapshotId,
      supersedesId: previousSnapshot.id,
    }, tx);
    await createReservationPricingSnapshot(snapshotData, tx);
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: "pricing_adjusted",
      description: "reservation_pricing_adjusted",
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({
      context: input.context,
      reservationId: input.reservationId,
      action: "ReservationRepriced",
      verb: "ReservationRepriced",
      changes: { supersedesId: previousSnapshot.id, pricingSnapshotId: snapshotId },
    }, tx);
  });

  await publishDomainEvent({
    name: "PricingSnapshotAdjusted",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation",
    entityId: input.reservationId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getReservationService(scope);
}

export async function assignReservationDriverService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  driverId?: string | null;
}) {
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };
  await getReservationService(scope);

  const driver = input.driverId
    ? await findDriverById({
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        driverId: input.driverId,
      })
    : null;
  if (input.driverId && (!driver || driver.status !== DriverStatus.active)) {
    throw createValidationError("RESERVATION_DRIVER_NOT_ASSIGNABLE");
  }

  await runInTransaction(async (tx) => {
    await softDeleteReservationDriverAssignments(
      {
        companyId: input.context.companyId,
        reservationId: input.reservationId,
        role: DriverRole.primary,
        deletedBy: input.context.userId ?? null,
      },
      tx,
    );
    if (driver) {
      await createDriverReservationAssignment(
        {
          id: createId(),
          companyId: input.context.companyId,
          reservationId: input.reservationId,
          driverId: driver.id,
          role: DriverRole.primary,
        },
        tx,
      );
    }
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: driver ? "driver_assigned" : "driver_unassigned",
      description: driver ? `${driver.firstName} ${driver.lastName}` : null,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({
      context: input.context,
      reservationId: input.reservationId,
      action: driver ? "ReservationDriverAssigned" : "ReservationDriverUnassigned",
      verb: driver ? "ReservationDriverAssigned" : "ReservationDriverUnassigned",
      changes: { driverId: driver?.id ?? null },
    }, tx);
  });

  if (input.driverId) {
    await publishDomainEvent({
      name: "DriverAssignedToReservation",
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      entityType: "reservation",
      entityId: input.reservationId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      occurredAt: new Date(),
    });
  }
  return getReservationService(scope);
}

export async function confirmReservationService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  blacklistAcknowledged?: boolean;
}) {
  if (!input.context.userId) throw createValidationError("RESERVATION_CONFIRMATION_ACTOR_REQUIRED");
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };

  const snapshotId = createId();
  await runInTransaction(async (tx) => {
    await lockReservationRow(scope, tx);
    const reservation = await getReservationService(scope, tx);
    if (reservation.status !== ReservationStatus.enquiry) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    const blacklist = await findActiveCustomerBlacklist({ companyId: input.context.companyId, customerId: reservation.customerId }, tx);
    if (blacklist.length > 0 && !input.blacklistAcknowledged) throw createValidationError("RESERVATION_CUSTOMER_BLACKLISTED", blacklist);
    await lockReservationVehicle({ ...input.context, vehicleId: reservation.vehicleId }, tx);
    await assertVehicleAvailable({ ...input.context, vehicleId: reservation.vehicleId, startsAt: reservation.startsAt, endsAt: reservation.endsAt, excludeReservationId: reservation.id }, tx);
    const currentSnapshot = await findCurrentPricingSnapshot({ companyId: input.context.companyId, reservationId: input.reservationId }, tx);
    if (currentSnapshot) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    const snapshotData = await buildPricingSnapshotData({ context: input.context, reservation, snapshotId }, tx);
    await createReservationPricingSnapshot(
      snapshotData,
      tx,
    );
    const result = await updateReservationStatusConditionally({
      ...scope,
      expectedStatuses: [ReservationStatus.enquiry],
      data: { status: ReservationStatus.confirmed, confirmedAt: new Date() },
    }, tx);
    if (result.count !== 1) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: "status_changed",
      fromStatus: ReservationStatus.enquiry,
      toStatus: ReservationStatus.confirmed,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({
      context: input.context,
      reservationId: input.reservationId,
      action: "ReservationConfirmed",
      verb: "ReservationConfirmed",
      changes: { pricingSnapshotId: snapshotId },
    }, tx);
  });

  await publishDomainEvent({ name: "ReservationConfirmed", companyId: input.context.companyId, agencyId: input.context.agencyId, entityType: "reservation", entityId: input.reservationId, userId: input.context.userId, actorName: input.context.actorName, occurredAt: new Date() });
  await publishDomainEvent({ name: "PricingSnapshotLocked", companyId: input.context.companyId, agencyId: input.context.agencyId, entityType: "reservation_pricing_snapshot", entityId: snapshotId, userId: input.context.userId, actorName: input.context.actorName, occurredAt: new Date() });
  return getReservationService(scope);
}

async function transitionReservation(input: {
  context: ReservationServiceContext;
  reservationId: string;
  allowedFrom: ReservationStatus[];
  toStatus: ReservationStatus;
  timestampField: "activatedAt" | "completedAt";
  eventName: "ReservationPickedUp" | "ReservationCompleted";
}) {
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };
  await runInTransaction(async (tx) => {
    await lockReservationRow(scope, tx);
    const reservation = await getReservationService(scope, tx);
    if (!input.allowedFrom.includes(reservation.status)) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    const data = { status: input.toStatus, [input.timestampField]: new Date() };
    const result = await updateReservationStatusConditionally({
      ...scope,
      expectedStatuses: input.allowedFrom,
      data,
    }, tx);
    if (result.count !== 1) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: "status_changed",
      fromStatus: reservation.status,
      toStatus: input.toStatus,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({
      context: input.context,
      reservationId: input.reservationId,
      action: input.eventName,
      verb: input.eventName,
    }, tx);
  });
  await publishDomainEvent({ name: input.eventName, companyId: input.context.companyId, agencyId: input.context.agencyId, entityType: "reservation", entityId: input.reservationId, userId: input.context.userId, actorName: input.context.actorName, occurredAt: new Date() });
  return getReservationService(scope);
}

export async function activateReservationService(input: { context: ReservationServiceContext; reservationId: string }) {
  return transitionReservation({
    ...input,
    allowedFrom: [ReservationStatus.confirmed],
    toStatus: ReservationStatus.active,
    timestampField: "activatedAt",
    eventName: "ReservationPickedUp",
  });
}

export async function completeReservationStatusService(input: { context: ReservationServiceContext; reservationId: string }) {
  return transitionReservation({
    ...input,
    allowedFrom: [ReservationStatus.active],
    toStatus: ReservationStatus.completed,
    timestampField: "completedAt",
    eventName: "ReservationCompleted",
  });
}

export async function cancelReservationService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  reason: string;
}) {
  if (!input.reason.trim()) throw createValidationError("RESERVATION_CANCELLATION_REASON_REQUIRED");
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };
  const initialReservation = await getReservationService(scope);
  if (!cancellableStatuses.includes(initialReservation.status)) {
    throw createValidationError("RESERVATION_INVALID_STATUS_TRANSITION");
  }
  await runInTransaction(async (tx) => {
    await lockReservationRow(scope, tx);
    const reservation = await getReservationService(scope, tx);
    if (reservation.status !== initialReservation.status || !cancellableStatuses.includes(reservation.status)) {
      throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    }
    const result = await updateReservationStatusConditionally({
      ...scope,
      expectedStatuses: [initialReservation.status],
      data: {
        status: ReservationStatus.cancelled,
        cancellationReason: input.reason,
        cancelledAt: new Date(),
        cancelledBy: input.context.userId ?? null,
      },
    }, tx);
    if (result.count !== 1) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: "status_changed",
      fromStatus: reservation.status,
      toStatus: ReservationStatus.cancelled,
      description: input.reason,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({
      context: input.context,
      reservationId: input.reservationId,
      action: "ReservationCancelled",
      verb: "ReservationCancelled",
      changes: { reason: input.reason },
    }, tx);
  });
  await publishDomainEvent({ name: "ReservationCancelled", companyId: input.context.companyId, agencyId: input.context.agencyId, entityType: "reservation", entityId: input.reservationId, userId: input.context.userId, actorName: input.context.actorName, occurredAt: new Date() });
  return getReservationService(scope);
}

export async function markReservationNoShowService(input: {
  context: ReservationServiceContext;
  reservationId: string;
  reason?: string;
}) {
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };
  await runInTransaction(async (tx) => {
    await lockReservationRow(scope, tx);
    const reservation = await getReservationService(scope, tx);
    if (reservation.status !== ReservationStatus.confirmed) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    const result = await updateReservationStatusConditionally({
      ...scope,
      expectedStatuses: [ReservationStatus.confirmed],
      data: { status: ReservationStatus.no_show },
    }, tx);
    if (result.count !== 1) throw createValidationError("RESERVATION_LIFECYCLE_CONFLICT");
    await appendTimeline({
      companyId: input.context.companyId,
      reservationId: input.reservationId,
      eventType: "status_changed",
      fromStatus: reservation.status,
      toStatus: ReservationStatus.no_show,
      description: input.reason,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeReservationLogs({ context: input.context, reservationId: input.reservationId, action: "ReservationNoShow", verb: "ReservationNoShow" }, tx);
  });
  return getReservationService(scope);
}

export async function getCurrentPricingSnapshotService(input: { companyId: string; reservationId: string }) {
  const snapshot = await findCurrentPricingSnapshot(input);
  if (!snapshot) throw createNotFoundError("Reservation pricing snapshot", input);
  return snapshot;
}

export async function deleteReservationService(input: ReservationServiceContext & { reservationId: string }) {
  await runInTransaction(async (tx) => {
    await lockReservationRow(input, tx);
    const reservation = await getReservationService(input, tx);
    if (reservingStatuses.includes(reservation.status)) throw createValidationError("RESERVATION_DELETE_BLOCKED_BY_STATUS");
    const blockers = await countBlockingReservations(input, tx);
    if (blockers > 0) throw createValidationError("RESERVATION_DELETE_BLOCKED_BY_STATUS");
    const result = await softDeleteReservation({ ...input, deletedBy: input.userId ?? null }, tx);
    if (result.count === 0) throw createNotFoundError("Reservation", input);
    await appendTimeline({
      companyId: input.companyId,
      reservationId: input.reservationId,
      eventType: "deleted",
      performedBy: input.userId ?? null,
    }, tx);
    await writeReservationLogs({ context: input, reservationId: input.reservationId, action: "ReservationDeleted", verb: "ReservationDeleted" }, tx);
  });
  return { id: input.reservationId };
}

export async function restoreReservationService(input: ReservationServiceContext & { reservationId: string }) {
  await runInTransaction(async (tx) => {
    await lockReservationRow(input, tx);
    const reservation = await getReservationService({ ...input, includeDeleted: true }, tx);
    if (reservingStatuses.includes(reservation.status)) {
      await lockReservationVehicle({ ...input, vehicleId: reservation.vehicleId }, tx);
      await assertVehicleAvailable({ ...input, vehicleId: reservation.vehicleId, startsAt: reservation.startsAt, endsAt: reservation.endsAt, excludeReservationId: reservation.id }, tx);
    }
    const result = await restoreReservation(input, tx);
    if (result.count === 0) throw createNotFoundError("Reservation", input);
    await appendTimeline({
      companyId: input.companyId,
      reservationId: input.reservationId,
      eventType: "restored",
      performedBy: input.userId ?? null,
    }, tx);
    await writeReservationLogs({ context: input, reservationId: input.reservationId, action: "ReservationRestored", verb: "ReservationRestored" }, tx);
  });
  return getReservationService(input);
}

export const reservationsService = {
  getReservationService,
  listReservationsService,
  listReservationSourcesService,
  listReservationExtraDefinitionsService,
  listAssignableReservationDriversService,
  checkReservationAvailabilityService,
  resolveReservationPricingService,
  createReservationService,
  updateReservationService,
  repriceReservationService,
  createReservationExtraDefinitionService,
  updateReservationExtraDefinitionService,
  deleteReservationExtraDefinitionService,
  assignReservationDriverService,
  confirmReservationService,
  activateReservationService,
  cancelReservationService,
  markReservationNoShowService,
  completeReservationStatusService,
  getCurrentPricingSnapshotService,
  deleteReservationService,
  restoreReservationService,
};
