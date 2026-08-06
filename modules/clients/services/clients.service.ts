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
  countCustomers,
  createCustomer,
  createCustomerBlacklistEntry,
  createCustomerBusiness,
  createCustomerContact,
  createCustomerDocument,
  createCustomerIndividual,
  countBlockingCustomerContracts,
  countBlockingCustomerReservations,
  clearPrimaryCustomerContacts,
  deleteCustomerContact,
  deleteCustomerDocument,
  findActiveCustomerBlacklist,
  findCustomerById,
  findCustomerByIdForCompany,
  findCustomerByContact,
  findCustomerReservationSummary,
  liftCustomerBlacklistEntry,
  paginateCustomers,
  restoreCustomer,
  softDeleteCustomer,
  updateCustomer,
  updateCustomerBusiness,
  updateCustomerContact,
  updateCustomerDocument,
  updateCustomerIndividual,
  type CustomerListInput,
} from "../repositories/clients.repository";
import { getCompanyService } from "@/modules/workspace/agencies/services/agencies.service";
import { enforcePlanLimitService } from "@/modules/workspace/billing/services/billing.service";

export type CustomerServiceContext = {
  companyId: string;
  agencyId: string;
  userId: string;
  actorName?: string;
};

type CustomerCreateData = Omit<Parameters<typeof createCustomer>[0], "id" | "companyId" | "agencyId">;
type CustomerIndividualCreateData = Omit<Parameters<typeof createCustomerIndividual>[0], "id" | "customerId" | "companyId">;
type CustomerBusinessCreateData = Omit<Parameters<typeof createCustomerBusiness>[0], "id" | "customerId" | "companyId">;
type CustomerContactCreateData = Omit<Parameters<typeof createCustomerContact>[0], "id" | "customerId" | "companyId">;
type CustomerDocumentCreateData = Omit<Parameters<typeof createCustomerDocument>[0], "id" | "customerId" | "companyId">;
type CustomerBlacklistCreateData = Omit<Parameters<typeof createCustomerBlacklistEntry>[0], "id" | "companyId" | "customerId" | "addedBy">;
type CustomerUpdateData = Parameters<typeof updateCustomer>[0]["data"];

