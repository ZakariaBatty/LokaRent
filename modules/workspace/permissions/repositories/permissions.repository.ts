import { Prisma, RoleScope, prisma } from "@lokarent/db";
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

export async function createUserPermissionOverride(
  data: Prisma.UserPermissionOverrideUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.userPermissionOverride.create({ data });
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
  deleteRolePermission,
  listUserPermissionOverrides,
  createUserPermissionOverride,
  updateUserPermissionOverride,
};
