import {
  CustomerStatus,
  CustomerType,
  DepositStatus,
  InvoiceStatus,
  InvoiceType,
  Prisma,
  ReservationStatus,
  VehicleMaintenanceStatus,
  prisma,
} from "@lokarent/db";
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
export type ExpenseSort = "date" | "amount";

export type FinanceReportingInput = {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
  currency: string;
};

export type FinanceReportingDateBucket = FinanceReportingInput & {
  buckets: Array<{ key: string; label: string; from: Date; to: Date }>;
};

export type FinanceReportingCustomerInput = {
  companyId: string;
  agencyId: string;
  customerIds: string[];
  currency: string;
  monthlyFrom: Date;
  monthlyTo: Date;
};

const validRevenueInvoiceStatuses = [
  InvoiceStatus.issued,
  InvoiceStatus.paid,
  InvoiceStatus.partially_paid,
  InvoiceStatus.overdue,
] as const;

const validRevenueInvoiceStatusSql = Prisma.join(
  validRevenueInvoiceStatuses.map((status) => Prisma.sql`${status}::"InvoiceStatus"`),
);

const occupiedReservationStatusSql = Prisma.join(
  [ReservationStatus.confirmed, ReservationStatus.active, ReservationStatus.completed].map(
    (status) => Prisma.sql`${status}::"ReservationStatus"`,
  ),
);

const upcomingMaintenanceStatusSql = Prisma.join(
  [VehicleMaintenanceStatus.scheduled, VehicleMaintenanceStatus.in_progress].map(
    (status) => Prisma.sql`${status}::"VehicleMaintenanceStatus"`,
  ),
);

const heldDepositStatusSql = Prisma.join(
  [DepositStatus.held, DepositStatus.partially_released].map(
    (status) => Prisma.sql`${status}::"DepositStatus"`),
);

async function sumInvoicedAmount(input: FinanceReportingInput, db: DatabaseClient = prisma) {
  const rows = await db.$queryRaw<{ amount: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(i.total_amount), 0)::numeric AS amount
    FROM invoices i
    WHERE i.company_id = ${input.companyId}::uuid
      AND i.agency_id = ${input.agencyId}::uuid
      AND i.deleted_at IS NULL
      AND i.currency = ${input.currency}
      AND i.status IN (${validRevenueInvoiceStatusSql})
      AND i.issued_at >= ${input.from}
      AND i.issued_at < ${input.to}
  `;
  return rows[0]?.amount ?? null;
}

async function sumCreditNoteAmount(input: FinanceReportingInput, db: DatabaseClient = prisma) {
  const rows = await db.$queryRaw<{ amount: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(cn.amount), 0)::numeric AS amount
    FROM credit_notes cn
    JOIN invoices i ON i.id = cn.original_invoice_id
    WHERE cn.company_id = ${input.companyId}::uuid
      AND cn.agency_id = ${input.agencyId}::uuid
      AND cn.currency = ${input.currency}
      AND cn.issued_at >= ${input.from}
      AND cn.issued_at < ${input.to}
      AND i.company_id = ${input.companyId}::uuid
      AND i.agency_id = ${input.agencyId}::uuid
      AND i.deleted_at IS NULL
      AND i.currency = ${input.currency}
      AND i.status IN (${validRevenueInvoiceStatusSql})
  `;
  return rows[0]?.amount ?? null;
}

async function sumCashCollectedAmount(input: FinanceReportingInput, db: DatabaseClient = prisma) {
  const rows = await db.$queryRaw<{ amount: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(p.amount), 0)::numeric AS amount
    FROM payments p
    WHERE p.company_id = ${input.companyId}::uuid
      AND p.agency_id = ${input.agencyId}::uuid
      AND p.currency = ${input.currency}
      AND p.paid_at >= ${input.from}
      AND p.paid_at < ${input.to}
  `;
  return rows[0]?.amount ?? null;
}

async function sumExpenseAmount(input: FinanceReportingInput, db: DatabaseClient = prisma) {
  const rows = await db.$queryRaw<{ amount: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(e.amount), 0)::numeric AS amount
    FROM expenses e
    WHERE e.company_id = ${input.companyId}::uuid
      AND e.agency_id = ${input.agencyId}::uuid
      AND e.deleted_at IS NULL
      AND e.currency = ${input.currency}
      AND e.occurred_at >= ${input.from}
      AND e.occurred_at < ${input.to}
  `;
  return rows[0]?.amount ?? null;
}

