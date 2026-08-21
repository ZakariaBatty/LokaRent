import { PermissionEffect, type Prisma } from "@lokarent/db";
import type { CurrentAgencyContext } from "@/shared/auth/current-agency-context";
import {
  createId,
  createNotFoundError,
  createPermissionOverrideNotFoundError,
  createPermissionOverrideScopeInvalidError,
  publishDomainEvent,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import { getAgencyMembershipService } from "@/modules/workspace/members/services/members.service";
import {
  createRole,
  createManyRolePermissions,
  createRolePermission,
  createUserPermissionOverride,
  deleteUserPermissionOverride,
  findActiveUserPermissionOverride,
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
  updateUserPermissionOverrideExpiry as updateUserPermissionOverrideExpiryRepository,
  upsertUserPermissionOverride,
} from "../repositories/permissions.repository";

export type PermissionActor = {
  userId?: string | null;
  actorName?: string;
};

type RoleScopeValue = Parameters<typeof listRoles>[0]["scope"];
type RoleCreateData = Omit<Parameters<typeof createRole>[0], "id" | "companyId">;
type RolePermissionCreateData = Omit<Parameters<typeof createRolePermission>[0], "id">;
type UserPermissionOverrideCreateData = Omit<Parameters<typeof createUserPermissionOverride>[0], "id">;
type PermissionOverrideContext = CurrentAgencyContext & PermissionActor;

type PermissionOverrideInput = {
  context: PermissionOverrideContext;
  targetUserId: string;
  permissionKey: string;
  reason: string;
  expiresAt?: Date | null;
};

type PermissionOverrideExpiryInput = {
  context: PermissionOverrideContext;
  targetUserId: string;
  permissionKey: string;
  expiresAt?: Date | null;
};

const PERMISSION_OVERRIDE_ENTITY = "user_permission_override";

const agencyRolePermissionTemplates: Record<string, string[]> = {
  accountant: [
    "reservations.view",
    "fleet.view",
    "clients.view",
    "contracts.view",
    "contracts.export_pdf",
    "finance.invoices.view",
    "finance.payments.record",
    "finance.deposits.manage",
    "finance.expenses.view",
    "finance.expenses.create",
    "finance.expenses.edit",
    "finance.expenses.delete",
    "finance.reports.view",
    "finance.reports.export",
    "reports.view",
    "reports.export",
  ],
  agent: [
    "reservations.view",
    "reservations.create",
    "reservations.edit",
    "reservations.cancel",
    "fleet.view",
    "fleet.maintenance.create",
    "clients.view",
    "clients.create",
    "clients.edit",
    "contracts.view",
    "contracts.create",
    "contracts.export_pdf",
  ],
  readonly: [
    "reservations.view",
    "fleet.view",
    "clients.view",
    "contracts.view",
  ],
};

const systemRoleDescriptions: Record<string, string> = {
  owner: "Company owner with workspace and all-agency access",
  admin: "Agency administrator",
  accountant: "Agency financial operator",
  agent: "Agency rental operations user",
  readonly: "Read-only agency user",
};

async function getScopedAgencyMembership(input: {
  context: CurrentAgencyContext;
  targetUserId: string;
  permissionKey: string;
}) {
  try {
    const membership = await getAgencyMembershipService({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.targetUserId,
    });

    if (
      membership.id !== input.context.agencyMembershipId &&
      membership.agencyId !== input.context.agencyId
    ) {
      throw createPermissionOverrideScopeInvalidError(input);
    }

    if (membership.status !== "active" || membership.agency.status !== "active") {
      throw createPermissionOverrideScopeInvalidError({
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.targetUserId,
        permissionKey: input.permissionKey,
      });
    }

    return membership;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "PERMISSION_OVERRIDE_SCOPE_INVALID"
    ) {
      throw error;
    }
    throw createPermissionOverrideScopeInvalidError({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.targetUserId,
      permissionKey: input.permissionKey,
    });
  }
}

