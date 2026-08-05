import { createAppError } from "./app-error";

export function createNotFoundError(resource: string, details?: unknown) {
  return createAppError(`${resource} not found`, "NOT_FOUND", 404, details);
}
