import { hashPassword } from "better-auth/crypto";
import { createId, createNotFoundError, createValidationError, runInTransaction } from "@/shared";
import {
  createAgency,
  createCompany,
  findCompanyBySlug,
} from "@/modules/workspace/agencies/repositories/agencies.repository";
import {
  createAgencyMembership,
  createCompanyMembership,
} from "@/modules/workspace/members/repositories/members.repository";
import {
  createRole,
  createManyRolePermissions,
  listPermissions,
} from "@/modules/workspace/permissions/repositories/permissions.repository";
import {
  findActivePlans,
  upsertSetting,
} from "@/modules/workspace/billing/repositories/billing.repository";
import { createVehicleCategory } from "@/modules/cars/repositories/cars.repository";
import {
  createAuthAccount,
  createAuthUser,
  createUser,
  findAuthUserByEmail,
  findAuthUserById,
  findUserByEmail,
  findUserById,
  findCredentialAccountByUserId,
  restoreUser,
  softDeleteUser,
  updateUser,
} from "../repositories/auth.repository";

const DEFAULT_VEHICLE_CATEGORIES = ["Economy", "Compact", "Sedan", "SUV", "Van", "Luxury"];
const DEFAULT_AGENCY_SETTINGS = [
  { key: "tax_rate", value: "0", valueType: "number", agencyScoped: true },
  { key: "default_currency", value: "MAD", valueType: "string", agencyScoped: false },
  { key: "contract_language", value: "fr", valueType: "string", agencyScoped: true },
];

export type RegisterOwnerServiceInput = {
  agencyName: string;
  city: string;
  vehicleCount?: number;
  managerName: string;
  phone: string;
  email: string;
  password: string;
  planName?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function toAgencyCode(value: string) {
  const code = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  return code || "MAIN";
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function createUniqueCompanySlug(name: string) {
  const base = toSlug(name) || "company";
  let slug = base;
  let suffix = 1;
  while (await findCompanyBySlug({ slug, includeDeleted: true })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

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

export async function getAuthUserService(authUserId: string) {
  const authUser = await findAuthUserById(authUserId);
  if (!authUser) throw createNotFoundError("Auth user", { authUserId });
  return authUser;
}

export async function getBusinessUserForAuthUserService(authUserId: string) {
  const authUser = await getAuthUserService(authUserId);
  return authUser.lokaRentUser;
}

export async function touchLastLoginService(authUserId: string) {
  const user = await getBusinessUserForAuthUserService(authUserId);
  await updateUser({
    companyId: user.companyId,
    userId: user.id,
    data: { lastLoginAt: new Date() },
  });
  return getUserService({ companyId: user.companyId, userId: user.id });
}

export async function registerOwnerService(input: RegisterOwnerServiceInput) {
  const email = normalizeEmail(input.email);
  const existingAuthUser = await findAuthUserByEmail(email);
  if (existingAuthUser) throw createValidationError("Account already exists");

  const password = await hashPassword(input.password);
  const slug = await createUniqueCompanySlug(input.agencyName);
  const now = new Date();

  return runInTransaction(async (tx) => {
    const plans = await findActivePlans(tx);
    const selectedPlan =
      plans.find((plan) => plan.name === input.planName) ??
      plans.find((plan) => plan.name === "starter") ??
      plans[0];
    if (!selectedPlan) throw createValidationError("No active plan is configured");

    const permissions = await listPermissions(tx);
    const companyId = createId();
    const agencyId = createId();
    const userId = createId();
    const ownerRoleId = createId();
    const adminRoleId = createId();

    const company = await createCompany(
      {
        id: companyId,
        name: input.agencyName.trim(),
        slug,
        countryCode: "MA",
        timezone: "Africa/Casablanca",
        currency: "MAD",
        language: "fr",
        planId: selectedPlan.id,
        status: "trial",
        trialEndsAt: addDays(now, 14),
      },
      tx,
    );

    const agency = await createAgency(
      {
        id: agencyId,
        companyId,
        name: input.agencyName.trim(),
        code: toAgencyCode(input.agencyName),
        countryCode: "MA",
        timezone: "Africa/Casablanca",
        currency: "MAD",
        phone: input.phone,
        email,
        address: { city: input.city },
        status: "active",
      },
      tx,
    );

    const user = await createUser(
      {
        id: userId,
        companyId,
        email,
        fullName: input.managerName.trim(),
        phone: input.phone,
        locale: "fr",
        timezone: "Africa/Casablanca",
        status: "active",
      },
      tx,
    );

    const authUser = await createAuthUser(
      {
        id: userId,
        name: user.fullName,
        email,
        emailVerified: false,
        image: user.avatarUrl,
      },
      tx,
    );

    await createAuthAccount(
      {
        id: createId(),
        userId,
        accountId: userId,
        providerId: "credential",
        password,
      },
      tx,
    );

    const ownerRole = await createRole(
      {
        id: ownerRoleId,
        companyId,
        name: "owner",
        description: "Company owner with workspace and all-agency access",
        scope: "company",
        isSystem: true,
      },
      tx,
    );
    const adminRole = await createRole(
      {
        id: adminRoleId,
        companyId,
        name: "admin",
        description: "Agency administrator",
        scope: "agency",
        isSystem: true,
      },
      tx,
    );

    await createManyRolePermissions(
      permissions.flatMap((permission) => [
        { id: createId(), roleId: ownerRole.id, permissionKey: permission.key },
        ...(permission.key.startsWith("workspace.billing")
          ? []
          : [{ id: createId(), roleId: adminRole.id, permissionKey: permission.key }]),
      ]),
      tx,
    );

    await createCompanyMembership(
      {
        id: createId(),
        companyId,
        userId,
        roleId: ownerRole.id,
        roleScope: "company",
        status: "active",
      },
      tx,
    );
    await createAgencyMembership(
      {
        id: createId(),
        companyId,
        agencyId,
        userId,
        roleId: adminRole.id,
        roleScope: "agency",
        isPrimary: true,
        status: "active",
        joinedAt: now,
      },
      tx,
    );

    await Promise.all([
      ...DEFAULT_VEHICLE_CATEGORIES.map((name) =>
        createVehicleCategory({ id: createId(), companyId, name }, tx),
      ),
      ...DEFAULT_AGENCY_SETTINGS.map((setting) =>
        upsertSetting(
          {
            companyId,
            agencyId: setting.agencyScoped ? agencyId : null,
            key: setting.key,
            create: { id: createId(), value: setting.value, valueType: setting.valueType },
            update: {
              value: setting.value,
              valueType: setting.valueType,
              deletedAt: null,
              deletedBy: null,
            },
          },
          tx,
        ),
      ),
    ]);

    return { authUser, company, agency, user };
  });
}

export async function assertCredentialPasswordIsHashed(authUserId: string) {
  const account = await findCredentialAccountByUserId(authUserId);
  if (!account?.password) throw createNotFoundError("Credential account", { authUserId });
  return account.password;
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
  getAuthUserService,
  getBusinessUserForAuthUserService,
  touchLastLoginService,
  registerOwnerService,
  assertCredentialPasswordIsHashed,
  createUserService,
  updateUserService,
  deactivateUserService,
  restoreUserService,
};
