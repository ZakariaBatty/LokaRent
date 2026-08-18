import {
  createId,
  createNotFoundError,
  createValidationError,
  publishDomainEvent,
  runInTransaction,
} from "@/shared";
import type { DatabaseClient } from "@/shared/database";
import { writeActivityLog, writeAuditLog } from "@/shared/audit";
import { createReservationTimelineEvent } from "@/modules/reservations/repositories/reservations.repository";
import {
  findSettingResolutionRows,
  incrementNumberSequence,
} from "@/modules/workspace/billing/repositories/billing.repository";
import {
  DepositMethod,
  DepositStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  Prisma,
} from "@lokarent/db";
import {
  createCreditNote,
  createDeposit,
  createDriverPayment,
  createExpense,
  createExpenseCategory,
  createInvoice,
  createManyInvoiceLineItems,
  deleteInvoiceLineItems,
  createPayment,
  findInvoiceCustomer,
  findInvoiceById,
  findInvoiceByIdForUpdate,
  findInvoiceByReservation,
  getFinanceReportingCurrency,
  findCreditNoteByOriginalInvoice,
  findDepositByIdForUpdate,
  findExpenseById,
  findExpenseCategoryById,
  findExpenseReservationById,
  findExpenseVehicleById,
  getExpenseAgencyDefaults,
  findDepositReservationSource,
  findInvoiceGenerationSource,
  getInvoicePaymentSummary,
  listInvoiceCustomers,
  listInvoiceableReservations,
  listCreditNotesForInvoice,
  listDeposits,
  listDriverPayments,
  lockInvoiceByReservation,
  lockDepositsByReservation,
  lockReservationForInvoice,
  listExpenseCategories,
  listExpenseReservationOptions,
  listExpenseVehicleOptions,
  listFinanceReportingSeries,
  listFinanceReportingCustomers,
  listFinanceReportingVehicles,
  listFinanceUpcomingChargeForecasts,
  listPayments,
  paginateExpenses,
  paginateInvoices,
  restoreExpense,
  softDeleteInvoice,
  softDeleteExpense,
  summarizeFinanceReportingTotals,
  summarizeExpensesByCurrency,
  updateDeposit,
  updateExpense,
  updateInvoice,
  type FinanceListInput,
} from "../repositories/finances.repository";

export type FinanceServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

export type FinanceReportingRange = "this_month" | "last_month" | "quarter" | "year" | "custom";

export type FinanceReportingSummary = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitabilityRate: number;
  revenueDelta: number;
  expensesDelta: number;
  profitDelta: number;
  profitabilityDelta: number;
  cashCollected: number;
  outstanding: number;
  depositsHeld: number;
};

export type FinanceReportingSeriesPoint = {
  month: string;
  revenue: number;
  expenses: number;
};

export type FinanceReportingCarExpense = {
  type: string;
  date: string;
  amount: number;
  note?: string;
};

export type FinanceReportingCar = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  category: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancyRate: number;
  roi: null;
  monthlyRevenue: number[];
  recentExpenses: FinanceReportingCarExpense[];
};

export type FinanceUpcomingChargeForecast = {
  id: string;
  type: "insurance" | "vignette" | "inspection" | "maintenance";
  carLabel: string;
  plate: string;
  dueDate: string;
  daysUntil: number;
  amount: number;
  urgency: "high" | "medium" | "low";
};

export type FinanceOverviewReport = {
  range: FinanceReportingRange;
  currency: string;
  period: { from: string; to: string };
  summary: FinanceReportingSummary;
  revenueVsExpenses: FinanceReportingSeriesPoint[];
  vehicles: FinanceReportingCar[];
  upcomingCharges: FinanceUpcomingChargeForecast[];
  cashCollected: number;
  outstanding: number;
  depositsHeld: number;
};

export type FinanceReportingCustomerSummary = {
  customerId: string;
  currency: string;
  invoiced: number;
  paid: number;
  outstanding: number;
  depositsHeld: number;
  monthlyInvoiced: number[];
};

type InvoiceCreateData = Omit<
  Parameters<typeof createInvoice>[0],
  "id" | "companyId" | "agencyId"
>;
type InvoiceLineItemCreateData = Omit<
  Parameters<typeof createManyInvoiceLineItems>[0][number],
  "id" | "companyId" | "invoiceId"
>;
type PaymentCreateData = Omit<
  Parameters<typeof createPayment>[0],
  "id" | "companyId" | "agencyId" | "recordedBy"
>;
type DepositReservationSource = NonNullable<
  Awaited<ReturnType<typeof findDepositReservationSource>>
>;
type ExpenseCategoryCreateData = Omit<
  Parameters<typeof createExpenseCategory>[0],
  "id" | "companyId"
>;
type ExpenseCreateData = Omit<
  Parameters<typeof createExpense>[0],
  "id" | "companyId" | "agencyId" | "recordedBy"
>;
type DriverPaymentCreateData = Omit<
  Parameters<typeof createDriverPayment>[0],
  "id" | "companyId" | "agencyId" | "recordedBy"
>;
type InvoiceGenerationSource = NonNullable<
  Awaited<ReturnType<typeof findInvoiceGenerationSource>>
>;

export type InvoiceDraftLineInput = {
  description: string;
  quantity: Prisma.Decimal.Value;
  unitPrice: Prisma.Decimal.Value;
  source?: "system" | "manual";
};

export type InvoiceMutationInput = {
  type?: InvoiceType;
  reservationId?: string | null;
  customerId?: string | null;
  taxRate?: Prisma.Decimal.Value | null;
  manualLines?: InvoiceDraftLineInput[];
  issueAt?: Date | null;
  dueAt?: Date | null;
  notes?: string | null;
};

export type InvoicePaymentInput = {
  invoiceId: string;
  amount: Prisma.Decimal.Value;
  method: PaymentMethod;
  paidAt: Date;
  reference?: string | null;
  notes?: string | null;
};

export type DepositCollectionInput = {
  reservationId: string;
  amount: Prisma.Decimal.Value;
  method: DepositMethod;
  collectedAt?: Date | null;
  notes?: string | null;
};

export type DepositReleaseInput = {
  depositId: string;
  amount?: Prisma.Decimal.Value | null;
  notes?: string | null;
};

export type DepositForfeitInput = {
  depositId: string;
  reason: string;
};

export type ExpenseMutationInput = {
  categoryId: string;
  vehicleId?: string | null;
  reservationId?: string | null;
  description: string;
  amount: Prisma.Decimal.Value;
  currency?: string | null;
  occurredAt: Date;
  method?: PaymentMethod | null;
  reference?: string | null;
  provider?: string | null;
  internalNote?: string | null;
  documentUrl?: string | null;
};

export type CreditNoteIssueInput = {
  originalInvoiceId: string;
  amount: Prisma.Decimal.Value;
  reason?: string | null;
  replacementInvoiceId?: string | null;
  issuedAt?: Date | null;
};

export async function getInvoiceService(input: {
  companyId: string;
  agencyId: string;
  invoiceId: string;
}) {
  const invoice = await findInvoiceById(input);
  if (!invoice) throw createNotFoundError("Invoice", input);
  return invoice;
}

export async function getInvoiceByReservationService(input: {
  companyId: string;
  agencyId: string;
  reservationId: string;
}) {
  const invoice = await findInvoiceByReservation(input);
  if (!invoice) throw createNotFoundError("Invoice", input);
  return invoice;
}

export async function listInvoicesService(
  input: FinanceListInput & {
    status?: Parameters<typeof paginateInvoices>[0]["status"];
    type?: Parameters<typeof paginateInvoices>[0]["type"];
    customerId?: string;
    customerType?: Parameters<typeof paginateInvoices>[0]["customerType"];
    sort?: Parameters<typeof paginateInvoices>[0]["sort"];
  },
) {
  return paginateInvoices(input);
}

function invoiceVehicleLabel(vehicle: InvoiceGenerationSource["vehicle"]) {
  return [vehicle.brand, vehicle.model, vehicle.plate]
    .filter(Boolean)
    .join(" · ");
}

function decimal(value: unknown) {
  return value instanceof Prisma.Decimal
    ? value
    : new Prisma.Decimal(value as string | number);
}

function decimalNumber(value: Prisma.Decimal.Value | null | undefined) {
  return Number(decimal(value ?? 0).toFixed(2));
}

function ratioPercent(numerator: Prisma.Decimal, denominator: Prisma.Decimal) {
  if (denominator.equals(0)) return new Prisma.Decimal(0);
  return numerator.mul(100).div(denominator);
}

