import type { Prisma, ReservationStatus as DbReservationStatus } from "@lokarent/db";
import type { Reservation, ReservationStatus, TimelineEvent } from "@/lib/reservations-data";

type ReservationPayload = Prisma.ReservationGetPayload<{
  include: {
    customer: { include: { individual: true; business: true } };
    vehicle: { include: { category: true } };
    source: true;
    pricingSnapshots: true;
    extras: true;
    timelineEvents: true;
    contract: true;
    driverAssignments: { include: { driver: true } };
  };
}>;

function customerName(customer: ReservationPayload["customer"]) {
  if (customer.type === "company") return customer.business?.companyName ?? customer.email ?? customer.code;
  return [customer.individual?.firstName, customer.individual?.lastName].filter(Boolean).join(" ") || customer.email || customer.code;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function mapReservationStatusToUi(status: DbReservationStatus): ReservationStatus {
  if (status === "confirmed") return "confirmee";
  if (status === "active") return "en_cours";
  if (status === "completed") return "terminee";
  if (status === "cancelled" || status === "no_show") return "annulee";
  return "demande";
}

function timelineType(eventType: string): TimelineEvent["type"] {
  if (eventType.includes("payment")) return "payment";
  if (eventType.includes("pickup")) return "pickup";
  if (eventType.includes("return")) return "return";
  if (eventType.includes("status")) return "status";
  return "note";
}

function mapTimeline(event: ReservationPayload["timelineEvents"][number]): TimelineEvent {
  return {
    id: event.id,
    type: event.eventType === "created" ? "created" : timelineType(event.eventType),
    label: event.eventType,
    description: event.description ?? undefined,
    timestamp: event.createdAt.toISOString(),
    author: event.performedBy ?? "system",
  };
}

export function mapReservationToUi(reservation: ReservationPayload): Reservation {
  const name = customerName(reservation.customer);
  const driverAssignment = reservation.driverAssignments[0];
  const total = Number(reservation.totalAmount);
  const advance = Number(reservation.advanceAmount);
  return {
    id: reservation.id,
    code: reservation.code,
    status: mapReservationStatusToUi(reservation.status),
    urgency: reservation.status === "active" ? "medium" : "low",
    client: {
      id: reservation.customerId,
      name,
      phone: reservation.customer.phone ?? "",
      initials: initials(name),
    },
    car: {
      id: reservation.vehicleId,
      brand: reservation.vehicle.brand,
      model: reservation.vehicle.model,
      plate: reservation.vehicle.plate,
      category: reservation.vehicle.category.name,
    },
    startDate: reservation.startsAt.toISOString(),
    endDate: reservation.endsAt.toISOString(),
    days: reservation.days,
    pickupLocation: reservation.pickupLocation ?? "",
    returnLocation: reservation.returnLocation ?? "",
    extras: {
      gps: reservation.extras.some((extra) => extra.label.toLowerCase().includes("gps")),
      babySeat: reservation.extras.some((extra) => extra.label.toLowerCase().includes("baby")),
      insuranceUpgrade: reservation.extras.some((extra) => extra.label.toLowerCase().includes("insurance")),
      additionalDriver: null,
    },
    startKm: null,
    returnKm: null,
    pricePerDay: Number(reservation.pricePerDay),
    total,
    caution: Number(reservation.depositAmount),
    advance,
    remaining: Math.max(0, total - advance),
    paymentMethod: "Espèces",
    paymentStatus: advance >= total ? "paid" : advance > 0 ? "partial" : "unpaid",
    contract: {
      departureChecklist: [],
      returnChecklist: [],
      damages: [],
      signed: Boolean(reservation.contract),
      photos: 0,
    },
    timeline: reservation.timelineEvents.map(mapTimeline),
    createdAt: reservation.createdAt.toISOString(),
    overdue: reservation.status === "active" && reservation.endsAt.getTime() < Date.now(),
    driver: driverAssignment
      ? {
          id: driverAssignment.driverId,
          name: `${driverAssignment.driver.firstName} ${driverAssignment.driver.lastName}`,
          phone: driverAssignment.driver.phone ?? "",
        }
      : null,
  };
}