function serializePermissionOverride(
  override:
    | Awaited<ReturnType<typeof upsertUserPermissionOverride>>
    | Awaited<ReturnType<typeof findActiveUserPermissionOverride>>
    | null,
) {
  if (!override) return null;
  return {
    id: override.id,
    userId: override.userId,
    agencyMembershipId: override.agencyMembershipId,
    permissionKey: override.permissionKey,
    roleId: override.roleId,
    effect: override.effect,
    reason: override.reason,
    expiresAt: override.expiresAt?.toISOString() ?? null,
  };
}

async function findOverrideForMembership(input: {
  companyId: string;
  agencyMembershipId: string;
  permissionKey: string;
  userId: string;
}) {
  const overrides = await listUserPermissionOverrides({
    companyId: input.companyId,
    agencyMembershipId: input.agencyMembershipId,
    userId: input.userId,
  });
  return overrides.find((override) => override.permissionKey === input.permissionKey) ?? null;
}

async function setPermissionOverrideEffect(
  input: PermissionOverrideInput,
  effect: PermissionEffect,
) {
  await getPermissionService(input.permissionKey);
  const membership = await getScopedAgencyMembership({
    context: input.context,
    targetUserId: input.targetUserId,
    permissionKey: input.permissionKey,
  });
  const before = await findOverrideForMembership({
    companyId: input.context.companyId,
    agencyMembershipId: membership.id,
    permissionKey: input.permissionKey,
    userId: input.targetUserId,
  });

  return runInTransaction(async (db) => {
    const override = await upsertUserPermissionOverride(
      {
        id: createId(),
        companyId: input.context.companyId,
        userId: input.targetUserId,
        agencyMembershipId: membership.id,
        permissionKey: input.permissionKey,
        roleId: membership.roleId,
        effect,
        reason: input.reason,
        expiresAt: input.expiresAt ?? null,
      },
      db,
    );
    const action =
      effect === PermissionEffect.grant
        ? "PermissionOverrideGranted"
        : "PermissionOverrideDenied";
    const changes = {
      before: serializePermissionOverride(before),
      after: serializePermissionOverride(override),
    } satisfies Prisma.InputJsonObject;

    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        action,
        entityType: PERMISSION_OVERRIDE_ENTITY,
        entityId: override.id,
        changes,
      },
      db,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: PERMISSION_OVERRIDE_ENTITY,
        entityId: override.id,
        verb: action,
        metadata: changes,
      },
      db,
    );

    return override;
  });
}

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