function deltaPercent(current: Prisma.Decimal, previous: Prisma.Decimal) {
  if (previous.equals(0)) return current.equals(0) ? new Prisma.Decimal(0) : new Prisma.Decimal(100);
  return current.minus(previous).mul(100).div(previous);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(value: Date, months: number) {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
}

function monthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function monthLabel(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(value).replace(".", "");
}

function resolveFinanceReportingPeriod(input: {
  range?: FinanceReportingRange;
  customFrom?: Date | null;
  customTo?: Date | null;
}) {
  let range = input.range ?? "this_month";
  const today = startOfDay(new Date());
  let from: Date;
  let to: Date;

  if (range === "last_month") {
    from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    to = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (range === "quarter") {
    from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    to = addDays(today, 1);
  } else if (range === "year") {
    from = new Date(today.getFullYear(), 0, 1);
    to = addDays(today, 1);
  } else if (range === "custom" && input.customFrom && input.customTo) {
    from = startOfDay(input.customFrom);
    to = addDays(startOfDay(input.customTo), 1);
  } else {
    range = "this_month";
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = addDays(today, 1);
  }

  if (to <= from) {
    range = "this_month";
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = addDays(today, 1);
  }

  const duration = to.getTime() - from.getTime();
  const previousTo = from;
  const previousFrom = new Date(from.getTime() - duration);

  return { range, from, to, previousFrom, previousTo };
}

function buildMonthlyBuckets(from: Date, to: Date) {
  const buckets: Array<{ key: string; label: string; from: Date; to: Date }> = [];
  let cursor = monthStart(from);
  while (cursor < to) {
    const bucketFrom = cursor < from ? from : cursor;
    const nextMonth = addMonths(cursor, 1);
    const bucketTo = nextMonth > to ? to : nextMonth;
    buckets.push({
      key: cursor.toISOString().slice(0, 7),
      label: monthLabel(cursor),
      from: bucketFrom,
      to: bucketTo,
    });
    cursor = nextMonth;
  }
  return buckets.length > 0 ? buckets : [{ key: from.toISOString().slice(0, 7), label: monthLabel(from), from, to }];
}

function buildLastTwelveMonthStarts(to: Date) {
  const end = monthStart(to);
  return Array.from({ length: 12 }, (_, index) => addMonths(end, index - 11));
}

function buildLastSixMonthStarts(to: Date) {
  const end = monthStart(to);
  return Array.from({ length: 6 }, (_, index) => addMonths(end, index - 5));
}

function daysBetween(from: Date, to: Date) {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

function taxAmountFor(totalPrice: Prisma.Decimal, taxRate: Prisma.Decimal) {
  return totalPrice.mul(taxRate).div(100);
}

function assertTaxRate(value: Prisma.Decimal) {
  if (value.lessThan(0) || value.greaterThan(100)) {
    throw createValidationError("INVOICE_TAX_RATE_INVALID");
  }
}

function assertPastOrPresentDate(value: Date) {
  if (Number.isNaN(value.getTime()) || value.getTime() > Date.now()) {
    throw createValidationError("INVOICE_PAYMENT_DATE_INVALID");
  }
}

function assertDepositDate(value: Date) {
  if (Number.isNaN(value.getTime()) || value.getTime() > Date.now()) {
    throw createValidationError("DEPOSIT_DATE_INVALID");
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function currentDepositRequirement(source: DepositReservationSource) {
  return decimal(
    source.pricingSnapshots[0]?.depositAmount ?? source.depositAmount ?? 0,
  );
}

function depositReleasedAmount(deposit: {
  releasedAmount: Prisma.Decimal | null;
}) {
  return decimal(deposit.releasedAmount ?? 0);
}

function depositHeldAmount(deposit: {
  amount: Prisma.Decimal;
  releasedAmount: Prisma.Decimal | null;
}) {
  return deposit.amount.minus(depositReleasedAmount(deposit));
}

function assertDepositActor(context: FinanceServiceContext) {
  if (!context.userId) throw createValidationError("DEPOSIT_ACTOR_REQUIRED");
  return context.userId;
}

function assertExpenseActor(context: FinanceServiceContext) {
  if (!context.userId) throw createValidationError("EXPENSE_ACTOR_REQUIRED");
  return context.userId;
}

function assertCurrency(value: string) {
  if (!/^[A-Z]{3}$/.test(value)) throw createValidationError("EXPENSE_CURRENCY_INVALID");
}

function assertExpenseDate(value: Date) {
  if (Number.isNaN(value.getTime()) || value.getTime() > Date.now()) {
    throw createValidationError("EXPENSE_DATE_INVALID");
  }
}

async function normalizeExpenseMutation(input: {
  context: FinanceServiceContext;
  data: ExpenseMutationInput;
  db?: DatabaseClient;
}) {
  const db = input.db;
  const amount = decimal(input.data.amount);
  if (amount.lessThanOrEqualTo(0)) throw createValidationError("EXPENSE_AMOUNT_INVALID");
  assertExpenseDate(input.data.occurredAt);
  const currency = (input.data.currency ?? "MAD").trim().toUpperCase();
  assertCurrency(currency);

  const category = await findExpenseCategoryById({
    companyId: input.context.companyId,
    categoryId: input.data.categoryId,
  }, db);
  if (!category) throw createValidationError("EXPENSE_CATEGORY_NOT_FOUND");

  let vehicleId = input.data.vehicleId ?? null;
  if (vehicleId) {
    const vehicle = await findExpenseVehicleById({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      vehicleId,
    }, db);
    if (!vehicle) throw createValidationError("EXPENSE_VEHICLE_NOT_FOUND");
  }

  let reservationId = input.data.reservationId ?? null;
  if (input.data.reservationId) {
    const reservation = await findExpenseReservationById({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      reservationId: input.data.reservationId,
    }, db);
    if (!reservation) throw createValidationError("EXPENSE_RESERVATION_NOT_FOUND");
    if (vehicleId && reservation.vehicleId !== vehicleId) {
      throw createValidationError("EXPENSE_RESERVATION_VEHICLE_MISMATCH");
    }
    vehicleId = vehicleId ?? reservation.vehicleId;
    reservationId = reservation.id;
  }

  return {
    categoryId: input.data.categoryId,
    vehicleId,
    reservationId,
    description: input.data.description.trim(),
    amount,
    currency,
    occurredAt: input.data.occurredAt,
    method: input.data.method ?? null,
    reference: normalizeOptionalText(input.data.reference),
    provider: normalizeOptionalText(input.data.provider),
    internalNote: normalizeOptionalText(input.data.internalNote),
    documentUrl: normalizeOptionalText(input.data.documentUrl),
  } satisfies ExpenseCreateData;
}

async function writeDepositAuditActivity(
  input: FinanceServiceContext & {
    depositId: string;
    action: string;
    verb: string;
    metadata?: Prisma.InputJsonValue;
  },
  db: Parameters<typeof writeAuditLog>[1],
) {
  await writeAuditLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: input.action,
      entityType: "deposit",
      entityId: input.depositId,
      changes: input.metadata,
    },
    db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "deposit",
      entityId: input.depositId,
      verb: input.verb,
      metadata: input.metadata,
    },
    db,
  );
}

async function writeInvoiceAuditActivity(
  input: FinanceServiceContext & {
    invoiceId: string;
    action: string;
    verb: string;
    metadata?: Prisma.InputJsonValue;
  },
  db: Parameters<typeof writeAuditLog>[1],
) {
  await writeAuditLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: input.action,
      entityType: "invoice",
      entityId: input.invoiceId,
      changes: input.metadata,
    },
    db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "invoice",
      entityId: input.invoiceId,
      verb: input.verb,
      metadata: input.metadata,
    },
    db,
  );
}

async function writeExpenseAuditActivity(
  input: FinanceServiceContext & {
    expenseId: string;
    action: string;
    verb: string;
    metadata?: Prisma.InputJsonValue;
  },
  db: Parameters<typeof writeAuditLog>[1],
) {
  await writeAuditLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      action: input.action,
      entityType: "expense",
      entityId: input.expenseId,
      changes: input.metadata,
    },
    db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "expense",
      entityId: input.expenseId,
      verb: input.verb,
      metadata: input.metadata,
    },
    db,
  );
}

function normalizeManualLines(lines: InvoiceDraftLineInput[] | undefined) {
  return (lines ?? [])
    .filter((line) => line.source !== "system")
    .map((line) => ({
      description: line.description.trim(),
      quantity: decimal(line.quantity),
      unitPrice: decimal(line.unitPrice),
    }))
    .filter((line) => line.description && line.quantity.greaterThan(0));
}