async function assertUniqueCustomerContact(input: {
  companyId: string;
  agencyId: string;
  email?: string | null;
  phone?: string | null;
  excludeCustomerId?: string;
}) {
  const duplicate = await findCustomerByContact(input);
  if (duplicate) {
    throw createValidationError("CLIENT_DUPLICATE_CONTACT", {
      customerId: duplicate.id,
      email: input.email ?? null,
      phone: input.phone ?? null,
    });
  }
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) {
    throw createValidationError("CLIENT_INDIVIDUAL_NAME_REQUIRED");
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function createCustomerCode() {
  return `CUS-${createId().replace(/-/g, "").slice(0, 18).toUpperCase()}`;
}

function normalizeCountryCode(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  const labels: Record<string, string> = {
    Marocain: "MA",
    "Français": "FR",
    Espagnol: "ES",
    Anglais: "GB",
    Allemand: "DE",
  };
  return labels[normalized] ?? normalized.slice(0, 2).toUpperCase();
}

export async function getCustomerService(input: {
  companyId: string;
  agencyId: string;
  customerId: string;
}) {
  const customer = await findCustomerById(input);
  if (!customer) throw createNotFoundError("Customer", input);
  return customer;
}

export async function listCustomersService(input: CustomerListInput) {
  return paginateCustomers(input);
}

export async function createCustomerService(input: {
  context: CustomerServiceContext;
  customer: CustomerCreateData;
  individual?: CustomerIndividualCreateData;
  business?: CustomerBusinessCreateData;
}) {
  await assertUniqueCustomerContact({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    email: typeof input.customer.email === "string" ? input.customer.email : null,
    phone: typeof input.customer.phone === "string" ? input.customer.phone : null,
  });

  const [company, currentCustomerCount] = await Promise.all([
    getCompanyService({ companyId: input.context.companyId }),
    countCustomers({ companyId: input.context.companyId }),
  ]);
  await enforcePlanLimitService({
    planId: company.planId,
    limitKey: "max_customers",
    currentUsage: currentCustomerCount,
    requestedIncrement: 1,
  });

  const customer = await runInTransaction(async (tx) => {
    const customerId = createId();
    const created = await createCustomer(
      {
        ...input.customer,
        id: customerId,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      },
      tx,
    );
    if (input.individual) {
      await createCustomerIndividual(
        {
          ...input.individual,
          id: createId(),
          customerId,
          companyId: input.context.companyId,
        },
        tx,
      );
    }
    if (input.business) {
      await createCustomerBusiness(
        {
          ...input.business,
          id: createId(),
          customerId,
          companyId: input.context.companyId,
        },
        tx,
      );
    }
    await writeAuditLog(
      {
        id: createId(),
        companyId: created.companyId,
        agencyId: created.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerCreated",
        entityType: "customer",
        entityId: created.id,
        changes: { created: true, type: created.type },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: created.companyId,
        agencyId: created.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "customer",
        entityId: created.id,
        verb: "CustomerCreated",
      },
      tx,
    );
    return created;
  });

  await publishDomainEvent({
    name: "CustomerCreated",
    companyId: customer.companyId,
    agencyId: customer.agencyId,
    entityType: "customer",
    entityId: customer.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return customer;
}

export async function createIndividualCustomerService(input: {
  context: CustomerServiceContext;
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  status?: "active" | "inactive" | "blacklisted";
  nationality?: string | null;
  idType?: "CIN" | "Passeport";
  idNumber?: string | null;
  licenseNumber?: string | null;
  licenseExpiresAt?: Date | null;
}) {
  const name = splitFullName(input.fullName);
  return createCustomerService({
    context: input.context,
    customer: {
      code: createCustomerCode(),
      type: "individual",
      email: input.email ?? null,
      phone: input.phone,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    },
    individual: {
      firstName: name.firstName,
      lastName: name.lastName,
      nationality: normalizeCountryCode(input.nationality),
      cinNumber: input.idType === "CIN" ? input.idNumber ?? null : null,
      drivingLicenseNumber: input.licenseNumber ?? null,
      drivingLicenseExpiresAt: input.licenseExpiresAt ?? null,
    },
  });
}

export async function createBusinessCustomerService(input: {
  context: CustomerServiceContext;
  companyName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  status?: "active" | "inactive" | "blacklisted";
  registrationNumber?: string | null;
  taxId?: string | null;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
}) {
  return createCustomerService({
    context: input.context,
    customer: {
      code: createCustomerCode(),
      type: "company",
      email: input.email ?? null,
      phone: input.phone,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    },
    business: {
      companyName: input.companyName,
      registrationNumber: input.registrationNumber ?? null,
      taxId: input.taxId ?? null,
      contactPersonName: input.contactPersonName ?? null,
      contactPersonPhone: input.contactPersonPhone ?? null,
    },
  });
}

export async function updateIndividualCustomerService(input: {
  context: CustomerServiceContext;
  customerId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  status?: "active" | "inactive" | "blacklisted";
  nationality?: string | null;
  idType?: "CIN" | "Passeport";
  idNumber?: string | null;
  licenseNumber?: string | null;
  licenseExpiresAt?: Date | null;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    customerId: input.customerId,
  };
  const existing = await getCustomerService(scope);
  if (existing.type !== "individual") throw createValidationError("CLIENT_TYPE_CHANGE_NOT_ALLOWED");
  await assertUniqueCustomerContact({
    ...scope,
    email: input.email ?? null,
    phone: input.phone,
    excludeCustomerId: input.customerId,
  });
  const name = splitFullName(input.fullName);

  await runInTransaction(async (tx) => {
    await updateCustomer(
      {
        ...scope,
        data: {
          email: input.email ?? null,
          phone: input.phone,
          status: input.status ?? existing.status,
          notes: input.notes ?? null,
        },
      },
      tx,
    );
    await updateCustomerIndividual(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
        data: {
          firstName: name.firstName,
          lastName: name.lastName,
          nationality: normalizeCountryCode(input.nationality),
          cinNumber: input.idType === "CIN" ? input.idNumber ?? null : null,
          drivingLicenseNumber: input.licenseNumber ?? null,
          drivingLicenseExpiresAt: input.licenseExpiresAt ?? null,
        },
      },
      tx,
    );
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerUpdated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { updated: true, type: "individual" },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerUpdated",
      },
      tx,
    );
  });

  return getCustomerService(scope);
}