async function sumDriverPaymentAmount(input: FinanceReportingInput, db: DatabaseClient = prisma) {
  const rows = await db.$queryRaw<{ amount: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(COALESCE(dp.net_amount, dp.gross_amount)), 0)::numeric AS amount
    FROM driver_payments dp
    WHERE dp.company_id = ${input.companyId}::uuid
      AND dp.agency_id = ${input.agencyId}::uuid
      AND dp.currency = ${input.currency}
      AND dp.paid_at >= ${input.from}
      AND dp.paid_at < ${input.to}
  `;
  return rows[0]?.amount ?? null;
}

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

export async function findDepositById(
  input: { companyId: string; agencyId: string; depositId: string },
  db: DatabaseClient = prisma,
) {
  return db.deposit.findFirst({
    where: { id: input.depositId, companyId: input.companyId, agencyId: input.agencyId },
  });
}

export async function findDepositByIdForUpdate(
  input: { companyId: string; agencyId: string; depositId: string },
  db: DatabaseClient = prisma,
) {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM deposits
    WHERE id = ${input.depositId}::uuid
      AND company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
    FOR UPDATE
  `;
  if (rows.length === 0) return null;
  return findDepositById(input, db);
}

export async function lockDepositsByReservation(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  await db.$queryRaw`
    SELECT id
    FROM deposits
    WHERE company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
      AND reservation_id = ${input.reservationId}::uuid
    FOR UPDATE
  `;
}

export async function findDepositReservationSource(
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
      pricingSnapshots: { where: { isCurrent: true }, orderBy: { createdAt: "desc" }, take: 1 },
      deposits: { orderBy: { collectedAt: "desc" } },
    },
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

export async function findCreditNoteByOriginalInvoice(
  input: { companyId: string; agencyId: string; invoiceId: string },
  db: DatabaseClient = prisma,
) {
  return db.creditNote.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      originalInvoiceId: input.invoiceId,
    },
    orderBy: { issuedAt: "desc" },
  });
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

export async function findExpenseCategoryById(
  input: { companyId: string; categoryId: string },
  db: DatabaseClient = prisma,
) {
  return db.expenseCategory.findFirst({
    where: { id: input.categoryId, companyId: input.companyId },
  });
}

export async function createExpenseCategory(
  data: Prisma.ExpenseCategoryUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.expenseCategory.create({ data });
}