function lineInputToCreateInput(input: {
  description: string;
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  sortOrder: number;
}): InvoiceLineItemCreateData {
  const totalPrice = input.quantity.mul(input.unitPrice);
  return {
    description: input.description,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    totalPrice,
    taxRate: input.taxRate,
    taxAmount: taxAmountFor(totalPrice, input.taxRate),
    sortOrder: input.sortOrder,
  };
}

function totalsForLineItems(lineItems: InvoiceLineItemCreateData[]) {
  const subtotalBeforeDiscount = lineItems.reduce((sum, item) => {
    const totalPrice = decimal(item.totalPrice);
    return totalPrice.lessThan(0) ? sum : sum.plus(totalPrice);
  }, decimal(0));
  const discountAmount = lineItems.reduce((sum, item) => {
    const totalPrice = decimal(item.totalPrice);
    return totalPrice.lessThan(0) ? sum.plus(totalPrice.abs()) : sum;
  }, decimal(0));
  const taxAmount = lineItems.reduce(
    (sum, item) => sum.plus(decimal(item.taxAmount ?? 0)),
    decimal(0),
  );
  const totalAmount = subtotalBeforeDiscount
    .minus(discountAmount)
    .plus(taxAmount);
  return { subtotalBeforeDiscount, discountAmount, taxAmount, totalAmount };
}

function nextDueDate(issueAt: Date) {
  return new Date(issueAt.getTime() + 14 * 86_400_000);
}

async function resolveAgencyTaxRate(
  context: FinanceServiceContext,
  db: Parameters<typeof findSettingResolutionRows>[1],
) {
  const rows = await findSettingResolutionRows(
    {
      companyId: context.companyId,
      agencyId: context.agencyId,
      key: "tax_rate",
    },
    db,
  );
  return rows[0]?.value != null ? decimal(rows[0].value) : null;
}

async function generateInvoiceCode(
  context: FinanceServiceContext,
  db: Parameters<typeof incrementNumberSequence>[1],
) {
  const year = String(new Date().getFullYear());
  return incrementNumberSequence(
    {
      id: createId(),
      companyId: context.companyId,
      agencyId: context.agencyId,
      sequenceKey: "invoice",
      periodKey: year,
      prefix: `FAC-${year}-`,
    },
    db,
  );
}

async function generateCreditNoteCode(
  context: FinanceServiceContext,
  db: Parameters<typeof incrementNumberSequence>[1],
) {
  const year = String(new Date().getFullYear());
  return incrementNumberSequence(
    {
      id: createId(),
      companyId: context.companyId,
      agencyId: context.agencyId,
      sequenceKey: "credit_note",
      periodKey: year,
      prefix: `AV-${year}-`,
    },
    db,
  );
}

async function buildInvoiceDraft(input: {
  context: FinanceServiceContext;
  type: InvoiceType;
  reservationId?: string | null;
  customerId?: string | null;
  taxRate?: Prisma.Decimal.Value | null;
  manualLines?: InvoiceDraftLineInput[];
  db: Parameters<typeof findInvoiceGenerationSource>[1];
}) {
  const manualLines = normalizeManualLines(input.manualLines);
  let reservationId: string | null = null;
  let customerId = input.customerId ?? null;
  let customerBusinessId: string | null = null;
  let currency = "MAD";
  let lineItems: InvoiceLineItemCreateData[] = [];

  if (input.type === InvoiceType.rental) {
    if (!input.reservationId)
      throw createValidationError("INVOICE_RESERVATION_REQUIRED");
    const scope = { ...input.context, reservationId: input.reservationId };
    const source = await findInvoiceGenerationSource(scope, input.db);
    if (!source) throw createNotFoundError("Reservation", input);
    const snapshot = source.pricingSnapshots[0];
    if (!snapshot)
      throw createValidationError("INVOICE_PRICING_SNAPSHOT_MISSING");
    const taxRate =
      snapshot.taxRate ?? (await resolveAgencyTaxRate(input.context, input.db));
    if (!taxRate) throw createValidationError("INVOICE_TAX_RATE_REQUIRED");
    assertTaxRate(taxRate);

    reservationId = source.id;
    customerId = source.customerId;
    customerBusinessId = source.customer.business?.id ?? null;
    currency = snapshot.currency;
    lineItems = [
      lineInputToCreateInput({
        description: `Location ${invoiceVehicleLabel(source.vehicle)} - ${snapshot.days} jour${snapshot.days > 1 ? "s" : ""}`,
        quantity: decimal(snapshot.days),
        unitPrice: snapshot.pricePerDay,
        taxRate,
        sortOrder: 0,
      }),
      ...source.extras.map((extra, index) =>
        lineInputToCreateInput({
          description: extra.label,
          quantity: decimal(extra.quantity),
          unitPrice: extra.unitPrice,
          taxRate,
          sortOrder: index + 1,
        }),
      ),
    ];
    if (snapshot.discountAmount.greaterThan(0)) {
      lineItems.push(
        lineInputToCreateInput({
          description: snapshot.discountReason
            ? `Remise - ${snapshot.discountReason}`
            : "Remise",
          quantity: decimal(1),
          unitPrice: snapshot.discountAmount.negated(),
          taxRate,
          sortOrder: lineItems.length,
        }),
      );
    }
    lineItems.push(
      ...manualLines.map((line, index) =>
        lineInputToCreateInput({
          ...line,
          taxRate,
          sortOrder: lineItems.length + index,
        }),
      ),
    );
  } else {
    if (input.reservationId)
      throw createValidationError("INVOICE_MANUAL_RESERVATION_NOT_ALLOWED");
    if (!customerId) throw createValidationError("INVOICE_CUSTOMER_REQUIRED");
    const customer = await findInvoiceCustomer(
      { ...input.context, customerId },
      input.db,
    );
    if (!customer) throw createValidationError("INVOICE_CUSTOMER_REQUIRED");
    if (manualLines.length === 0)
      throw createValidationError("INVOICE_LINE_REQUIRED");
    const taxRate =
      input.taxRate != null
        ? decimal(input.taxRate)
        : await resolveAgencyTaxRate(input.context, input.db);
    if (!taxRate) throw createValidationError("INVOICE_TAX_RATE_REQUIRED");
    assertTaxRate(taxRate);
    customerBusinessId = customer.business?.id ?? null;
    lineItems = manualLines.map((line, index) =>
      lineInputToCreateInput({ ...line, taxRate, sortOrder: index }),
    );
  }

  if (lineItems.length === 0)
    throw createValidationError("INVOICE_LINE_REQUIRED");
  return {
    reservationId,
    customerId: customerId!,
    customerBusinessId,
    currency,
    lineItems,
    totals: totalsForLineItems(lineItems),
  };
}

export async function listInvoiceableReservationsService(input: {
  companyId: string;
  agencyId: string;
  search?: string;
  take?: number;
}) {
  return listInvoiceableReservations(input);
}

export async function listInvoiceCustomersService(input: {
  companyId: string;
  agencyId: string;
  search?: string;
  take?: number;
}) {
  return listInvoiceCustomers(input);
}

