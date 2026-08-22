"use server";

import { revalidatePath } from "next/cache";
import { PermissionEffect } from "@lokarent/db";
import { z } from "zod";
import { getAgencyService } from "@/modules/workspace/agencies/services/agencies.service";
import { getAgencyMembershipService } from "@/modules/workspace/members/services/members.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { createId, isAppError, runInTransaction, writeActivityLog, writeAuditLog } from "@/shared";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { getPermissionScope } from "@/shared/permissions/rbac";
import {
  createRolePermission,
  deleteRolePermission,
  findPermissionByKey,
  findRoleById,
  listRolePermissions,
  listUserPermissionOverrides,
  upsertUserPermissionOverride,
  deleteUserPermissionOverride,
  updateUserPermissionOverrideExpiry,
} from "../repositories/permissions.repository";

export type WorkspacePermissionActionResult =
  | { success: true }
  | { success: false; message: string; code?: string };

const replaceRolePermissionsSchema = z.object({
  roleId: z.string().uuid(),
  permissionKeys: z.array(z.string().min(1)),
});

const overrideSchema = z.object({
  agencyId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  permissionKey: z.string().min(1),
  effect: z.enum(["grant", "deny"]),
  expiresAt: z.string().datetime().nullable().optional(),
});

const revokeOverrideSchema = z.object({
  agencyId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  permissionKey: z.string().min(1),
});

const updateOverrideExpirySchema = revokeOverrideSchema.extend({
  expiresAt: z.string().datetime().nullable().optional(),
});

function resultForError(error: unknown): WorkspacePermissionActionResult {
  if (!isAppError(error)) return { success: false, message: "workspace.permissions.messages.generic" };
  if (error.code === "FORBIDDEN") return { success: false, message: "workspace.permissions.messages.forbidden", code: error.code };
  if (error.code === "NOT_FOUND") return { success: false, message: "workspace.permissions.messages.notFound", code: error.code };
  return { success: false, message: "workspace.permissions.messages.validation", code: error.code };
}

function revalidateWorkspaceRbac() {
  revalidatePath("/workspace/permissions");
  revalidatePath("/workspace/members");
  revalidatePath("/workspace/invitations");
}

async function getActionContext() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_MEMBERS_MANAGE, context);
  return context;
}

function isSystemCriticalRole(role: { name: string; scope: string; isSystem: boolean }) {
  return role.isSystem || (role.scope === "company" && role.name.toLowerCase() === "owner");
}

async function assertPermissionKeys(input: { roleScope: "company" | "agency"; permissionKeys: string[] }) {
  const permissions = await Promise.all(input.permissionKeys.map((key) => findPermissionByKey(key)));
  if (permissions.some((permission) => !permission)) {
    throw new Error("Invalid permission");
  }
  for (const key of input.permissionKeys) {
    const scope = getPermissionScope(key as (typeof PERMISSIONS)[keyof typeof PERMISSIONS]);
    if (input.roleScope === "company" && scope !== "company") throw new Error("Invalid permission scope");
    if (input.roleScope === "agency" && scope !== "agency") throw new Error("Invalid permission scope");
  }
}

