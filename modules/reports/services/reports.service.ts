import {
  getAgencyDashboardCounts,
  listReportCancellationReasons,
  listReportCustomerSegments,
  listReportExpenseCategories,
  listReportTopCustomers,
  listReportVehicleOperations,
  listReportWeekdayLoad,
  getRevenueSummary,
  summarizeReportReservations,
} from "../repositories/reports.repository";
import {
  getFinanceOverviewReportService,
  listCustomerFinanceSummariesService,
  type FinanceOverviewReport,
  type FinanceReportingRange,
  type FinanceServiceContext,
} from "@/modules/finances/services/finances.service";

export type ReportsPeriod = FinanceReportingRange;

export type ReportsKpi = {
  revenue: number;
  revenueDelta: number;
  rentals: number;
  rentalsDelta: number;
  avgDuration: number;
  avgDurationDelta: number;
  fleetOccupancy: number;
  fleetOccupancyDelta: number;
  avgTicket: number;
  avgTicketDelta: number;
  netProfit: number;
  netProfitDelta: number;
};

export type ReportsVehicleRow = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  category: string;
  rentals: number;
  daysRented: number;
  daysAvailable: number;
  revenue: number;
  expenses: number;
  profit: number;
  roi: number;
  occupancy: number;
  avgRevenuePerDay: number;
  trend: "up" | "down" | "flat";
};

export type ReportsClientRow = {
  id: string;
  name: string;
  initials: string;
  nationality: string;
  isMoroccan: boolean;
  rentals: number;
  totalSpent: number;
  lastVisit: string | null;
  loyalty: "vip" | "regular" | "new" | "inactive";
};

export type ReportsExpenseCategoryRow = {
  id: string;
  label: string;
  amount: number;
  prevAmount: number;
  color: string;
};

export type ReportsOverview = {
  period: ReportsPeriod;
  currency: string;
  finance: FinanceOverviewReport;
  kpi: ReportsKpi;
  revenueVsExpenses: FinanceOverviewReport["revenueVsExpenses"];
  vehicles: ReportsVehicleRow[];
  clients: ReportsClientRow[];
  customerSegments: Array<{ nameKey: "moroccan" | "foreign"; value: number; color: string }>;
  expensesByCategory: ReportsExpenseCategoryRow[];
  reservationFunnel: Array<{ stageKey: "requests" | "confirmed" | "completed" | "cancelled"; value: number; color: string }>;
  cancellationReasons: Array<{ reason: string | null; count: number }>;
  weekdayLoad: Array<{ dayKey: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; count: number }>;
  complianceItems: Array<{
    id: string;
    type: FinanceOverviewReport["upcomingCharges"][number]["type"];
    car: string;
    plate: string;
    expiresAt: string;
    daysLeft: number;
    estimatedCost: number;
    urgency: "expired" | "urgent" | "soon";
  }>;
  complianceTotalCost: number;
};

const expenseColors = ["#3b82f6", "#8b5cf6", "#f97316", "#475569", "#eab308", "#6366f1", "#10b981"];
const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function decimalNumber(value: unknown) {
  if (value && typeof value === "object" && "toFixed" in value) {
    return Number((value as { toFixed: (scale: number) => string }).toFixed(2));
  }
  return Number(Number(value ?? 0).toFixed(2));
}

function deltaPercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) * 100) / previous).toFixed(2));
}

function periodDays(period: FinanceOverviewReport["period"]) {
  return Math.max(1, Math.ceil((new Date(period.to).getTime() - new Date(period.from).getTime()) / 86_400_000));
}

