import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findUserById(
  input: { companyId: string; userId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.user.findFirst({
    where: {
      id: input.userId,
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findUserByEmail(
  input: { companyId: string; email: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.user.findFirst({
    where: {
      companyId: input.companyId,
      email: input.email,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function createUser(data: Prisma.UserUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.user.create({ data });
}

export async function updateUser(
  input: { companyId: string; userId: string; data: Prisma.UserUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.user.updateMany({
    where: { id: input.userId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteUser(
  input: { companyId: string; userId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.user.updateMany({
    where: { id: input.userId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreUser(
  input: { companyId: string; userId: string },
  db: DatabaseClient = prisma,
) {
  return db.user.updateMany({
    where: { id: input.userId, companyId: input.companyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export const authRepository = {
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  softDeleteUser,
  restoreUser,
};