export async function replaceRolePermissionsAction(input: unknown): Promise<WorkspacePermissionActionResult> {
  const parsed = replaceRolePermissionsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.permissions.messages.validation" };

  try {
    const context = await getActionContext();
    const role = await findRoleById({ companyId: context.companyId, roleId: parsed.data.roleId });
    if (!role) return { success: false, message: "workspace.permissions.messages.notFound", code: "NOT_FOUND" };
    if (isSystemCriticalRole(role)) {
      return { success: false, message: "workspace.permissions.messages.systemRoleReadonly", code: "FORBIDDEN" };
    }
    await assertPermissionKeys({ roleScope: role.scope, permissionKeys: parsed.data.permissionKeys });

    const current = await listRolePermissions(role.id);
    const currentKeys = new Set(current.map((permission) => permission.permissionKey));
    const nextKeys = new Set(parsed.data.permissionKeys);
    const toAdd = [...nextKeys].filter((key) => !currentKeys.has(key));
    const toRemove = [...currentKeys].filter((key) => !nextKeys.has(key));

    await runInTransaction(async (db) => {
      await Promise.all(toRemove.map((permissionKey) => deleteRolePermission({ companyId: context.companyId, roleId: role.id, permissionKey }, db)));
      await Promise.all(toAdd.map((permissionKey) => createRolePermission({ id: createId(), roleId: role.id, permissionKey }, db)));
      const changes = { before: [...currentKeys], after: [...nextKeys] };
      await writeAuditLog({
        id: createId(),
        companyId: context.companyId,
        userId: context.userId,
        action: "RolePermissionsUpdated",
        entityType: "role",
        entityId: role.id,
        changes,
      }, db);
      await writeActivityLog({
        id: createId(),
        companyId: context.companyId,
        userId: context.userId,
        actorName: "Workspace",
        entityType: "role",
        entityId: role.id,
        verb: "RolePermissionsUpdated",
        metadata: changes,
      }, db);
    });

    revalidateWorkspaceRbac();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}

export async function setUserPermissionOverrideAction(input: unknown): Promise<WorkspacePermissionActionResult> {
  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.permissions.messages.validation" };

  try {
    const context = await getActionContext();
    await getAgencyService({ companyId: context.companyId, agencyId: parsed.data.agencyId });
    const permission = await findPermissionByKey(parsed.data.permissionKey);
    if (!permission) return { success: false, message: "workspace.permissions.messages.notFound", code: "NOT_FOUND" };
    if (getPermissionScope(parsed.data.permissionKey as (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) !== "agency") {
      return { success: false, message: "workspace.permissions.messages.scopeMismatch", code: "FORBIDDEN" };
    }
    const membership = await getAgencyMembershipService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      userId: parsed.data.targetUserId,
    });
    if (membership.status !== "active") {
      return { success: false, message: "workspace.permissions.messages.validation", code: "VALIDATION_ERROR" };
    }

    await runInTransaction(async (db) => {
      const override = await upsertUserPermissionOverride({
        id: createId(),
        companyId: context.companyId,
        agencyMembershipId: membership.id,
        userId: parsed.data.targetUserId,
        roleId: membership.roleId,
        permissionKey: parsed.data.permissionKey,
        effect: parsed.data.effect === "grant" ? PermissionEffect.grant : PermissionEffect.deny,
        reason: "Workspace permissions override",
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      }, db);
      const changes = { after: { permissionKey: override.permissionKey, effect: override.effect, expiresAt: override.expiresAt?.toISOString() ?? null } };
      await writeAuditLog({
        id: createId(),
        companyId: context.companyId,
        agencyId: parsed.data.agencyId,
        userId: context.userId,
        action: override.effect === "grant" ? "PermissionOverrideGranted" : "PermissionOverrideDenied",
        entityType: "user_permission_override",
        entityId: override.id,
        changes,
      }, db);
      await writeActivityLog({
        id: createId(),
        companyId: context.companyId,
        agencyId: parsed.data.agencyId,
        userId: context.userId,
        actorName: "Workspace",
        entityType: "user_permission_override",
        entityId: override.id,
        verb: override.effect === "grant" ? "PermissionOverrideGranted" : "PermissionOverrideDenied",
        metadata: changes,
      }, db);
    });

    revalidateWorkspaceRbac();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}

export async function revokeUserPermissionOverrideAction(input: unknown): Promise<WorkspacePermissionActionResult> {
  const parsed = revokeOverrideSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.permissions.messages.validation" };

  try {
    const context = await getActionContext();
    await getAgencyService({ companyId: context.companyId, agencyId: parsed.data.agencyId });
    const membership = await getAgencyMembershipService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      userId: parsed.data.targetUserId,
    });
    const existing = (await listUserPermissionOverrides({
      companyId: context.companyId,
      agencyMembershipId: membership.id,
      userId: parsed.data.targetUserId,
    })).find((override) => override.permissionKey === parsed.data.permissionKey);
    if (!existing) return { success: false, message: "workspace.permissions.messages.notFound", code: "NOT_FOUND" };

    await runInTransaction(async (db) => {
      await deleteUserPermissionOverride({
        companyId: context.companyId,
        agencyMembershipId: membership.id,
        permissionKey: parsed.data.permissionKey,
      }, db);
      const changes = {
        before: {
          permissionKey: existing.permissionKey,
          effect: existing.effect,
          expiresAt: existing.expiresAt?.toISOString() ?? null,
        },
        after: null,
      };
      await writeAuditLog({
        id: createId(),
        companyId: context.companyId,
        agencyId: parsed.data.agencyId,
        userId: context.userId,
        action: "PermissionOverrideRevoked",
        entityType: "user_permission_override",
        entityId: existing.id,
        changes,
      }, db);
      await writeActivityLog({
        id: createId(),
        companyId: context.companyId,
        agencyId: parsed.data.agencyId,
        userId: context.userId,
        actorName: "Workspace",
        entityType: "user_permission_override",
        entityId: existing.id,
        verb: "PermissionOverrideRevoked",
        metadata: changes,
      }, db);
    });
    revalidateWorkspaceRbac();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}

export async function updateUserPermissionOverrideExpiryAction(input: unknown): Promise<WorkspacePermissionActionResult> {
  const parsed = updateOverrideExpirySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "workspace.permissions.messages.validation" };

  try {
    const context = await getActionContext();
    await getAgencyService({ companyId: context.companyId, agencyId: parsed.data.agencyId });
    const membership = await getAgencyMembershipService({
      companyId: context.companyId,
      agencyId: parsed.data.agencyId,
      userId: parsed.data.targetUserId,
    });
    const existing = (await listUserPermissionOverrides({
      companyId: context.companyId,
      agencyMembershipId: membership.id,
      userId: parsed.data.targetUserId,
    })).find((override) => override.permissionKey === parsed.data.permissionKey);
    if (!existing) return { success: false, message: "workspace.permissions.messages.notFound", code: "NOT_FOUND" };

    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    await runInTransaction(async (db) => {
      await updateUserPermissionOverrideExpiry({
        companyId: context.companyId,
        agencyMembershipId: membership.id,
        permissionKey: parsed.data.permissionKey,
        expiresAt,
      }, db);
      const changes = {
        before: { permissionKey: existing.permissionKey, expiresAt: existing.expiresAt?.toISOString() ?? null },
        after: { permissionKey: existing.permissionKey, expiresAt: expiresAt?.toISOString() ?? null },
      };
      await writeAuditLog({
        id: createId(),
        companyId: context.companyId,
        agencyId: parsed.data.agencyId,
        userId: context.userId,
        action: "PermissionOverrideExpiryUpdated",
        entityType: "user_permission_override",
        entityId: existing.id,
        changes,
      }, db);
      await writeActivityLog({
        id: createId(),
        companyId: context.companyId,
        agencyId: parsed.data.agencyId,
        userId: context.userId,
        actorName: "Workspace",
        entityType: "user_permission_override",
        entityId: existing.id,
        verb: "PermissionOverrideExpiryUpdated",
        metadata: changes,
      }, db);
    });
    revalidateWorkspaceRbac();
    return { success: true };
  } catch (error) {
    return resultForError(error);
  }
}