export async function generateInvoiceFromReservationService(
  input: {
    context: FinanceServiceContext;
  } & InvoiceMutationInput,
) {
  const type =
    input.type ??
    (input.reservationId ? InvoiceType.rental : InvoiceType.manual);
  if (type === InvoiceType.rental && !input.reservationId)
    throw createValidationError("INVOICE_RESERVATION_REQUIRED");
  if (type === InvoiceType.manual && input.reservationId)
    throw createValidationError("INVOICE_MANUAL_RESERVATION_NOT_ALLOWED");

  let createdInvoiceId = "";
  const invoice = await runInTransaction(async (tx) => {
    const invoiceId = createId();
    createdInvoiceId = invoiceId;
    const sequence = await generateInvoiceCode(input.context, tx);
    const issueAt = input.issueAt ?? new Date();
    const dueAt = input.dueAt ?? nextDueDate(issueAt);

    if (type === InvoiceType.rental) {
      const scope = { ...input.context, reservationId: input.reservationId! };
      await lockReservationForInvoice(scope, tx);
      await lockInvoiceByReservation(scope, tx);
      const source = await findInvoiceGenerationSource(scope, tx);
      if (!source) throw createNotFoundError("Reservation", input);
      if (source.invoices[0])
        throw createValidationError("INVOICE_ALREADY_EXISTS_FOR_RESERVATION");
    }

    const draft = await buildInvoiceDraft({ ...input, type, db: tx });
    const created = await createInvoice(
      {
        id: invoiceId,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        type,
        code: sequence.formatted,
        reservationId: draft.reservationId,
        customerId: draft.customerId,
        customerBusinessId: draft.customerBusinessId,
        status: InvoiceStatus.draft,
        subtotal: draft.totals.subtotalBeforeDiscount,
        taxAmount: draft.totals.taxAmount,
        discountAmount: draft.totals.discountAmount,
        totalAmount: draft.totals.totalAmount,
        currency: draft.currency,
        issuedAt: issueAt,
        dueAt,
        notes: input.notes ?? null,
      },
      tx,
    );
    await createManyInvoiceLineItems(
      draft.lineItems.map((lineItem) => ({
        ...lineItem,
        id: createId(),
        companyId: input.context.companyId,
        invoiceId,
      })),
      tx,
    );
    if (created.reservationId) {
      await createReservationTimelineEvent(
        {
          id: createId(),
          companyId: created.companyId,
          reservationId: created.reservationId,
          eventType: "invoice_generated",
          description: created.code,
          performedBy: input.context.userId ?? null,
        },
        tx,
      );
    }
    return created;
  });

  await publishDomainEvent({
    name: "InvoiceGenerated",
    companyId: invoice.companyId,
    agencyId: invoice.agencyId,
    entityType: "invoice",
    entityId: createdInvoiceId || invoice.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });

  return getInvoiceService({ ...input.context, invoiceId: invoice.id });
}

export async function updateInvoiceService(
  input: {
    context: FinanceServiceContext;
    invoiceId: string;
  } & InvoiceMutationInput,
) {
  const invoice = await runInTransaction(async (tx) => {
    const current = await findInvoiceById(
      { ...input.context, invoiceId: input.invoiceId },
      tx,
    );
    if (!current) throw createNotFoundError("Invoice", input);
    if (current.status !== InvoiceStatus.draft)
      throw createValidationError("FINANCE_INVOICE_IMMUTABLE");

    const type = current.type;
    if (input.type && input.type !== type)
      throw createValidationError("INVOICE_TYPE_IMMUTABLE");

    const draft = await buildInvoiceDraft({
      context: input.context,
      type,
      reservationId: type === InvoiceType.rental ? current.reservationId : null,
      customerId:
        type === InvoiceType.rental ? current.customerId : input.customerId,
      taxRate: input.taxRate,
      manualLines: input.manualLines,
      db: tx,
    });

    await updateInvoice(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        invoiceId: input.invoiceId,
        data: {
          customerId: draft.customerId,
          customerBusinessId: draft.customerBusinessId,
          subtotal: draft.totals.subtotalBeforeDiscount,
          taxAmount: draft.totals.taxAmount,
          discountAmount: draft.totals.discountAmount,
          totalAmount: draft.totals.totalAmount,
          currency: draft.currency,
          issuedAt: input.issueAt ?? current.issuedAt,
          dueAt: input.dueAt ?? current.dueAt,
          notes: input.notes ?? null,
        },
      },
      tx,
    );
    await deleteInvoiceLineItems(
      { companyId: input.context.companyId, invoiceId: input.invoiceId },
      tx,
    );
    await createManyInvoiceLineItems(
      draft.lineItems.map((lineItem) => ({
        ...lineItem,
        id: createId(),
        companyId: input.context.companyId,
        invoiceId: input.invoiceId,
      })),
      tx,
    );

    const updated = await findInvoiceById(
      { ...input.context, invoiceId: input.invoiceId },
      tx,
    );
    if (!updated) throw createNotFoundError("Invoice", input);
    return updated;
  });
  return invoice;
}

export async function deleteInvoiceService(
  input: FinanceServiceContext & { invoiceId: string },
) {
  await runInTransaction(async (tx) => {
    const current = await findInvoiceByIdForUpdate(input, tx);
    if (!current) throw createNotFoundError("Invoice", input);
    if (current.status !== InvoiceStatus.draft) {
      throw createValidationError("INVOICE_DELETE_REQUIRES_DRAFT");
    }

    const result = await softDeleteInvoice(
      {
        companyId: input.companyId,
        agencyId: input.agencyId,
        invoiceId: input.invoiceId,
        deletedBy: input.userId ?? null,
      },
      tx,
    );
    if (result.count !== 1) throw createNotFoundError("Invoice", input);

    await writeInvoiceAuditActivity(
      {
        ...input,
        action: "InvoiceDraftDeleted",
        verb: "InvoiceDraftDeleted",
        metadata: { status: current.status, code: current.code },
      },
      tx,
    );
  });
  return { invoiceId: input.invoiceId };
}

