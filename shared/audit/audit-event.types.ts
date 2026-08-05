import type { Prisma } from "@lokarent/db";

export type AuditActor = {
  userId?: string | null;
  actorName?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditInput = AuditActor & {
  id: string;
  companyId: string;
  agencyId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Prisma.InputJsonValue;
};
