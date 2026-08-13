import { ContactType, CustomerStatus, CustomerType, Prisma, prisma } from "@lokarent/db";
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
  nationality?: string;
  nationalityMode?: "exact" | "foreign";
  search?: string;
  includeDeleted?: boolean;
  orderBy?: "createdAt" | "code" | "email" | "updatedAt";
  direction?: "asc" | "desc";
};

const customerListSelect = {
  id: true,
  companyId: true,
  agencyId: true,
  code: true,
  type: true,
  email: true,
  phone: true,
  city: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedBy: true,
  individual: true,
  business: true,
  documents: { select: { type: true } },
  blacklist: {
    select: { reason: true, liftedAt: true, createdAt: true },
    where: { liftedAt: null },
    orderBy: { createdAt: "desc" },
    take: 1,
  },
} satisfies Prisma.CustomerSelect;

export type CustomerListItem = Prisma.CustomerGetPayload<{ select: typeof customerListSelect }>;

export type CustomerReservationSummary = {
  totalRentals: number;
  totalSpent: number;
  lastRentalDate?: Date;
  monthly: number[];
  reservations: {
    id: string;
    carBrand: string;
    carModel: string;
    plate: string;
    startDate: Date;
    endDate: Date;
    amount: number;
    status: "completed" | "active" | "cancelled" | "upcoming";
  }[];
};

function buildCustomerWhere(input: CustomerListInput): Prisma.CustomerWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    type: input.type,
    ...(input.nationalityMode === "exact" && input.nationality
      ? { type: "individual", individual: { is: { nationality: input.nationality } } }
      : {}),
    ...(input.nationalityMode === "foreign"
      ? {
          type: "individual",
          individual: { is: { nationality: { not: null, notIn: ["MA"] } } },
        }
      : {}),
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.search
      ? {
          OR: [
            { code: { contains: input.search, mode: "insensitive" } },
            { email: { contains: input.search, mode: "insensitive" } },
            { phone: { contains: input.search, mode: "insensitive" } },
            { individual: { is: { firstName: { contains: input.search, mode: "insensitive" } } } },
            { individual: { is: { lastName: { contains: input.search, mode: "insensitive" } } } },
            { business: { is: { companyName: { contains: input.search, mode: "insensitive" } } } },
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
    include: { individual: true, business: true, contacts: true, documents: true, blacklist: true },
  });
}