export async function updateBusinessCustomerService(input: {
  context: CustomerServiceContext;
  customerId: string;
  companyName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  status?: "active" | "inactive" | "blacklisted";
  registrationNumber?: string | null;
  taxId?: string | null;
  contactPersonName?: string | null;
  contactPersonPhone?: string | null;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    customerId: input.customerId,
  };
  const existing = await getCustomerService(scope);
  if (existing.type !== "company") throw createValidationError("CLIENT_TYPE_CHANGE_NOT_ALLOWED");
  await assertUniqueCustomerContact({
    ...scope,
    email: input.email ?? null,
    phone: input.phone,
    excludeCustomerId: input.customerId,
  });

  await runInTransaction(async (tx) => {
    await updateCustomer(
      {
        ...scope,
        data: {
          email: input.email ?? null,
          phone: input.phone,
          status: input.status ?? existing.status,
          notes: input.notes ?? null,
        },
      },
      tx,
    );
    await updateCustomerBusiness(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
        data: {
          companyName: input.companyName,
          registrationNumber: input.registrationNumber ?? null,
          taxId: input.taxId ?? null,
          contactPersonName: input.contactPersonName ?? null,
          contactPersonPhone: input.contactPersonPhone ?? null,
        },
      },
      tx,
    );
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerUpdated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { updated: true, type: "company" },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerUpdated",
      },
      tx,
    );
  });

  return getCustomerService(scope);
}

export async function getCustomerForCompanyService(input: {
  companyId: string;
  customerId: string;
  includeDeleted?: boolean;
}) {
  const customer = await findCustomerByIdForCompany(input);
  if (!customer) throw createNotFoundError("Customer", input);
  return customer;
}

export async function getDeletedCustomerService(input: {
  companyId: string;
  agencyId: string;
  customerId: string;
}) {
  const customer = await findCustomerById({ ...input, includeDeleted: true });
  if (!customer || !customer.deletedAt) throw createNotFoundError("Customer", input);
  return customer;
}

export async function updateCustomerService(input: {
  context: CustomerServiceContext;
  customerId: string;
  data: CustomerUpdateData;
  auditLogId?: string;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    customerId: input.customerId,
  };
  await getCustomerService(scope);
  await runInTransaction(async (tx) => {
    await updateCustomer({ ...scope, data: input.data }, tx);
    await writeAuditLog(
      {
        id: input.auditLogId ?? createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerUpdated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { updated: true },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerUpdated",
      },
      tx,
    );
  });
  return getCustomerService(scope);
}

export async function deleteCustomerService(input: CustomerServiceContext & { customerId: string }) {
  await getCustomerService(input);
  const [reservations, contracts] = await Promise.all([
    countBlockingCustomerReservations(input),
    countBlockingCustomerContracts(input),
  ]);
  if (reservations > 0 || contracts > 0) {
    throw createValidationError("CLIENT_DELETE_BLOCKED_BY_ACTIVE_RECORDS", {
      reservations,
      contracts,
    });
  }
  return runInTransaction(async (tx) => {
    const result = await softDeleteCustomer({ ...input, deletedBy: input.userId }, tx);
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.companyId,
        agencyId: input.agencyId,
        userId: input.userId,
        actorName: input.actorName,
        action: "CustomerDeleted",
        entityType: "customer",
        entityId: input.customerId,
        changes: { deleted: true },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.companyId,
        agencyId: input.agencyId,
        userId: input.userId,
        actorName: input.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerDeleted",
      },
      tx,
    );
    return result;
  });
}

