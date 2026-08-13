import { CustomerStatus, CustomerType, DepositStatus, InvoiceStatus, InvoiceType, Prisma, prisma } from "@lokarent/db";
import {
  createPaginationMeta,
  getPagination,
  type DatabaseClient,
  type PaginationInput,
} from "@/shared/database";

export type FinanceListInput = PaginationInput & {
  companyId: string;
  agencyId: string;
  from?: Date;
  to?: Date;
  search?: string;
};

export type InvoiceSort = "recent" | "amount_desc" | "due_asc";

const invoiceInclude = {
  lineItems: { orderBy: { sortOrder: "asc" } },
  payments: { orderBy: { paidAt: "desc" } },
  creditNotesAsOriginal: true,
  reservation: {
    include: {
      vehicle: true,
      extras: { orderBy: { createdAt: "asc" } },
      pricingSnapshots: { where: { isCurrent: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  },
  customer: { include: { individual: true, business: true } },
  customerBusiness: true,
} satisfies Prisma.InvoiceInclude;

export async function findInvoiceById(
  input: { companyId: string; agencyId: string; invoiceId: string },
  db: DatabaseClient = prisma,
) {
  return db.invoice.findFirst({
    where: { id: input.invoiceId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    include: invoiceInclude,
  });
}

export async function findInvoiceByReservation(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.invoice.findFirst({
    where: { companyId: input.companyId, agencyId: input.agencyId, reservationId: input.reservationId, deletedAt: null },
    include: { lineItems: { orderBy: { sortOrder: "asc" } }, payments: true },
  });
}

export async function paginateInvoices(
  input: FinanceListInput & {
    status?: InvoiceStatus;
    type?: InvoiceType;
    customerId?: string;
    customerType?: CustomerType;
    sort?: InvoiceSort;
  },
  db: DatabaseClient = prisma,
) {
  const pagination = getPagination(input);
  const search = input.search?.trim();
  const where: Prisma.InvoiceWhereInput = {
    companyId: input.companyId,
    agencyId: input.agencyId,
    deletedAt: null,
    status: input.status,
    type: input.type,
    customerId: input.customerId,
    ...(input.customerType ? { customer: { type: input.customerType } } : {}),
    ...(input.from || input.to ? { issuedAt: { gte: input.from, lte: input.to } } : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { reservation: { code: { contains: search, mode: "insensitive" } } },
            { customer: { code: { contains: search, mode: "insensitive" } } },
            { customer: { email: { contains: search, mode: "insensitive" } } },
            { customer: { phone: { contains: search, mode: "insensitive" } } },
            { customer: { individual: { firstName: { contains: search, mode: "insensitive" } } } },
            { customer: { individual: { lastName: { contains: search, mode: "insensitive" } } } },
            { customer: { business: { companyName: { contains: search, mode: "insensitive" } } } },
            { reservation: { vehicle: { plate: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.InvoiceOrderByWithRelationInput =
    input.sort === "amount_desc"
      ? { totalAmount: "desc" }
      : input.sort === "due_asc"
        ? { dueAt: "asc" }
        : { createdAt: "desc" };
  const [data, total] = await Promise.all([
    db.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.invoice.count({ where }),
  ]);
  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function findInvoiceGenerationSource(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findFirst({
    where: {
      id: input.reservationId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    include: {
      customer: { include: { individual: true, business: true } },
      vehicle: true,
      extras: { orderBy: { createdAt: "asc" } },
      pricingSnapshots: { where: { isCurrent: true }, orderBy: { createdAt: "desc" }, take: 1 },
      contracts: { where: { isCurrent: true, deletedAt: null }, orderBy: { versionNumber: "desc" }, take: 1 },
      invoices: { where: { deletedAt: null }, take: 1 },
    },
  });
}

export async function lockReservationForInvoice(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  await db.$queryRaw`
    SELECT id
    FROM reservations
    WHERE id = ${input.reservationId}::uuid
      AND company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
    FOR UPDATE
  `;
}

export async function lockInvoiceByReservation(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  await db.$queryRaw`
    SELECT id
    FROM invoices
    WHERE company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
      AND reservation_id = ${input.reservationId}::uuid
    FOR UPDATE
  `;
}

export async function listInvoiceableReservations(
  input: { companyId: string; agencyId: string; search?: string; take?: number },
  db: DatabaseClient = prisma,
) {
  const search = input.search?.trim();
  return db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      invoices: { none: { deletedAt: null } },
      pricingSnapshots: { some: { isCurrent: true } },
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { customer: { code: { contains: search, mode: "insensitive" } } },
              { customer: { individual: { firstName: { contains: search, mode: "insensitive" } } } },
              { customer: { individual: { lastName: { contains: search, mode: "insensitive" } } } },
              { customer: { business: { companyName: { contains: search, mode: "insensitive" } } } },
              { vehicle: { plate: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: { include: { individual: true, business: true } },
      vehicle: true,
      extras: { orderBy: { createdAt: "asc" } },
      pricingSnapshots: { where: { isCurrent: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 50,
  });
}

export async function findInvoiceCustomer(
  input: { companyId: string; agencyId: string; customerId: string },
  db: DatabaseClient = prisma,
) {
  return db.customer.findFirst({
    where: {
      id: input.customerId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    include: { individual: true, business: true },
  });
}

export async function listInvoiceCustomers(
  input: { companyId: string; agencyId: string; search?: string; take?: number },
  db: DatabaseClient = prisma,
) {
  const search = input.search?.trim();
  return db.customer.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      status: CustomerStatus.active,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { individual: { firstName: { contains: search, mode: "insensitive" } } },
              { individual: { lastName: { contains: search, mode: "insensitive" } } },
              { business: { companyName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { individual: true, business: true },
    orderBy: { createdAt: "desc" },
    take: input.take ?? 50,
  });
}

export async function createInvoice(data: Prisma.InvoiceUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.invoice.create({ data });
}

export async function updateInvoice(
  input: { companyId: string; agencyId: string; invoiceId: string; data: Prisma.InvoiceUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.invoice.updateMany({
    where: { id: input.invoiceId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteInvoice(
  input: { companyId: string; agencyId: string; invoiceId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.invoice.updateMany({
    where: {
      id: input.invoiceId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      status: InvoiceStatus.draft,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function findInvoiceByIdForUpdate(
  input: { companyId: string; agencyId: string; invoiceId: string },
  db: DatabaseClient = prisma,
) {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM invoices
    WHERE id = ${input.invoiceId}::uuid
      AND company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
      AND deleted_at IS NULL
    FOR UPDATE
  `;
  if (rows.length === 0) return null;
  return findInvoiceById(input, db);
}

export async function deleteInvoiceLineItems(
  input: { companyId: string; invoiceId: string },
  db: DatabaseClient = prisma,
) {
  return db.invoiceLineItem.deleteMany({
    where: { companyId: input.companyId, invoiceId: input.invoiceId },
  });
}

export async function createInvoiceLineItem(
  data: Prisma.InvoiceLineItemUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.invoiceLineItem.create({ data });
}

export async function createManyInvoiceLineItems(
  data: Prisma.InvoiceLineItemCreateManyInput[],
  db: DatabaseClient = prisma,
) {
  return db.invoiceLineItem.createMany({ data });
}

export async function listPayments(
  input: FinanceListInput & { invoiceId?: string; reservationId?: string; customerId?: string },
  db: DatabaseClient = prisma,
) {
  return db.payment.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      invoiceId: input.invoiceId,
      reservationId: input.reservationId,
      customerId: input.customerId,
      ...(input.from || input.to ? { paidAt: { gte: input.from, lte: input.to } } : {}),
    },
    orderBy: { paidAt: "desc" },
  });
}

export async function createPayment(data: Prisma.PaymentUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.payment.create({ data });
}

export async function updatePayment(
  input: { companyId: string; agencyId: string; paymentId: string; data: Prisma.PaymentUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.payment.updateMany({
    where: { id: input.paymentId, companyId: input.companyId, agencyId: input.agencyId },
    data: input.data,
  });
}

export async function listDeposits(
  input: FinanceListInput & { reservationId?: string; customerId?: string; status?: DepositStatus },
  db: DatabaseClient = prisma,
) {
  return db.deposit.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      reservationId: input.reservationId,
      customerId: input.customerId,
      status: input.status,
      ...(input.from || input.to ? { collectedAt: { gte: input.from, lte: input.to } } : {}),
    },
    orderBy: { collectedAt: "desc" },
  });
}

export async function createDeposit(data: Prisma.DepositUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.deposit.create({ data });
}

export async function updateDeposit(
  input: { companyId: string; agencyId: string; depositId: string; data: Prisma.DepositUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.deposit.updateMany({
    where: { id: input.depositId, companyId: input.companyId, agencyId: input.agencyId },
    data: input.data,
  });
}

export async function createCreditNote(data: Prisma.CreditNoteUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.creditNote.create({ data });
}

export async function listCreditNotesForInvoice(
  input: { companyId: string; agencyId: string; invoiceId: string },
  db: DatabaseClient = prisma,
) {
  return db.creditNote.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      originalInvoiceId: input.invoiceId,
    },
    orderBy: { issuedAt: "desc" },
  });
}

export async function listExpenseCategories(companyId: string, db: DatabaseClient = prisma) {
  return db.expenseCategory.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
}

export async function createExpenseCategory(
  data: Prisma.ExpenseCategoryUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.expenseCategory.create({ data });
}

export async function paginateExpenses(
  input: FinanceListInput & { categoryId?: string; vehicleId?: string; reservationId?: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  const pagination = getPagination(input);
  const where: Prisma.ExpenseWhereInput = {
    companyId: input.companyId,
    agencyId: input.agencyId,
    categoryId: input.categoryId,
    vehicleId: input.vehicleId,
    reservationId: input.reservationId,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.from || input.to ? { occurredAt: { gte: input.from, lte: input.to } } : {}),
  };
  const [data, total] = await Promise.all([
    db.expense.findMany({
      where,
      include: { category: true, vehicle: true, reservation: true },
      orderBy: { occurredAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.expense.count({ where }),
  ]);
  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function createExpense(data: Prisma.ExpenseUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.expense.create({ data });
}

export async function updateExpense(
  input: { companyId: string; agencyId: string; expenseId: string; data: Prisma.ExpenseUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.expense.updateMany({
    where: { id: input.expenseId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteExpense(
  input: { companyId: string; agencyId: string; expenseId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.expense.updateMany({
    where: { id: input.expenseId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreExpense(
  input: { companyId: string; agencyId: string; expenseId: string },
  db: DatabaseClient = prisma,
) {
  return db.expense.updateMany({
    where: { id: input.expenseId, companyId: input.companyId, agencyId: input.agencyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function createDriverPayment(
  data: Prisma.DriverPaymentUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.driverPayment.create({ data });
}

export async function listDriverPayments(
  input: FinanceListInput & { driverId?: string; reservationId?: string },
  db: DatabaseClient = prisma,
) {
  return db.driverPayment.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      driverId: input.driverId,
      reservationId: input.reservationId,
      ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoicePaymentSummary(
  input: { companyId: string; agencyId: string; invoiceId: string },
  db: DatabaseClient = prisma,
) {
  const [invoice, payments, creditNotes] = await Promise.all([
    db.invoice.findFirst({
      where: { id: input.invoiceId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
      select: { totalAmount: true, currency: true },
    }),
    db.payment.aggregate({
      where: { invoiceId: input.invoiceId, companyId: input.companyId, agencyId: input.agencyId },
      _sum: { amount: true },
    }),
    db.creditNote.aggregate({
      where: {
        originalInvoiceId: input.invoiceId,
        companyId: input.companyId,
        agencyId: input.agencyId,
      },
      _sum: { amount: true },
    }),
  ]);

  return { invoice, paidAmount: payments._sum.amount, creditedAmount: creditNotes._sum.amount };
}

export const financesRepository = {
  findInvoiceById,
  findInvoiceByReservation,
  paginateInvoices,
  findInvoiceGenerationSource,
  lockReservationForInvoice,
  lockInvoiceByReservation,
  listInvoiceableReservations,
  findInvoiceCustomer,
  listInvoiceCustomers,
  createInvoice,
  updateInvoice,
  softDeleteInvoice,
  findInvoiceByIdForUpdate,
  createInvoiceLineItem,
  createManyInvoiceLineItems,
  deleteInvoiceLineItems,
  listPayments,
  createPayment,
  updatePayment,
  listDeposits,
  createDeposit,
  updateDeposit,
  createCreditNote,
  listCreditNotesForInvoice,
  listExpenseCategories,
  createExpenseCategory,
  paginateExpenses,
  createExpense,
  updateExpense,
  softDeleteExpense,
  restoreExpense,
  createDriverPayment,
  listDriverPayments,
  getInvoicePaymentSummary,
};
