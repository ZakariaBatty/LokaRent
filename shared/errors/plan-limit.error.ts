import { createAppError } from "./app-error";

export function createPlanLimitExceededError(details?: unknown) {
  return createAppError("PLAN_LIMIT_EXCEEDED", "PLAN_LIMIT_EXCEEDED", 422, details);
}