export async function restoreCustomerService(input: CustomerServiceContext & { customerId: string }) {
  await getDeletedCustomerService(input);
  return runInTransaction(async (tx) => {
    const result = await restoreCustomer(input, tx);
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.companyId,
        agencyId: input.agencyId,
        userId: input.userId,
        actorName: input.actorName,
        action: "CustomerRestored",
        entityType: "customer",
        entityId: input.customerId,
        changes: { restored: true },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.companyId,
        agencyId: input.agencyId,
        userId: input.userId,
        actorName: input.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerRestored",
      },
      tx,
    );
    return result;
  });
}

export async function createCustomerContactService(input: {
  context: CustomerServiceContext;
  customerId: string;
  data: CustomerContactCreateData;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  return runInTransaction(async (tx) => {
    if (input.data.isPrimary) {
      await clearPrimaryCustomerContacts(
        {
          companyId: input.context.companyId,
          customerId: input.customerId,
          type: input.data.type,
        },
        tx,
      );
    }
    const contact = await createCustomerContact(
      {
        ...input.data,
        id: createId(),
        companyId: input.context.companyId,
        customerId: input.customerId,
      },
      tx,
    );
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerContactCreated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { contactId: contact.id },
      },
      tx,
    );
    return contact;
  });
}

export async function updateCustomerContactService(input: {
  context: CustomerServiceContext;
  customerId: string;
  contactId: string;
  data: CustomerContactCreateData;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  return runInTransaction(async (tx) => {
    if (input.data.isPrimary) {
      await clearPrimaryCustomerContacts(
        {
          companyId: input.context.companyId,
          customerId: input.customerId,
          type: input.data.type,
        },
        tx,
      );
    }
    const result = await updateCustomerContact(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
        contactId: input.contactId,
        data: input.data,
      },
      tx,
    );
    if (result.count === 0) throw createNotFoundError("CustomerContact", input);
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerContactUpdated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { contactId: input.contactId },
      },
      tx,
    );
    return result;
  });
}

export async function deleteCustomerContactService(input: {
  context: CustomerServiceContext;
  customerId: string;
  contactId: string;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  return runInTransaction(async (tx) => {
    const result = await deleteCustomerContact(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
        contactId: input.contactId,
      },
      tx,
    );
    if (result.count === 0) throw createNotFoundError("CustomerContact", input);
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerContactDeleted",
        entityType: "customer",
        entityId: input.customerId,
        changes: { contactId: input.contactId },
      },
      tx,
    );
    return result;
  });
}

export async function createCustomerDocumentService(input: {
  context: CustomerServiceContext;
  customerId: string;
  data: CustomerDocumentCreateData;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  return runInTransaction(async (tx) => {
    const document = await createCustomerDocument(
      {
        ...input.data,
        id: createId(),
        companyId: input.context.companyId,
        customerId: input.customerId,
      },
      tx,
    );
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerDocumentCreated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { documentId: document.id },
      },
      tx,
    );
    return document;
  });
}

export async function updateCustomerDocumentService(input: {
  context: CustomerServiceContext;
  customerId: string;
  documentId: string;
  data: CustomerDocumentCreateData;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  return runInTransaction(async (tx) => {
    const result = await updateCustomerDocument(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
        documentId: input.documentId,
        data: input.data,
      },
      tx,
    );
    if (result.count === 0) throw createNotFoundError("CustomerDocument", input);
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerDocumentUpdated",
        entityType: "customer",
        entityId: input.customerId,
        changes: { documentId: input.documentId },
      },
      tx,
    );
    return result;
  });
}

