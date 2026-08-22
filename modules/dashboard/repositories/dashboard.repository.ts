import {
  CustomerStatus,
  Prisma,
  ReservationStatus,
  VehicleStatus,
  prisma,
} from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export type DashboardPeriodInput = {
  companyId: string;
  agencyId: string;
  from: Date;
  to: Date;
};

export type DashboardCurrencyInput = DashboardPeriodInput & {
  currency: string;
};

const bookedReservationStatuses = [
  ReservationStatus.confirmed,
  ReservationStatus.active,
  ReservationStatus.completed,
] as const;

const bookedReservationStatusSql = Prisma.join(
  bookedReservationStatuses.map((status) => Prisma.sql`${status}::"ReservationStatus"`),
);

export async function getDashboardAgencyCurrency(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  return db.agency.findFirst({
    where: { id: input.agencyId, companyId: input.companyId, deletedAt: null },
    select: { currency: true, company: { select: { currency: true } } },
  });
}

export async function summarizeDashboardFleet(
  input: { companyId: string; agencyId: string; now: Date },
  db: DatabaseClient = prisma,
) {
  const [total, available, maintenance, inactive, activeRentals] = await Promise.all([
    db.vehicle.count({
      where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    }),
    db.vehicle.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: VehicleStatus.available,
      },
    }),
    db.vehicle.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: VehicleStatus.maintenance,
      },
    }),
    db.vehicle.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: { in: [VehicleStatus.inactive, VehicleStatus.retired] },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.active,
        startsAt: { lte: input.now },
        endsAt: { gt: input.now },
      },
    }),
  ]);

  return {
    total,
    available,
    rented: activeRentals,
    maintenance,
    inactive,
  };
}

export async function summarizeDashboardReservations(
  input: DashboardPeriodInput & { now: Date },
  db: DatabaseClient = prisma,
) {
  const todayStart = new Date(input.now.getFullYear(), input.now.getMonth(), input.now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const next48h = new Date(input.now);
  next48h.setHours(next48h.getHours() + 48);

  const [total, active, returnsToday, overdueReturns, upcomingReturns] = await Promise.all([
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
        status: ReservationStatus.active,
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.active,
        endsAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.active,
        endsAt: { lt: input.now },
      },
    }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: ReservationStatus.active,
        endsAt: { gte: input.now, lte: next48h },
      },
    }),
  ]);

  return { total, active, returnsToday, overdueReturns, upcomingReturns };
}

export async function summarizeDashboardCustomers(
  input: DashboardPeriodInput,
  db: DatabaseClient = prisma,
) {
  const [active, newCustomers] = await Promise.all([
    db.customer.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: CustomerStatus.active,
      },
    }),
    db.customer.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        createdAt: { gte: input.from, lt: input.to },
      },
    }),
  ]);

  return { active, newCustomers };
}

export async function summarizeDashboardBookedValue(
  input: DashboardCurrencyInput,
  db: DatabaseClient = prisma,
) {
  const previousFrom = new Date(input.from.getTime() - (input.to.getTime() - input.from.getTime()));

  const [current, previous] = await Promise.all([
    db.reservationPricingSnapshot.aggregate({
      where: {
        companyId: input.companyId,
        isCurrent: true,
        currency: input.currency,
        reservation: {
          companyId: input.companyId,
          agencyId: input.agencyId,
          deletedAt: null,
          status: { in: [...bookedReservationStatuses] },
          startsAt: { gte: input.from, lt: input.to },
        },
      },
      _sum: { totalAmount: true },
    }),
    db.reservationPricingSnapshot.aggregate({
      where: {
        companyId: input.companyId,
        isCurrent: true,
        currency: input.currency,
        reservation: {
          companyId: input.companyId,
          agencyId: input.agencyId,
          deletedAt: null,
          status: { in: [...bookedReservationStatuses] },
          startsAt: { gte: previousFrom, lt: input.from },
        },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  return {
    current: current._sum.totalAmount,
    previous: previous._sum.totalAmount,
  };
}

export async function listDashboardBookedValueSeries(
  input: DashboardCurrencyInput,
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<{ month: Date; amount: Prisma.Decimal | null }[]>`
    SELECT
      DATE_TRUNC('month', r.starts_at)::date AS month,
      COALESCE(SUM(s.total_amount), 0)::numeric AS amount
    FROM reservation_pricing_snapshots s
    JOIN reservations r ON r.id = s.reservation_id
    WHERE s.company_id = ${input.companyId}::uuid
      AND s.is_current = true
      AND s.currency = ${input.currency}
      AND r.company_id = ${input.companyId}::uuid
      AND r.agency_id = ${input.agencyId}::uuid
      AND r.deleted_at IS NULL
      AND r.status IN (${bookedReservationStatusSql})
      AND r.starts_at >= ${input.from}
      AND r.starts_at < ${input.to}
    GROUP BY DATE_TRUNC('month', r.starts_at)::date
    ORDER BY month ASC
  `;
}

export async function summarizeDashboardOccupancy(
  input: DashboardPeriodInput,
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<{ reservedDays: Prisma.Decimal | null; vehicleCount: bigint }[]>`
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
      AND r.status IN (${bookedReservationStatusSql})
      AND r.starts_at < ${input.to}
      AND r.ends_at > ${input.from}
  `;
}

export async function countDashboardExpiringDocuments(
  input: { companyId: string; agencyId: string; now: Date; to: Date },
  db: DatabaseClient = prisma,
) {
  const [insurances, registrations, vignettes, inspections] = await Promise.all([
    db.vehicleInsurance.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        expiresAt: { gte: input.now, lte: input.to },
      },
    }),
    db.vehicleRegistration.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        expiresAt: { gte: input.now, lte: input.to },
      },
    }),
    db.vehicleVignette.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        expiresAt: { gte: input.now, lte: input.to },
      },
    }),
    db.vehicleInspection.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        expiresAt: { gte: input.now, lte: input.to },
      },
    }),
  ]);

  return { insurances, registrations, vignettes, inspections };
}