export async function createInvoiceService(input: {
  context: FinanceServiceContext;
  invoice: InvoiceCreateData;
  lineItems: InvoiceLineItemCreateData[];
}) {
  const invoice = await runInTransaction(async (tx) => {
    const invoiceId = createId();
    const created = await createInvoice(
      {
        ...input.invoice,
        id: invoiceId,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      },
      tx,
    );
    if (input.lineItems.length > 0) {
      await createManyInvoiceLineItems(
        input.lineItems.map((lineItem, index) => ({
          ...lineItem,
          id: createId(),
          companyId: input.context.companyId,
          invoiceId,
          sortOrder: lineItem.sortOrder ?? index,
        })),
        tx,
      );
    }
    if (created.reservationId) {
      await createReservationTimelineEvent(
        {
          id: createId(),
          companyId: created.companyId,
          reservationId: created.reservationId,
          eventType: "invoice_issued",
          performedBy: input.context.userId ?? null,
        },
        tx,
      );
    }
    return created;
  });
  await publishDomainEvent({
    name: "InvoiceGenerated",
    companyId: invoice.companyId,
    agencyId: invoice.agencyId,
    entityType: "invoice",
    entityId: invoice.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return invoice;
}

export async function issueInvoiceService(
  input: FinanceServiceContext & { invoiceId: string },
) {
  const invoice = await runInTransaction(async (tx) => {
    const current = await findInvoiceByIdForUpdate(input, tx);
    if (!current) throw createNotFoundError("Invoice", input);
    if (current.status !== InvoiceStatus.draft) {
      throw createValidationError("INVOICE_ISSUE_REQUIRES_DRAFT");
    }

    await updateInvoice(
      {
        ...input,
        data: {
          status: InvoiceStatus.issued,
          issuedAt: current.issuedAt ?? new Date(),
        },
      },
      tx,
    );
    if (current.reservationId) {
      await createReservationTimelineEvent(
        {
          id: createId(),
          companyId: current.companyId,
          reservationId: current.reservationId,
          eventType: "invoice_issued",
          description: current.code,
          performedBy: input.userId ?? null,
        },
        tx,
      );
    }
    await writeInvoiceAuditActivity(
      {
        ...input,
        action: "InvoiceIssued",
        verb: "InvoiceIssued",
        metadata: { from: current.status, to: InvoiceStatus.issued },
      },
      tx,
    );
    const issued = await findInvoiceById(input, tx);
    if (!issued) throw createNotFoundError("Invoice", input);
    return issued;
  });
  await publishDomainEvent({
    name: "InvoiceIssued",
    companyId: invoice.companyId,
    agencyId: invoice.agencyId,
    entityType: "invoice",
    entityId: input.invoiceId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return invoice;
}

export async function voidInvoiceService(
  input: FinanceServiceContext & { invoiceId: string },
) {
  const actorUserId = input.userId;
  if (!actorUserId) throw createValidationError("INVOICE_VOID_ACTOR_REQUIRED");

  const invoice = await runInTransaction(async (tx) => {
    const current = await findInvoiceByIdForUpdate(input, tx);
    if (!current) throw createNotFoundError("Invoice", input);
    if (
      current.status !== InvoiceStatus.issued &&
      current.status !== InvoiceStatus.overdue
    ) {
      if (current.status === InvoiceStatus.voided)
        throw createValidationError("INVOICE_ALREADY_VOIDED");
      throw createValidationError("INVOICE_VOID_NOT_ALLOWED");
    }
    const existingCorrection = await findCreditNoteByOriginalInvoice(
      {
        companyId: current.companyId,
        agencyId: current.agencyId,
        invoiceId: current.id,
      },
      tx,
    );
    if (existingCorrection)
      throw createValidationError("INVOICE_CREDIT_NOTE_ALREADY_EXISTS");

    const sequence = await generateCreditNoteCode(input, tx);
    await createCreditNote(
      {
        id: createId(),
        companyId: input.companyId,
        agencyId: input.agencyId,
        code: sequence.formatted,
        originalInvoiceId: input.invoiceId,
        amount: current.totalAmount,
        currency: current.currency,
        reason: "INVOICE_VOIDED",
        issuedBy: actorUserId,
        issuedAt: new Date(),
      },
      tx,
    );
    await updateInvoice(
      {
        companyId: input.companyId,
        agencyId: input.agencyId,
        invoiceId: input.invoiceId,
        data: { status: InvoiceStatus.voided },
      },
      tx,
    );
    if (current.reservationId) {
      await createReservationTimelineEvent(
        {
          id: createId(),
          companyId: current.companyId,
          reservationId: current.reservationId,
          eventType: "invoice_cancelled",
          description: current.code,
          performedBy: input.userId ?? null,
        },
        tx,
      );
    }
    await writeInvoiceAuditActivity(
      {
        ...input,
        action: "InvoiceVoided",
        verb: "InvoiceVoided",
        metadata: {
          from: current.status,
          to: InvoiceStatus.voided,
          creditNoteCode: sequence.formatted,
        },
      },
      tx,
    );
    const voided = await findInvoiceById(input, tx);
    if (!voided) throw createNotFoundError("Invoice", input);
    return voided;
  });
  await publishDomainEvent({
    name: "CreditNoteIssued",
    companyId: invoice.companyId,
    agencyId: invoice.agencyId,
    entityType: "invoice",
    entityId: invoice.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return invoice;
}

export async function recordInvoicePaymentService(input: {
  context: FinanceServiceContext;
  payment: InvoicePaymentInput;
}) {
  const actorUserId = input.context.userId;
  if (!actorUserId)
    throw createValidationError("INVOICE_PAYMENT_ACTOR_REQUIRED");
  const amount = decimal(input.payment.amount);
  if (!amount.greaterThan(0))
    throw createValidationError("INVOICE_PAYMENT_INVALID_AMOUNT");
  assertPastOrPresentDate(input.payment.paidAt);

  const result = await runInTransaction(async (tx) => {
    const current = await findInvoiceByIdForUpdate(
      { ...input.context, invoiceId: input.payment.invoiceId },
      tx,
    );
    if (!current) throw createNotFoundError("Invoice", input.payment);
    if (
      current.status !== InvoiceStatus.issued &&
      current.status !== InvoiceStatus.partially_paid &&
      current.status !== InvoiceStatus.overdue
    ) {
      if (current.status === InvoiceStatus.draft)
        throw createValidationError("INVOICE_PAYMENT_REQUIRES_ISSUED");
      if (current.status === InvoiceStatus.paid)
        throw createValidationError("INVOICE_ALREADY_PAID");
      throw createValidationError("INVOICE_PAYMENT_NOT_ALLOWED");
    }

    const summary = await getInvoicePaymentSummary(
      {
        companyId: current.companyId,
        agencyId: current.agencyId,
        invoiceId: current.id,
      },
      tx,
    );
    const paidBefore = decimal(summary.paidAmount ?? 0);
    const credited = decimal(summary.creditedAmount ?? 0);
    const outstanding = current.totalAmount.minus(paidBefore).minus(credited);
    if (amount.greaterThan(outstanding)) {
      throw createValidationError("INVOICE_PAYMENT_OVERPAYMENT");
    }

    const created = await createPayment(
      {
        id: createId(),
        companyId: current.companyId,
        agencyId: current.agencyId,
        invoiceId: current.id,
        reservationId: current.reservationId ?? null,
        customerId: current.customerId,
        method: input.payment.method,
        amount,
        currency: current.currency,
        paidAt: input.payment.paidAt,
        reference: normalizeOptionalText(input.payment.reference),
        notes: normalizeOptionalText(input.payment.notes),
        recordedBy: actorUserId,
      },
      tx,
    );

    const paidAfter = paidBefore.plus(amount);
    const payableTotal = current.totalAmount.minus(credited);
    const nextStatus = paidAfter.greaterThanOrEqualTo(payableTotal)
      ? InvoiceStatus.paid
      : InvoiceStatus.partially_paid;
    await updateInvoice(
      {
        companyId: current.companyId,
        agencyId: current.agencyId,
        invoiceId: current.id,
        data: {
          status: nextStatus,
          paidAt:
            nextStatus === InvoiceStatus.paid ? input.payment.paidAt : null,
        },
      },
      tx,
    );

    if (current.reservationId) {
      await createReservationTimelineEvent(
        {
          id: createId(),
          companyId: current.companyId,
          reservationId: current.reservationId,
          eventType: "payment_recorded",
          description: current.code,
          performedBy: actorUserId,
        },
        tx,
      );
    }
    await writeInvoiceAuditActivity(
      {
        ...input.context,
        invoiceId: current.id,
        action: "InvoicePaymentRecorded",
        verb: "InvoicePaymentRecorded",
        metadata: {
          paymentId: created.id,
          amount: amount.toString(),
          status: nextStatus,
        },
      },
      tx,
    );

    const updated = await findInvoiceById(
      { ...input.context, invoiceId: current.id },
      tx,
    );
    if (!updated) throw createNotFoundError("Invoice", input.payment);
    return {
      invoice: updated,
      payment: created,
      paid: nextStatus === InvoiceStatus.paid,
    };
  });

  await publishDomainEvent({
    name: "PaymentRecorded",
    companyId: result.payment.companyId,
    agencyId: result.payment.agencyId,
    entityType: "payment",
    entityId: result.payment.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  if (result.paid) {
    await publishDomainEvent({
      name: "InvoicePaid",
      companyId: result.invoice.companyId,
      agencyId: result.invoice.agencyId,
      entityType: "invoice",
      entityId: result.invoice.id,
      userId: input.context.userId,
      actorName: input.context.actorName,
      occurredAt: new Date(),
    });
  }
  return result.invoice;
}

export async function recordPaymentService(input: {
  context: FinanceServiceContext;
  payment: PaymentCreateData;
}) {
  if (!input.context.userId)
    throw createValidationError("INVOICE_PAYMENT_ACTOR_REQUIRED");
  const payment = await runInTransaction(async (tx) =>
    createPayment(
      {
        ...input.payment,
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        recordedBy: input.context.userId!,
      },
      tx,
    ),
  );
  await publishDomainEvent({
    name: "PaymentRecorded",
    companyId: payment.companyId,
    agencyId: payment.agencyId,
    entityType: "payment",
    entityId: payment.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return payment;
}

export async function listPaymentsService(
  input: FinanceListInput & {
    invoiceId?: string;
    reservationId?: string;
    customerId?: string;
  },
) {
  return listPayments(input);
}

export async function collectDepositService(input: {
  context: FinanceServiceContext;
  deposit: DepositCollectionInput;
}) {
  const actorUserId = assertDepositActor(input.context);
  const amount = decimal(input.deposit.amount);
  if (!amount.greaterThan(0))
    throw createValidationError("DEPOSIT_AMOUNT_INVALID");
  const collectedAt = input.deposit.collectedAt ?? new Date();
  assertDepositDate(collectedAt);

  const deposit = await runInTransaction(async (tx) => {
    const scope = {
      ...input.context,
      reservationId: input.deposit.reservationId,
    };
    await lockReservationForInvoice(scope, tx);
    await lockDepositsByReservation(scope, tx);
    const source = await findDepositReservationSource(scope, tx);
    if (!source) throw createNotFoundError("Reservation", input.deposit);
    const agreedDeposit = currentDepositRequirement(source);
    if (!agreedDeposit.greaterThan(0))
      throw createValidationError("DEPOSIT_NOT_REQUIRED");
    if (amount.greaterThan(agreedDeposit))
      throw createValidationError("DEPOSIT_EXCEEDS_REQUIRED");
    if (input.deposit.reservationId !== source.id)
      throw createNotFoundError("Reservation", input.deposit);
    if (source.deposits.length > 0)
      throw createValidationError("DEPOSIT_ALREADY_COLLECTED");

    const created = await createDeposit(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        reservationId: source.id,
        customerId: source.customerId,
        amount,
        currency: source.currency,
        method: input.deposit.method,
        collectedAt,
        collectedBy: actorUserId,
        status: DepositStatus.held,
        notes: normalizeOptionalText(input.deposit.notes),
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: created.companyId,
        reservationId: created.reservationId,
        eventType: "deposit_collected",
        description: `${created.amount.toString()} ${created.currency}`,
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
    await writeDepositAuditActivity(
      {
        ...input.context,
        depositId: created.id,
        action: "DepositCollected",
        verb: "DepositCollected",
        metadata: {
          reservationId: created.reservationId,
          amount: created.amount.toString(),
          currency: created.currency,
          agreedDeposit: agreedDeposit.toString(),
        },
      },
      tx,
    );
    return created;
  });
  await publishDomainEvent({
    name: "DepositCollected",
    companyId: deposit.companyId,
    agencyId: deposit.agencyId,
    entityType: "deposit",
    entityId: deposit.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return deposit;
}

export async function releaseDepositService(
  input: FinanceServiceContext & DepositReleaseInput,
) {
  const actorUserId = assertDepositActor(input);
  const deposit = await runInTransaction(async (tx) => {
    const current = await findDepositByIdForUpdate(input, tx);
    if (!current) throw createNotFoundError("Deposit", input);
    if (current.status === DepositStatus.released)
      throw createValidationError("DEPOSIT_ALREADY_RELEASED");
    if (current.status === DepositStatus.forfeited)
      throw createValidationError("DEPOSIT_ALREADY_FORFEITED");
    if (
      current.status !== DepositStatus.held &&
      current.status !== DepositStatus.partially_released
    ) {
      throw createValidationError("DEPOSIT_RELEASE_NOT_ALLOWED");
    }

    const heldBefore = depositHeldAmount(current);
    if (!heldBefore.greaterThan(0))
      throw createValidationError("DEPOSIT_NOTHING_HELD");
    const releaseAmount =
      input.amount == null ? heldBefore : decimal(input.amount);
    if (!releaseAmount.greaterThan(0))
      throw createValidationError("DEPOSIT_RELEASE_AMOUNT_INVALID");
    if (releaseAmount.greaterThan(heldBefore))
      throw createValidationError("DEPOSIT_RELEASE_EXCEEDS_HELD");
    const releasedTotal = depositReleasedAmount(current).plus(releaseAmount);
    const nextStatus = releasedTotal.greaterThanOrEqualTo(current.amount)
      ? DepositStatus.released
      : DepositStatus.partially_released;
    const now = new Date();

    await updateDeposit(
      {
        companyId: input.companyId,
        agencyId: input.agencyId,
        depositId: input.depositId,
        data: {
          status: nextStatus,
          releasedAt: now,
          releasedBy: actorUserId,
          releasedAmount: releasedTotal,
          notes: normalizeOptionalText(input.notes) ?? current.notes,
        },
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: current.companyId,
        reservationId: current.reservationId,
        eventType:
          nextStatus === DepositStatus.released
            ? "deposit_released"
            : "deposit_partially_released",
        description: `${releaseAmount.toString()} ${current.currency}`,
        performedBy: actorUserId,
      },
      tx,
    );
    await writeDepositAuditActivity(
      {
        ...input,
        depositId: current.id,
        action: "DepositReleased",
        verb: "DepositReleased",
        metadata: {
          amount: releaseAmount.toString(),
          releasedTotal: releasedTotal.toString(),
          status: nextStatus,
        },
      },
      tx,
    );
    const updated = await findDepositByIdForUpdate(input, tx);
    if (!updated) throw createNotFoundError("Deposit", input);
    return updated;
  });
  await publishDomainEvent({
    name: "DepositReleased",
    companyId: deposit.companyId,
    agencyId: deposit.agencyId,
    entityType: "deposit",
    entityId: deposit.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return deposit;
}

export async function forfeitDepositService(
  input: FinanceServiceContext & DepositForfeitInput,
) {
  const actorUserId = assertDepositActor(input);
  const reason = input.reason.trim();
  if (!reason) throw createValidationError("DEPOSIT_FORFEIT_REASON_REQUIRED");
  const deposit = await runInTransaction(async (tx) => {
    const current = await findDepositByIdForUpdate(input, tx);
    if (!current) throw createNotFoundError("Deposit", input);
    if (current.status === DepositStatus.released)
      throw createValidationError("DEPOSIT_ALREADY_RELEASED");
    if (current.status === DepositStatus.forfeited)
      throw createValidationError("DEPOSIT_ALREADY_FORFEITED");
    if (
      current.status !== DepositStatus.held &&
      current.status !== DepositStatus.partially_released
    ) {
      throw createValidationError("DEPOSIT_FORFEIT_NOT_ALLOWED");
    }
    const held = depositHeldAmount(current);
    if (!held.greaterThan(0))
      throw createValidationError("DEPOSIT_NOTHING_HELD");

    await updateDeposit(
      {
        companyId: input.companyId,
        agencyId: input.agencyId,
        depositId: input.depositId,
        data: {
          status: DepositStatus.forfeited,
          forfeitureReason: reason,
          releasedAt: new Date(),
          releasedBy: actorUserId,
        },
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: current.companyId,
        reservationId: current.reservationId,
        eventType: "deposit_forfeited",
        description: `${held.toString()} ${current.currency} - ${reason}`,
        performedBy: actorUserId,
      },
      tx,
    );
    await writeDepositAuditActivity(
      {
        ...input,
        depositId: current.id,
        action: "DepositForfeited",
        verb: "DepositForfeited",
        metadata: { amount: held.toString(), reason },
      },
      tx,
    );
    const updated = await findDepositByIdForUpdate(input, tx);
    if (!updated) throw createNotFoundError("Deposit", input);
    return updated;
  });
  await publishDomainEvent({
    name: "DepositForfeited",
    companyId: deposit.companyId,
    agencyId: deposit.agencyId,
    entityType: "deposit",
    entityId: deposit.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return deposit;
}

export async function listDepositsService(
  input: FinanceListInput & {
    reservationId?: string;
    customerId?: string;
    status?: Parameters<typeof listDeposits>[0]["status"];
  },
) {
  return listDeposits(input);
}

export async function issueCreditNoteService(input: {
  context: FinanceServiceContext;
  data: CreditNoteIssueInput;
}) {
  const actorUserId = input.context.userId;
  if (!actorUserId) throw createValidationError("CREDIT_NOTE_ACTOR_REQUIRED");
  const amount = decimal(input.data.amount);
  if (!amount.greaterThan(0))
    throw createValidationError("CREDIT_NOTE_AMOUNT_INVALID");
  const issuedAt = input.data.issuedAt ?? new Date();
  if (Number.isNaN(issuedAt.getTime()) || issuedAt.getTime() > Date.now()) {
    throw createValidationError("CREDIT_NOTE_DATE_INVALID");
  }

  const note = await runInTransaction(async (tx) => {
    const invoice = await findInvoiceByIdForUpdate(
      { ...input.context, invoiceId: input.data.originalInvoiceId },
      tx,
    );
    if (!invoice) throw createNotFoundError("Invoice", input.data);
    if (
      invoice.status !== InvoiceStatus.issued &&
      invoice.status !== InvoiceStatus.partially_paid &&
      invoice.status !== InvoiceStatus.paid &&
      invoice.status !== InvoiceStatus.overdue
    ) {
      throw createValidationError("CREDIT_NOTE_INVOICE_STATUS_INVALID");
    }
    if (input.data.replacementInvoiceId) {
      const replacement = await findInvoiceById(
        { ...input.context, invoiceId: input.data.replacementInvoiceId },
        tx,
      );
      if (!replacement)
        throw createNotFoundError("Invoice", {
          invoiceId: input.data.replacementInvoiceId,
        });
    }
    const summary = await getInvoicePaymentSummary(
      {
        companyId: invoice.companyId,
        agencyId: invoice.agencyId,
        invoiceId: invoice.id,
      },
      tx,
    );
    const credited = decimal(summary.creditedAmount ?? 0);
    const eligible = invoice.totalAmount.minus(credited);
    if (!eligible.greaterThan(0))
      throw createValidationError("CREDIT_NOTE_NOTHING_ELIGIBLE");
    if (amount.greaterThan(eligible))
      throw createValidationError("CREDIT_NOTE_EXCEEDS_ELIGIBLE");
    const sequence = await generateCreditNoteCode(input.context, tx);
    const created = await createCreditNote(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        code: sequence.formatted,
        originalInvoiceId: invoice.id,
        replacementInvoiceId: input.data.replacementInvoiceId ?? null,
        amount,
        currency: invoice.currency,
        reason: normalizeOptionalText(input.data.reason),
        issuedBy: actorUserId,
        issuedAt,
      },
      tx,
    );
    await writeInvoiceAuditActivity(
      {
        ...input.context,
        invoiceId: invoice.id,
        action: "CreditNoteIssued",
        verb: "CreditNoteIssued",
        metadata: {
          creditNoteId: created.id,
          amount: amount.toString(),
          currency: invoice.currency,
        },
      },
      tx,
    );
    return created;
  });
  await publishDomainEvent({
    name: "CreditNoteIssued",
    companyId: note.companyId,
    agencyId: note.agencyId,
    entityType: "credit_note",
    entityId: note.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return note;
}

export async function listCreditNotesForInvoiceService(input: {
  companyId: string;
  agencyId: string;
  invoiceId: string;
}) {
  return listCreditNotesForInvoice(input);
}

export async function listExpenseCategoriesService(companyId: string) {
  return listExpenseCategories(companyId);
}

export async function listExpenseVehicleOptionsService(input: {
  companyId: string;
  agencyId: string;
  search?: string;
  take?: number;
}) {
  return listExpenseVehicleOptions(input);
}

export async function listExpenseReservationOptionsService(input: {
  companyId: string;
  agencyId: string;
  search?: string;
  take?: number;
}) {
  return listExpenseReservationOptions(input);
}

export async function getExpenseDefaultsService(input: {
  companyId: string;
  agencyId: string;
}) {
  const defaults = await getExpenseAgencyDefaults(input);
  return {
    currency: defaults?.currency ?? defaults?.company.currency ?? "MAD",
  };
}

export async function createExpenseCategoryService(input: {
  companyId: string;
  data: ExpenseCategoryCreateData;
}) {
  return createExpenseCategory({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
  });
}

export async function listExpensesService(
  input: FinanceListInput & {
    categoryId?: string;
    vehicleId?: string;
    reservationId?: string;
    includeDeleted?: boolean;
    sort?: Parameters<typeof paginateExpenses>[0]["sort"];
  },
) {
  return paginateExpenses(input);
}

export async function getExpenseService(input: {
  companyId: string;
  agencyId: string;
  expenseId: string;
}) {
  const expense = await findExpenseById(input);
  if (!expense) throw createNotFoundError("Expense", input);
  return expense;
}

export async function summarizeExpensesService(
  input: FinanceListInput & { categoryId?: string; vehicleId?: string; reservationId?: string },
) {
  return summarizeExpensesByCurrency(input);
}

export async function createExpenseService(input: {
  context: FinanceServiceContext;
  data: ExpenseMutationInput;
}) {
  const data = await normalizeExpenseMutation(input);
  const actorId = assertExpenseActor(input.context);
  const expense = await createExpense({
    ...data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    recordedBy: actorId,
  });
  await publishDomainEvent({
    name: "ExpenseRecorded",
    companyId: expense.companyId,
    agencyId: expense.agencyId,
    entityType: "expense",
    entityId: expense.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return expense;
}

export async function updateExpenseService(input: {
  context: FinanceServiceContext;
  expenseId: string;
  data: ExpenseMutationInput;
}) {
  assertExpenseActor(input.context);
  const expense = await runInTransaction(async (tx) => {
    const current = await findExpenseById(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      },
      tx,
    );
    if (!current) {
      throw createNotFoundError("Expense", {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      });
    }
    const data = await normalizeExpenseMutation({
      context: input.context,
      data: input.data,
      db: tx,
    });
    const result = await updateExpense(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
        data,
      },
      tx,
    );
    if (result.count === 0)
      throw createNotFoundError("Expense", {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      });
    await writeExpenseAuditActivity(
      {
        ...input.context,
        expenseId: input.expenseId,
        action: "ExpenseUpdated",
        verb: "ExpenseUpdated",
        metadata: {
          categoryId: { from: current.categoryId, to: data.categoryId },
          vehicleId: { from: current.vehicleId, to: data.vehicleId },
          reservationId: { from: current.reservationId, to: data.reservationId },
          amount: { from: current.amount.toString(), to: data.amount.toString() },
          currency: { from: current.currency, to: data.currency },
          occurredAt: {
            from: current.occurredAt.toISOString().slice(0, 10),
            to: data.occurredAt.toISOString().slice(0, 10),
          },
          documentUrl: { from: current.documentUrl, to: data.documentUrl },
        },
      },
      tx,
    );
    const updated = await findExpenseById(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      },
      tx,
    );
    if (!updated) throw createNotFoundError("Expense", input);
    return updated;
  });

  await publishDomainEvent({
    name: "ExpenseUpdated",
    companyId: expense.companyId,
    agencyId: expense.agencyId,
    entityType: "expense",
    entityId: expense.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return expense;
}

export async function deleteExpenseService(input: {
  context: FinanceServiceContext;
  expenseId: string;
}) {
  const actorId = assertExpenseActor(input.context);
  await runInTransaction(async (tx) => {
    const current = await findExpenseById(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      },
      tx,
    );
    if (!current) {
      throw createNotFoundError("Expense", {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      });
    }
    const result = await softDeleteExpense(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
        deletedBy: actorId,
      },
      tx,
    );
    if (result.count === 0)
      throw createNotFoundError("Expense", {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        expenseId: input.expenseId,
      });
    await writeExpenseAuditActivity(
      {
        ...input.context,
        expenseId: input.expenseId,
        action: "ExpenseDeleted",
        verb: "ExpenseDeleted",
        metadata: {
          amount: current.amount.toString(),
          currency: current.currency,
          categoryId: current.categoryId,
          vehicleId: current.vehicleId,
          reservationId: current.reservationId,
        },
      },
      tx,
    );
  });
  await publishDomainEvent({
    name: "ExpenseDeleted",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "expense",
    entityId: input.expenseId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return { expenseId: input.expenseId };
}

export async function restoreExpenseService(input: {
  companyId: string;
  agencyId: string;
  expenseId: string;
}) {
  return restoreExpense(input);
}

export async function recordDriverPaymentService(input: {
  context: FinanceServiceContext;
  data: DriverPaymentCreateData;
}) {
  const payment = await createDriverPayment({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    recordedBy: input.context.userId ?? "",
  });
  await publishDomainEvent({
    name: "DriverPaymentRecorded",
    companyId: payment.companyId,
    agencyId: payment.agencyId,
    entityType: "driver_payment",
    entityId: payment.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return payment;
}

export async function listDriverPaymentsService(
  input: FinanceListInput & { driverId?: string; reservationId?: string },
) {
  return listDriverPayments(input);
}

export async function getFinanceOverviewReportService(
  input: FinanceServiceContext & {
    range?: FinanceReportingRange;
    customFrom?: Date | null;
    customTo?: Date | null;
    currency?: string | null;
  },
): Promise<FinanceOverviewReport> {
  const currencySource = await getFinanceReportingCurrency(input);
  const currency = (input.currency ?? currencySource?.currency ?? currencySource?.company.currency ?? "MAD")
    .trim()
    .toUpperCase();
  assertCurrency(currency);

  const period = resolveFinanceReportingPeriod(input);
  const scope = {
    companyId: input.companyId,
    agencyId: input.agencyId,
    from: period.from,
    to: period.to,
    currency,
  };
  const previousScope = { ...scope, from: period.previousFrom, to: period.previousTo };
  const buckets = buildMonthlyBuckets(period.from, period.to);
  const twelveMonthStarts = buildLastTwelveMonthStarts(period.to);
  const forecastFrom = startOfDay(new Date());
  const forecastTo = addDays(forecastFrom, 31);

  const [totals, previousTotals, series, vehicleData, forecasts] = await Promise.all([
    summarizeFinanceReportingTotals(scope),
    summarizeFinanceReportingTotals(previousScope),
    listFinanceReportingSeries({ ...scope, buckets }),
    listFinanceReportingVehicles({
      ...scope,
      monthlyFrom: twelveMonthStarts[0] ?? monthStart(period.from),
    }),
    listFinanceUpcomingChargeForecasts({
      companyId: input.companyId,
      agencyId: input.agencyId,
      from: forecastFrom,
      to: forecastTo,
      currency,
    }),
  ]);

  const invoicedRevenue = decimal(totals.invoicedAmount ?? 0).minus(totals.creditNoteAmount ?? 0);
  const actualExpenses = decimal(totals.expenseAmount ?? 0);
  const netProfit = invoicedRevenue.minus(actualExpenses);
  const previousRevenue = decimal(previousTotals.invoicedAmount ?? 0).minus(previousTotals.creditNoteAmount ?? 0);
  const previousExpenses = decimal(previousTotals.expenseAmount ?? 0);
  const previousProfit = previousRevenue.minus(previousExpenses);
  const profitability = ratioPercent(netProfit, invoicedRevenue);
  const previousProfitability = ratioPercent(previousProfit, previousRevenue);

  const revenueVsExpenses = series.map((point) => ({
    month: point.label,
    revenue: decimalNumber(decimal(point.invoiceAmount ?? 0).minus(point.creditNoteAmount ?? 0)),
    expenses: decimalNumber(point.expenseAmount),
  }));

  const vehicleRevenue = new Map(vehicleData.revenueRows.map((row) => [row.vehicleId, decimal(row.amount ?? 0)]));
  const vehicleCredits = new Map(vehicleData.creditRows.map((row) => [row.vehicleId, decimal(row.amount ?? 0)]));
  const vehicleExpenses = new Map(vehicleData.expenseRows.map((row) => [row.vehicleId, decimal(row._sum.amount ?? 0)]));
  const vehicleOccupancy = new Map(vehicleData.occupancyRows.map((row) => [row.vehicleId, decimal(row.reservedDays ?? 0)]));
  const expensesByVehicle = new Map<string, FinanceReportingCarExpense[]>();
  for (const row of vehicleData.recentExpenseRows) {
    const current = expensesByVehicle.get(row.vehicleId) ?? [];
    current.push({
      type: row.type,
      date: row.date.toISOString(),
      amount: decimalNumber(row.amount),
      note: row.note ?? undefined,
    });
    expensesByVehicle.set(row.vehicleId, current);
  }

  const monthKeys = twelveMonthStarts.map((date) => date.toISOString().slice(0, 7));
  const monthlyRevenueByVehicle = new Map<string, Map<string, Prisma.Decimal>>();
  for (const row of vehicleData.monthlyRevenueRows) {
    const key = row.month.toISOString().slice(0, 7);
    const current = monthlyRevenueByVehicle.get(row.vehicleId) ?? new Map<string, Prisma.Decimal>();
    current.set(key, decimal(row.amount ?? 0));
    monthlyRevenueByVehicle.set(row.vehicleId, current);
  }

  const periodDays = daysBetween(period.from, period.to);
  const vehicles = vehicleData.vehicles.map((vehicle) => {
    const revenue = (vehicleRevenue.get(vehicle.id) ?? decimal(0)).minus(vehicleCredits.get(vehicle.id) ?? 0);
    const expenses = vehicleExpenses.get(vehicle.id) ?? decimal(0);
    const profit = revenue.minus(expenses);
    const reservedDays = vehicleOccupancy.get(vehicle.id) ?? decimal(0);
    const occupancyRate = Math.max(0, Math.min(100, Math.round(Number(reservedDays.mul(100).div(periodDays).toFixed(0)))));
    const monthlyMap = monthlyRevenueByVehicle.get(vehicle.id) ?? new Map<string, Prisma.Decimal>();

    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      category: vehicle.category.name,
      revenue: decimalNumber(revenue),
      expenses: decimalNumber(expenses),
      profit: decimalNumber(profit),
      occupancyRate,
      roi: null,
      monthlyRevenue: monthKeys.map((key) => decimalNumber(monthlyMap.get(key))),
      recentExpenses: expensesByVehicle.get(vehicle.id) ?? [],
    };
  });

  const upcomingCharges = forecasts.map((forecast) => {
    const due = startOfDay(forecast.dueDate);
    const daysUntil = Math.max(0, Math.ceil((due.getTime() - forecastFrom.getTime()) / 86_400_000));
    return {
      id: forecast.id,
      type: forecast.type,
      carLabel: `${forecast.brand} ${forecast.model}`,
      plate: forecast.plate,
      dueDate: due.toISOString(),
      daysUntil,
      amount: decimalNumber(forecast.amount),
      urgency: daysUntil <= 7 ? "high" : daysUntil <= 21 ? "medium" : "low",
    } satisfies FinanceUpcomingChargeForecast;
  });

  return {
    range: period.range,
    currency,
    period: { from: period.from.toISOString(), to: period.to.toISOString() },
    summary: {
      totalRevenue: decimalNumber(invoicedRevenue),
      totalExpenses: decimalNumber(actualExpenses),
      netProfit: decimalNumber(netProfit),
      profitabilityRate: decimalNumber(profitability),
      revenueDelta: decimalNumber(deltaPercent(invoicedRevenue, previousRevenue)),
      expensesDelta: decimalNumber(deltaPercent(actualExpenses, previousExpenses)),
      profitDelta: decimalNumber(deltaPercent(netProfit, previousProfit)),
      profitabilityDelta: decimalNumber(profitability.minus(previousProfitability)),
      cashCollected: decimalNumber(totals.cashCollectedAmount),
      outstanding: decimalNumber(totals.outstandingAmount),
      depositsHeld: decimalNumber(totals.depositHeldAmount),
    },
    revenueVsExpenses,
    vehicles,
    upcomingCharges,
    cashCollected: decimalNumber(totals.cashCollectedAmount),
    outstanding: decimalNumber(totals.outstandingAmount),
    depositsHeld: decimalNumber(totals.depositHeldAmount),
  };
}

export async function listCustomerFinanceSummariesService(
  input: FinanceServiceContext & { customerIds: string[]; currency?: string | null },
): Promise<Record<string, FinanceReportingCustomerSummary>> {
  const currencySource = await getFinanceReportingCurrency(input);
  const currency = (input.currency ?? currencySource?.currency ?? currencySource?.company.currency ?? "MAD")
    .trim()
    .toUpperCase();
  assertCurrency(currency);

  const monthlyStarts = buildLastSixMonthStarts(new Date());
  const monthlyFrom = monthlyStarts[0] ?? monthStart(new Date());
  const monthlyTo = addMonths(monthStart(new Date()), 1);
  const rows = await listFinanceReportingCustomers({
    companyId: input.companyId,
    agencyId: input.agencyId,
    customerIds: input.customerIds,
    currency,
    monthlyFrom,
    monthlyTo,
  });
  const monthKeys = monthlyStarts.map((date) => date.toISOString().slice(0, 7));
  const monthlyByCustomer = new Map<string, Map<string, Prisma.Decimal>>();

  for (const row of rows.monthlyRows) {
    const key = row.month.toISOString().slice(0, 7);
    const current = monthlyByCustomer.get(row.customerId) ?? new Map<string, Prisma.Decimal>();
    current.set(key, decimal(row.invoiceAmount ?? 0).minus(row.creditNoteAmount ?? 0));
    monthlyByCustomer.set(row.customerId, current);
  }

  const summaries: Record<string, FinanceReportingCustomerSummary> = {};
  for (const customerId of input.customerIds) {
    const totals = rows.totals.find((row) => row.customerId === customerId);
    const invoiced = decimal(totals?.invoicedAmount ?? 0).minus(totals?.creditNoteAmount ?? 0);
    const monthlyMap = monthlyByCustomer.get(customerId) ?? new Map<string, Prisma.Decimal>();

    summaries[customerId] = {
      customerId,
      currency,
      invoiced: decimalNumber(invoiced),
      paid: decimalNumber(totals?.paidAmount),
      outstanding: decimalNumber(totals?.outstandingAmount),
      depositsHeld: decimalNumber(totals?.depositsHeldAmount),
      monthlyInvoiced: monthKeys.map((key) => decimalNumber(monthlyMap.get(key))),
    };
  }

  return summaries;
}

export const financesService = {
  getInvoiceService,
  getInvoiceByReservationService,
  listInvoicesService,
  createInvoiceService,
  generateInvoiceFromReservationService,
  updateInvoiceService,
  deleteInvoiceService,
  listInvoiceableReservationsService,
  listInvoiceCustomersService,
  issueInvoiceService,
  recordPaymentService,
  listPaymentsService,
  collectDepositService,
  releaseDepositService,
  forfeitDepositService,
  listDepositsService,
  issueCreditNoteService,
  listCreditNotesForInvoiceService,
  listExpenseCategoriesService,
  listExpenseVehicleOptionsService,
  listExpenseReservationOptionsService,
  getExpenseDefaultsService,
  createExpenseCategoryService,
  listExpensesService,
  getExpenseService,
  summarizeExpensesService,
  createExpenseService,
  updateExpenseService,
  deleteExpenseService,
  restoreExpenseService,
  recordDriverPaymentService,
  listDriverPaymentsService,
  getFinanceOverviewReportService,
  listCustomerFinanceSummariesService,
};
