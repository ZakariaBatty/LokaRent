import type { Prisma } from "@lokarent/db";
import type { Invoice, InvoiceStatus, InvoiceTimelineEvent } from "@/lib/invoices-data";

type InvoiceWithDetails = Prisma.InvoiceGetPayload<{
  include: {
    lineItems: true;
    payments: true;
    creditNotesAsOriginal: true;
    reservation: { include: { vehicle: true } };
    customer: { include: { individual: true; business: true } };
    customerBusiness: true;
  };
}>;

type InvoiceableReservation = {
  id: string;
  code: string;
  currency: string;
  customer: InvoiceWithDetails["customer"];
  vehicle: InvoiceWithDetails["reservation"]["vehicle"];
  pricingSnapshots: {
    totalAmount: Prisma.Decimal;
    currency: string;
    taxRate: Prisma.Decimal | null;
  }[];
};

export type InvoiceableReservationOption = {
  id: string;
  code: string;
  carLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerType: "individual" | "company";
  total: number;
  currency: string;
  taxReady: boolean;
};

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString().split("T")[0] : "";
}

function toIsoDateTime(value: Date | null | undefined) {
  return value?.toISOString() ?? new Date(0).toISOString();
}

function mapStatus(status: InvoiceWithDetails["status"]): InvoiceStatus {
  if (status === "partially_paid") return "partial";
  if (status === "voided") return "cancelled";
  return status;
}

function customerName(customer: InvoiceWithDetails["customer"] | InvoiceableReservation["customer"]) {
  if (customer.type === "company") return customer.business?.companyName ?? customer.email ?? customer.code;
  return [customer.individual?.firstName, customer.individual?.lastName].filter(Boolean).join(" ") || customer.email || customer.code;
}

function carLabel(vehicle: InvoiceWithDetails["reservation"]["vehicle"] | InvoiceableReservation["vehicle"]) {
  return [vehicle.brand, vehicle.model, vehicle.plate].filter(Boolean).join(" · ");
}

function timeline(invoice: InvoiceWithDetails, paid: number): InvoiceTimelineEvent[] {
  const events: InvoiceTimelineEvent[] = [
    {
      id: `${invoice.id}-created`,
      type: "created",
      label: "Facture créée",
      timestamp: toIsoDateTime(invoice.createdAt),
      author: "Système",
    },
  ];
  if (invoice.issuedAt) {
    events.push({
      id: `${invoice.id}-issued`,
      type: "issued",
      label: "Facture émise",
      timestamp: toIsoDateTime(invoice.issuedAt),
      author: "Système",
    });
  }
  for (const payment of invoice.payments) {
    events.push({
      id: payment.id,
      type: "payment",
      label: `Paiement reçu - ${toNumber(payment.amount).toLocaleString("fr-MA")} ${payment.currency}`,
      timestamp: toIsoDateTime(payment.paidAt),
      author: "Système",
    });
  }
  if (invoice.status === "voided") {
    events.push({
      id: `${invoice.id}-voided`,
      type: "cancelled",
      label: "Facture annulée",
      timestamp: toIsoDateTime(invoice.updatedAt),
      author: "Système",
    });
  }
  if (paid <= 0 && invoice.dueAt && invoice.dueAt < new Date() && invoice.status !== "paid") {
    events.push({
      id: `${invoice.id}-overdue`,
      type: "reminder",
      label: "Échéance dépassée",
      timestamp: toIsoDateTime(invoice.dueAt),
      author: "Système",
    });
  }
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function mapInvoiceToUi(invoice: InvoiceWithDetails): Invoice {
  const paid = invoice.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const credited = invoice.creditNotesAsOriginal.reduce((sum, note) => sum + toNumber(note.amount), 0);
  const total = toNumber(invoice.totalAmount);
  const remaining = Math.max(0, total - paid - credited);

  return {
    id: invoice.id,
    number: invoice.code,
    status: mapStatus(invoice.status),
    type: "rental",
    customerId: invoice.customerId,
    customerName: customerName(invoice.customer),
    customerType: invoice.customer.type === "company" ? "company" : "individual",
    customerPhone: invoice.customer.phone ?? "",
    customerEmail: invoice.customer.email ?? undefined,
    customerAddress: undefined,
    customerCompany: invoice.customerBusiness?.companyName ?? invoice.customer.business?.companyName ?? undefined,
    reservationId: invoice.reservationId,
    reservationCode: invoice.reservation.code,
    carLabel: carLabel(invoice.reservation.vehicle),
    issueDate: toIsoDate(invoice.issuedAt ?? invoice.createdAt),
    dueDate: toIsoDate(invoice.dueAt),
    lineItems: invoice.lineItems.map((lineItem) => {
      const subtotal = toNumber(lineItem.totalPrice);
      const taxAmount = toNumber(lineItem.taxAmount);
      return {
        id: lineItem.id,
        description: lineItem.description,
        quantity: toNumber(lineItem.quantity),
        unitPrice: toNumber(lineItem.unitPrice),
        taxRate: toNumber(lineItem.taxRate),
        subtotal,
        total: subtotal + taxAmount,
      };
    }),
    subtotal: toNumber(invoice.subtotal),
    taxTotal: toNumber(invoice.taxAmount),
    total,
    paid,
    remaining,
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      date: toIsoDate(payment.paidAt),
      method: payment.method,
      amount: toNumber(payment.amount),
      reference: payment.reference ?? undefined,
      note: payment.notes ?? undefined,
    })),
    notes: invoice.notes ?? undefined,
    createdAt: toIsoDateTime(invoice.createdAt),
    timeline: timeline(invoice, paid),
  };
}

export function mapInvoiceableReservationToOption(reservation: InvoiceableReservation): InvoiceableReservationOption {
  const snapshot = reservation.pricingSnapshots[0];
  return {
    id: reservation.id,
    code: reservation.code,
    carLabel: carLabel(reservation.vehicle),
    customerName: customerName(reservation.customer),
    customerPhone: reservation.customer.phone ?? "",
    customerEmail: reservation.customer.email ?? "",
    customerType: reservation.customer.type === "company" ? "company" : "individual",
    total: snapshot ? toNumber(snapshot.totalAmount) : 0,
    currency: snapshot?.currency ?? reservation.currency,
    taxReady: Boolean(snapshot?.taxRate),
  };
}
