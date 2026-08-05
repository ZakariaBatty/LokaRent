import { createId, createNotFoundError, createValidationError } from "@/shared";
import {
  createUser,
  findUserByEmail,
  findUserById,
  restoreUser,
  softDeleteUser,
  updateUser,
} from "../repositories/auth.repository";

export async function getUserService(input: { companyId: string; userId: string }) {
  const user = await findUserById(input);
  if (!user) throw createNotFoundError("User", input);
  return user;
}

export async function getUserByEmailService(input: { companyId: string; email: string }) {
  const user = await findUserByEmail(input);
  if (!user) throw createNotFoundError("User", input);
  return user;
}

type UserCreateData = Omit<Parameters<typeof createUser>[0], "id" | "companyId">;
type UserUpdateData = Parameters<typeof updateUser>[0]["data"];

export async function createUserService(input: { companyId: string; data: UserCreateData }) {
  const existing = await findUserByEmail({
    companyId: input.companyId,
    email: input.data.email,
    includeDeleted: true,
  });
  if (existing) throw createValidationError("User email already exists for this company");
  return createUser({ ...input.data, id: createId(), companyId: input.companyId });
}

export async function updateUserService(input: {
  companyId: string;
  userId: string;
  data: UserUpdateData;
}) {
  await getUserService(input);
  await updateUser(input);
  return getUserService(input);
}

export async function deactivateUserService(input: {
  companyId: string;
  userId: string;
  deletedBy?: string | null;
}) {
  await getUserService(input);
  return softDeleteUser(input);
}

export async function restoreUserService(input: { companyId: string; userId: string }) {
  return restoreUser(input);
}

export const authService = {
  getUserService,
  getUserByEmailService,
  createUserService,
  updateUserService,
  deactivateUserService,
  restoreUserService,
};
