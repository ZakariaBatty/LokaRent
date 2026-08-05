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

export const activityRepository = {
  createAuditLog,
  listAuditLogs,
  createActivityLog,
  listActivityLogs,
};
