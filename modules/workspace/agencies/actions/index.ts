"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assignUserToAgencyService } from "@/modules/workspace/members/services/members.service";
import { ensureCompanySystemRolesService, listRolesService } from "@/modules/workspace/permissions/services/permissions.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  createAgencyService,
  deactivateAgencyService,
  updateAgencyService,
} from "../services/agencies.service";

export type WorkspaceAgencyActionResult =
  | { success: true; agencyId?: string }
  | { success: false; message: string; code?: string };

const addressSchema = z.object({
  line1: z.string().trim().max(180).optional(),
  city: z.string().trim().max(80).optional(),
});

const agencyPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(24),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().email().nullable().optional(),
  address: addressSchema.optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

const updateAgencySchema = agencyPayloadSchema.extend({
  agencyId: z.string().uuid(),
});

const deactivateAgencySchema = z.object({
  agencyId: z.string().uuid(),
});

function revalidateWorkspaceAgencies() {
  revalidatePath("/", "layout");
  revalidatePath("/workspace");
  revalidatePath("/workspace/agencies");
}

function resultForError(error: unknown): WorkspaceAgencyActionResult {
  if (!isAppError(error)) return { success: false, message: "workspace.agencies.messages.generic" };
  if (error.code === "FORBIDDEN") return { success: false, message: "workspace.agencies.messages.forbidden", code: error.code };
  if (error.code === "NOT_FOUND") return { success: false, message: "workspace.agencies.messages.notFound", code: error.code };
  if (error.code === "PLAN_LIMIT_EXCEEDED") return { success: false, message: "workspace.agencies.messages.planLimit", code: error.code };
  return { success: false, message: "workspace.agencies.messages.validation", code: error.code };
}

function toAgencyData(input: z.infer<typeof agencyPayloadSchema>) {
  const address = {
    line1: input.address?.line1 ?? "",
    city: input.address?.city ?? "",
  };
  return {
    name: input.name,
    code: input.code.toUpperCase(),
    phone: input.phone || null,
    email: input.email || null,
    address,
    status: input.status ?? "active",
  };
}

async function getDefaultAgencyAdminRole(companyId: string) {
  const roles = await listRolesService({ companyId, scope: "agency" });
  return roles.find((role) => role.name === "admin" && role.isSystem) ?? roles.find((role) => role.scope === "agency" && role.isSystem);
}

export async function createWorkspaceAgencyAction(input: unknown): Promise<WorkspaceAgencyActionResult> {
  const parsed = agencyPayloadSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.agencies.messages.validation" };

  try {
    const context = await requireCurrentCompanyContext();
    await requirePermission(PERMISSIONS.WORKSPACE_AGENCIES_CREATE, context);
    await ensureCompanySystemRolesService({ companyId: context.companyId });
    const role = await getDefaultAgencyAdminRole(context.companyId);
    if (!role) return { success: false, message: "workspace.agencies.messages.noAgencyRole", code: "NOT_FOUND" };

    const agency = await createAgencyService({
      companyId: context.companyId,
      userId: context.userId,
      actorName: "Workspace",
      data: toAgencyData(parsed.data),
    });

    await assignUserToAgencyService({
      companyId: context.companyId,
      agencyId: agency.id,
      userId: context.userId,
      actorName: "Workspace",
      data: {
        userId: context.userId,
        roleId: role.id,
        roleScope: "agency",
        isPrimary: false,
        status: "active",
        joinedAt: new Date(),
      },
    });

    revalidateWorkspaceAgencies();
    return { success: true, agencyId: agency.id };
  } catch (error) {
    return resultForError(error);
  }
}

export async function updateWorkspaceAgencyAction(input: unknown): Promise<WorkspaceAgencyActionResult> {
  const parsed = updateAgencySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.agencies.messages.validation" };

  try {
    const context = await requireCurrentCompanyContext();
    await requirePermission(PERMISSIONS.WORKSPACE_MEMBERS_MANAGE, context);
    await updateAgencyService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      userId: context.userId,
      actorName: "Workspace",
      data: toAgencyData(parsed.data),
    });
    revalidateWorkspaceAgencies();
    return { success: true, agencyId: parsed.data.agencyId };
  } catch (error) {
    return resultForError(error);
  }
}

export async function deactivateWorkspaceAgencyAction(input: unknown): Promise<WorkspaceAgencyActionResult> {
  const parsed = deactivateAgencySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.agencies.messages.validation" };

  try {
    const context = await requireCurrentCompanyContext();
    await requirePermission(PERMISSIONS.WORKSPACE_MEMBERS_MANAGE, context);
    await deactivateAgencyService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      userId: context.userId,
      actorName: "Workspace",
    });
    revalidateWorkspaceAgencies();
    return { success: true, agencyId: parsed.data.agencyId };
  } catch (error) {
    return resultForError(error);
  }
}