export async function paginateExpenses(
  input: FinanceListInput & {
    categoryId?: string;
    vehicleId?: string;
    reservationId?: string;
    includeDeleted?: boolean;
    sort?: ExpenseSort;
  },
  db: DatabaseClient = prisma,
) {
  const pagination = getPagination(input);
  const search = input.search?.trim();
  const where: Prisma.ExpenseWhereInput = {
    companyId: input.companyId,
    agencyId: input.agencyId,
    categoryId: input.categoryId,
    vehicleId: input.vehicleId,
    reservationId: input.reservationId,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.from || input.to ? { occurredAt: { gte: input.from, lte: input.to } } : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { provider: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
            { category: { name: { contains: search, mode: "insensitive" } } },
            { vehicle: { plate: { contains: search, mode: "insensitive" } } },
            { vehicle: { brand: { contains: search, mode: "insensitive" } } },
            { vehicle: { model: { contains: search, mode: "insensitive" } } },
            { reservation: { code: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ExpenseOrderByWithRelationInput =
    input.sort === "amount" ? { amount: "desc" } : { occurredAt: "desc" };
  const [data, total] = await Promise.all([
    db.expense.findMany({
      where,
      include: { category: true, vehicle: true, reservation: true, recordedByUser: true },
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.expense.count({ where }),
  ]);
  return { data, pagination: createPaginationMeta(pagination, total) };
}

export async function findExpenseById(
  input: { companyId: string; agencyId: string; expenseId: string },
  db: DatabaseClient = prisma,
) {
  return db.expense.findFirst({
    where: { id: input.expenseId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    include: { category: true, vehicle: true, reservation: true, recordedByUser: true },
  });
}

export async function findExpenseVehicleById(
  input: { companyId: string; agencyId: string; vehicleId: string },
  db: DatabaseClient = prisma,
) {
  return db.vehicle.findFirst({
    where: { id: input.vehicleId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    select: { id: true },
  });
}

export async function findExpenseReservationById(
  input: { companyId: string; agencyId: string; reservationId: string },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findFirst({
    where: { id: input.reservationId, companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    select: { id: true, vehicleId: true },
  });
}

export async function getExpenseAgencyDefaults(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  return db.agency.findFirst({
    where: { id: input.agencyId, companyId: input.companyId, deletedAt: null },
    select: { currency: true, company: { select: { currency: true } } },
  });
}

export async function listExpenseVehicleOptions(
  input: { companyId: string; agencyId: string; search?: string; take?: number },
  db: DatabaseClient = prisma,
) {
  const search = input.search?.trim();
  return db.vehicle.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { plate: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
              { model: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, brand: true, model: true, plate: true, category: { select: { name: true } } },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
    take: input.take ?? 100,
  });
}

export async function listExpenseReservationOptions(
  input: { companyId: string; agencyId: string; search?: string; take?: number },
  db: DatabaseClient = prisma,
) {
  const search = input.search?.trim();
  return db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { vehicle: { plate: { contains: search, mode: "insensitive" } } },
              { vehicle: { brand: { contains: search, mode: "insensitive" } } },
              { vehicle: { model: { contains: search, mode: "insensitive" } } },
              { customer: { code: { contains: search, mode: "insensitive" } } },
              { customer: { individual: { firstName: { contains: search, mode: "insensitive" } } } },
              { customer: { individual: { lastName: { contains: search, mode: "insensitive" } } } },
              { customer: { business: { companyName: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      code: true,
      vehicleId: true,
      startsAt: true,
      endsAt: true,
      vehicle: { select: { brand: true, model: true, plate: true } },
      customer: {
        select: {
          code: true,
          individual: { select: { firstName: true, lastName: true } },
          business: { select: { companyName: true } },
        },
      },
    },
    orderBy: { startsAt: "desc" },
    take: input.take ?? 100,
  });
}

export async function summarizeExpensesByCurrency(
  input: FinanceListInput & { categoryId?: string; vehicleId?: string; reservationId?: string },
  db: DatabaseClient = prisma,
) {
  const search = input.search?.trim();
  return db.expense.groupBy({
    by: ["currency"],
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      categoryId: input.categoryId,
      vehicleId: input.vehicleId,
      reservationId: input.reservationId,
      ...(input.from || input.to ? { occurredAt: { gte: input.from, lte: input.to } } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { provider: { contains: search, mode: "insensitive" } },
              { reference: { contains: search, mode: "insensitive" } },
              { category: { name: { contains: search, mode: "insensitive" } } },
              { vehicle: { plate: { contains: search, mode: "insensitive" } } },
              { reservation: { code: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    _sum: { amount: true },
    _count: { _all: true },
  });
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
      ...(input.from || input.to ? { paidAt: { gte: input.from, lte: input.to } } : {}),
    },
    orderBy: { paidAt: "desc" },
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

export async function getFinanceReportingCurrency(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  return db.agency.findFirst({
    where: { id: input.agencyId, companyId: input.companyId, deletedAt: null },
    select: { currency: true, company: { select: { currency: true } } },
  });
}

export async function summarizeFinanceReportingTotals(
  input: FinanceReportingInput,
  db: DatabaseClient = prisma,
) {
  const [
    invoiced,
    creditNotes,
    cashCollected,
    expenses,
    driverPayments,
    depositsHeld,
    outstanding,
  ] = await Promise.all([
    sumInvoicedAmount(input, db),
    sumCreditNoteAmount(input, db),
    sumCashCollectedAmount(input, db),
    sumExpenseAmount(input, db),
    sumDriverPaymentAmount(input, db),
    db.deposit.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        currency: input.currency,
        status: { in: [DepositStatus.held, DepositStatus.partially_released] },
      },
      _sum: { amount: true, releasedAmount: true },
    }),
    db.$queryRaw<{ amount: Prisma.Decimal | null }[]>`
      SELECT COALESCE(SUM(invoice_totals.balance), 0)::numeric AS amount
      FROM (
        SELECT
          i.id,
          GREATEST(
            i.total_amount
              - COALESCE((
                SELECT SUM(p.amount)
                FROM payments p
                WHERE p.invoice_id = i.id
                  AND p.company_id = ${input.companyId}::uuid
                  AND p.agency_id = ${input.agencyId}::uuid
                  AND p.currency = ${input.currency}
              ), 0)
              - COALESCE((
                SELECT SUM(cn.amount)
                FROM credit_notes cn
                WHERE cn.original_invoice_id = i.id
                  AND cn.company_id = ${input.companyId}::uuid
                  AND cn.agency_id = ${input.agencyId}::uuid
                  AND cn.currency = ${input.currency}
              ), 0),
            0
          ) AS balance
        FROM invoices i
        WHERE i.company_id = ${input.companyId}::uuid
          AND i.agency_id = ${input.agencyId}::uuid
          AND i.deleted_at IS NULL
          AND i.currency = ${input.currency}
          AND i.status IN (${validRevenueInvoiceStatusSql})
          AND i.issued_at >= ${input.from}
          AND i.issued_at < ${input.to}
      ) invoice_totals
    `,
  ]);

  return {
    invoicedAmount: invoiced,
    creditNoteAmount: creditNotes,
    cashCollectedAmount: cashCollected,
    expenseAmount: (expenses ?? new Prisma.Decimal(0)).plus(driverPayments ?? new Prisma.Decimal(0)),
    depositHeldAmount: (depositsHeld._sum.amount ?? new Prisma.Decimal(0)).minus(
      depositsHeld._sum.releasedAmount ?? new Prisma.Decimal(0),
    ),
    outstandingAmount: outstanding[0]?.amount ?? null,
  };
}

export async function listFinanceReportingSeries(
  input: FinanceReportingDateBucket,
  db: DatabaseClient = prisma,
) {
  const [invoiceRows, creditRows, expenseRows, driverPaymentRows] = await Promise.all([
    Promise.all(
      input.buckets.map(async (bucket) => {
        const amount = await sumInvoicedAmount({ ...input, from: bucket.from, to: bucket.to }, db);
        return { key: bucket.key, amount };
      }),
    ),
    Promise.all(
      input.buckets.map(async (bucket) => {
        const amount = await sumCreditNoteAmount({ ...input, from: bucket.from, to: bucket.to }, db);
        return { key: bucket.key, amount };
      }),
    ),
    Promise.all(
      input.buckets.map(async (bucket) => {
        const amount = await sumExpenseAmount({ ...input, from: bucket.from, to: bucket.to }, db);
        return { key: bucket.key, amount };
      }),
    ),
    Promise.all(
      input.buckets.map(async (bucket) => {
        const amount = await sumDriverPaymentAmount({ ...input, from: bucket.from, to: bucket.to }, db);
        return { key: bucket.key, amount };
      }),
    ),
  ]);

  return input.buckets.map((bucket) => ({
    ...bucket,
    invoiceAmount: invoiceRows.find((row) => row.key === bucket.key)?.amount ?? null,
    creditNoteAmount: creditRows.find((row) => row.key === bucket.key)?.amount ?? null,
    expenseAmount: (expenseRows.find((row) => row.key === bucket.key)?.amount ?? new Prisma.Decimal(0)).plus(
      driverPaymentRows.find((row) => row.key === bucket.key)?.amount ?? new Prisma.Decimal(0),
    ),
  }));
}

export async function listFinanceReportingVehicles(
  input: FinanceReportingInput & { monthlyFrom: Date },
  db: DatabaseClient = prisma,
) {
  const [
    vehicles,
    revenueRows,
    creditRows,
    expenseRows,
    driverPaymentRows,
    occupancyRows,
    recentExpenseRows,
    monthlyRevenueRows,
  ] = await Promise.all([
    db.vehicle.findMany({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
      },
      select: {
        id: true,
        brand: true,
        model: true,
        plate: true,
        category: { select: { name: true } },
      },
      orderBy: [{ brand: "asc" }, { model: "asc" }, { plate: "asc" }],
    }),
    db.$queryRaw<{ vehicleId: string; amount: Prisma.Decimal | null }[]>`
      SELECT r.vehicle_id AS "vehicleId", COALESCE(SUM(i.total_amount), 0)::numeric AS amount
      FROM invoices i
      JOIN reservations r ON r.id = i.reservation_id
      WHERE i.company_id = ${input.companyId}::uuid
        AND i.agency_id = ${input.agencyId}::uuid
        AND i.deleted_at IS NULL
        AND i.currency = ${input.currency}
        AND i.status IN (${validRevenueInvoiceStatusSql})
        AND i.issued_at >= ${input.from}
        AND i.issued_at < ${input.to}
        AND r.company_id = ${input.companyId}::uuid
        AND r.agency_id = ${input.agencyId}::uuid
        AND r.deleted_at IS NULL
      GROUP BY r.vehicle_id
    `,
    db.$queryRaw<{ vehicleId: string; amount: Prisma.Decimal | null }[]>`
      SELECT r.vehicle_id AS "vehicleId", COALESCE(SUM(cn.amount), 0)::numeric AS amount
      FROM credit_notes cn
      JOIN invoices i ON i.id = cn.original_invoice_id
      JOIN reservations r ON r.id = i.reservation_id
      WHERE cn.company_id = ${input.companyId}::uuid
        AND cn.agency_id = ${input.agencyId}::uuid
        AND cn.currency = ${input.currency}
        AND cn.issued_at >= ${input.from}
        AND cn.issued_at < ${input.to}
        AND i.company_id = ${input.companyId}::uuid
        AND i.agency_id = ${input.agencyId}::uuid
        AND i.deleted_at IS NULL
        AND i.currency = ${input.currency}
        AND i.status IN (${validRevenueInvoiceStatusSql})
        AND i.reservation_id IS NOT NULL
        AND r.company_id = ${input.companyId}::uuid
        AND r.agency_id = ${input.agencyId}::uuid
        AND r.deleted_at IS NULL
      GROUP BY r.vehicle_id
    `,
    db.expense.groupBy({
      by: ["vehicleId"],
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        currency: input.currency,
        vehicleId: { not: null },
        occurredAt: { gte: input.from, lt: input.to },
      },
      _sum: { amount: true },
    }),
    db.$queryRaw<{ vehicleId: string; amount: Prisma.Decimal | null }[]>`
      SELECT r.vehicle_id AS "vehicleId", COALESCE(SUM(COALESCE(dp.net_amount, dp.gross_amount)), 0)::numeric AS amount
      FROM driver_payments dp
      JOIN reservations r ON r.id = dp.reservation_id
      WHERE dp.company_id = ${input.companyId}::uuid
        AND dp.agency_id = ${input.agencyId}::uuid
        AND dp.currency = ${input.currency}
        AND dp.paid_at >= ${input.from}
        AND dp.paid_at < ${input.to}
        AND r.company_id = ${input.companyId}::uuid
        AND r.agency_id = ${input.agencyId}::uuid
        AND r.deleted_at IS NULL
      GROUP BY r.vehicle_id
    `,
    db.$queryRaw<{ vehicleId: string; reservedDays: Prisma.Decimal | null }[]>`
      SELECT
        vehicle_id AS "vehicleId",
        COALESCE(
          SUM(
            EXTRACT(
              EPOCH FROM (
                LEAST(ends_at, ${input.to})
                - GREATEST(starts_at, ${input.from})
              )
            ) / 86400
          ),
          0
        )::numeric AS "reservedDays"
      FROM reservations
      WHERE company_id = ${input.companyId}::uuid
        AND agency_id = ${input.agencyId}::uuid
        AND deleted_at IS NULL
        AND status IN (${occupiedReservationStatusSql})
        AND starts_at < ${input.to}
        AND ends_at > ${input.from}
      GROUP BY vehicle_id
    `,
    db.$queryRaw<
      {
        vehicleId: string;
        type: string;
        date: Date;
        amount: Prisma.Decimal;
        note: string | null;
      }[]
    >`
      SELECT "vehicleId", type, date, amount, note
      FROM (
        SELECT
          e.vehicle_id AS "vehicleId",
          c.name AS type,
          e.occurred_at AS date,
          e.amount,
          e.description AS note,
          ROW_NUMBER() OVER (PARTITION BY e.vehicle_id ORDER BY e.occurred_at DESC, e.created_at DESC) AS rn
        FROM expenses e
        JOIN expense_categories c ON c.id = e.category_id
        WHERE e.company_id = ${input.companyId}::uuid
          AND e.agency_id = ${input.agencyId}::uuid
          AND e.deleted_at IS NULL
          AND e.currency = ${input.currency}
          AND e.vehicle_id IS NOT NULL
          AND e.occurred_at >= ${input.from}
          AND e.occurred_at < ${input.to}
      ) ranked
      WHERE rn <= 5
      ORDER BY date DESC
    `,
    db.$queryRaw<{ vehicleId: string; month: Date; amount: Prisma.Decimal | null }[]>`
      SELECT
        r.vehicle_id AS "vehicleId",
        DATE_TRUNC('month', i.issued_at)::date AS month,
        (
          COALESCE(SUM(i.total_amount), 0)
          - COALESCE(SUM(credits.amount), 0)
        )::numeric AS amount
      FROM invoices i
      JOIN reservations r ON r.id = i.reservation_id
      LEFT JOIN LATERAL (
        SELECT SUM(cn.amount) AS amount
        FROM credit_notes cn
        WHERE cn.original_invoice_id = i.id
          AND cn.company_id = ${input.companyId}::uuid
          AND cn.agency_id = ${input.agencyId}::uuid
          AND cn.currency = ${input.currency}
          AND cn.issued_at >= ${input.monthlyFrom}
          AND cn.issued_at < ${input.to}
      ) credits ON true
      WHERE i.company_id = ${input.companyId}::uuid
        AND i.agency_id = ${input.agencyId}::uuid
        AND i.deleted_at IS NULL
        AND i.currency = ${input.currency}
        AND i.status IN (${validRevenueInvoiceStatusSql})
        AND i.issued_at >= ${input.monthlyFrom}
        AND i.issued_at < ${input.to}
        AND i.reservation_id IS NOT NULL
        AND r.company_id = ${input.companyId}::uuid
        AND r.agency_id = ${input.agencyId}::uuid
        AND r.deleted_at IS NULL
      GROUP BY r.vehicle_id, DATE_TRUNC('month', i.issued_at)::date
    `,
  ]);

  return {
    vehicles,
    revenueRows,
    creditRows,
    expenseRows,
    driverPaymentRows,
    occupancyRows,
    recentExpenseRows,
    monthlyRevenueRows,
  };
}

export async function listFinanceReportingCustomers(
  input: FinanceReportingCustomerInput,
  db: DatabaseClient = prisma,
) {
  if (input.customerIds.length === 0) {
    return { totals: [], monthlyRows: [] };
  }

  const targetCustomersSql = Prisma.join(
    input.customerIds.map((customerId) => Prisma.sql`(${customerId}::uuid)`),
  );

  const [totals, monthlyRows] = await Promise.all([
    db.$queryRaw<
      {
        customerId: string;
        invoicedAmount: Prisma.Decimal | null;
        creditNoteAmount: Prisma.Decimal | null;
        paidAmount: Prisma.Decimal | null;
        outstandingAmount: Prisma.Decimal | null;
        depositsHeldAmount: Prisma.Decimal | null;
      }[]
    >`
      WITH target_customers(id) AS (
        VALUES ${targetCustomersSql}
      ),
      invoice_totals AS (
        SELECT customer_id, COALESCE(SUM(total_amount), 0)::numeric AS amount
        FROM invoices
        WHERE company_id = ${input.companyId}::uuid
          AND agency_id = ${input.agencyId}::uuid
          AND deleted_at IS NULL
          AND currency = ${input.currency}
          AND status IN (${validRevenueInvoiceStatusSql})
          AND customer_id IN (SELECT id FROM target_customers)
        GROUP BY customer_id
      ),
      credit_totals AS (
        SELECT i.customer_id, COALESCE(SUM(cn.amount), 0)::numeric AS amount
        FROM credit_notes cn
        JOIN invoices i ON i.id = cn.original_invoice_id
        WHERE cn.company_id = ${input.companyId}::uuid
          AND cn.agency_id = ${input.agencyId}::uuid
          AND cn.currency = ${input.currency}
          AND i.company_id = ${input.companyId}::uuid
          AND i.agency_id = ${input.agencyId}::uuid
          AND i.deleted_at IS NULL
          AND i.currency = ${input.currency}
          AND i.status IN (${validRevenueInvoiceStatusSql})
          AND i.customer_id IN (SELECT id FROM target_customers)
        GROUP BY i.customer_id
      ),
      payment_totals AS (
        SELECT customer_id, COALESCE(SUM(amount), 0)::numeric AS amount
        FROM payments
        WHERE company_id = ${input.companyId}::uuid
          AND agency_id = ${input.agencyId}::uuid
          AND currency = ${input.currency}
          AND customer_id IN (SELECT id FROM target_customers)
        GROUP BY customer_id
      ),
      outstanding_totals AS (
        SELECT customer_id, COALESCE(SUM(balance), 0)::numeric AS amount
        FROM (
          SELECT
            i.customer_id,
            GREATEST(
              i.total_amount
                - COALESCE((
                  SELECT SUM(p.amount)
                  FROM payments p
                  WHERE p.invoice_id = i.id
                    AND p.company_id = ${input.companyId}::uuid
                    AND p.agency_id = ${input.agencyId}::uuid
                    AND p.currency = ${input.currency}
                ), 0)
                - COALESCE((
                  SELECT SUM(cn.amount)
                  FROM credit_notes cn
                  WHERE cn.original_invoice_id = i.id
                    AND cn.company_id = ${input.companyId}::uuid
                    AND cn.agency_id = ${input.agencyId}::uuid
                    AND cn.currency = ${input.currency}
                ), 0),
              0
            ) AS balance
          FROM invoices i
          WHERE i.company_id = ${input.companyId}::uuid
            AND i.agency_id = ${input.agencyId}::uuid
            AND i.deleted_at IS NULL
            AND i.currency = ${input.currency}
            AND i.status IN (${validRevenueInvoiceStatusSql})
            AND i.customer_id IN (SELECT id FROM target_customers)
        ) invoice_balances
        GROUP BY customer_id
      ),
      deposit_totals AS (
        SELECT
          customer_id,
          COALESCE(SUM(amount), 0)::numeric - COALESCE(SUM(released_amount), 0)::numeric AS amount
        FROM deposits
        WHERE company_id = ${input.companyId}::uuid
          AND agency_id = ${input.agencyId}::uuid
          AND currency = ${input.currency}
          AND status IN (${heldDepositStatusSql})
          AND customer_id IN (SELECT id FROM target_customers)
        GROUP BY customer_id
      )
      SELECT
        tc.id AS "customerId",
        COALESCE(it.amount, 0)::numeric AS "invoicedAmount",
        COALESCE(ct.amount, 0)::numeric AS "creditNoteAmount",
        COALESCE(pt.amount, 0)::numeric AS "paidAmount",
        COALESCE(ot.amount, 0)::numeric AS "outstandingAmount",
        COALESCE(dt.amount, 0)::numeric AS "depositsHeldAmount"
      FROM target_customers tc
      LEFT JOIN invoice_totals it ON it.customer_id = tc.id
      LEFT JOIN credit_totals ct ON ct.customer_id = tc.id
      LEFT JOIN payment_totals pt ON pt.customer_id = tc.id
      LEFT JOIN outstanding_totals ot ON ot.customer_id = tc.id
      LEFT JOIN deposit_totals dt ON dt.customer_id = tc.id
    `,
    db.$queryRaw<
      {
        customerId: string;
        month: Date;
        invoiceAmount: Prisma.Decimal | null;
        creditNoteAmount: Prisma.Decimal | null;
      }[]
    >`
      WITH target_customers(id) AS (
        VALUES ${targetCustomersSql}
      ),
      invoice_months AS (
        SELECT
          customer_id,
          DATE_TRUNC('month', issued_at)::date AS month,
          COALESCE(SUM(total_amount), 0)::numeric AS amount
        FROM invoices
        WHERE company_id = ${input.companyId}::uuid
          AND agency_id = ${input.agencyId}::uuid
          AND deleted_at IS NULL
          AND currency = ${input.currency}
          AND status IN (${validRevenueInvoiceStatusSql})
          AND issued_at >= ${input.monthlyFrom}
          AND issued_at < ${input.monthlyTo}
          AND customer_id IN (SELECT id FROM target_customers)
        GROUP BY customer_id, DATE_TRUNC('month', issued_at)::date
      ),
      credit_months AS (
        SELECT
          i.customer_id,
          DATE_TRUNC('month', cn.issued_at)::date AS month,
          COALESCE(SUM(cn.amount), 0)::numeric AS amount
        FROM credit_notes cn
        JOIN invoices i ON i.id = cn.original_invoice_id
        WHERE cn.company_id = ${input.companyId}::uuid
          AND cn.agency_id = ${input.agencyId}::uuid
          AND cn.currency = ${input.currency}
          AND cn.issued_at >= ${input.monthlyFrom}
          AND cn.issued_at < ${input.monthlyTo}
          AND i.company_id = ${input.companyId}::uuid
          AND i.agency_id = ${input.agencyId}::uuid
          AND i.deleted_at IS NULL
          AND i.currency = ${input.currency}
          AND i.status IN (${validRevenueInvoiceStatusSql})
          AND i.customer_id IN (SELECT id FROM target_customers)
        GROUP BY i.customer_id, DATE_TRUNC('month', cn.issued_at)::date
      )
      SELECT
        COALESCE(im.customer_id, cm.customer_id) AS "customerId",
        COALESCE(im.month, cm.month) AS month,
        COALESCE(im.amount, 0)::numeric AS "invoiceAmount",
        COALESCE(cm.amount, 0)::numeric AS "creditNoteAmount"
      FROM invoice_months im
      FULL OUTER JOIN credit_months cm ON cm.customer_id = im.customer_id AND cm.month = im.month
      ORDER BY month ASC
    `,
  ]);

  return { totals, monthlyRows };
}

export async function listFinanceUpcomingChargeForecasts(
  input: { companyId: string; agencyId: string; from: Date; to: Date; currency: string },
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<
    {
      id: string;
      type: "insurance" | "vignette" | "inspection" | "maintenance";
      vehicleId: string;
      brand: string;
      model: string;
      plate: string;
      dueDate: Date;
      amount: Prisma.Decimal;
    }[]
  >`
    SELECT * FROM (
      SELECT
        vi.id,
        'insurance'::text AS type,
        v.id AS "vehicleId",
        v.brand,
        v.model,
        v.plate,
        vi.expires_at AS "dueDate",
        vi.premium_amount AS amount
      FROM vehicle_insurances vi
      JOIN vehicles v ON v.id = vi.vehicle_id
      WHERE vi.company_id = ${input.companyId}::uuid
        AND vi.agency_id = ${input.agencyId}::uuid
        AND vi.deleted_at IS NULL
        AND v.company_id = ${input.companyId}::uuid
        AND v.agency_id = ${input.agencyId}::uuid
        AND v.deleted_at IS NULL
        AND vi.currency = ${input.currency}
        AND vi.premium_amount IS NOT NULL
        AND vi.expires_at >= ${input.from}
        AND vi.expires_at < ${input.to}

      UNION ALL

      SELECT
        vv.id,
        'vignette'::text AS type,
        v.id AS "vehicleId",
        v.brand,
        v.model,
        v.plate,
        vv.expires_at AS "dueDate",
        vv.amount
      FROM vehicle_vignettes vv
      JOIN vehicles v ON v.id = vv.vehicle_id
      WHERE vv.company_id = ${input.companyId}::uuid
        AND vv.agency_id = ${input.agencyId}::uuid
        AND v.company_id = ${input.companyId}::uuid
        AND v.agency_id = ${input.agencyId}::uuid
        AND v.deleted_at IS NULL
        AND vv.currency = ${input.currency}
        AND vv.amount IS NOT NULL
        AND vv.expires_at >= ${input.from}
        AND vv.expires_at < ${input.to}

      UNION ALL

      SELECT
        vins.id,
        'inspection'::text AS type,
        v.id AS "vehicleId",
        v.brand,
        v.model,
        v.plate,
        vins.expires_at AS "dueDate",
        vins.cost AS amount
      FROM vehicle_inspections vins
      JOIN vehicles v ON v.id = vins.vehicle_id
      WHERE vins.company_id = ${input.companyId}::uuid
        AND vins.agency_id = ${input.agencyId}::uuid
        AND vins.deleted_at IS NULL
        AND v.company_id = ${input.companyId}::uuid
        AND v.agency_id = ${input.agencyId}::uuid
        AND v.deleted_at IS NULL
        AND vins.currency = ${input.currency}
        AND vins.cost IS NOT NULL
        AND vins.expires_at >= ${input.from}
        AND vins.expires_at < ${input.to}

      UNION ALL

      SELECT
        vm.id,
        'maintenance'::text AS type,
        v.id AS "vehicleId",
        v.brand,
        v.model,
        v.plate,
        COALESCE(vm.next_due_at, vm.performed_at) AS "dueDate",
        vm.cost AS amount
      FROM vehicle_maintenances vm
      JOIN vehicles v ON v.id = vm.vehicle_id
      WHERE vm.company_id = ${input.companyId}::uuid
        AND vm.agency_id = ${input.agencyId}::uuid
        AND vm.deleted_at IS NULL
        AND v.company_id = ${input.companyId}::uuid
        AND v.agency_id = ${input.agencyId}::uuid
        AND v.deleted_at IS NULL
        AND vm.status IN (${upcomingMaintenanceStatusSql})
        AND vm.currency_code = ${input.currency}
        AND vm.cost IS NOT NULL
        AND COALESCE(vm.next_due_at, vm.performed_at) >= ${input.from}
        AND COALESCE(vm.next_due_at, vm.performed_at) < ${input.to}
    ) forecasts
    ORDER BY "dueDate" ASC, amount DESC
    LIMIT 12
  `;
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
  findDepositById,
  findDepositByIdForUpdate,
  lockDepositsByReservation,
  findDepositReservationSource,
  createDeposit,
  updateDeposit,
  createCreditNote,
  findCreditNoteByOriginalInvoice,
  listCreditNotesForInvoice,
  listExpenseCategories,
  findExpenseCategoryById,
  createExpenseCategory,
  paginateExpenses,
  findExpenseById,
  findExpenseVehicleById,
  findExpenseReservationById,
  getExpenseAgencyDefaults,
  listExpenseVehicleOptions,
  listExpenseReservationOptions,
  summarizeExpensesByCurrency,
  createExpense,
  updateExpense,
  softDeleteExpense,
  restoreExpense,
  createDriverPayment,
  listDriverPayments,
  getInvoicePaymentSummary,
  getFinanceReportingCurrency,
  summarizeFinanceReportingTotals,
  listFinanceReportingSeries,
  listFinanceReportingVehicles,
  listFinanceReportingCustomers,
  listFinanceUpcomingChargeForecasts,
};
