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
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function daysUntil(value: Date | string | null | undefined) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function documentStatus(daysLeft: number | null): DocumentStatus {
  if (daysLeft === null) return "unknown";
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "warning";
  return "ok";
}

function documentDaysLeft(daysLeft: number | null) {
  return daysLeft ?? 0;
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

function resolvePricingRule(vehicle: VehicleWithFleetDetails) {
  return (
    vehicle.vehiclePricingRules[0] ??
    vehicle.category.pricingRules.find((rule) => rule.agencyId === vehicle.agencyId) ??
    null
  );
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
      amount: Number(reservation.totalAmount ?? 0),
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
  const pricingRule = resolvePricingRule(vehicle);
  const mileage = vehicle.vehicleMileageLogs[0]?.mileage ?? 0;
  const insuranceDays = daysUntil(insurance?.expiresAt);
  const registrationDays = daysUntil(registration?.expiresAt);
  const vignetteDays = daysUntil(vignette?.expiresAt);
  const inspectionDays = daysUntil(inspection?.expiresAt);
  const reservations = mapReservations(vehicle);

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
    priceDay: Number(pricingRule?.dailyRate ?? 0),
    priceWeek: Number(pricingRule?.weeklyRate ?? 0),
    priceMonth: Number(pricingRule?.monthlyRate ?? 0),
    depositAmount: pricingRule?.depositAmount === null || pricingRule?.depositAmount === undefined
      ? undefined
      : Number(pricingRule.depositAmount),
    mileageLimit: pricingRule?.mileageLimit ?? undefined,
    extraMileageRate: pricingRule?.extraMileageRate === null || pricingRule?.extraMileageRate === undefined
      ? undefined
      : Number(pricingRule.extraMileageRate),
    photos: vehicle.vehiclePhotos.map((photo) => ({
      url: photo.url,
      publicId: photo.publicId ?? undefined,
      mimeType: photo.mimeType ?? undefined,
      sizeBytes: photo.sizeBytes ?? undefined,
    })),
    insurance: {
      company: insurance?.provider ?? "",
      policyNumber: insurance?.policyNumber ?? undefined,
      startDate: toIsoDate(insurance?.startsAt),
      endDate: toIsoDate(insurance?.expiresAt),
      premiumAmount: insurance?.premiumAmount === null || insurance?.premiumAmount === undefined
        ? undefined
        : Number(insurance.premiumAmount),
      currency: insurance?.currency ?? undefined,
      documentUrl: insurance?.documentUrl ?? undefined,
      status: documentStatus(insuranceDays),
      daysLeft: documentDaysLeft(insuranceDays),
    },
    registration: registration
      ? {
          number: registration.registrationNumber,
          issuedAt: toIsoDate(registration.issuedAt),
          expiresAt: toIsoDate(registration.expiresAt),
          issuingAuthority: registration.issuingAuthority ?? undefined,
          documentUrl: registration.documentUrl ?? undefined,
          status: documentStatus(registrationDays),
          daysLeft: documentDaysLeft(registrationDays),
        }
      : null,
    vignette: {
      year: vignette?.taxYear ?? new Date().getFullYear(),
      paidAt: toIsoDate(vignette?.paidAt),
      endDate: toIsoDate(vignette?.expiresAt),
      amount: vignette?.amount === null || vignette?.amount === undefined ? undefined : Number(vignette.amount),
      currency: vignette?.currency ?? undefined,
      documentUrl: vignette?.documentUrl ?? undefined,
      status: documentStatus(vignetteDays),
      daysLeft: documentDaysLeft(vignetteDays),
    },
    visiteTechnique: {
      lastDate: toIsoDate(inspection?.inspectedAt),
      nextDate: toIsoDate(inspection?.expiresAt),
      result: inspection?.result ?? undefined,
      center: inspection?.center ?? undefined,
      cost: inspection?.cost === null || inspection?.cost === undefined ? undefined : Number(inspection.cost),
      currency: inspection?.currency ?? undefined,
      documentUrl: inspection?.documentUrl ?? undefined,
      status: documentStatus(inspectionDays),
      daysLeft: documentDaysLeft(inspectionDays),
    },
    carteGriseUploaded: Boolean(registration?.documentUrl),
    creditAuto: null,
    revenue: 0,
    expenses: 0,
    occupancyRate: 0,
    totalDays: reservations.reduce(
      (sum, reservation) => sum + (reservation.status !== "cancelled" ? reservation.days : 0),
      0,
    ),
    recentExpenses: [],
    reservations,
    monthlyRevenue: Array.from({ length: 12 }, () => 0),
  };
}
