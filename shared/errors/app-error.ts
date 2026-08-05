export type AppErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
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
