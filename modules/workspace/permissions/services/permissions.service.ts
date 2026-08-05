import { createId, createNotFoundError, publishDomainEvent } from "@/shared";
import {
  createRole,
  createRolePermission,
  createUserPermissionOverride,
  deleteRolePermission,
  findPermissionByKey,
  findRoleById,
  listPermissions,
  listRolePermissions,
  listRoles,
  listUserPermissionOverrides,
  softDeleteRole,
  updateRole,
  updateUserPermissionOverride,
} from "../repositories/permissions.repository";

export type PermissionActor = {
  userId?: string | null;
  actorName?: string;
};

type RoleScopeValue = Parameters<typeof listRoles>[0]["scope"];
type RoleCreateData = Omit<Parameters<typeof createRole>[0], "id" | "companyId">;
type RolePermissionCreateData = Omit<Parameters<typeof createRolePermission>[0], "id">;
type UserPermissionOverrideCreateData = Omit<Parameters<typeof createUserPermissionOverride>[0], "id">;

export async function listPermissionsService() {
  return listPermissions();
}

export async function getPermissionService(key: string) {
  const permission = await findPermissionByKey(key);
  if (!permission) throw createNotFoundError("Permission", { key });
  return permission;
}

export async function listRolesService(input: {
  companyId: string;
  scope?: RoleScopeValue;
  includeDeleted?: boolean;
}) {
  return listRoles(input);
}

export async function getRoleService(input: { companyId: string; roleId: string }) {
  const role = await findRoleById(input);
  if (!role) throw createNotFoundError("Role", input);
  return role;
}

export async function createRoleService(
  input: PermissionActor & { companyId: string; data: RoleCreateData },
) {
  const role = await createRole({ ...input.data, id: createId(), companyId: input.companyId });
  await publishDomainEvent({
    name: "RoleCreated",
    companyId: role.companyId,
    entityType: "role",
    entityId: role.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return role;
}

export async function updateRoleService(
  input: PermissionActor & {
    companyId: string;
    roleId: string;
    data: Parameters<typeof updateRole>[0]["data"];
  },
) {
  await getRoleService(input);
  const result = await updateRole(input);
  await publishDomainEvent({
    name: "RolePermissionsUpdated",
    companyId: input.companyId,
    entityType: "role",
    entityId: input.roleId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function deleteRoleService(
  input: PermissionActor & { companyId: string; roleId: string },
) {
  await getRoleService(input);
  return softDeleteRole({ ...input, deletedBy: input.userId ?? null });
}

export async function listRolePermissionsService(roleId: string) {
  return listRolePermissions(roleId);
}

export async function addRolePermissionService(
  input: PermissionActor & {
    companyId: string;
    data: RolePermissionCreateData;
  },
) {
  await getRoleService({ companyId: input.companyId, roleId: input.data.roleId });
  await getPermissionService(input.data.permissionKey);
  const rolePermission = await createRolePermission({ ...input.data, id: createId() });
  await publishDomainEvent({
    name: "RolePermissionsUpdated",
    companyId: input.companyId,
    entityType: "role",
    entityId: input.data.roleId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return rolePermission;
}

export async function removeRolePermissionService(
  input: PermissionActor & { companyId: string; roleId: string; permissionKey: string },
) {
  const result = await deleteRolePermission(input);
  await publishDomainEvent({
    name: "RolePermissionsUpdated",
    companyId: input.companyId,
    entityType: "role",
    entityId: input.roleId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function listUserPermissionOverridesService(input: {
  companyId: string;
  agencyMembershipId: string;
  userId?: string;
}) {
  return listUserPermissionOverrides(input);
}

export async function createUserPermissionOverrideService(
  data: UserPermissionOverrideCreateData,
) {
  return createUserPermissionOverride({ ...data, id: createId() });
}

export async function updateUserPermissionOverrideService(input: {
  companyId: string;
  agencyMembershipId: string;
  overrideId: string;
  data: Parameters<typeof updateUserPermissionOverride>[0]["data"];
}) {
  return updateUserPermissionOverride(input);
}

export const permissionsService = {
  listPermissionsService,
  getPermissionService,
  listRolesService,
  getRoleService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
  listRolePermissionsService,
  addRolePermissionService,
  removeRolePermissionService,
  listUserPermissionOverridesService,
  createUserPermissionOverrideService,
  updateUserPermissionOverrideService,
};