export async function ensureCompanySystemRolesService(input: { companyId: string }) {
  const permissions = await listPermissions();
  const allPermissionKeys = permissions.map((permission) => permission.key);
  const templates = [
    { name: "owner", scope: "company" as const, permissions: allPermissionKeys },
    {
      name: "admin",
      scope: "agency" as const,
      permissions: allPermissionKeys.filter((key) => !key.startsWith("workspace.billing")),
    },
    ...Object.entries(agencyRolePermissionTemplates).map(([name, permissionKeys]) => ({
      name,
      scope: "agency" as const,
      permissions: permissionKeys,
    })),
  ];

  return runInTransaction(async (db) => {
    const existingRoles = await listRoles({ companyId: input.companyId }, db);
    const roles = [];
    for (const template of templates) {
      const existing = existingRoles.find((role) => role.name === template.name && role.scope === template.scope);
      if (existing) {
        roles.push(existing);
      } else {
        roles.push(await createRole({
          id: createId(),
          companyId: input.companyId,
          name: template.name,
          description: systemRoleDescriptions[template.name],
          scope: template.scope,
          isSystem: true,
        }, db));
      }
    }

    const rolePermissions = roles.flatMap((role) => {
      const template = templates.find((item) => item.name === role.name && item.scope === role.scope);
      return (template?.permissions ?? []).map((permissionKey) => ({
        id: createId(),
        roleId: role.id,
        permissionKey,
      }));
    });
    if (rolePermissions.length > 0) {
      await createManyRolePermissions(rolePermissions, db);
    }
    return roles;
  });
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

export async function getActiveUserPermissionOverrideService(input: {
  companyId: string;
  agencyId: string;
  agencyMembershipId: string;
  userId: string;
  permissionKey: string;
  now?: Date;
}) {
  return findActiveUserPermissionOverride(input);
}

export async function grantPermissionOverride(input: PermissionOverrideInput) {
  return setPermissionOverrideEffect(input, PermissionEffect.grant);
}

export async function denyPermissionOverride(input: PermissionOverrideInput) {
  return setPermissionOverrideEffect(input, PermissionEffect.deny);
}

export async function revokePermissionOverride(input: {
  context: PermissionOverrideContext;
  targetUserId: string;
  permissionKey: string;
}) {
  await getPermissionService(input.permissionKey);
  const membership = await getScopedAgencyMembership({
    context: input.context,
    targetUserId: input.targetUserId,
    permissionKey: input.permissionKey,
  });
  const before = await findOverrideForMembership({
    companyId: input.context.companyId,
    agencyMembershipId: membership.id,
    permissionKey: input.permissionKey,
    userId: input.targetUserId,
  });

  if (!before) {
    throw createPermissionOverrideNotFoundError({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.targetUserId,
      permissionKey: input.permissionKey,
    });
  }

  return runInTransaction(async (db) => {
    const result = await deleteUserPermissionOverride(
      {
        companyId: input.context.companyId,
        agencyMembershipId: membership.id,
        permissionKey: input.permissionKey,
      },
      db,
    );
    const changes = {
      before: serializePermissionOverride(before),
      after: null,
    } satisfies Prisma.InputJsonObject;

    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        action: "PermissionOverrideRevoked",
        entityType: PERMISSION_OVERRIDE_ENTITY,
        entityId: before.id,
        changes,
      },
      db,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: PERMISSION_OVERRIDE_ENTITY,
        entityId: before.id,
        verb: "PermissionOverrideRevoked",
        metadata: changes,
      },
      db,
    );

    return result;
  });
}

export async function updatePermissionOverrideExpiry(input: PermissionOverrideExpiryInput) {
  await getPermissionService(input.permissionKey);
  const membership = await getScopedAgencyMembership({
    context: input.context,
    targetUserId: input.targetUserId,
    permissionKey: input.permissionKey,
  });
  const before = await findOverrideForMembership({
    companyId: input.context.companyId,
    agencyMembershipId: membership.id,
    permissionKey: input.permissionKey,
    userId: input.targetUserId,
  });

  if (!before) {
    throw createPermissionOverrideNotFoundError({
      companyId: input.context.companyId,
      agencyId: input.context.agencyId,
      userId: input.targetUserId,
      permissionKey: input.permissionKey,
    });
  }

  return runInTransaction(async (db) => {
    const result = await updateUserPermissionOverrideExpiryRepository(
      {
        companyId: input.context.companyId,
        agencyMembershipId: membership.id,
        permissionKey: input.permissionKey,
        expiresAt: input.expiresAt ?? null,
      },
      db,
    );
    const after = {
      ...serializePermissionOverride(before),
      expiresAt: input.expiresAt?.toISOString() ?? null,
    } satisfies Prisma.InputJsonObject;
    const changes = {
      before: serializePermissionOverride(before),
      after,
    } satisfies Prisma.InputJsonObject;

    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        action: "PermissionOverrideExpiryUpdated",
        entityType: PERMISSION_OVERRIDE_ENTITY,
        entityId: before.id,
        changes,
      },
      db,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: PERMISSION_OVERRIDE_ENTITY,
        entityId: before.id,
        verb: "PermissionOverrideExpiryUpdated",
        metadata: changes,
      },
      db,
    );

    return result;
  });
}

export const permissionsService = {
  listPermissionsService,
  getPermissionService,
  listRolesService,
  ensureCompanySystemRolesService,
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
  getActiveUserPermissionOverrideService,
  grantPermissionOverride,
  denyPermissionOverride,
  revokePermissionOverride,
  updatePermissionOverrideExpiry,
};