export async function findCustomerByIdForCompany(
  input: { companyId: string; customerId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.customer.findFirst({
    where: {
      id: input.customerId,
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { individual: true, business: true, contacts: true, documents: true, blacklist: true },
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
      select: customerListSelect,
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
  input: {
    companyId: string;
    agencyId: string;
    email?: string | null;
    phone?: string | null;
    excludeCustomerId?: string;
  },
  db: DatabaseClient = prisma,
) {
  if (!input.email && !input.phone) return null;

  return db.customer.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      ...(input.excludeCustomerId ? { id: { not: input.excludeCustomerId } } : {}),
      OR: [
        ...(input.email ? [{ email: input.email }] : []),
        ...(input.phone ? [{ phone: input.phone }] : []),
      ],
    },
    include: { individual: true, business: true, contacts: true, documents: true, blacklist: true },
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

export async function updateCustomerIndividual(
  input: {
    companyId: string;
    customerId: string;
    data: Prisma.CustomerIndividualUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.customerIndividual.updateMany({
    where: {
      companyId: input.companyId,
      customerId: input.customerId,
    },
    data: input.data,
  });
}

export async function updateCustomerBusiness(
  input: {
    companyId: string;
    customerId: string;
    data: Prisma.CustomerBusinessUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.customerBusiness.updateMany({
    where: {
      companyId: input.companyId,
      customerId: input.customerId,
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
  input: {
    companyId: string;
    customerId: string;
    contactId: string;
    data: Prisma.CustomerContactUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.customerContact.updateMany({
    where: { id: input.contactId, companyId: input.companyId, customerId: input.customerId },
    data: input.data,
  });
}

export async function clearPrimaryCustomerContacts(
  input: { companyId: string; customerId: string; type: ContactType },
  db: DatabaseClient = prisma,
) {
  return db.customerContact.updateMany({
    where: { companyId: input.companyId, customerId: input.customerId, type: input.type },
    data: { isPrimary: false },
  });
}

export async function deleteCustomerContact(
  input: { companyId: string; customerId: string; contactId: string },
  db: DatabaseClient = prisma,
) {
  return db.customerContact.deleteMany({
    where: { id: input.contactId, companyId: input.companyId, customerId: input.customerId },
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

export async function updateCustomerDocument(
  input: {
    companyId: string;
    customerId: string;
    documentId: string;
    data: Prisma.CustomerDocumentUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.customerDocument.updateMany({
    where: { id: input.documentId, companyId: input.companyId, customerId: input.customerId },
    data: input.data,
  });
}

export async function deleteCustomerDocument(
  input: { companyId: string; customerId: string; documentId: string },
  db: DatabaseClient = prisma,
) {
  return db.customerDocument.deleteMany({
    where: { id: input.documentId, companyId: input.companyId, customerId: input.customerId },
  });
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
        deletedAt: null,
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  return { reservations, invoices };
}

function reservationHistoryStatus(status: string): CustomerReservationSummary["reservations"][number]["status"] {
  if (status === "completed") return "completed";
  if (status === "active") return "active";
  if (status === "cancelled" || status === "no_show") return "cancelled";
  return "upcoming";
}

function lastSixMonthKeys(now = new Date()) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

function monthKey(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function findCustomerReservationSummaries(
  input: { companyId: string; agencyId: string; customerIds: string[] },
  db: DatabaseClient = prisma,
): Promise<Record<string, CustomerReservationSummary>> {
  if (input.customerIds.length === 0) return {};
  const reservations = await db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      customerId: { in: input.customerIds },
      deletedAt: null,
    },
    select: {
      id: true,
      customerId: true,
      startsAt: true,
      endsAt: true,
      status: true,
      totalAmount: true,
      vehicle: { select: { brand: true, model: true, plate: true } },
    },
    orderBy: [{ startsAt: "desc" }, { id: "asc" }],
  });
  const keys = lastSixMonthKeys();
  const empty = (): CustomerReservationSummary => ({
    totalRentals: 0,
    totalSpent: 0,
    monthly: [0, 0, 0, 0, 0, 0],
    reservations: [],
  });
  const summaries: Record<string, CustomerReservationSummary> = Object.fromEntries(
    input.customerIds.map((id) => [id, empty()]),
  );

  for (const reservation of reservations) {
    const summary = summaries[reservation.customerId] ?? empty();
    summaries[reservation.customerId] = summary;
    const amount = Number(reservation.totalAmount);
    const isCancelled = reservation.status === "cancelled" || reservation.status === "no_show";
    summary.totalRentals += 1;
    if (!isCancelled) {
      summary.totalSpent += amount;
      const keyIndex = keys.indexOf(monthKey(reservation.startsAt));
      if (keyIndex >= 0) summary.monthly[keyIndex] += amount;
    }
    summary.lastRentalDate ??= reservation.startsAt;
    if (summary.reservations.length < 10) {
      summary.reservations.push({
        id: reservation.id,
        carBrand: reservation.vehicle.brand,
        carModel: reservation.vehicle.model,
        plate: reservation.vehicle.plate,
        startDate: reservation.startsAt,
        endDate: reservation.endsAt,
        amount,
        status: reservationHistoryStatus(reservation.status),
      });
    }
  }

  return summaries;
}

export async function countBlockingCustomerReservations(
  input: { companyId: string; agencyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservation.count({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      customerId: input.customerId,
      deletedAt: null,
      status: { in: ["enquiry", "confirmed", "active"] },
    },
  });
}

export async function countBlockingCustomerContracts(
  input: { companyId: string; agencyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.contract.count({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      customerId: input.customerId,
      deletedAt: null,
      status: { in: ["draft", "active", "disputed"] },
    },
  });
}

export const clientsRepository = {
  findCustomerById,
  findCustomerByIdForCompany,
  paginateCustomers,
  countCustomers,
  findCustomerByContact,
  createCustomer,
  updateCustomer,
  updateCustomerIndividual,
  updateCustomerBusiness,
  softDeleteCustomer,
  restoreCustomer,
  createCustomerIndividual,
  createCustomerBusiness,
  listCustomerContacts,
  createCustomerContact,
  updateCustomerContact,
  clearPrimaryCustomerContacts,
  deleteCustomerContact,
  listCustomerDocuments,
  createCustomerDocument,
  updateCustomerDocument,
  deleteCustomerDocument,
  findActiveCustomerBlacklist,
  createCustomerBlacklistEntry,
  liftCustomerBlacklistEntry,
  findCustomerReservationSummary,
  findCustomerReservationSummaries,
  countBlockingCustomerReservations,
  countBlockingCustomerContracts,
};
