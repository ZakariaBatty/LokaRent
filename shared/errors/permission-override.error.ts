import { createAppError } from "./app-error";

export function createPermissionOverrideNotFoundError(details?: unknown) {
  return createAppError(
    "PERMISSION_OVERRIDE_NOT_FOUND",
    "PERMISSION_OVERRIDE_NOT_FOUND",
    404,
    details,
  );
}

export function createPermissionOverrideScopeInvalidError(details?: unknown) {
  return createAppError(
    "PERMISSION_OVERRIDE_SCOPE_INVALID",
    "PERMISSION_OVERRIDE_SCOPE_INVALID",
    400,
    details,
  );
}

export function createPermissionDeniedByOverrideError(details?: unknown) {
  return createAppError(
    "PERMISSION_DENIED_BY_OVERRIDE",
    "PERMISSION_DENIED_BY_OVERRIDE",
    403,
    details,
  );
}
