import { Prisma, ReservationStatus, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export type ReportsPeriodInput = {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
};

const occupiedReservationStatusSql = Prisma.join(
  [ReservationStatus.confirmed, ReservationStatus.active, ReservationStatus.completed].map(
    (status) => Prisma.sql`${status}::"ReservationStatus"`,
  ),
);

export async function getAgencyDashboardCounts(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  const [vehicles, customers, activeReservations, overdueInvoices, openExpenses] = await Promise.all([
    db.vehicle.count({ where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null } }),
    db.customer.count({ where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null } }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: { in: ["confirmed", "active"] },
      },
    }),
    db.invoice.count({
      where: { companyId: input.companyId, agencyId: input.agencyId, status: "overdue", deletedAt: null },
    }),
    db.expense.count({
      where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    }),
  ]);

  return { vehicles, customers, activeReservations, overdueInvoices, openExpenses };
}

export async function getRevenueSummary(
  input: { companyId: string; agencyId: string; from?: Date; to?: Date },
  db: DatabaseClient = prisma,
) {
  const [invoices, payments, expenses] = await Promise.all([
    db.invoice.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        ...(input.from || input.to ? { paidAt: { gte: input.from, lte: input.to } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.expense.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        ...(input.from || input.to ? { occurredAt: { gte: input.from, lte: input.to } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return { invoices, payments, expenses };
}

export async function summarizeReportReservations(
  input: ReportsPeriodInput,
  db: DatabaseClient = prisma,
) {
  const [total, previousTotal, completed, cancelled, noShow, duration, occupancyRows] = await Promise.all([
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        startsAt: { gte: input.from, lt: input.to },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        startsAt: {
          gte: new Date(input.from.getTime() - (input.to.getTime() - input.from.getTime())),
          lt: input.from,
        },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.completed,
        startsAt: { gte: input.from, lt: input.to },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.cancelled,
        startsAt: { gte: input.from, lt: input.to },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.no_show,
        startsAt: { gte: input.from, lt: input.to },
      },
    }),
    db.reservation.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        startsAt: { gte: input.from, lt: input.to },
      },
      _avg: { days: true },
    }),
    db.$queryRaw<{ reservedDays: Prisma.Decimal | null; vehicleCount: bigint }[]>`
      SELECT
        COALESCE(
          SUM(
            EXTRACT(
              EPOCH FROM (
                LEAST(r.ends_at, ${input.to})
                - GREATEST(r.starts_at, ${input.from})
              )
            ) / 86400
          ),
          0
        )::numeric AS "reservedDays",
        (
          SELECT COUNT(*)
          FROM vehicles v
          WHERE v.company_id = ${input.companyId}::uuid
            AND v.agency_id = ${input.agencyId}::uuid
            AND v.deleted_at IS NULL
        ) AS "vehicleCount"
      FROM reservations r
      WHERE r.company_id = ${input.companyId}::uuid
        AND r.agency_id = ${input.agencyId}::uuid
        AND r.deleted_at IS NULL
        AND r.status IN (${occupiedReservationStatusSql})
        AND r.starts_at < ${input.to}
        AND r.ends_at > ${input.from}
    `,
  ]);

  return {
    total,
    previousTotal,
    completed,
    cancelled,
    noShow,
    averageDays: duration._avg.days ?? 0,
    reservedDays: occupancyRows[0]?.reservedDays ?? new Prisma.Decimal(0),
    vehicleCount: Number(occupancyRows[0]?.vehicleCount ?? 0),
  };
}

export async function listReportVehicleOperations(
  input: ReportsPeriodInput,
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<
    {
      vehicleId: string;
      rentals: bigint;
      daysRented: Prisma.Decimal | null;
    }[]
  >`
    SELECT
      vehicle_id AS "vehicleId",
      COUNT(*)::bigint AS rentals,
      COALESCE(
        SUM(
          EXTRACT(
            EPOCH FROM (
              LEAST(ends_at, ${input.to})
              - GREATEST(starts_at, ${input.from})
            )
          ) / 86400
        ),
        0
      )::numeric AS "daysRented"
    FROM reservations
    WHERE company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
      AND deleted_at IS NULL
      AND status IN (${occupiedReservationStatusSql})
      AND starts_at < ${input.to}
      AND ends_at > ${input.from}
    GROUP BY vehicle_id
  `;
}

