import type { Prisma } from "@lokarent/db";
import type { ExpenseRecord } from "@/lib/expenses-data";

type ExpensePayload = Prisma.ExpenseGetPayload<{
  include: { category: true; vehicle: true; reservation: true; recordedByUser: true };
}>;

function toNumber(value: Prisma.Decimal) {
  return Number(value.toString());
}

function attachmentFromUrl(url: string | null) {
  if (!url) return null;
  const name = url.split("/").pop() || url;
  const lower = name.toLowerCase();
  return {
    name,
    kind: lower.endsWith(".pdf") ? "pdf" : "image",
  } satisfies ExpenseRecord["attachment"];
}

export function mapExpenseToUi(expense: ExpensePayload): ExpenseRecord {
  return {
    id: expense.id,
    date: expense.occurredAt.toISOString().slice(0, 10),
    carId: expense.vehicleId,
    carLabel: expense.vehicle
      ? {
          brand: expense.vehicle.brand,
          model: expense.vehicle.model,
          plate: expense.vehicle.plate,
          category: expense.vehicle.categoryId,
        }
      : null,
    categoryId: expense.categoryId,
    type: expense.category.name,
    description: expense.description,
    amount: toNumber(expense.amount),
    currency: expense.currency,
    method: expense.method,
    reference: expense.reference,
    provider: expense.provider,
    reservationId: expense.reservationId,
    reservationCode: expense.reservation?.code ?? null,
    documentUrl: expense.documentUrl,
    recordedBy: expense.recordedByUser.fullName ?? expense.recordedByUser.email ?? expense.recordedBy,
    attachment: attachmentFromUrl(expense.documentUrl),
    internalNote: expense.internalNote ?? undefined,
  };
}

export function mapExpenseCategoryToOption(category: { id: string; name: string; isSystem: boolean }) {
  return {
    id: category.id,
    name: category.name,
    isSystem: category.isSystem,
  };
}

export function mapExpenseVehicleToOption(vehicle: {
  id: string;
  brand: string;
  model: string;
  plate: string;
  category?: { name: string } | null;
}) {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    plate: vehicle.plate,
    category: vehicle.category?.name,
  };
}

export function mapExpenseReservationToOption(reservation: {
  id: string;
  code: string;
  vehicleId: string;
  startsAt: Date;
  endsAt: Date;
  vehicle: { brand: string; model: string; plate: string };
  customer: {
    code: string;
    individual?: { firstName: string; lastName: string } | null;
    business?: { companyName: string } | null;
  };
}) {
  const customerName =
    reservation.customer.business?.companyName ??
    [reservation.customer.individual?.firstName, reservation.customer.individual?.lastName].filter(Boolean).join(" ") ??
    reservation.customer.code;

  return {
    id: reservation.id,
    code: reservation.code,
    vehicleId: reservation.vehicleId,
    vehicleLabel: `${reservation.vehicle.brand} ${reservation.vehicle.model} · ${reservation.vehicle.plate}`,
    customerLabel: customerName || reservation.customer.code,
    startsAt: reservation.startsAt.toISOString().slice(0, 10),
    endsAt: reservation.endsAt.toISOString().slice(0, 10),
  };
}
