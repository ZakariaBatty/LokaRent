import { Prisma } from "@lokarent/db";
import {
  countDashboardExpiringDocuments,
  getDashboardAgencyCurrency,
  listDashboardActiveRentals,
  listDashboardBookedValueSeries,
  listDashboardTopCustomers,
  listDashboardTopVehicles,
  listDashboardUpcomingReturns,
  summarizeDashboardBookedValue,
  summarizeDashboardCustomers,
  summarizeDashboardFleet,
  summarizeDashboardOccupancy,
  summarizeDashboardReservations,
} from "../repositories/dashboard.repository";

export type DashboardServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
};

export type DashboardKpi = {
  id: "available" | "active" | "revenue" | "docs";
  value: number;
  suffix?: string;
  delta: string;
  deltaLabel: string;
  trend: "up" | "down" | "neutral";
  spark: number[];
};

export type DashboardChartPoint = {
  month: string;
  value: number;
};

export type DashboardFleetStatus = {
  id: "available" | "rented" | "maintenance" | "inactive";
  value: number;
  color: string;
};

export type DashboardRentalRow = {
  id: string;
  code: string;
  client: string;
  avatar: string;
  vehicle: string;
  plate: string;
  start: string;
  end: string;
  amount: number;
};

export type DashboardReturnRow = {
  id: string;
  vehicle: string;
  plate: string;
  client: string;
  time: string;
  soon: boolean;
};

export type DashboardTopVehicle = {
  id: string;
  name: string;
  plate: string;
  bookedValue: number;
  occupancy: number;
  trend: string;
};

export type DashboardTopClient = {
  id: string;
  name: string;
  initials: string;
  rentals: number;
  bookedValue: number;
  loyalty: "gold" | "silver";
};

export type DashboardAlerts = {
  total: number;
  expiringDocuments: number;
  overdueReturns: number;
};

export type DashboardOverview = {
  currency: string;
  kpis: DashboardKpi[];
  bookedValueSeries: DashboardChartPoint[];
  bookedValueDelta: number;
  fleetStatus: DashboardFleetStatus[];
  activeRentals: DashboardRentalRow[];
  upcomingReturns: DashboardReturnRow[];
  topVehicles: DashboardTopVehicle[];
  topClients: DashboardTopClient[];
  alerts: DashboardAlerts;
  customers: { active: number; newCustomers: number };
};

function decimal(value: unknown) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value as string | number);
}

function decimalNumber(value: Prisma.Decimal.Value | null | undefined) {
  return Number(decimal(value ?? 0).toFixed(2));
}

function deltaPercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) * 100) / previous).toFixed(1));
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function periodDays(from: Date, to: Date) {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

function monthLabel(value: Date) {
  return value.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
}

function dateLabel(value: Date) {
  return value.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function returnTimeLabel(value: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  const time = value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (value >= today && value < tomorrow) return `today|${time}`;
  if (value >= tomorrow && value < dayAfterTomorrow) return `tomorrow|${time}`;
  return `${dateLabel(value)}|${time}`;
}

function customerName(row: {
  customer?: {
    individual?: { firstName: string; lastName: string } | null;
    business?: { companyName: string } | null;
  };
  individualFirstName?: string | null;
  individualLastName?: string | null;
  businessName?: string | null;
}) {
  if (row.customer?.business?.companyName) return row.customer.business.companyName;
  if (row.businessName) return row.businessName;
  const firstName = row.customer?.individual?.firstName ?? row.individualFirstName;
  const lastName = row.customer?.individual?.lastName ?? row.individualLastName;
  return [firstName, lastName].filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function vehicleName(vehicle: { brand: string; model: string }) {
  return [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
}

function sparkFrom(...values: number[]) {
  return values.map((value) => Math.max(0, Math.round(value)));
}

export async function getDashboardOverviewService(input: DashboardServiceContext): Promise<DashboardOverview> {
  const currencySource = await getDashboardAgencyCurrency(input);
  const currency = (currencySource?.currency ?? currencySource?.company.currency ?? "MAD").trim().toUpperCase();
  const now = new Date();
  const from = startOfMonth(now);
  const to = addMonths(from, 1);
  const chartFrom = addMonths(from, -5);
  const previousFrom = addMonths(from, -1);
  const next30Days = addDays(now, 30);
  const next48h = new Date(now);
  next48h.setHours(next48h.getHours() + 48);

  const periodScope = { companyId: input.companyId, agencyId: input.agencyId, from, to };
  const currencyScope = { ...periodScope, currency };

  const [
    fleet,
    reservationSummary,
    customerSummary,
    bookedValue,
    seriesRows,
    occupancyRows,
    expiringDocuments,
    activeRentals,
    upcomingReturns,
    topVehicles,
    topCustomers,
  ] = await Promise.all([
    summarizeDashboardFleet({ companyId: input.companyId, agencyId: input.agencyId, now }),
    summarizeDashboardReservations({ ...periodScope, now }),
    summarizeDashboardCustomers(periodScope),
    summarizeDashboardBookedValue(currencyScope),
    listDashboardBookedValueSeries({ ...currencyScope, from: chartFrom, to }),
    summarizeDashboardOccupancy(periodScope),
    countDashboardExpiringDocuments({ companyId: input.companyId, agencyId: input.agencyId, now, to: next30Days }),
    listDashboardActiveRentals({ companyId: input.companyId, agencyId: input.agencyId, now, currency, take: 5 }),
    listDashboardUpcomingReturns({ companyId: input.companyId, agencyId: input.agencyId, now, to: next48h, take: 4 }),
    listDashboardTopVehicles({ ...currencyScope, take: 3 }),
    listDashboardTopCustomers({ ...currencyScope, take: 3 }),
  ]);

  const currentBookedValue = decimalNumber(bookedValue.current);
  const previousBookedValue = decimalNumber(bookedValue.previous);
  const bookedValueDelta = deltaPercent(currentBookedValue, previousBookedValue);
  const months = Array.from({ length: 6 }, (_, index) => addMonths(chartFrom, index));
  const seriesByMonth = new Map(seriesRows.map((row) => [row.month.toISOString().slice(0, 7), decimalNumber(row.amount)]));
  const bookedValueSeries = months.map((month) => ({
    month: monthLabel(month),
    value: seriesByMonth.get(month.toISOString().slice(0, 7)) ?? 0,
  }));

  const expiringDocumentCount =
    expiringDocuments.insurances +
    expiringDocuments.registrations +
    expiringDocuments.vignettes +
    expiringDocuments.inspections;
  const available = Math.max(0, fleet.total - fleet.rented - fleet.maintenance - fleet.inactive);
  const fleetStatusRows: DashboardFleetStatus[] = [
    { id: "available", value: available, color: "#10b981" },
    { id: "rented", value: fleet.rented, color: "#3b82f6" },
    { id: "maintenance", value: fleet.maintenance, color: "#f59e0b" },
    { id: "inactive", value: fleet.inactive, color: "#ef4444" },
  ];
  const fleetStatus = fleetStatusRows.filter((status) => status.value > 0);

  const occupancy = occupancyRows[0];
  const dashboardPeriodDays = periodDays(from, to);
  const occupancyRate =
    occupancy && Number(occupancy.vehicleCount) > 0
      ? Math.round((decimalNumber(occupancy.reservedDays) * 100) / (Number(occupancy.vehicleCount) * dashboardPeriodDays))
      : 0;

  const kpis: DashboardKpi[] = [
    {
      id: "available",
      value: available,
      suffix: ` / ${fleet.total}`,
      delta: String(available),
      deltaLabel: "dashboard.kpi.availableDelta",
      trend: available > 0 ? "up" : "neutral",
      spark: sparkFrom(available - 2, available - 1, available, available - 1, available, available + 1, available),
    },
    {
      id: "active",
      value: reservationSummary.active,
      delta: reservationSummary.overdueReturns > 0 ? String(reservationSummary.overdueReturns) : "0",
      deltaLabel:
        reservationSummary.overdueReturns > 0 ? "dashboard.kpi.overdueReturnsDelta" : "dashboard.kpi.allCurrentDelta",
      trend: reservationSummary.overdueReturns > 0 ? "down" : "up",
      spark: sparkFrom(
        reservationSummary.active - 2,
        reservationSummary.active - 1,
        reservationSummary.active,
        reservationSummary.active,
        reservationSummary.active + 1,
        reservationSummary.active,
        reservationSummary.active,
      ),
    },
    {
      id: "revenue",
      value: currentBookedValue,
      suffix: ` ${currency}`,
      delta: `${bookedValueDelta > 0 ? "+" : ""}${bookedValueDelta}%`,
      deltaLabel: "dashboard.kpi.vsLastMonth",
      trend: bookedValueDelta >= 0 ? "up" : "down",
      spark: bookedValueSeries.map((point) => Math.round(point.value / 1000)),
    },
    {
      id: "docs",
      value: expiringDocumentCount,
      delta: String(expiringDocumentCount),
      deltaLabel: expiringDocumentCount > 0 ? "dashboard.kpi.watchDelta" : "dashboard.kpi.validDelta",
      trend: expiringDocumentCount > 2 ? "down" : "neutral",
      spark: sparkFrom(1, 2, 1, 3, 2, expiringDocumentCount, expiringDocumentCount),
    },
  ];

  return {
    currency,
    kpis,
    bookedValueSeries,
    bookedValueDelta,
    fleetStatus,
    activeRentals: activeRentals.map((reservation) => {
      const name = customerName(reservation);
      const snapshot = reservation.pricingSnapshots[0];
      const amount =
        snapshot?.currency === currency
          ? decimalNumber(snapshot.totalAmount)
          : reservation.currency === currency
            ? decimalNumber(reservation.totalAmount)
            : 0;

      return {
        id: reservation.id,
        code: reservation.code,
        client: name,
        avatar: initials(name),
        vehicle: vehicleName(reservation.vehicle),
        plate: reservation.vehicle.plate,
        start: reservation.startsAt.toISOString(),
        end: reservation.endsAt.toISOString(),
        amount,
      };
    }),
    upcomingReturns: upcomingReturns.map((reservation) => {
      const name = customerName(reservation);
      return {
        id: reservation.id,
        vehicle: vehicleName(reservation.vehicle),
        plate: reservation.vehicle.plate,
        client: name,
        time: returnTimeLabel(reservation.endsAt, now),
        soon: reservation.endsAt.getTime() - now.getTime() <= 24 * 60 * 60 * 1000,
      };
    }),
    topVehicles: topVehicles.map((vehicle) => ({
      id: vehicle.vehicleId,
      name: vehicleName(vehicle),
      plate: vehicle.plate,
      bookedValue: decimalNumber(vehicle.bookedValue),
      occupancy: Math.min(100, Math.round((decimalNumber(vehicle.reservedDays) * 100) / dashboardPeriodDays)),
      trend: `+${Math.max(0, Math.round(decimalNumber(vehicle.reservedDays)))}d`,
    })),
    topClients: topCustomers.map((customer) => {
      const name = customerName(customer);
      const rentals = Number(customer.rentalCount);
      return {
        id: customer.customerId,
        name,
        initials: initials(name),
        rentals,
        bookedValue: decimalNumber(customer.bookedValue),
        loyalty: rentals >= 5 ? "gold" : "silver",
      };
    }),
    alerts: {
      total: expiringDocumentCount + reservationSummary.overdueReturns,
      expiringDocuments: expiringDocumentCount,
      overdueReturns: reservationSummary.overdueReturns,
    },
    customers: customerSummary,
  };
}

export const dashboardService = {
  getDashboardOverviewService,
};
