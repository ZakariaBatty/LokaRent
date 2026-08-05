import {
  createId,
  createNotFoundError,
  publishDomainEvent,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import {
  createCustomer,
  createCustomerBlacklistEntry,
  createCustomerBusiness,
  createCustomerContact,
  createCustomerDocument,
  createCustomerIndividual,
  findActiveCustomerBlacklist,
  findCustomerById,
  findCustomerReservationSummary,
  liftCustomerBlacklistEntry,
  paginateCustomers,
  restoreCustomer,
  softDeleteCustomer,
  updateCustomer,
  type CustomerListInput,
} from "../repositories/clients.repository";

export type CustomerServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

type CustomerCreateData = Omit<Parameters<typeof createCustomer>[0], "id" | "companyId" | "agencyId">;
type CustomerIndividualCreateData = Omit<Parameters<typeof createCustomerIndividual>[0], "id" | "customerId" | "companyId">;
type CustomerBusinessCreateData = Omit<Parameters<typeof createCustomerBusiness>[0], "id" | "customerId" | "companyId">;
type CustomerContactCreateData = Omit<Parameters<typeof createCustomerContact>[0], "id" | "customerId" | "companyId">;
type CustomerDocumentCreateData = Omit<Parameters<typeof createCustomerDocument>[0], "id" | "customerId" | "companyId">;
type CustomerBlacklistCreateData = Omit<Parameters<typeof createCustomerBlacklistEntry>[0], "id" | "companyId" | "customerId" | "addedBy">;
type CustomerUpdateData = Parameters<typeof updateCustomer>[0]["data"];

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
  activityLogId?: string;
}) {
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
    return created;
  });

  if (input.activityLogId) {
    await writeActivityLog({
      id: input.activityLogId,
      companyId: customer.companyId,
      agencyId: customer.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      entityType: "customer",
      entityId: customer.id,
      verb: "CustomerCreated",
    });
  }
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
  await updateCustomer({ ...scope, data: input.data });
  if (input.auditLogId) {
    await writeAuditLog({
      id: input.auditLogId,
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.context.userId,
      actorName: input.context.actorName,
      action: "CustomerUpdated",
      entityType: "customer",
      entityId: input.customerId,
      changes: { updated: true },
    });
  }
  return getCustomerService(scope);
}

export async function deleteCustomerService(input: CustomerServiceContext & { customerId: string }) {
  await getCustomerService(input);
  return softDeleteCustomer({ ...input, deletedBy: input.userId ?? null });
}

export async function restoreCustomerService(input: {
  companyId: string;
  agencyId: string;
  customerId: string;
}) {
  return restoreCustomer(input);
}

export async function createCustomerContactService(input: {
  context: Pick<CustomerServiceContext, "companyId">;
  customerId: string;
  data: CustomerContactCreateData;
}) {
  return createCustomerContact({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    customerId: input.customerId,
  });
}

export async function createCustomerDocumentService(input: {
  context: Pick<CustomerServiceContext, "companyId">;
  customerId: string;
  data: CustomerDocumentCreateData;
}) {
  return createCustomerDocument({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    customerId: input.customerId,
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
  const entry = await runInTransaction(async (tx) => {
    const blacklist = await createCustomerBlacklistEntry(
      {
        ...input.data,
        id: createId(),
        companyId: input.context.companyId,
        customerId: input.customerId,
        addedBy: input.context.userId ?? "",
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
  const result = await liftCustomerBlacklistEntry({
    companyId: input.context.companyId,
    blacklistId: input.blacklistId,
    liftedBy: input.context.userId ?? "",
    liftReason: input.liftReason,
  });
  const active = await findActiveCustomerBlacklist({
    companyId: input.context.companyId,
    customerId: input.customerId,
  });
  if (active.length === 0) {
    await updateCustomer({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      customerId: input.customerId,
      data: { status: "active" },
    });
  }
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
  listCustomersService,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
  restoreCustomerService,
  createCustomerContactService,
  createCustomerDocumentService,
  listActiveCustomerBlacklistService,
  blacklistCustomerService,
  liftCustomerBlacklistService,
  getCustomerSummaryService,
};