export async function deleteCustomerDocumentService(input: {
  context: CustomerServiceContext;
  customerId: string;
  documentId: string;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  return runInTransaction(async (tx) => {
    const result = await deleteCustomerDocument(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
        documentId: input.documentId,
      },
      tx,
    );
    if (result.count === 0) throw createNotFoundError("CustomerDocument", input);
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerDocumentDeleted",
        entityType: "customer",
        entityId: input.customerId,
        changes: { documentId: input.documentId },
      },
      tx,
    );
    return result;
  });
}

export async function listActiveCustomerBlacklistService(input: {
  companyId: string;
  customerId: string;
}) {
  return findActiveCustomerBlacklist(input);
}

export async function blacklistCustomerService(input: {
  context: CustomerServiceContext;
  customerId: string;
  data: CustomerBlacklistCreateData;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  const existing = await findActiveCustomerBlacklist({
    companyId: input.context.companyId,
    customerId: input.customerId,
  });
  if (existing.length > 0) throw createValidationError("CLIENT_ALREADY_BLACKLISTED");
  const entry = await runInTransaction(async (tx) => {
    const blacklist = await createCustomerBlacklistEntry(
      {
        ...input.data,
        id: createId(),
        companyId: input.context.companyId,
        customerId: input.customerId,
        addedBy: input.context.userId,
      },
      tx,
    );
    await updateCustomer(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        customerId: input.customerId,
        data: { status: "blacklisted" },
      },
      tx,
    );
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerBlacklisted",
        entityType: "customer",
        entityId: input.customerId,
        changes: { blacklistId: blacklist.id, severity: blacklist.severity },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerBlacklisted",
      },
      tx,
    );
    return blacklist;
  });
  await publishDomainEvent({
    name: "CustomerBlacklisted",
    companyId: entry.companyId,
    agencyId: input.context.agencyId,
    entityType: "customer",
    entityId: entry.customerId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return entry;
}

export async function liftCustomerBlacklistService(input: {
  context: CustomerServiceContext;
  blacklistId: string;
  customerId: string;
  liftReason?: string | null;
}) {
  await getCustomerService({ ...input.context, customerId: input.customerId });
  const result = await runInTransaction(async (tx) => {
    const lifted = await liftCustomerBlacklistEntry(
      {
        companyId: input.context.companyId,
        blacklistId: input.blacklistId,
        liftedBy: input.context.userId,
        liftReason: input.liftReason,
      },
      tx,
    );
    if (lifted.count === 0) throw createNotFoundError("CustomerBlacklist", input);
    const active = await findActiveCustomerBlacklist(
      {
        companyId: input.context.companyId,
        customerId: input.customerId,
      },
      tx,
    );
    if (active.length === 0) {
      await updateCustomer(
        {
          companyId: input.context.companyId,
          agencyId: input.context.agencyId,
          customerId: input.customerId,
          data: { status: "active" },
        },
        tx,
      );
    }
    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        action: "CustomerBlacklistLifted",
        entityType: "customer",
        entityId: input.customerId,
        changes: { blacklistId: input.blacklistId },
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "customer",
        entityId: input.customerId,
        verb: "CustomerBlacklistLifted",
      },
      tx,
    );
    return lifted;
  });
  await publishDomainEvent({
    name: "CustomerBlacklistLifted",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "customer",
    entityId: input.customerId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function getCustomerSummaryService(input: {
  companyId: string;
  agencyId: string;
  customerId: string;
}) {
  await getCustomerService(input);
  return findCustomerReservationSummary(input);
}

export const clientsService = {
  getCustomerService,
  getCustomerForCompanyService,
  getDeletedCustomerService,
  listCustomersService,
  createCustomerService,
  createIndividualCustomerService,
  createBusinessCustomerService,
  updateCustomerService,
  updateIndividualCustomerService,
  updateBusinessCustomerService,
  deleteCustomerService,
  restoreCustomerService,
  createCustomerContactService,
  updateCustomerContactService,
  deleteCustomerContactService,
  createCustomerDocumentService,
  updateCustomerDocumentService,
  deleteCustomerDocumentService,
  listActiveCustomerBlacklistService,
  blacklistCustomerService,
  liftCustomerBlacklistService,
  getCustomerSummaryService,
};
