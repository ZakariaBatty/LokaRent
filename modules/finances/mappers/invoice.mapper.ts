import type { Prisma } from "@lokarent/db";
import type { Invoice, InvoiceStatus, InvoiceTimelineEvent } from "@/lib/invoices-data";

type InvoiceWithDetails = Prisma.InvoiceGetPayload<{
  include: {
    lineItems: true;
    payments: true;
    creditNotesAsOriginal: true;
    reservation: {
      include: {
        vehicle: true;
        extras: true;
        pricingSnapshots: true;
      };
    };
    customer: { include: { individual: true; business: true } };
    customerBusiness: true;
  };
}>;

type InvoiceReservationWithVehicle = NonNullable<InvoiceWithDetails["reservation"]>;

type InvoiceableReservation = {
  id: string;
  code: string;
  currency: string;
  customer: InvoiceWithDetails["customer"];
  vehicle: InvoiceReservationWithVehicle["vehicle"];
  pricingSnapshots: {
    id: string;
    pricePerDay: Prisma.Decimal;
    days: number;
    discountAmount: Prisma.Decimal;
    discountReason: string | null;
    totalAmount: Prisma.Decimal;
    currency: string;
    taxRate: Prisma.Decimal | null;
  }[];
  extras: {
    id: string;
    label: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
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
  defaultTaxRate: number | null;
  lineItems: Invoice["lineItems"];
};

export type InvoiceCustomerOption = {
  id: string;
  name: string;
  type: "individual" | "company";
  phone: string;
  email: string;
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

function carLabel(vehicle: InvoiceReservationWithVehicle["vehicle"] | InvoiceableReservation["vehicle"]) {
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

function systemLineCount(invoice: InvoiceWithDetails) {
  if (invoice.type !== "rental" || !invoice.reservation) return 0;
  const snapshot = invoice.reservation.pricingSnapshots[0];
  if (!snapshot) return 0;
  return 1 + invoice.reservation.extras.length + (snapshot.discountAmount.greaterThan(0) ? 1 : 0);
}

export function mapInvoiceToUi(invoice: InvoiceWithDetails): Invoice {
  const paid = invoice.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const credited = invoice.creditNotesAsOriginal.reduce((sum, note) => sum + toNumber(note.amount), 0);
  const total = toNumber(invoice.totalAmount);
  const remaining = Math.max(0, total - paid - credited);
  const trustedSystemLineCount = systemLineCount(invoice);
  const taxRate = invoice.lineItems.find((lineItem) => lineItem.taxRate != null)?.taxRate;

  return {
    id: invoice.id,
    number: invoice.code,
    status: mapStatus(invoice.status),
    type: invoice.type,
    customerId: invoice.customerId,
    customerName: customerName(invoice.customer),
    customerType: invoice.customer.type === "company" ? "company" : "individual",
    customerPhone: invoice.customer.phone ?? "",
    customerEmail: invoice.customer.email ?? undefined,
    customerAddress: undefined,
    customerCompany: invoice.customerBusiness?.companyName ?? invoice.customer.business?.companyName ?? undefined,
    reservationId: invoice.reservationId ?? undefined,
    reservationCode: invoice.reservation?.code,
    carLabel: invoice.reservation ? carLabel(invoice.reservation.vehicle) : undefined,
    issueDate: toIsoDate(invoice.issuedAt ?? invoice.createdAt),
    dueDate: toIsoDate(invoice.dueAt),
    lineItems: invoice.lineItems.map((lineItem, index) => {
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
        source: invoice.type === "rental" && index < trustedSystemLineCount ? "system" : "manual",
      };
    }),
    subtotal: toNumber(invoice.subtotal),
    taxTotal: toNumber(invoice.taxAmount),
    taxRate: taxRate != null ? toNumber(taxRate) : undefined,
    discount: toNumber(invoice.discountAmount),
    total,
    paid,
    remaining,
    currency: invoice.currency,
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      date: toIsoDate(payment.paidAt),
      method: payment.method,
      amount: toNumber(payment.amount),
      reference: payment.reference ?? undefined,
      note: payment.notes ?? undefined,
      recordedBy: payment.recordedBy,
    })),
    notes: invoice.notes ?? undefined,
    createdAt: toIsoDateTime(invoice.createdAt),
    timeline: timeline(invoice, paid),
  };
}

export function mapInvoiceableReservationToOption(reservation: InvoiceableReservation): InvoiceableReservationOption {
  const snapshot = reservation.pricingSnapshots[0];
  const taxRate = snapshot?.taxRate ? toNumber(snapshot.taxRate) : null;
  const lineItems: Invoice["lineItems"] = snapshot
    ? [
        {
          id: `${reservation.id}-rental`,
          description: `Location ${carLabel(reservation.vehicle)} - ${snapshot.days} jour${snapshot.days > 1 ? "s" : ""}`,
          quantity: snapshot.days,
          unitPrice: toNumber(snapshot.pricePerDay),
          taxRate: taxRate ?? 0,
          subtotal: toNumber(snapshot.pricePerDay) * snapshot.days,
          total: toNumber(snapshot.pricePerDay) * snapshot.days * (1 + (taxRate ?? 0) / 100),
          source: "system",
        },
        ...reservation.extras.map((extra) => {
          const subtotal = toNumber(extra.totalPrice);
          return {
            id: extra.id,
            description: extra.label,
            quantity: extra.quantity,
            unitPrice: toNumber(extra.unitPrice),
            taxRate: taxRate ?? 0,
            subtotal,
            total: subtotal * (1 + (taxRate ?? 0) / 100),
            source: "system" as const,
          };
        }),
        ...(snapshot.discountAmount.greaterThan(0)
          ? [{
              id: `${reservation.id}-discount`,
              description: snapshot.discountReason ? `Remise - ${snapshot.discountReason}` : "Remise",
              quantity: 1,
              unitPrice: -toNumber(snapshot.discountAmount),
              taxRate: taxRate ?? 0,
              subtotal: -toNumber(snapshot.discountAmount),
              total: -toNumber(snapshot.discountAmount) * (1 + (taxRate ?? 0) / 100),
              source: "system" as const,
            }]
          : []),
      ]
    : [];
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
    defaultTaxRate: taxRate,
    lineItems,
  };
}
