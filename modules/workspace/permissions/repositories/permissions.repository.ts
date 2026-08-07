import { PermissionEffect, Prisma, RoleScope, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function listPermissions(db: DatabaseClient = prisma) {
  return db.permission.findMany({ orderBy: [{ domain: "asc" }, { key: "asc" }] });
}

export async function findPermissionByKey(key: string, db: DatabaseClient = prisma) {
  return db.permission.findUnique({ where: { key } });
}

export async function findRoleById(
  input: { companyId: string; roleId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.role.findFirst({
    where: {
      id: input.roleId,
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { rolePermissions: { include: { permission: true } } },
  });
}

export async function listRoles(
  input: { companyId: string; scope?: RoleScope; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.role.findMany({
    where: {
      companyId: input.companyId,
      scope: input.scope,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { rolePermissions: { include: { permission: true } } },
    orderBy: [{ scope: "asc" }, { name: "asc" }],
  });
}

export async function createRole(data: Prisma.RoleUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.role.create({ data });
}

export async function updateRole(
  input: { companyId: string; roleId: string; data: Prisma.RoleUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.role.updateMany({
    where: { id: input.roleId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteRole(
  input: { companyId: string; roleId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.role.updateMany({
    where: { id: input.roleId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function listRolePermissions(roleId: string, db: DatabaseClient = prisma) {
  return db.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
    orderBy: { permissionKey: "asc" },
  });
}

export async function createRolePermission(
  data: Prisma.RolePermissionUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.rolePermission.create({ data });
}

export async function createManyRolePermissions(
  data: Prisma.RolePermissionCreateManyInput[],
  db: DatabaseClient = prisma,
) {
  return db.rolePermission.createMany({ data, skipDuplicates: true });
}

export async function deleteRolePermission(
  input: { companyId: string; roleId: string; permissionKey: string },
  db: DatabaseClient = prisma,
) {
  return db.rolePermission.deleteMany({
    where: {
      roleId: input.roleId,
      permissionKey: input.permissionKey,
      role: { companyId: input.companyId, deletedAt: null },
    },
  });
}

export async function listUserPermissionOverrides(
  input: { companyId: string; agencyMembershipId: string; userId?: string },
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.findMany({
    where: {
      agencyMembershipId: input.agencyMembershipId,
      userId: input.userId,
      agencyMembership: { companyId: input.companyId, deletedAt: null },
    },
    include: { permission: true, role: true },
    orderBy: { createdAt: "desc" },
  });
}

type UserPermissionOverrideScope = {
  companyId: string;
  agencyMembershipId: string;
  permissionKey: string;
};

type UserPermissionOverrideUpsertData = UserPermissionOverrideScope & {
  id: string;
  userId: string;
  roleId: string;
  effect: PermissionEffect;
  reason: string;
  expiresAt?: Date | null;
};

export async function createUserPermissionOverride(
  data: Prisma.UserPermissionOverrideUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.create({ data });
}

export async function createGrantPermissionOverride(
  data: Omit<Prisma.UserPermissionOverrideUncheckedCreateInput, "effect">,
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.create({ data: { ...data, effect: PermissionEffect.grant } });
}

export async function createDenyPermissionOverride(
  data: Omit<Prisma.UserPermissionOverrideUncheckedCreateInput, "effect">,
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.create({ data: { ...data, effect: PermissionEffect.deny } });
}

export async function upsertUserPermissionOverride(
  data: UserPermissionOverrideUpsertData,
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.upsert({
    where: {
      agencyMembershipId_permissionKey: {
        agencyMembershipId: data.agencyMembershipId,
        permissionKey: data.permissionKey,
      },
    },
    create: {
      id: data.id,
      userId: data.userId,
      agencyMembershipId: data.agencyMembershipId,
      permissionKey: data.permissionKey,
      roleId: data.roleId,
      effect: data.effect,
      reason: data.reason,
      expiresAt: data.expiresAt ?? null,
    },
    update: {
      userId: data.userId,
      roleId: data.roleId,
      effect: data.effect,
      reason: data.reason,
      expiresAt: data.expiresAt ?? null,
    },
  });
}

export async function updateUserPermissionOverrideEffect(
  input: UserPermissionOverrideScope & { effect: PermissionEffect },
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.updateMany({
    where: {
      agencyMembershipId: input.agencyMembershipId,
      permissionKey: input.permissionKey,
      agencyMembership: { companyId: input.companyId, deletedAt: null },
    },
    data: { effect: input.effect },
  });
}

export async function updateUserPermissionOverrideExpiry(
  input: UserPermissionOverrideScope & { expiresAt?: Date | null },
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.updateMany({
    where: {
      agencyMembershipId: input.agencyMembershipId,
      permissionKey: input.permissionKey,
      agencyMembership: { companyId: input.companyId, deletedAt: null },
    },
    data: { expiresAt: input.expiresAt ?? null },
  });
}

export async function updateUserPermissionOverride(
  input: {
    companyId: string;
    agencyMembershipId: string;
    overrideId: string;
    data: Prisma.UserPermissionOverrideUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.updateMany({
    where: {
      id: input.overrideId,
      agencyMembershipId: input.agencyMembershipId,
      agencyMembership: { companyId: input.companyId, deletedAt: null },
    },
    data: input.data,
  });
}

export async function deleteUserPermissionOverride(
  input: UserPermissionOverrideScope,
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.deleteMany({
    where: {
      agencyMembershipId: input.agencyMembershipId,
      permissionKey: input.permissionKey,
      agencyMembership: { companyId: input.companyId, deletedAt: null },
    },
  });
}

export async function findActiveUserPermissionOverride(
  input: UserPermissionOverrideScope & { userId?: string; agencyId?: string; now?: Date },
  db: DatabaseClient = prisma,
) {
  const now = input.now ?? new Date();
  return db.userPermissionOverride.findFirst({
    where: {
      agencyMembershipId: input.agencyMembershipId,
      permissionKey: input.permissionKey,
      userId: input.userId,
      agencyMembership: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        status: "active",
        deletedAt: null,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { permission: true, role: true },
  });
}

export const permissionsRepository = {
  listPermissions,
  findPermissionByKey,
  findRoleById,
  listRoles,
  createRole,
  updateRole,
  softDeleteRole,
  listRolePermissions,
  createRolePermission,
  createManyRolePermissions,
  deleteRolePermission,
  listUserPermissionOverrides,
  createUserPermissionOverride,
  createGrantPermissionOverride,
  createDenyPermissionOverride,
  upsertUserPermissionOverride,
  updateUserPermissionOverrideEffect,
  updateUserPermissionOverrideExpiry,
  updateUserPermissionOverride,
  deleteUserPermissionOverride,
  findActiveUserPermissionOverride,
};
