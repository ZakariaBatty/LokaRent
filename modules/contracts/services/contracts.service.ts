import { ContractStatus, Prisma, ReservationStatus } from "@lokarent/db";
import { createHash } from "crypto";
import { createId, createNotFoundError, createValidationError, publishDomainEvent, runInTransaction } from "@/shared";
import { writeActivityLog, writeAuditLog } from "@/shared/audit";
import { createVehicleMileageLog } from "@/modules/cars/repositories/cars.repository";
import { incrementNumberSequence } from "@/modules/workspace/billing/repositories/billing.repository";
import {
  createReservationTimelineEvent,
  findCurrentPricingSnapshot,
  findReservationById,
  lockReservationRow,
  updateReservationStatusConditionally,
} from "@/modules/reservations/repositories/reservations.repository";
import {
  clearDefaultContractTemplates,
  createContract,
  createContractInspectionItem,
  createContractSignature,
  createContractTemplate,
  createContractTemplateVersion,
  findContractById,
  findContractByReservation,
  findContractOrganizationSnapshot,
  findCurrentContractTemplateVersion,
  findDefaultContractTemplate,
  listContractTemplates,
  listContractTemplateVersions,
  listContractInspectionItems,
  listContractSignatures,
  lockContractRow,
  paginateContracts,
  softDeleteContract,
  updateContract,
  updateContractStatusConditionally,
  updateContractInspectionItem,
  updateContractTemplate,
  type ContractListInput,
} from "../repositories/contracts.repository";

export type ContractServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

type ContractTemplateCreateData = Omit<Parameters<typeof createContractTemplate>[0], "id" | "companyId" | "agencyId">;
type ContractTemplateVersionCreateData = Omit<Parameters<typeof createContractTemplateVersion>[0], "id" | "companyId" | "templateId" | "createdBy">;
type ContractCreateData = Omit<Parameters<typeof createContract>[0], "id" | "companyId" | "agencyId">;
type MileageLogCreateData = Omit<Parameters<typeof createVehicleMileageLog>[0], "id" | "companyId" | "recordedBy" | "source" | "referenceId">;
type SignatureCreateData = Omit<Parameters<typeof createContractSignature>[0], "id" | "companyId" | "contractId" | "signedBy">;
type InspectionItemCreateData = Omit<Parameters<typeof createContractInspectionItem>[0], "id" | "companyId">;

const contractGenerationStatuses: ReservationStatus[] = [ReservationStatus.confirmed, ReservationStatus.active];
const mutableContractStatuses: ContractStatus[] = [ContractStatus.draft, ContractStatus.active, ContractStatus.disputed];

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stableJson(value: unknown) {
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

function contentHash(content: string, snapshot: Prisma.InputJsonValue) {
  return createHash("sha256").update(content).update(JSON.stringify(snapshot)).digest("hex");
}

function customerName(customer: NonNullable<Awaited<ReturnType<typeof findReservationById>>>) {
  if (customer.customer.type === "company") return customer.customer.business?.companyName ?? customer.customer.email ?? customer.customer.code;
  return [customer.customer.individual?.firstName, customer.customer.individual?.lastName].filter(Boolean).join(" ") || customer.customer.email || customer.customer.code;
}

function customerIdentity(customer: NonNullable<Awaited<ReturnType<typeof findReservationById>>>) {
  if (customer.customer.type === "company") return customer.customer.business?.taxId ?? customer.customer.code;
  return customer.customer.individual?.cinNumber ?? customer.customer.code;
}

function renderTemplate(body: unknown, variables: Record<string, string>) {
  const raw =
    typeof body === "string"
      ? body
      : typeof body === "object" && body && "title" in body
        ? defaultTemplateHtml(body as { title?: string; clauses?: { title: string; content: string; enabled: boolean }[]; footerText?: string })
        : String(body ?? "");
  return raw.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => variables[key] ?? "");
}

