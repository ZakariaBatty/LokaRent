import {
  getPermissionService,
  getRoleService,
  listUserPermissionOverridesService,
} from "@/modules/workspace/permissions/services/permissions.service";
import type { CurrentAgencyContext, CurrentCompanyContext } from "@/shared/auth";
import type { PermissionDecision, PermissionKey, PermissionScope } from "./permission.types";

type RbacContext = CurrentCompanyContext | CurrentAgencyContext;

function hasAgencyContext(context: RbacContext): context is CurrentAgencyContext {
  return "agencyId" in context && "agencyMembershipId" in context;
}

export function getPermissionScope(permissionKey: PermissionKey): PermissionScope {
  return permissionKey.startsWith("workspace.") ? "company" : "agency";
}

function hasPermission(role: Awaited<ReturnType<typeof getRoleService>>, permissionKey: PermissionKey) {
  return role.rolePermissions.some((rolePermission) => rolePermission.permissionKey === permissionKey);
}

async function hasActiveOverrideGrant(context: CurrentAgencyContext, permissionKey: PermissionKey) {
  const now = new Date();
  const overrides = await listUserPermissionOverridesService({
    companyId: context.companyId,
    agencyMembershipId: context.agencyMembershipId,
    userId: context.userId,
  });

  return overrides.some(
    (override) =>
      override.permissionKey === permissionKey &&
      (!override.expiresAt || override.expiresAt > now),
  );
}

export async function resolvePermission(
  context: RbacContext,
  permissionKey: PermissionKey,
): Promise<PermissionDecision> {
  await getPermissionService(permissionKey);

  const scope = getPermissionScope(permissionKey);
  if (scope === "agency" && !hasAgencyContext(context)) {
    return { allowed: false, permissionKey, scope, source: "none" };
  }

  const roleId =
    scope === "agency" && hasAgencyContext(context) && !context.isOwner
      ? context.agencyRoleId
      : context.companyRoleId;

  if (scope === "agency" && hasAgencyContext(context)) {
    if (await hasActiveOverrideGrant(context, permissionKey)) {
      return { allowed: true, permissionKey, scope, source: "override" };
    }
  }

  const role = await getRoleService({ companyId: context.companyId, roleId });

  if (context.isOwner && hasPermission(role, permissionKey)) {
    return { allowed: true, permissionKey, scope, source: "owner" };
  }

  if (hasPermission(role, permissionKey)) {
    return { allowed: true, permissionKey, scope, source: "role" };
  }

  return { allowed: false, permissionKey, scope, source: "none" };
}
