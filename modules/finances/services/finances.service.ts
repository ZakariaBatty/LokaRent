import {
  createId,
  createNotFoundError,
  createValidationError,
  publishDomainEvent,
  runInTransaction,
} from "@/shared";
import { createReservationTimelineEvent } from "@/modules/reservations/repositories/reservations.repository";
import { incrementNumberSequence } from "@/modules/workspace/billing/repositories/billing.repository";
import { Prisma } from "@lokarent/db";
import {
  createCreditNote,
  createDeposit,
  createDriverPayment,
  createExpense,
  createExpenseCategory,
  createInvoice,
  createManyInvoiceLineItems,
  createPayment,
  findInvoiceById,
  findInvoiceByReservation,
  findInvoiceGenerationSource,
  getInvoicePaymentSummary,
  listInvoiceableReservations,
  listCreditNotesForInvoice,
  listDeposits,
  listDriverPayments,
  lockInvoiceByReservation,
  lockReservationForInvoice,
  listExpenseCategories,
  listPayments,
  paginateExpenses,
  paginateInvoices,
  restoreExpense,
  softDeleteExpense,
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
type DepositCreateData = Omit<
  Parameters<typeof createDeposit>[0],
  "id" | "companyId" | "agencyId" | "collectedBy"
>;
type CreditNoteCreateData = Omit<
  Parameters<typeof createCreditNote>[0],
  "id" | "companyId" | "agencyId" | "issuedBy"
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
    customerId?: string;
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

function taxAmountFor(
  totalPrice: Prisma.Decimal,
  taxRate: Prisma.Decimal | null,
) {
  if (!taxRate) return null;
  return totalPrice.mul(taxRate).div(100);
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

export async function listInvoiceableReservationsService(input: {
  companyId: string;
  agencyId: string;
  search?: string;
  take?: number;
}) {
  return listInvoiceableReservations(input);
}

export async function generateInvoiceFromReservationService(input: {
  context: FinanceServiceContext;
  reservationId: string;
  dueAt?: Date | null;
  notes?: string | null;
}) {
  let createdInvoiceId = "";
  const invoice = await runInTransaction(async (tx) => {
    const scope = { ...input.context, reservationId: input.reservationId };
    await lockReservationForInvoice(scope, tx);
    await lockInvoiceByReservation(scope, tx);

    const source = await findInvoiceGenerationSource(scope, tx);
    if (!source) throw createNotFoundError("Reservation", input);
    if (source.invoice)
      throw createValidationError("FINANCE_INVOICE_ALREADY_EXISTS");

    const snapshot = source.pricingSnapshots[0];
    if (!snapshot)
      throw createValidationError("FINANCE_PRICING_SNAPSHOT_MISSING");
    if (!snapshot.taxRate)
      throw createValidationError("FINANCE_HISTORICAL_TAX_RATE_MISSING");

    const invoiceId = createId();
    createdInvoiceId = invoiceId;
    const sequence = await generateInvoiceCode(input.context, tx);
    const issuedAt = new Date();
    const dueAt = input.dueAt ?? new Date(issuedAt.getTime() + 14 * 86_400_000);

    const rentalDescription = `Location ${invoiceVehicleLabel(source.vehicle)} - ${snapshot.days} jour${snapshot.days > 1 ? "s" : ""}`;
    const rentalTotal = snapshot.pricePerDay.mul(snapshot.days);
    const rentalTaxAmount = taxAmountFor(rentalTotal, snapshot.taxRate);
    const lineItems: InvoiceLineItemCreateData[] = [
      {
        description: rentalDescription,
        quantity: decimal(snapshot.days),
        unitPrice: snapshot.pricePerDay,
        totalPrice: rentalTotal,
        taxRate: snapshot.taxRate,
        taxAmount: rentalTaxAmount,
        sortOrder: 0,
      },
      ...source.extras.map((extra, index) => ({
        description: extra.label,
        quantity: decimal(extra.quantity),
        unitPrice: extra.unitPrice,
        totalPrice: extra.totalPrice,
        taxRate: snapshot.taxRate,
        taxAmount: taxAmountFor(extra.totalPrice, snapshot.taxRate),
        sortOrder: index + 1,
      })),
    ];

    if (snapshot.discountAmount.greaterThan(0)) {
      lineItems.push({
        description: snapshot.discountReason
          ? `Remise - ${snapshot.discountReason}`
          : "Remise",
        quantity: decimal(1),
        unitPrice: snapshot.discountAmount.negated(),
        totalPrice: snapshot.discountAmount.negated(),
        taxRate: snapshot.taxRate,
        taxAmount: taxAmountFor(
          snapshot.discountAmount.negated(),
          snapshot.taxRate,
        ),
        sortOrder: lineItems.length,
      });
    }

    const subtotal = lineItems.reduce(
      (sum, item) => sum.plus(decimal(item.totalPrice)),
      decimal(0),
    );
    const taxAmount = lineItems.reduce(
      (sum, item) => sum.plus(decimal(item.taxAmount ?? 0)),
      decimal(0),
    );
    const totalAmount = subtotal.plus(taxAmount);
    const created = await createInvoice(
      {
        id: invoiceId,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        code: sequence.formatted,
        reservationId: source.id,
        customerId: source.customerId,
        customerBusinessId: source.customer.business?.id ?? null,
        status: "issued",
        subtotal,
        taxAmount,
        discountAmount: snapshot.discountAmount,
        totalAmount,
        currency: snapshot.currency,
        issuedAt,
        dueAt,
        notes: input.notes ?? null,
      },
      tx,
    );
    await createManyInvoiceLineItems(
      lineItems.map((lineItem) => ({
        ...lineItem,
        id: createId(),
        companyId: input.context.companyId,
        invoiceId,
      })),
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: created.companyId,
        reservationId: created.reservationId,
        eventType: "invoice_issued",
        description: created.code,
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
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
  const invoice = await getInvoiceService(input);
  if (invoice.status !== "draft") {
    throw createValidationError("Only draft invoices can be issued");
  }
  await updateInvoice({
    ...input,
    data: { status: "issued", issuedAt: new Date() },
  });
  await publishDomainEvent({
    name: "InvoiceIssued",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "invoice",
    entityId: input.invoiceId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return getInvoiceService(input);
}

export async function recordPaymentService(input: {
  context: FinanceServiceContext;
  payment: PaymentCreateData;
}) {
  const payment = await runInTransaction(async (tx) => {
    const created = await createPayment(
      {
        ...input.payment,
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        recordedBy: input.context.userId ?? "",
      },
      tx,
    );
    if (created.invoiceId) {
      const summary = await getInvoicePaymentSummary(
        {
          companyId: created.companyId,
          agencyId: created.agencyId,
          invoiceId: created.invoiceId,
        },
        tx,
      );
      if (summary.invoice && summary.paidAmount) {
        const nextStatus = summary.paidAmount.greaterThanOrEqualTo(
          summary.invoice.totalAmount,
        )
          ? "paid"
          : "partially_paid";
        await updateInvoice(
          {
            companyId: created.companyId,
            agencyId: created.agencyId,
            invoiceId: created.invoiceId,
            data: {
              status: nextStatus,
              paidAt: nextStatus === "paid" ? new Date() : null,
            },
          },
          tx,
        );
      }
    }
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: created.companyId,
        reservationId: created.reservationId,
        eventType: "payment_recorded",
        performedBy: input.context.userId ?? null,
      },
      tx,
    );
    return created;
  });
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
  deposit: DepositCreateData;
}) {
  const deposit = await runInTransaction(async (tx) => {
    const created = await createDeposit(
      {
        ...input.deposit,
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        collectedBy: input.context.userId ?? "",
      },
      tx,
    );
    await createReservationTimelineEvent(
      {
        id: createId(),
        companyId: created.companyId,
        reservationId: created.reservationId,
        eventType: "deposit_collected",
        performedBy: input.context.userId ?? null,
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
  input: FinanceServiceContext & {
    depositId: string;
    releasedAmount?: Parameters<
      typeof updateDeposit
    >[0]["data"]["releasedAmount"];
    notes?: string | null;
  },
) {
  const status = input.releasedAmount ? "partially_released" : "released";
  const result = await updateDeposit({
    companyId: input.companyId,
    agencyId: input.agencyId,
    depositId: input.depositId,
    data: {
      status,
      releasedAt: new Date(),
      releasedBy: input.userId ?? "",
      releasedAmount: input.releasedAmount,
      notes: input.notes,
    },
  });
  await publishDomainEvent({
    name: "DepositReleased",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "deposit",
    entityId: input.depositId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function forfeitDepositService(
  input: FinanceServiceContext & {
    depositId: string;
    reason: string;
  },
) {
  if (!input.reason.trim())
    throw createValidationError("Deposit forfeiture reason is required");
  const result = await updateDeposit({
    companyId: input.companyId,
    agencyId: input.agencyId,
    depositId: input.depositId,
    data: { status: "forfeited", forfeitureReason: input.reason },
  });
  await publishDomainEvent({
    name: "DepositForfeited",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "deposit",
    entityId: input.depositId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
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
  data: CreditNoteCreateData;
}) {
  const note = await createCreditNote({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    issuedBy: input.context.userId ?? "",
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
  },
) {
  return paginateExpenses(input);
}

export async function createExpenseService(input: {
  context: FinanceServiceContext;
  data: ExpenseCreateData;
}) {
  const expense = await createExpense({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    recordedBy: input.context.userId ?? "",
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
  companyId: string;
  agencyId: string;
  expenseId: string;
  data: Parameters<typeof updateExpense>[0]["data"];
}) {
  return updateExpense(input);
}

export async function deleteExpenseService(input: {
  companyId: string;
  agencyId: string;
  expenseId: string;
  deletedBy?: string | null;
}) {
  return softDeleteExpense(input);
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

export const financesService = {
  getInvoiceService,
  getInvoiceByReservationService,
  listInvoicesService,
  createInvoiceService,
  generateInvoiceFromReservationService,
  listInvoiceableReservationsService,
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
  createExpenseCategoryService,
  listExpensesService,
  createExpenseService,
  updateExpenseService,
  deleteExpenseService,
  restoreExpenseService,
  recordDriverPaymentService,
  listDriverPaymentsService,
};
