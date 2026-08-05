import type { DatabaseClient } from "@/shared/database";
import { prisma } from "@/shared/database";
import { createActivityLog, createAuditLog } from "@/modules/workspace/activity/repositories/activity.repository";
import type { AuditInput } from "./audit-event.types";

export async function writeAuditLog(input: AuditInput, db: DatabaseClient = prisma) {
  return createAuditLog(
    {
      id: input.id,
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      ...(input.changes === undefined ? {} : { changes: input.changes }),
    },
    db,
  );
}

export async function writeActivityLog(
  input: Omit<AuditInput, "action" | "changes" | "ipAddress" | "userAgent"> & {
    verb: string;
    metadata?: AuditInput["changes"];
  },
  db: DatabaseClient = prisma,
) {
  return createActivityLog(
    {
      id: input.id,
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      userId: input.userId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      verb: input.verb,
      actorName: input.actorName ?? "System",
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
    },
    db,
  );
}
