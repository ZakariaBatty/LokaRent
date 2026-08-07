import { createAppError } from "./app-error";

export function createForbiddenError(message = "Forbidden", details?: unknown) {
  return createAppError(message, "FORBIDDEN", 403, details);
}
