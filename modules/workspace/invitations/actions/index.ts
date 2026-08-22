"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAgencyService, getCompanyService, getCompanyUsageCountsService } from "@/modules/workspace/agencies/services/agencies.service";
import { getPlanLimitService } from "@/modules/workspace/billing/services/billing.service";
import { getRoleService } from "@/modules/workspace/permissions/services/permissions.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  createInvitationService,
  generateInvitationToken,
  hashInvitationToken,
  revokeInvitationService,
} from "../services/invitations.service";

export type WorkspaceInvitationActionResult =
  | { success: true; inviteUrl?: string }
  | { success: false; message: string; code?: string };

const createInvitationSchema = z.object({
  email: z.string().trim().email(),
  agencyId: z.string().uuid().nullable().optional(),
  roleId: z.string().uuid(),
});

const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

function resultForError(error: unknown): WorkspaceInvitationActionResult {
  if (!isAppError(error)) return { success: false, message: "workspace.invitations.messages.generic" };
  if (error.code === "FORBIDDEN") return { success: false, message: "workspace.invitations.messages.forbidden", code: error.code };
  if (error.code === "NOT_FOUND") return { success: false, message: "workspace.invitations.messages.notFound", code: error.code };
  if (error.code === "PLAN_LIMIT_EXCEEDED") return { success: false, message: "workspace.invitations.messages.planLimit", code: error.code };
  return { success: false, message: "workspace.invitations.messages.validation", code: error.code };
}

async function getInvitationActionContext() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_MEMBERS_MANAGE, context);
  return context;
}

function revalidateWorkspaceInvitations() {
  revalidatePath("/workspace");
  revalidatePath("/workspace/members");
  revalidatePath("/workspace/invitations");
}

async function getInviteBaseUrl() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : process.env.BETTER_AUTH_URL ?? "";
}

export async function createWorkspaceInvitationAction(input: unknown): Promise<WorkspaceInvitationActionResult> {
  const parsed = createInvitationSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.invitations.messages.validation" };

  try {
    const context = await getInvitationActionContext();
    const company = await getCompanyService({ companyId: context.companyId });
    const role = await getRoleService({ companyId: context.companyId, roleId: parsed.data.roleId });
    const agencyId = parsed.data.agencyId ?? null;

    if (agencyId) {
      await getAgencyService({ companyId: context.companyId, agencyId });
      if (role.scope !== "agency") {
        return { success: false, message: "workspace.invitations.messages.agencyRoleRequired" };
      }
    } else if (role.scope !== "company") {
      return { success: false, message: "workspace.invitations.messages.companyRoleRequired" };
    }

    const [usage, maxUsersLimit] = await Promise.all([
      getCompanyUsageCountsService(context.companyId),
      getPlanLimitService({ planId: company.planId, limitKey: "max_users" }),
    ]);

    const rawToken = generateInvitationToken();
    await createInvitationService({
      companyId: context.companyId,
      agencyId,
      userId: context.userId,
      actorName: "Workspace",
      data: {
        email: parsed.data.email.toLowerCase(),
        roleId: parsed.data.roleId,
        tokenHash: hashInvitationToken(rawToken),
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      currentUserCount: usage.users,
      maxUsers: maxUsersLimit ? Number(maxUsersLimit.limitValue) : undefined,
    });
    revalidateWorkspaceInvitations();
    const baseUrl = await getInviteBaseUrl();
    return { success: true, inviteUrl: `${baseUrl}/invite/${rawToken}` };
  } catch (error) {
    return resultForError(error);
  }
}

export async function revokeWorkspaceInvitationAction(input: unknown): Promise<WorkspaceInvitationActionResult> {
  const parsed = revokeInvitationSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.invitations.messages.validation" };

  try {
    const context = await getInvitationActionContext();
    await revokeInvitationService({
      companyId: context.companyId,
      invitationId: parsed.data.invitationId,
      userId: context.userId,
      actorName: "Workspace",
    });
    revalidateWorkspaceInvitations();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}
