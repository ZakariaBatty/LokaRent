"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAgencyService } from "@/modules/workspace/agencies/services/agencies.service";
import { getRoleService } from "@/modules/workspace/permissions/services/permissions.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  assignUserToAgencyService,
  getCompanyMembershipService,
  listUserAgencyMembershipsService,
  removeAgencyMembershipService,
  removeCompanyMembershipService,
  updateAgencyMembershipService,
} from "../services/members.service";

export type WorkspaceMemberActionResult =
  | { success: true }
  | { success: false; message: string; code?: string };

const assignAgencySchema = z.object({
  userId: z.string().uuid(),
  agencyId: z.string().uuid(),
  roleId: z.string().uuid(),
});

const updateAgencyMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  agencyId: z.string().uuid(),
  roleId: z.string().uuid(),
});

const removeAgencyMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  agencyId: z.string().uuid(),
  userId: z.string().uuid(),
});

const removeCompanyMembershipSchema = z.object({
  membershipId: z.string().uuid(),
  userId: z.string().uuid(),
});

function resultForError(error: unknown): WorkspaceMemberActionResult {
  if (!isAppError(error)) return { success: false, message: "Une erreur est survenue." };
  if (error.code === "FORBIDDEN") return { success: false, message: "Action non autorisée.", code: error.code };
  if (error.code === "NOT_FOUND") return { success: false, message: "Enregistrement introuvable.", code: error.code };
  if (error.code === "PLAN_LIMIT_EXCEEDED") return { success: false, message: "Limite du plan atteinte.", code: error.code };
  return { success: false, message: error.message || "Données invalides.", code: error.code };
}

async function getMembersActionContext() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_MEMBERS_MANAGE, context);
  return context;
}

function revalidateWorkspaceMembers() {
  revalidatePath("/workspace");
  revalidatePath("/workspace/members");
  revalidatePath("/workspace/agencies");
}

async function assertAgencyRole(input: { companyId: string; roleId: string }) {
  const role = await getRoleService(input);
  if (role.scope !== "agency") {
    throw new Error("Le rôle sélectionné n'est pas un rôle d'agence.");
  }
  return role;
}

export async function assignWorkspaceMemberAgencyAction(input: unknown): Promise<WorkspaceMemberActionResult> {
  const parsed = assignAgencySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Données invalides." };

  try {
    const context = await getMembersActionContext();
    await Promise.all([
      getCompanyMembershipService({ companyId: context.companyId, userId: parsed.data.userId }),
      getAgencyService({ companyId: context.companyId, agencyId: parsed.data.agencyId }),
      assertAgencyRole({ companyId: context.companyId, roleId: parsed.data.roleId }),
    ]);
    await assignUserToAgencyService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      userId: context.userId,
      actorName: "Workspace",
      data: {
        userId: parsed.data.userId,
        roleId: parsed.data.roleId,
        roleScope: "agency",
        status: "active",
        joinedAt: new Date(),
      },
    });
    revalidateWorkspaceMembers();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}

export async function updateWorkspaceMemberAgencyRoleAction(input: unknown): Promise<WorkspaceMemberActionResult> {
  const parsed = updateAgencyMembershipSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Données invalides." };

  try {
    const context = await getMembersActionContext();
    await Promise.all([
      getAgencyService({ companyId: context.companyId, agencyId: parsed.data.agencyId }),
      assertAgencyRole({ companyId: context.companyId, roleId: parsed.data.roleId }),
    ]);
    await updateAgencyMembershipService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      membershipId: parsed.data.membershipId,
      userId: context.userId,
      actorName: "Workspace",
      data: { roleId: parsed.data.roleId },
    });
    revalidateWorkspaceMembers();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}

export async function removeWorkspaceMemberAgencyAction(input: unknown): Promise<WorkspaceMemberActionResult> {
  const parsed = removeAgencyMembershipSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Données invalides." };

  try {
    const context = await getMembersActionContext();
    if (parsed.data.userId === context.userId) {
      return { success: false, message: "Vous ne pouvez pas retirer votre propre accès depuis cette page." };
    }
    await getAgencyService({ companyId: context.companyId, agencyId: parsed.data.agencyId });
    await removeAgencyMembershipService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      membershipId: parsed.data.membershipId,
      userId: context.userId,
      actorName: "Workspace",
    });
    revalidateWorkspaceMembers();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}

export async function removeWorkspaceMemberAction(input: unknown): Promise<WorkspaceMemberActionResult> {
  const parsed = removeCompanyMembershipSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Données invalides." };

  try {
    const context = await getMembersActionContext();
    if (parsed.data.userId === context.userId) {
      return { success: false, message: "Vous ne pouvez pas retirer votre propre compte du workspace." };
    }
    const agencyMemberships = await listUserAgencyMembershipsService({
      companyId: context.companyId,
      userId: parsed.data.userId,
    });
    await Promise.all(
      agencyMemberships.map((membership) =>
        removeAgencyMembershipService({
          companyId: context.companyId,
          agencyId: membership.agencyId,
          membershipId: membership.id,
          userId: context.userId,
          actorName: "Workspace",
        }),
      ),
    );
    await removeCompanyMembershipService({
      companyId: context.companyId,
      membershipId: parsed.data.membershipId,
      userId: context.userId,
      actorName: "Workspace",
    });
    revalidateWorkspaceMembers();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}
