import { createAppError } from "./app-error";

export function createUnauthorizedError(message = "Unauthorized", details?: unknown) {
  return createAppError(message, "UNAUTHORIZED", 401, details);
}
