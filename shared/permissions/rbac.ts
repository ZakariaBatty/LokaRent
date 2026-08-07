import {
  getActiveUserPermissionOverrideService,
  getPermissionService,
  getRoleService,
} from "@/modules/workspace/permissions/services/permissions.service";
import { getAgencyMembershipService } from "@/modules/workspace/members/services/members.service";
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

async function findActiveOverride(context: CurrentAgencyContext, permissionKey: PermissionKey) {
  return getActiveUserPermissionOverrideService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    agencyMembershipId: context.agencyMembershipId,
    userId: context.userId,
    permissionKey,
  });
}

async function hasActiveAgencyMembership(context: CurrentAgencyContext) {
  try {
    const membership = await getAgencyMembershipService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      userId: context.userId,
    });

    return (
      membership.id === context.agencyMembershipId &&
      membership.status === "active" &&
      membership.agency.status === "active"
    );
  } catch {
    return false;
  }
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
    const activeMembership = await hasActiveAgencyMembership(context);
    if (!activeMembership) {
      return { allowed: false, permissionKey, scope, source: "none" };
    }

    const override = await findActiveOverride(context, permissionKey);
    if (override?.effect === "deny") {
      return { allowed: false, permissionKey, scope, source: "override_deny" };
    }
    if (override?.effect === "grant") {
      return { allowed: true, permissionKey, scope, source: "override_grant" };
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
