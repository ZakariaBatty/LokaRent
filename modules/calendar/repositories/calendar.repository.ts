import { prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function listCalendarReservations(
  input: { companyId: string; agencyId: string; from: Date; to: Date },
  db: DatabaseClient = prisma,
) {
  return db.reservation.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      startsAt: { lt: input.to },
      endsAt: { gt: input.from },
    },
    include: { customer: true, vehicle: true },
    orderBy: { startsAt: "asc" },
  });
}

export async function listCalendarAvailabilityBlocks(
  input: { companyId: string; agencyId: string; from: Date; to: Date },
  db: DatabaseClient = prisma,
) {
  return db.vehicleAvailabilityBlock.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
      startsAt: { lt: input.to },
      endsAt: { gt: input.from },
    },
    include: { vehicle: true },
    orderBy: { startsAt: "asc" },
  });
}

export const calendarRepository = {
  listCalendarReservations,
  listCalendarAvailabilityBlocks,
};
