import { createId } from "@/shared";
import {
  createActivityLog,
  createAuditLog,
  listActivityLogs,
  listAuditLogs,
} from "../repositories/activity.repository";

type AuditCreateData = Omit<Parameters<typeof createAuditLog>[0], "id" | "companyId" | "agencyId" | "userId">;
type ActivityCreateData = Omit<Parameters<typeof createActivityLog>[0], "id" | "companyId" | "agencyId" | "userId">;

export async function createAuditLogService(input: {
  companyId: string;
  agencyId?: string | null;
  userId?: string | null;
  data: AuditCreateData;
}) {
  return createAuditLog({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    agencyId: input.agencyId ?? null,
    userId: input.userId ?? null,
  });
}

export async function listAuditLogsService(input: {
  companyId: string;
  agencyId?: string | null;
  entityType?: string;
  entityId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}) {
  return listAuditLogs(input);
}

export async function createActivityLogService(input: {
  companyId: string;
  agencyId?: string | null;
  userId?: string | null;
  data: ActivityCreateData;
}) {
  return createActivityLog({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    agencyId: input.agencyId ?? null,
    userId: input.userId ?? null,
  });
}

export async function listActivityLogsService(input: {
  companyId: string;
  agencyId?: string | null;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
}) {
  return listActivityLogs(input);
}

export const activityService = {
  createAuditLogService,
  listAuditLogsService,
  createActivityLogService,
  listActivityLogsService,
};