function defaultTemplateHtml(template: { title?: string; clauses?: { title: string; content: string; enabled: boolean }[]; footerText?: string }) {
  const clauses = (template.clauses ?? [])
    .filter((clause) => clause.enabled)
    .map((clause, index) => `<h3>${index + 1}. ${escapeHtml(clause.title)}</h3><p>${escapeHtml(clause.content)}</p>`)
    .join("");
  return `<article><h1>${escapeHtml(template.title ?? "Contract")}</h1>{{contract.summary}}${clauses}<footer>${escapeHtml(template.footerText ?? "")}</footer></article>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSnapshot(input: {
  reservation: NonNullable<Awaited<ReturnType<typeof findReservationById>>>;
  pricingSnapshot: NonNullable<Awaited<ReturnType<typeof findCurrentPricingSnapshot>>>;
  template: NonNullable<Awaited<ReturnType<typeof findDefaultContractTemplate>>>;
  version: NonNullable<Awaited<ReturnType<typeof findCurrentContractTemplateVersion>>>;
  organization: Awaited<ReturnType<typeof findContractOrganizationSnapshot>>;
  code: string;
  pickupMileage: number;
  pickupFuelLevel?: number | null;
  pickupAt: Date;
  notes?: string | null;
}) {
  const reservation = input.reservation;
  const pricing = input.pricingSnapshot;
  const additionalDrivers = reservation.authorizedDrivers.map((driver) => ({
    fullName: driver.fullName,
    licenseNumber: driver.licenseNumber,
    licenseIssuedAt: driver.licenseIssuedAt?.toISOString() ?? null,
    licenseExpiresAt: driver.licenseExpiresAt?.toISOString() ?? null,
  }));
  const internalDrivers = reservation.driverAssignments.map((assignment) => ({
    id: assignment.driverId,
    role: assignment.role,
    fullName: `${assignment.driver.firstName} ${assignment.driver.lastName}`,
    phone: assignment.driver.phone,
  }));
  const extras = reservation.extras.map((extra) => ({
    label: extra.label,
    unitPrice: extra.unitPrice.toString(),
    quantity: extra.quantity,
    totalPrice: extra.totalPrice.toString(),
    currency: extra.currency,
  }));
  const snapshot = {
    contract: {
      code: input.code,
      pickupMileage: input.pickupMileage,
      pickupFuelLevel: input.pickupFuelLevel ?? null,
      pickupAt: input.pickupAt.toISOString(),
      notes: input.notes ?? null,
    },
    template: {
      id: input.template.id,
      name: input.template.name,
      versionId: input.version.id,
      versionNumber: input.version.versionNumber,
      body: jsonClone(input.version.body),
    },
    company: input.organization.company
      ? {
          id: input.organization.company.id,
          name: input.organization.company.name,
          countryCode: input.organization.company.countryCode,
          timezone: input.organization.company.timezone,
          currency: input.organization.company.currency,
        }
      : null,
    agency: input.organization.agency
      ? {
          id: input.organization.agency.id,
          name: input.organization.agency.name,
          code: input.organization.agency.code,
          phone: input.organization.agency.phone,
          email: input.organization.agency.email,
          address: jsonClone(input.organization.agency.address),
          countryCode: input.organization.agency.countryCode,
          timezone: input.organization.agency.timezone,
          currency: input.organization.agency.currency,
        }
      : null,
    reservation: {
      id: reservation.id,
      code: reservation.code,
      startsAt: pricing.startsAt?.toISOString() ?? reservation.startsAt.toISOString(),
      endsAt: pricing.endsAt?.toISOString() ?? reservation.endsAt.toISOString(),
      durationValue: pricing.durationValue ?? reservation.days,
      durationUnit: pricing.durationUnit ?? "day",
      pickupLocation: reservation.pickupLocation,
      returnLocation: reservation.returnLocation,
    },
    customer: {
      id: reservation.customerId,
      name: customerName(reservation),
      identity: customerIdentity(reservation),
      phone: reservation.customer.phone,
      email: reservation.customer.email,
      city: reservation.customer.city,
    },
    vehicle: {
      id: reservation.vehicleId,
      brand: reservation.vehicle.brand,
      model: reservation.vehicle.model,
      plate: reservation.vehicle.plate,
      category: reservation.vehicle.category?.name ?? null,
      vin: reservation.vehicle.vin,
      year: reservation.vehicle.year,
    },
    pricing: {
      snapshotId: pricing.id,
      pricingRuleId: pricing.pricingRuleId,
      pricePerDay: pricing.pricePerDay.toString(),
      days: pricing.days,
      extrasTotal: pricing.extrasTotal.toString(),
      discountAmount: pricing.discountAmount.toString(),
      discountReason: pricing.discountReason,
      totalAmount: pricing.totalAmount.toString(),
      mileageLimit: pricing.mileageLimit,
      extraMileageRate: pricing.extraMileageRate?.toString() ?? null,
      depositAmount: pricing.depositAmount?.toString() ?? reservation.depositAmount.toString(),
      currency: pricing.currency,
      extras,
    },
    authorizedDrivers: additionalDrivers,
    internalDrivers,
  };
  const variables = {
    "contract.code": input.code,
    "reservation.code": reservation.code,
    "customer.name": snapshot.customer.name,
    "customer.identity": snapshot.customer.identity,
    "customer.phone": reservation.customer.phone ?? "",
    "vehicle.label": `${reservation.vehicle.brand} ${reservation.vehicle.model}`,
    "vehicle.plate": reservation.vehicle.plate,
    "pickup.date": snapshot.reservation.startsAt,
    "return.date": snapshot.reservation.endsAt,
    "pricing.total": pricing.totalAmount.toString(),
    "pricing.currency": pricing.currency,
    "company.name": snapshot.company?.name ?? "",
    "agency.name": snapshot.agency?.name ?? "",
    "agency.phone": snapshot.agency?.phone ?? "",
    "agency.email": snapshot.agency?.email ?? "",
    "contract.summary": `<section><p>${escapeHtml(snapshot.customer.name)} - ${escapeHtml(reservation.vehicle.plate)} - ${escapeHtml(pricing.totalAmount.toString())} ${escapeHtml(pricing.currency)}</p></section>`,
  };
  const renderedHtml = renderTemplate(input.version.body, variables);
  return { snapshot: snapshot as Prisma.InputJsonValue, renderedHtml };
}

async function writeContractLogs(input: {
  context: ContractServiceContext;
  contractId: string;
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
    entityType: "contract",
    entityId: input.contractId,
    changes: input.changes,
  }, db);
  await writeActivityLog({
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    entityType: "contract",
    entityId: input.contractId,
    verb: input.verb,
    metadata: input.changes,
  }, db);
}

async function generateContractCode(context: ContractServiceContext, db: Parameters<typeof incrementNumberSequence>[1]) {
  const year = String(new Date().getFullYear());
  return incrementNumberSequence({
    id: createId(),
    companyId: context.companyId,
    agencyId: context.agencyId,
    sequenceKey: "contract",
    periodKey: year,
    prefix: `CTR-${year}-`,
  }, db);
}

export async function getContractService(input: {
  companyId: string;
  agencyId: string;
  contractId: string;
}, db?: Parameters<typeof findContractById>[1]) {
  const contract = await findContractById(input, db);
  if (!contract) throw createNotFoundError("Contract", input);
  return contract;
}

export async function getContractByReservationService(input: {
  companyId: string;
  agencyId: string;
  reservationId: string;
}, db?: Parameters<typeof findContractByReservation>[1]) {
  const contract = await findContractByReservation(input, db);
  if (!contract) throw createNotFoundError("Contract", input);
  return contract;
}

export async function listContractsService(input: ContractListInput) {
  return paginateContracts(input);
}

export async function listContractTemplatesService(input: {
  companyId: string;
  agencyId: string;
  includeInactive?: boolean;
}) {
  return listContractTemplates(input);
}

export async function listContractTemplateVersionsService(input: {
  companyId: string;
  templateId: string;
}) {
  return listContractTemplateVersions(input);
}

export async function getDefaultContractTemplateService(input: {
  companyId: string;
  agencyId?: string | null;
}) {
  const template = await findDefaultContractTemplate(input);
  if (!template) throw createNotFoundError("Default contract template", input);
  return template;
}

export async function createContractTemplateService(input: {
  context: ContractServiceContext;
  template: ContractTemplateCreateData;
  version: ContractTemplateVersionCreateData;
}) {
  return runInTransaction(async (tx) => {
    const templateId = createId();
    if (input.template.isDefault) {
      await clearDefaultContractTemplates({
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      }, tx);
    }
    const template = await createContractTemplate(
      {
        ...input.template,
        id: templateId,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      },
      tx,
    );
    const version = await createContractTemplateVersion(
      {
        ...input.version,
        id: createId(),
        companyId: input.context.companyId,
        templateId,
        createdBy: input.context.userId ?? null,
      },
      tx,
    );
    await writeContractLogs({
      context: input.context,
      contractId: templateId,
      action: "ContractTemplateCreated",
      verb: "ContractTemplateCreated",
      changes: { templateId, versionId: version.id },
    }, tx);
    return { template, version };
  });
}

export async function updateContractTemplateService(input: {
  context: ContractServiceContext;
  templateId: string;
  data: {
    name?: string;
    content?: string;
    isDefault?: boolean;
    isActive?: boolean;
    body?: Prisma.InputJsonValue;
  };
}) {
  return runInTransaction(async (tx) => {
    const template = await listContractTemplates({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      includeInactive: true,
    }, tx).then((items) => items.find((item) => item.id === input.templateId));
    if (!template) throw createNotFoundError("Contract template", input);
    if (input.data.isDefault) {
      await clearDefaultContractTemplates({
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        excludeTemplateId: input.templateId,
      }, tx);
    }
    const createsNewVersion = input.data.body !== undefined || input.data.content !== undefined;
    const nextVersion = createsNewVersion ? template.version + 1 : template.version;
    const result = await updateContractTemplate({
      companyId: input.context.companyId,
      templateId: input.templateId,
      data: {
        name: input.data.name,
        content: input.data.content,
        isDefault: input.data.isDefault,
        isActive: input.data.isActive,
        version: nextVersion,
      },
    }, tx);
    if (result.count !== 1) throw createNotFoundError("Contract template", input);
    let version = null;
    if (createsNewVersion) {
      version = await createContractTemplateVersion({
        id: createId(),
        companyId: input.context.companyId,
        templateId: input.templateId,
        versionNumber: nextVersion,
        body: input.data.body ?? input.data.content ?? template.content,
        createdBy: input.context.userId ?? null,
      }, tx);
    }
    await writeContractLogs({
      context: input.context,
      contractId: input.templateId,
      action: "ContractTemplateUpdated",
      verb: "ContractTemplateUpdated",
      changes: { createsNewVersion, versionId: version?.id ?? null },
    }, tx);
    return { templateId: input.templateId, version };
  });
}

export async function getCurrentContractTemplateVersionService(input: {
  companyId: string;
  templateId: string;
}) {
  const version = await findCurrentContractTemplateVersion(input);
  if (!version) throw createNotFoundError("Contract template version", input);
  return version;
}

export async function createContractService(input: {
  context: ContractServiceContext;
  data: ContractCreateData;
}) {
  const existing = await findContractByReservation({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.data.reservationId,
  });
  if (existing) throw createValidationError("Reservation already has a contract");
  const contract = await createContract({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
  await publishDomainEvent({
    name: "ContractGenerated",
    companyId: contract.companyId,
    agencyId: contract.agencyId,
    entityType: "contract",
    entityId: contract.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return contract;
}

export async function generateContractFromReservationService(input: {
  context: ContractServiceContext;
  reservationId: string;
  templateId?: string;
  pickupMileage: number;
  pickupFuelLevel?: number | null;
  pickupAt?: Date;
  notes?: string | null;
  inspectionItems?: InspectionItemCreateData[];
}) {
  if (!input.context.userId) throw createValidationError("CONTRACT_GENERATION_ACTOR_REQUIRED");
  if (!Number.isInteger(input.pickupMileage) || input.pickupMileage < 0) throw createValidationError("CONTRACT_INVALID_PICKUP_MILEAGE");
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, reservationId: input.reservationId };
  let createdContractId = "";
  let contractCode = "";

  await runInTransaction(async (tx) => {
    await lockReservationRow(scope, tx);
    const reservation = await findReservationById(scope, tx);
    if (!reservation) throw createNotFoundError("Reservation", scope);
    if (!contractGenerationStatuses.includes(reservation.status)) throw createValidationError("CONTRACT_GENERATION_NOT_ALLOWED");
    const existing = await findContractByReservation(scope, tx);
    if (existing) throw createValidationError("CONTRACT_ALREADY_EXISTS");
    const pricingSnapshot = await findCurrentPricingSnapshot({ companyId: input.context.companyId, reservationId: input.reservationId }, tx);
    if (!pricingSnapshot) throw createValidationError("CONTRACT_PRICING_SNAPSHOT_MISSING");
    const template = input.templateId
      ? await listContractTemplates({ companyId: input.context.companyId, agencyId: input.context.agencyId, includeInactive: false }, tx).then((items) => items.find((item) => item.id === input.templateId) ?? null)
      : await findDefaultContractTemplate(input.context, tx);
    if (!template) throw createValidationError(input.templateId ? "CONTRACT_TEMPLATE_NOT_FOUND" : "CONTRACT_DEFAULT_TEMPLATE_NOT_CONFIGURED");
    const version = await findCurrentContractTemplateVersion({ companyId: input.context.companyId, templateId: template.id }, tx);
    if (!version) throw createValidationError("CONTRACT_TEMPLATE_VERSION_NOT_FOUND");
    const organization = await findContractOrganizationSnapshot(input.context, tx);
    const sequence = await generateContractCode(input.context, tx);
    contractCode = sequence.formatted;
    const pickupAt = input.pickupAt ?? new Date();
    const frozen = buildSnapshot({
      reservation,
      pricingSnapshot,
      template,
      version,
      organization,
      code: contractCode,
      pickupMileage: input.pickupMileage,
      pickupFuelLevel: input.pickupFuelLevel,
      pickupAt,
      notes: input.notes,
    });
    createdContractId = createId();
    const hash = contentHash(frozen.renderedHtml, frozen.snapshot);
    await createContract({
      id: createdContractId,
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      code: contractCode,
      reservationId: reservation.id,
      customerId: reservation.customerId,
      vehicleId: reservation.vehicleId,
      templateId: template.id,
      templateVersionId: version.id,
      status: ContractStatus.draft,
      pickupMileage: input.pickupMileage,
      pickupFuelLevel: input.pickupFuelLevel ?? null,
      pickupAt,
      notes: input.notes ?? null,
      renderedHtml: frozen.renderedHtml,
      contentSnapshot: frozen.snapshot,
      contentHash: hash,
    }, tx);
    for (const item of input.inspectionItems ?? []) {
      await createContractInspectionItem({
        ...item,
        id: createId(),
        companyId: input.context.companyId,
        contractId: createdContractId,
      }, tx);
    }
    await createVehicleMileageLog({
      id: createId(),
      companyId: input.context.companyId,
      vehicleId: reservation.vehicleId,
      mileage: input.pickupMileage,
      recordedAt: pickupAt,
      recordedBy: input.context.userId ?? null,
      source: "contract_pickup",
      referenceId: createdContractId,
    }, tx);
    await createReservationTimelineEvent({
      id: createId(),
      companyId: input.context.companyId,
      reservationId: reservation.id,
      eventType: "contract_generated",
      description: contractCode,
      performedBy: input.context.userId ?? null,
    }, tx);
    await writeContractLogs({
      context: input.context,
      contractId: createdContractId,
      action: "ContractGenerated",
      verb: "ContractGenerated",
      changes: { reservationId: reservation.id, templateVersionId: version.id, contentHash: hash },
    }, tx);
  });

  await publishDomainEvent({
    name: "ContractGenerated",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "contract",
    entityId: createdContractId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getContractService({ companyId: input.context.companyId, agencyId: input.context.agencyId, contractId: createdContractId });
}

export async function activateContractAtPickupService(input: {
  context: ContractServiceContext;
  contractId: string;
  reservationId: string;
  mileageLog: MileageLogCreateData;
  signature?: SignatureCreateData;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    contractId: input.contractId,
  };
  await runInTransaction(async (tx) => {
    await lockContractRow(scope, tx);
    const contract = await getContractService(scope);
    if (contract.status !== ContractStatus.draft) {
      throw createValidationError("CONTRACT_INVALID_STATUS_TRANSITION");
    }
    await createVehicleMileageLog(
      {
        ...input.mileageLog,
        id: createId(),
        companyId: input.context.companyId,
        recordedBy: input.context.userId ?? null,
        source: "contract_pickup",
        referenceId: input.contractId,
      },
      tx,
    );
    if (input.signature) {
      await createContractSignature(
        {
          ...input.signature,
          id: createId(),
          companyId: input.context.companyId,
          contractId: input.contractId,
          signedBy: input.context.userId ?? null,
        },
        tx,
      );
    }
    const result = await updateContractStatusConditionally(
      {
        ...scope,
        expectedStatuses: [ContractStatus.draft],
        data: { status: "active", signedAt: input.signature?.signedAt ?? new Date() },
      },
      tx,
    );
    if (result.count !== 1) throw createValidationError("CONTRACT_LIFECYCLE_CONFLICT");
    const reservationResult = await updateReservationStatusConditionally(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        reservationId: input.reservationId,
        expectedStatuses: [ReservationStatus.confirmed],
        data: { status: "active", activatedAt: new Date() },
      },
      tx,
    );
    if (reservationResult.count !== 1) throw createValidationError("CONTRACT_RESERVATION_STATUS_NOT_ALLOWED");
    await writeContractLogs({
      context: input.context,
      contractId: input.contractId,
      action: "ContractActivated",
      verb: "ContractActivated",
    }, tx);
  });
  await publishDomainEvent({
    name: "ReservationPickedUp",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation",
    entityId: input.reservationId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getContractService(scope);
}

export async function completeContractAtReturnService(input: ContractServiceContext & {
  contractId: string;
  returnMileage: number;
  returnFuelLevel?: number | null;
  reservationId?: string;
  mileageLog?: MileageLogCreateData;
  signature?: SignatureCreateData;
}) {
  await runInTransaction(async (tx) => {
    await lockContractRow(input, tx);
    const contract = await getContractService(input);
    if (contract.status !== ContractStatus.active && contract.status !== ContractStatus.disputed) {
      throw createValidationError("CONTRACT_INVALID_STATUS_TRANSITION");
    }
    if (input.returnMileage < contract.pickupMileage) {
      throw createValidationError("CONTRACT_RETURN_MILEAGE_TOO_LOW");
    }
    if (input.mileageLog) {
      await createVehicleMileageLog(
        {
          ...input.mileageLog,
          id: createId(),
          companyId: input.companyId,
          recordedBy: input.userId ?? null,
          source: "contract_return",
          referenceId: input.contractId,
        },
        tx,
      );
    }
    if (input.signature) {
      await createContractSignature(
        {
          ...input.signature,
          id: createId(),
          companyId: input.companyId,
          contractId: input.contractId,
          signedBy: input.userId ?? null,
        },
        tx,
      );
    }
    const result = await updateContractStatusConditionally(
      {
        companyId: input.companyId,
        agencyId: input.agencyId,
        contractId: input.contractId,
        expectedStatuses: [ContractStatus.active, ContractStatus.disputed],
        data: {
          status: "completed",
          returnMileage: input.returnMileage,
          returnFuelLevel: input.returnFuelLevel,
          returnedAt: new Date(),
        },
      },
      tx,
    );
    if (result.count !== 1) throw createValidationError("CONTRACT_LIFECYCLE_CONFLICT");
    if (input.reservationId) {
      const reservationResult = await updateReservationStatusConditionally(
        {
          companyId: input.companyId,
          agencyId: input.agencyId,
          reservationId: input.reservationId,
          expectedStatuses: [ReservationStatus.active],
          data: { status: "completed", completedAt: new Date() },
        },
        tx,
      );
      if (reservationResult.count !== 1) throw createValidationError("CONTRACT_RESERVATION_STATUS_NOT_ALLOWED");
    }
    await writeContractLogs({
      context: input,
      contractId: input.contractId,
      action: "ContractCompleted",
      verb: "ContractCompleted",
    }, tx);
  });
  await publishDomainEvent({
    name: "ContractCompleted",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "contract",
    entityId: input.contractId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return getContractService(input);
}

export async function createInspectionItemService(input: {
  context: ContractServiceContext;
  data: InspectionItemCreateData;
}) {
  const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, contractId: input.data.contractId };
  const item = await runInTransaction(async (tx) => {
    await lockContractRow(scope, tx);
    const contract = await getContractService(scope, tx);
    if (!mutableContractStatuses.includes(contract.status)) throw createValidationError("CONTRACT_IMMUTABLE");
    const created = await createContractInspectionItem({
      ...input.data,
      id: createId(),
      companyId: input.context.companyId,
    }, tx);
    await writeContractLogs({
      context: input.context,
      contractId: input.data.contractId,
      action: "ContractInspectionItemCreated",
      verb: "ContractInspectionItemCreated",
      changes: { itemId: created.id, event: created.event, condition: created.condition },
    }, tx);
    return created;
  });
  if (item.event === "return" && item.condition !== "ok") {
    await publishDomainEvent({
      name: "DamageRecordedAtReturn",
      companyId: item.companyId,
      entityType: "contract_inspection_item",
      entityId: item.id,
      userId: input.context.userId,
      actorName: input.context.actorName,
      occurredAt: new Date(),
    });
  }
  return item;
}

export async function updateInspectionItemService(input: {
  context: ContractServiceContext;
  contractId: string;
  itemId: string;
  data: Parameters<typeof updateContractInspectionItem>[0]["data"];
}) {
  return runInTransaction(async (tx) => {
    const scope = { companyId: input.context.companyId, agencyId: input.context.agencyId, contractId: input.contractId };
    await lockContractRow(scope, tx);
    const contract = await getContractService(scope, tx);
    if (!mutableContractStatuses.includes(contract.status)) throw createValidationError("CONTRACT_IMMUTABLE");
    const result = await updateContractInspectionItem({
      companyId: input.context.companyId,
      itemId: input.itemId,
      data: input.data,
    }, tx);
    if (result.count !== 1) throw createNotFoundError("Contract inspection item", input);
    await writeContractLogs({
      context: input.context,
      contractId: input.contractId,
      action: "ContractInspectionItemUpdated",
      verb: "ContractInspectionItemUpdated",
      changes: { itemId: input.itemId },
    }, tx);
    return result;
  });
}

export async function listInspectionItemsService(input: {
  companyId: string;
  contractId: string;
  includeDeleted?: boolean;
}) {
  return listContractInspectionItems(input);
}

export async function createContractSignatureService(input: {
  context: ContractServiceContext;
  contractId: string;
  data: SignatureCreateData;
}) {
  const signature = await runInTransaction(async (tx) => {
    await lockContractRow({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      contractId: input.contractId,
    }, tx);
    const contract = await getContractService({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      contractId: input.contractId,
    }, tx);
    if (contract.status === ContractStatus.completed || contract.status === ContractStatus.cancelled) {
      throw createValidationError("CONTRACT_IMMUTABLE");
    }
    const created = await createContractSignature({
      ...input.data,
      id: createId(),
      companyId: input.context.companyId,
      contractId: input.contractId,
      signedBy: input.context.userId ?? null,
    }, tx);
    if (input.data.event === "pickup") {
      await updateContract({
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        contractId: input.contractId,
        data: { signedAt: input.data.signedAt },
      }, tx);
    }
    await writeContractLogs({
      context: input.context,
      contractId: input.contractId,
      action: created.signerType === "agent" ? "ContractSignedByAgent" : "ContractSignedByCustomer",
      verb: created.signerType === "agent" ? "ContractSignedByAgent" : "ContractSignedByCustomer",
      changes: { signatureId: created.id, signerType: created.signerType, event: created.event },
    }, tx);
    return created;
  });
  await publishDomainEvent({
    name: signature.signerType === "agent" ? "ContractSignedByAgent" : "ContractSignedByCustomer",
    companyId: signature.companyId,
    entityType: "contract_signature",
    entityId: signature.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return signature;
}

export async function listContractSignaturesService(input: {
  companyId: string;
  contractId: string;
}) {
  return listContractSignatures(input);
}

export async function deleteContractService(input: ContractServiceContext & { contractId: string }) {
  await runInTransaction(async (tx) => {
    await lockContractRow(input, tx);
    const contract = await getContractService(input, tx);
    if (contract.status !== ContractStatus.draft) throw createValidationError("CONTRACT_DELETE_BLOCKED");
    const result = await softDeleteContract({ ...input, deletedBy: input.userId ?? null }, tx);
    if (result.count !== 1) throw createNotFoundError("Contract", input);
    await writeContractLogs({
      context: input,
      contractId: input.contractId,
      action: "ContractDeleted",
      verb: "ContractDeleted",
    }, tx);
  });
  return { id: input.contractId };
}

export const contractsService = {
  getContractService,
  getContractByReservationService,
  listContractsService,
  getDefaultContractTemplateService,
  listContractTemplatesService,
  listContractTemplateVersionsService,
  createContractTemplateService,
  updateContractTemplateService,
  getCurrentContractTemplateVersionService,
  createContractService,
  generateContractFromReservationService,
  activateContractAtPickupService,
  completeContractAtReturnService,
  createInspectionItemService,
  updateInspectionItemService,
  listInspectionItemsService,
  createContractSignatureService,
  listContractSignaturesService,
  deleteContractService,
};
