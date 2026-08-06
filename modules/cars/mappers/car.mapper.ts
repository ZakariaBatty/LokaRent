import type { FuelType, Transmission, VehicleStatus } from "@lokarent/db";
import type {
  Car,
  CarCategory,
  CarStatus,
  DocumentStatus,
  FuelType as UiFuelType,
  ReservationHistory,
} from "@/lib/cars-data";
import type { VehicleWithFleetDetails } from "../repositories/cars.repository";

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function daysUntil(value: Date | string | null | undefined) {
  if (!value) return 0;
  return Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function documentStatus(daysLeft: number): DocumentStatus {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "warning";
  return "ok";
}

function mapStatus(status: VehicleStatus): CarStatus {
  if (status === "available") return "disponible";
  if (status === "rented") return "louee";
  if (status === "maintenance") return "maintenance";
  return "hors_service";
}

function mapFuel(fuelType: FuelType): UiFuelType {
  if (fuelType === "diesel") return "Diesel";
  if (fuelType === "hybrid" || fuelType === "electric") return "Hybride";
  return "Essence";
}

export function mapUiStatus(status: CarStatus): VehicleStatus {
  if (status === "disponible") return "available";
  if (status === "louee") return "rented";
  if (status === "maintenance") return "maintenance";
  return "inactive";
}

export function mapUiFuel(fuel: UiFuelType): FuelType {
  if (fuel === "Diesel") return "diesel";
  if (fuel === "Hybride") return "hybrid";
  return "petrol";
}

export function mapCategoryName(name?: string | null): CarCategory {
  if (name === "SUV") return "SUV";
  if (name === "Van" || name === "Utilitaire") return "Utilitaire";
  if (name === "Sedan" || name === "Compact" || name === "Berline") return "Berline";
  return "Citadine";
}

export function mapTransmission(value?: Transmission | null) {
  return value ?? "manual";
}

function customerName(reservation: VehicleWithFleetDetails["reservations"][number]) {
  if (reservation.customer.type === "company") {
    return reservation.customer.business?.companyName ?? reservation.customer.email ?? reservation.code;
  }
  return (
    [reservation.customer.individual?.firstName, reservation.customer.individual?.lastName]
      .filter(Boolean)
      .join(" ") || reservation.customer.email || reservation.code
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function reservationDays(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function reservationAmount(reservation: VehicleWithFleetDetails["reservations"][number]) {
  return Number(reservation.totalAmount ?? 0);
}

function mapReservations(vehicle: VehicleWithFleetDetails): ReservationHistory[] {
  return vehicle.reservations.map((reservation) => {
    const name = customerName(reservation);
    return {
      id: reservation.code,
      clientName: name,
      clientInitials: initials(name),
      startDate: reservation.startsAt.toISOString(),
      endDate: reservation.endsAt.toISOString(),
      days: reservationDays(reservation.startsAt, reservation.endsAt),
      amount: reservationAmount(reservation),
      status:
        reservation.status === "cancelled"
          ? "cancelled"
          : reservation.status === "completed"
            ? "completed"
            : reservation.status === "active"
              ? "active"
              : "confirmed",
    };
  });
}

export function mapVehicleToCar(vehicle: VehicleWithFleetDetails): Car {
  const insurance = vehicle.vehicleInsurances[0];
  const registration = vehicle.vehicleRegistrations[0];
  const vignette = vehicle.vehicleVignettes[0];
  const inspection = vehicle.vehicleInspections[0];
  const mileage = vehicle.vehicleMileageLogs[0]?.mileage ?? 0;
  const insuranceDays = daysUntil(insurance?.expiresAt);
  const vignetteDays = daysUntil(vignette?.expiresAt);
  const inspectionDays = daysUntil(inspection?.expiresAt);
  const reservations = mapReservations(vehicle);
  const revenue = reservations
    .filter((reservation) => reservation.status !== "cancelled")
    .reduce((sum, reservation) => sum + reservation.amount, 0);
  const expenses = vehicle.vehicleMaintenances.reduce(
    (sum, maintenance) => sum + Number(maintenance.cost ?? 0),
    0,
  );

  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color ?? "",
    plate: vehicle.plate,
    category: mapCategoryName(vehicle.category.name),
    fuel: mapFuel(vehicle.fuelType),
    seats: vehicle.seats ?? 0,
    km: mileage,
    status: mapStatus(vehicle.status),
    priceDay: 0,
    priceWeek: 0,
    priceMonth: 0,
    insurance: {
      company: insurance?.provider ?? "",
      startDate: toIsoDate(insurance?.startsAt),
      endDate: toIsoDate(insurance?.expiresAt),
      status: documentStatus(insuranceDays),
      daysLeft: insuranceDays,
    },
    vignette: {
      year: vignette?.taxYear ?? new Date().getFullYear(),
      endDate: toIsoDate(vignette?.expiresAt),
      status: documentStatus(vignetteDays),
      daysLeft: vignetteDays,
    },
    visiteTechnique: {
      lastDate: toIsoDate(inspection?.inspectedAt),
      nextDate: toIsoDate(inspection?.expiresAt),
      status: documentStatus(inspectionDays),
      daysLeft: inspectionDays,
    },
    carteGriseUploaded: Boolean(registration?.documentUrl),
    creditAuto: null,
    revenue,
    expenses,
    occupancyRate: 0,
    totalDays: reservations.reduce(
      (sum, reservation) => sum + (reservation.status !== "cancelled" ? reservation.days : 0),
      0,
    ),
    recentExpenses: vehicle.vehicleMaintenances.map((maintenance) => ({
      type: "Maintenance",
      date: toIsoDate(maintenance.performedAt),
      amount: Number(maintenance.cost ?? 0),
      note: maintenance.description ?? maintenance.type,
    })),
    reservations,
    monthlyRevenue: Array.from({ length: 12 }, () => 0),
  };
}
