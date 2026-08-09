import type { DriverPricingType } from "@lokarent/db";
import type {
  Driver,
  DriverAssignment,
  DriverDocument,
  DriverPaymentEntry,
  DriverPaymentRate,
  PaymentType,
} from "@/lib/drivers-data";
import type { DriverWithDetails } from "../repositories/drivers.repository";

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function paymentType(value?: DriverPricingType | null): PaymentType {
  if (value === "hourly") return "hourly";
  if (value === "mission") return "mission";
  return "monthly";
}

function mapPricingRule(rule: DriverWithDetails["pricingRules"][number]): DriverPaymentRate {
  return {
    id: rule.id,
    type: paymentType(rule.pricingType),
    monthlySalary: rule.monthlyRate === null ? undefined : Number(rule.monthlyRate),
    pricePerHour: rule.hourlyRate === null ? undefined : Number(rule.hourlyRate),
    pricePerMission: rule.missionRate === null ? undefined : Number(rule.missionRate),
    currency: rule.currency,
    startDate: toIsoDate(rule.validFrom),
    endDate: null,
    createdAt: toIsoDate(rule.createdAt),
  };
}

function documentLabel(type: DriverDocument["type"]) {
  if (type === "driving_license") return "drivers.documentTypes.driving_license";
  if (type === "national_id") return "drivers.documentTypes.national_id";
  if (type === "contract") return "drivers.documentTypes.contract";
  return "drivers.documentTypes.other";
}

function mapDocument(document: DriverWithDetails["documents"][number]): DriverDocument {
  return {
    id: document.id,
    labelKey: documentLabel(document.type),
    type: document.type,
    documentNumber: document.documentNumber ?? undefined,
    issuedAt: toIsoDate(document.issuedAt) || undefined,
    expiry: toIsoDate(document.expiresAt) || undefined,
    documentUrl: document.documentUrl ?? undefined,
    scanned: Boolean(document.documentUrl),
  };
}

function customerName(assignment: DriverWithDetails["reservationAssignments"][number]) {
  const customer = assignment.reservation.customer;
  if (customer.type === "company") return customer.business?.companyName ?? customer.email ?? assignment.reservation.code;
  return (
    [customer.individual?.firstName, customer.individual?.lastName].filter(Boolean).join(" ") ||
    customer.email ||
    assignment.reservation.code
  );
}

function assignmentStatus(status: DriverWithDetails["reservationAssignments"][number]["reservation"]["status"]) {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "ongoing";
}

function mapAssignment(assignment: DriverWithDetails["reservationAssignments"][number]): DriverAssignment {
  const reservation = assignment.reservation;
  return {
    id: assignment.id,
    reservationCode: reservation.code,
    clientName: customerName(assignment),
    carLabel: `${reservation.vehicle.brand} ${reservation.vehicle.model} ${reservation.vehicle.year}`,
    startDate: toIsoDate(reservation.startsAt),
    endDate: toIsoDate(reservation.endsAt),
    status: assignmentStatus(reservation.status),
  };
}

function mapPayment(payment: DriverWithDetails["payments"][number]): DriverPaymentEntry {
  return {
    id: payment.id,
    date: toIsoDate(payment.paidAt ?? payment.createdAt),
    amount: Number(payment.netAmount ?? payment.grossAmount),
    type: payment.reservationId ? "mission" : "salary",
    reference: payment.reservationId ?? undefined,
    note: payment.notes ?? undefined,
  };
}

export function mapDriverToUi(driver: DriverWithDetails): Driver {
  const currentRule = driver.pricingRules.find((rule) => rule.isCurrent) ?? driver.pricingRules[0] ?? null;
  const currentRate = currentRule
    ? mapPricingRule(currentRule)
    : {
        id: "",
        type: "monthly" as const,
        monthlySalary: 0,
        currency: "MAD",
        startDate: toIsoDate(driver.createdAt),
        endDate: null,
        createdAt: toIsoDate(driver.createdAt),
      };
  const payments = driver.payments.map(mapPayment);
  const assignments = driver.reservationAssignments.map(mapAssignment);
  const documents = driver.documents.map(mapDocument);
  const nationalId = documents.find((document) => document.type === "national_id");
  const license = documents.find((document) => document.type === "driving_license");

  return {
    id: driver.id,
    reference: driver.reference ?? undefined,
    firstName: driver.firstName,
    lastName: driver.lastName,
    phone: driver.phone ?? "",
    email: driver.email ?? "",
    notes: driver.notes ?? "",
    homeAgencyName: driver.homeAgency.name,
    cinNumber: nationalId?.documentNumber ?? "",
    cinExpiry: nationalId?.expiry ?? "",
    licenseNumber: license?.documentNumber ?? "",
    licenseExpiry: license?.expiry ?? "",
    paymentType: currentRate.type,
    currentRate,
    rateHistory: driver.pricingRules.filter((rule) => rule.id !== currentRule?.id).map(mapPricingRule),
    paymentHistory: payments,
    assignments,
    documents,
    status: driver.status,
    createdAt: toIsoDate(driver.createdAt),
    totalAssignments: driver._count.reservationAssignments,
    totalEarned: payments.reduce((sum, payment) => sum + payment.amount, 0),
  };
}

export function mapUiPaymentType(type: PaymentType): DriverPricingType {
  if (type === "hourly") return "hourly";
  if (type === "mission") return "mission";
  return "monthly";
}