function customerName(row: Awaited<ReturnType<typeof listReportTopCustomers>>[number]) {
  if (row.business?.companyName) return row.business.companyName;
  return [row.individual?.firstName, row.individual?.lastName].filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function loyaltyFor(rentals: number, totalSpent: number): ReportsClientRow["loyalty"] {
  if (rentals >= 8 || totalSpent >= 20_000) return "vip";
  if (rentals >= 3 || totalSpent >= 5_000) return "regular";
  if (rentals >= 1) return "new";
  return "inactive";
}

export async function getAgencyDashboardCountsService(input: {
  companyId: string;
  agencyId: string;
}) {
  return getAgencyDashboardCounts(input);
}

export async function getRevenueSummaryService(input: {
  companyId: string;
  agencyId: string;
  from?: Date;
  to?: Date;
}) {
  return getRevenueSummary(input);
}

export async function getDashboardSummaryService(input: {
  companyId: string;
  agencyId: string;
  from?: Date;
  to?: Date;
}) {
  const [counts, revenue] = await Promise.all([
    getAgencyDashboardCounts(input),
    getRevenueSummary(input),
  ]);
  return { counts, revenue };
}

export async function getReportsOverviewService(
  input: FinanceServiceContext & {
    range?: ReportsPeriod;
    customFrom?: Date | null;
    customTo?: Date | null;
    currency?: string | null;
  },
): Promise<ReportsOverview> {
  const finance = await getFinanceOverviewReportService(input);
  const from = new Date(finance.period.from);
  const to = new Date(finance.period.to);
  const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
  const scope = { companyId: input.companyId, agencyId: input.agencyId, from, to };

  const [
    reservationSummary,
    previousReservationSummary,
    vehicleOperations,
    expenseCategories,
    customerRows,
    customerSegments,
    weekdayRows,
    cancellationRows,
  ] = await Promise.all([
    summarizeReportReservations(scope),
    summarizeReportReservations({ ...scope, from: previousFrom, to: from }),
    listReportVehicleOperations(scope),
    listReportExpenseCategories({ ...scope, currency: finance.currency }),
    listReportTopCustomers(scope),
    listReportCustomerSegments(scope),
    listReportWeekdayLoad(scope),
    listReportCancellationReasons(scope),
  ]);

  const periodDayCount = periodDays(finance.period);
  const totalVehicleDays = Math.max(1, reservationSummary.vehicleCount * periodDayCount);
  const fleetOccupancy = Math.round((decimalNumber(reservationSummary.reservedDays) * 100) / totalVehicleDays);
  const previousPeriodDays = Math.max(1, Math.ceil((from.getTime() - previousFrom.getTime()) / 86_400_000));
  const previousVehicleDays = Math.max(1, previousReservationSummary.vehicleCount * previousPeriodDays);
  const previousFleetOccupancy = Math.round(
    (decimalNumber(previousReservationSummary.reservedDays) * 100) / previousVehicleDays,
  );
  const avgTicket = reservationSummary.total > 0 ? finance.summary.totalRevenue / reservationSummary.total : 0;
  const previousRevenue =
    finance.summary.revenueDelta === -100
      ? 0
      : finance.summary.totalRevenue / (1 + finance.summary.revenueDelta / 100);
  const previousAvgTicket = previousReservationSummary.total > 0 ? previousRevenue / previousReservationSummary.total : 0;

  const operationByVehicle = new Map(vehicleOperations.map((row) => [row.vehicleId, row]));
  const vehicles = finance.vehicles.map((vehicle) => {
    const operations = operationByVehicle.get(vehicle.id);
    const daysRented = Math.round(decimalNumber(operations?.daysRented));
    const daysAvailable = Math.max(0, periodDayCount - daysRented);
    const roi = vehicle.expenses > 0 ? Number(((vehicle.profit * 100) / vehicle.expenses).toFixed(1)) : 0;

    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      category: vehicle.category,
      rentals: Number(operations?.rentals ?? 0),
      daysRented,
      daysAvailable,
      revenue: vehicle.revenue,
      expenses: vehicle.expenses,
      profit: vehicle.profit,
      roi,
      occupancy: vehicle.occupancyRate,
      avgRevenuePerDay: daysRented > 0 ? Math.round(vehicle.revenue / daysRented) : 0,
      trend: vehicle.profit > 0 ? "up" : vehicle.profit < 0 ? "down" : "flat",
    } satisfies ReportsVehicleRow;
  });

  const customerFinance = await listCustomerFinanceSummariesService({
    companyId: input.companyId,
    agencyId: input.agencyId,
    customerIds: customerRows.map((customer) => customer.id),
    currency: finance.currency,
  });
  const clients = customerRows
    .map((customer) => {
      const name = customerName(customer);
      const summary = customerFinance[customer.id];
      const lastVisit = customer.reservations.reduce<string | null>((latest, reservation) => {
        const iso = reservation.startsAt.toISOString();
        return !latest || iso > latest ? iso : latest;
      }, null);

      return {
        id: customer.id,
        name,
        initials: initials(name),
        nationality: customer.individual?.nationality ?? "MA",
        isMoroccan: (customer.individual?.nationality ?? "MA") === "MA",
        rentals: customer.reservations.length,
        totalSpent: summary?.invoiced ?? 0,
        lastVisit,
        loyalty: loyaltyFor(customer.reservations.length, summary?.invoiced ?? 0),
      } satisfies ReportsClientRow;
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 6);

  const weekdayByNumber = new Map(weekdayRows.map((row) => [row.weekday, Number(row.count)]));
  const completed = reservationSummary.completed;
  const cancelled = reservationSummary.cancelled + reservationSummary.noShow;

  const complianceItems = finance.upcomingCharges.map((charge) => {
    const urgency: ReportsOverview["complianceItems"][number]["urgency"] =
      charge.urgency === "high" ? "urgent" : "soon";

    return {
      id: charge.id,
      type: charge.type,
      car: charge.carLabel,
      plate: charge.plate,
      expiresAt: charge.dueDate,
      daysLeft: charge.daysUntil,
      estimatedCost: charge.amount,
      urgency,
    };
  });

  return {
    period: finance.range,
    currency: finance.currency,
    finance,
    kpi: {
      revenue: finance.summary.totalRevenue,
      revenueDelta: finance.summary.revenueDelta,
      rentals: reservationSummary.total,
      rentalsDelta: deltaPercent(reservationSummary.total, reservationSummary.previousTotal),
      avgDuration: Number(reservationSummary.averageDays.toFixed(1)),
      avgDurationDelta: deltaPercent(reservationSummary.averageDays, previousReservationSummary.averageDays),
      fleetOccupancy,
      fleetOccupancyDelta: Number((fleetOccupancy - previousFleetOccupancy).toFixed(1)),
      avgTicket: Number(avgTicket.toFixed(2)),
      avgTicketDelta: deltaPercent(avgTicket, previousAvgTicket),
      netProfit: finance.summary.netProfit,
      netProfitDelta: finance.summary.profitDelta,
    },
    revenueVsExpenses: finance.revenueVsExpenses,
    vehicles,
    clients,
    customerSegments: [
      { nameKey: "moroccan", value: customerSegments.moroccan, color: "#3b82f6" },
      { nameKey: "foreign", value: customerSegments.foreign, color: "#f59e0b" },
    ],
    expensesByCategory: expenseCategories.map((row, index) => ({
      id: row.categoryId,
      label: row.label,
      amount: decimalNumber(row.amount),
      prevAmount: decimalNumber(row.prevAmount),
      color: expenseColors[index % expenseColors.length] ?? "#94a3b8",
    })),
    reservationFunnel: [
      { stageKey: "requests", value: reservationSummary.total, color: "#94a3b8" },
      {
        stageKey: "confirmed",
        value: Math.max(0, reservationSummary.total - cancelled),
        color: "#3b82f6",
      },
      { stageKey: "completed", value: completed, color: "#10b981" },
      { stageKey: "cancelled", value: cancelled, color: "#f43f5e" },
    ],
    cancellationReasons: cancellationRows.map((row) => ({
      reason: row.cancellationReason,
      count: row._count._all,
    })),
    weekdayLoad: dayKeys.map((dayKey, index) => ({ dayKey, count: weekdayByNumber.get(index + 1) ?? 0 })),
    complianceItems,
    complianceTotalCost: complianceItems.reduce((sum, item) => sum + item.estimatedCost, 0),
  };
}

export const reportsService = {
  getAgencyDashboardCountsService,
  getRevenueSummaryService,
  getDashboardSummaryService,
  getReportsOverviewService,
};
