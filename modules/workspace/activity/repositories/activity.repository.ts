import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function createAuditLog(
  data: Prisma.AuditLogUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.auditLog.create({ data });
}

export async function listAuditLogs(
  input: {
    companyId: string;
    agencyId?: string | null;
    entityType?: string;
    entityId?: string;
    userId?: string;
    from?: Date;
    to?: Date;
  },
  db: DatabaseClient = prisma,
) {
  return db.auditLog.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createActivityLog(
  data: Prisma.ActivityLogUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.activityLog.create({ data });
}

export async function listActivityLogs(
  input: {
    companyId: string;
    agencyId?: string | null;
    entityType?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
  },
  db: DatabaseClient = prisma,
) {
  return db.activityLog.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      entityType: input.entityType,
      entityId: input.entityId,
      ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export type ActivityFeedFilters = {
  companyId: string;
  agencyId?: string | null;
  entityType?: string;
  verb?: string;
  search?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

function activityFeedWhere(input: ActivityFeedFilters): Prisma.ActivityLogWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: input.entityType,
    verb: input.verb,
    ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
    ...(input.search
      ? {
          OR: [
            { actorName: { contains: input.search, mode: "insensitive" } },
            { verb: { contains: input.search, mode: "insensitive" } },
            { entityType: { contains: input.search, mode: "insensitive" } },
            { agency: { name: { contains: input.search, mode: "insensitive" } } },
            { user: { fullName: { contains: input.search, mode: "insensitive" } } },
            { user: { email: { contains: input.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

export async function listActivityFeed(
  input: ActivityFeedFilters,
  db: DatabaseClient = prisma,
) {
  const where = activityFeedWhere(input);
  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: {
        agency: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: input.pageSize,
    }),
    db.activityLog.count({ where }),
  ]);

  return { items, total };
}

export async function listActivityFilterOptions(
  input: { companyId: string },
  db: DatabaseClient = prisma,
) {
  const [verbs, entityTypes] = await Promise.all([
    db.activityLog.findMany({
      where: { companyId: input.companyId },
      distinct: ["verb"],
      select: { verb: true },
      orderBy: { verb: "asc" },
    }),
    db.activityLog.findMany({
      where: { companyId: input.companyId },
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
  ]);

  return {
    verbs: verbs.map((item) => item.verb),
    entityTypes: entityTypes.map((item) => item.entityType),
  };
}

export const activityRepository = {
  createAuditLog,
  listAuditLogs,
  createActivityLog,
  listActivityLogs,
  listActivityFeed,
  listActivityFilterOptions,
};