export async function listDashboardActiveRentals(
  input: { companyId: string; agencyId: string; now: Date; currency: string; take: number },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      status: ReservationStatus.active,
    },
    select: {
      id: true,
      code: true,
      startsAt: true,
      endsAt: true,
      totalAmount: true,
      currency: true,
      customer: {
        select: {
          individual: { select: { firstName: true, lastName: true } },
          business: { select: { companyName: true } },
        },
      },
      vehicle: { select: { brand: true, model: true, plate: true } },
      pricingSnapshots: {
        where: { isCurrent: true, currency: input.currency },
        select: { totalAmount: true, currency: true },
        take: 1,
      },
    },
    orderBy: { endsAt: "asc" },
    take: input.take,
  });
}

export async function listDashboardUpcomingReturns(
  input: { companyId: string; agencyId: string; now: Date; to: Date; take: number },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      status: ReservationStatus.active,
      endsAt: { gte: input.now, lte: input.to },
    },
    select: {
      id: true,
      code: true,
      endsAt: true,
      customer: {
        select: {
          individual: { select: { firstName: true, lastName: true } },
          business: { select: { companyName: true } },
        },
      },
      vehicle: { select: { brand: true, model: true, plate: true } },
    },
    orderBy: { endsAt: "asc" },
    take: input.take,
  });
}

export async function listDashboardTopVehicles(
  input: DashboardCurrencyInput & { take: number },
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<
    {
      vehicleId: string;
      brand: string;
      model: string;
      plate: string;
      bookedValue: Prisma.Decimal | null;
      rentalCount: bigint;
      reservedDays: Prisma.Decimal | null;
    }[]
  >`
    SELECT
      v.id AS "vehicleId",
      v.brand,
      v.model,
      v.plate,
      COALESCE(SUM(s.total_amount), 0)::numeric AS "bookedValue",
      COUNT(DISTINCT r.id)::bigint AS "rentalCount",
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
      )::numeric AS "reservedDays"
    FROM vehicles v
    JOIN reservations r ON r.vehicle_id = v.id
    JOIN reservation_pricing_snapshots s ON s.reservation_id = r.id
    WHERE v.company_id = ${input.companyId}::uuid
      AND v.agency_id = ${input.agencyId}::uuid
      AND v.deleted_at IS NULL
      AND r.company_id = ${input.companyId}::uuid
      AND r.agency_id = ${input.agencyId}::uuid
      AND r.deleted_at IS NULL
      AND r.status IN (${bookedReservationStatusSql})
      AND r.starts_at < ${input.to}
      AND r.ends_at > ${input.from}
      AND s.company_id = ${input.companyId}::uuid
      AND s.is_current = true
      AND s.currency = ${input.currency}
    GROUP BY v.id, v.brand, v.model, v.plate
    ORDER BY "bookedValue" DESC, "rentalCount" DESC, v.brand ASC
    LIMIT ${input.take}
  `;
}

export async function listDashboardTopCustomers(
  input: DashboardCurrencyInput & { take: number },
  db: DatabaseClient = prisma,
) {
  return db.$queryRaw<
    {
      customerId: string;
      individualFirstName: string | null;
      individualLastName: string | null;
      businessName: string | null;
      bookedValue: Prisma.Decimal | null;
      rentalCount: bigint;
    }[]
  >`
    SELECT
      c.id AS "customerId",
      ci.first_name AS "individualFirstName",
      ci.last_name AS "individualLastName",
      cb.company_name AS "businessName",
      COALESCE(SUM(s.total_amount), 0)::numeric AS "bookedValue",
      COUNT(DISTINCT r.id)::bigint AS "rentalCount"
    FROM customers c
    JOIN reservations r ON r.customer_id = c.id
    JOIN reservation_pricing_snapshots s ON s.reservation_id = r.id
    LEFT JOIN customer_individuals ci ON ci.customer_id = c.id
    LEFT JOIN customer_businesses cb ON cb.customer_id = c.id
    WHERE c.company_id = ${input.companyId}::uuid
      AND c.agency_id = ${input.agencyId}::uuid
      AND c.deleted_at IS NULL
      AND r.company_id = ${input.companyId}::uuid
      AND r.agency_id = ${input.agencyId}::uuid
      AND r.deleted_at IS NULL
      AND r.status IN (${bookedReservationStatusSql})
      AND r.starts_at >= ${input.from}
      AND r.starts_at < ${input.to}
      AND s.company_id = ${input.companyId}::uuid
      AND s.is_current = true
      AND s.currency = ${input.currency}
    GROUP BY c.id, ci.first_name, ci.last_name, cb.company_name
    ORDER BY "bookedValue" DESC, "rentalCount" DESC
    LIMIT ${input.take}
  `;
}

export const dashboardRepository = {
  getDashboardAgencyCurrency,
  summarizeDashboardFleet,
  summarizeDashboardReservations,
  summarizeDashboardCustomers,
  summarizeDashboardBookedValue,
  listDashboardBookedValueSeries,
  summarizeDashboardOccupancy,
  countDashboardExpiringDocuments,
  listDashboardActiveRentals,
  listDashboardUpcomingReturns,
  listDashboardTopVehicles,
  listDashboardTopCustomers,
};
