export type AppErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PLAN_LIMIT_EXCEEDED"
  | "PERMISSION_DENIED_BY_OVERRIDE"
  | "PERMISSION_OVERRIDE_NOT_FOUND"
  | "PERMISSION_OVERRIDE_SCOPE_INVALID"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export type AppError = Error & {
  code: AppErrorCode;
  statusCode: number;
  details?: unknown;
};

export function createAppError(
  message: string,
  code: AppErrorCode,
  statusCode: number,
  details?: unknown,
): AppError {
  return Object.assign(new Error(message), {
    code,
    statusCode,
    details,
  });
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && "code" in error && "statusCode" in error;
}
