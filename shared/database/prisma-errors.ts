import { Prisma } from "@lokarent/db";

export function isPrismaKnownRequestError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isUniqueConstraintError(error: unknown) {
  return isPrismaKnownRequestError(error) && error.code === "P2002";
}

export function isForeignKeyConstraintError(error: unknown) {
  return isPrismaKnownRequestError(error) && error.code === "P2003";
}

export function isRecordNotFoundError(error: unknown) {
  return isPrismaKnownRequestError(error) && error.code === "P2025";
}