export async function listReportExpenseCategories(
  input: ReportsPeriodInput & { currency: string },
  db: DatabaseClient = prisma,
) {
  const previousFrom = new Date(input.from.getTime() - (input.to.getTime() - input.from.getTime()));

  return db.$queryRaw<
    {
      categoryId: string;
      label: string;
      amount: Prisma.Decimal | null;
      prevAmount: Prisma.Decimal | null;
    }[]
  >`
    SELECT
      c.id AS "categoryId",
      c.name AS label,
      COALESCE(SUM(e.amount) FILTER (
        WHERE e.occurred_at >= ${input.from}
          AND e.occurred_at < ${input.to}
      ), 0)::numeric AS amount,
      COALESCE(SUM(e.amount) FILTER (
        WHERE e.occurred_at >= ${previousFrom}
          AND e.occurred_at < ${input.from}
      ), 0)::numeric AS "prevAmount"
    FROM expense_categories c
    JOIN expenses e ON e.category_id = c.id
    WHERE e.company_id = ${input.companyId}::uuid
      AND e.agency_id = ${input.agencyId}::uuid
      AND e.deleted_at IS NULL
      AND e.currency = ${input.currency}
      AND e.occurred_at >= ${previousFrom}
      AND e.occurred_at < ${input.to}
    GROUP BY c.id, c.name
    ORDER BY amount DESC, c.name ASC
  `;
}

export async function listReportTopCustomers(
  input: ReportsPeriodInput,
  db: DatabaseClient = prisma,
) {
  return db.customer.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      reservations: {
        some: {
          companyId: input.companyId,
          agencyId: input.agencyId,
          deletedAt: null,
          startsAt: { gte: input.from, lt: input.to },
        },
      },
    },
    select: {
      id: true,
      type: true,
      individual: { select: { firstName: true, lastName: true, nationality: true } },
      business: { select: { companyName: true } },
      reservations: {
        where: {
          companyId: input.companyId,
          agencyId: input.agencyId,
          deletedAt: null,
          startsAt: { gte: input.from, lt: input.to },
        },
        select: { startsAt: true },
      },
    },
    take: 50,
  });
}

export async function listReportCustomerSegments(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  const [moroccan, foreign] = await Promise.all([
    db.customer.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        individual: { nationality: "MA" },
      },
    }),
    db.customer.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        OR: [{ individual: null }, { individual: { nationality: { not: "MA" } } }],
      },
    }),
  ]);

  return { moroccan, foreign };
}

export async function listReportWeekdayLoad(
  input: ReportsPeriodInput,
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<{ weekday: number; count: bigint }[]>`
    SELECT EXTRACT(ISODOW FROM starts_at)::int AS weekday, COUNT(*)::bigint AS count
    FROM reservations
    WHERE company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
      AND deleted_at IS NULL
      AND starts_at >= ${input.from}
      AND starts_at < ${input.to}
    GROUP BY EXTRACT(ISODOW FROM starts_at)::int
    ORDER BY weekday ASC
  `;
}

export async function listReportCancellationReasons(
  input: ReportsPeriodInput,
  db: DatabaseClient = prisma,
) {
  return db.reservation.groupBy({
    by: ["cancellationReason"],
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      status: ReservationStatus.cancelled,
      startsAt: { gte: input.from, lt: input.to },
      cancellationReason: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { cancellationReason: "desc" } },
    take: 6,
  });
}

export const reportsRepository = {
  getAgencyDashboardCounts,
  getRevenueSummary,
  summarizeReportReservations,
  listReportVehicleOperations,
  listReportExpenseCategories,
  listReportTopCustomers,
  listReportCustomerSegments,
  listReportWeekdayLoad,
  listReportCancellationReasons,
};
