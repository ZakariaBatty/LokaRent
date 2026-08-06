import { CustomerStatus, CustomerType, Prisma, prisma } from "@lokarent/db";
import {
  createPaginationMeta,
  getPagination,
  type DatabaseClient,
  type PaginationInput,
} from "@/shared/database";

export type CustomerListInput = PaginationInput & {
  companyId: string;
  agencyId: string;
  status?: CustomerStatus;
  type?: CustomerType;
  search?: string;
  includeDeleted?: boolean;
  orderBy?: "createdAt" | "code" | "email";
  direction?: "asc" | "desc";
};

function buildCustomerWhere(input: CustomerListInput): Prisma.CustomerWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    type: input.type,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.search
      ? {
          OR: [
            { code: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { phone: { contains: input.search, mode: "insensitive" } },
            { individual: { firstName: { contains: input.search, mode: "insensitive" } } },
            { individual: { lastName: { contains: input.search, mode: "insensitive" } } },
            { business: { companyName: { contains: input.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function findCustomerById(
  input: { companyId: string; agencyId: string; customerId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.customer.findFirst({
    where: {
      id: input.customerId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { individual: true, business: true, contacts: true, documents: true },
  });
}

export async function paginateCustomers(input: CustomerListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = buildCustomerWhere(input);
  const orderField = input.orderBy ?? "createdAt";
  const direction = input.direction ?? "desc";
  const [data, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: { individual: true, business: true },
      orderBy: { [orderField]: direction },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.customer.count({ where }),
  ]);

  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function countCustomers(
  input: { companyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.customer.count({
    where: {
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findCustomerByContact(
  input: { companyId: string; agencyId: string; email?: string | null; phone?: string | null },
  db: DatabaseClient = prisma,
) {
  if (!input.email && !input.phone) return null;

  return db.customer.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      OR: [
        ...(input.email ? [{ email: input.email }] : []),
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
    include: { individual: true, business: true },
  });
}

export async function createCustomer(
  data: Prisma.CustomerUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.customer.create({ data });
}

export async function updateCustomer(
  input: {
    companyId: string;
    agencyId: string;
    customerId: string;
    data: Prisma.CustomerUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.customer.updateMany({
    where: {
      id: input.customerId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function softDeleteCustomer(
  input: { companyId: string; agencyId: string; customerId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.customer.updateMany({
    where: {
      id: input.customerId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreCustomer(
  input: { companyId: string; agencyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.customer.updateMany({
    where: { id: input.customerId, companyId: input.companyId, agencyId: input.agencyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function createCustomerIndividual(
  data: Prisma.CustomerIndividualUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.customerIndividual.create({ data });
}

export async function createCustomerBusiness(
  data: Prisma.CustomerBusinessUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.customerBusiness.create({ data });
}

export async function listCustomerContacts(
  input: { companyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.customerContact.findMany({
    where: { companyId: input.companyId, customerId: input.customerId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

export async function createCustomerContact(
  data: Prisma.CustomerContactUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.customerContact.create({ data });
}

export async function updateCustomerContact(
  input: { companyId: string; contactId: string; data: Prisma.CustomerContactUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.customerContact.updateMany({
    where: { id: input.contactId, companyId: input.companyId },
    data: input.data,
  });
}

export async function listCustomerDocuments(
  input: { companyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.customerDocument.findMany({
    where: { companyId: input.companyId, customerId: input.customerId },
    orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function createCustomerDocument(
  data: Prisma.CustomerDocumentUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.customerDocument.create({ data });
}

export async function findActiveCustomerBlacklist(
  input: { companyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.customerBlacklist.findMany({
    where: {
      companyId: input.companyId,
      customerId: input.customerId,
      liftedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomerBlacklistEntry(
  data: Prisma.CustomerBlacklistUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.customerBlacklist.create({ data });
}

export async function liftCustomerBlacklistEntry(
  input: {
    companyId: string;
    blacklistId: string;
    liftedBy: string;
    liftReason?: string | null;
  },
  db: DatabaseClient = prisma,
) {
  return db.customerBlacklist.updateMany({
    where: { id: input.blacklistId, companyId: input.companyId, liftedAt: null },
    data: {
      liftedAt: new Date(),
      liftedBy: input.liftedBy,
      liftReason: input.liftReason ?? null,
    },
  });
}

export async function findCustomerReservationSummary(
  input: { companyId: string; agencyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  const [reservations, invoices] = await Promise.all([
    db.reservation.groupBy({
      by: ["status"],
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        customerId: input.customerId,
        deletedAt: null,
      },
      _count: true,
    }),
    db.invoice.groupBy({
      by: ["status"],
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        customerId: input.customerId,
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  return { reservations, invoices };
}

export const clientsRepository = {
  findCustomerById,
  paginateCustomers,
  countCustomers,
  findCustomerByContact,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  restoreCustomer,
  createCustomerIndividual,
  createCustomerBusiness,
  listCustomerContacts,
  createCustomerContact,
  updateCustomerContact,
  listCustomerDocuments,
  createCustomerDocument,
  findActiveCustomerBlacklist,
  createCustomerBlacklistEntry,
  liftCustomerBlacklistEntry,
  findCustomerReservationSummary,
};
