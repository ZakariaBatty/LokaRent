import {
  getCurrentAgencyContext,
  getCurrentCompanyContext,
  type CurrentAgencyContext,
  type CurrentCompanyContext,
} from "@/shared/auth";
import { createForbiddenError, createPermissionDeniedByOverrideError } from "@/shared/errors";
import type { PermissionKey } from "./permission.types";
import { getPermissionScope, resolvePermission } from "./rbac";

type PermissionContext = CurrentCompanyContext | CurrentAgencyContext;

export async function can(permissionKey: PermissionKey, context?: PermissionContext) {
  const permissionScope = getPermissionScope(permissionKey);
  const currentContext =
    context ??
    (permissionScope === "company"
      ? await getCurrentCompanyContext()
      : await getCurrentAgencyContext());

  if (!currentContext) return false;

  const decision = await resolvePermission(currentContext, permissionKey);
  return decision.allowed;
}

export async function requirePermission(permissionKey: PermissionKey, context?: PermissionContext) {
  const permissionScope = getPermissionScope(permissionKey);
  const currentContext =
    context ??
    (permissionScope === "company"
      ? await getCurrentCompanyContext()
      : await getCurrentAgencyContext());

  if (!currentContext) {
    throw createForbiddenError("Permission requires an authenticated context", { permissionKey });
  }

  const decision = await resolvePermission(currentContext, permissionKey);
  if (!decision.allowed) {
    if (decision.source === "override_deny") {
      throw createPermissionDeniedByOverrideError(decision);
    }
    throw createForbiddenError("Permission denied", decision);
  }

  return decision;
}
