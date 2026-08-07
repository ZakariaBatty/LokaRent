import { createAppError } from "./app-error";

export function createValidationError(message: string, details?: unknown) {
  return createAppError(message, "VALIDATION_ERROR", 422, details);
}
