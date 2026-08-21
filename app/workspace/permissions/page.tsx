import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { listActiveAgenciesService } from "@/modules/workspace/agencies/services/agencies.service";
import { listWorkspaceMembersService } from "@/modules/workspace/members/services/members.service";
import { listCompanyUserPermissionOverrides } from "@/modules/workspace/permissions/repositories/permissions.repository";
import { ensureCompanySystemRolesService, listPermissionsService, listRolesService } from "@/modules/workspace/permissions/services/permissions.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import fr from "@/translations/fr";
import { WorkspacePermissionsClient, type WorkspacePermissionsData } from "./workspace-permissions-client";

export default async function PermissionsPage() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_VIEW, context);
  await ensureCompanySystemRolesService({ companyId: context.companyId });

  const [permissions, roles, members, agencies, overrides] = await Promise.all([
    listPermissionsService(),
    listRolesService({ companyId: context.companyId }),
    listWorkspaceMembersService({ companyId: context.companyId }),
    listActiveAgenciesService(context.companyId),
    listCompanyUserPermissionOverrides({ companyId: context.companyId }),
  ]);

  const data: WorkspacePermissionsData = {
    currentUserId: context.userId,
    permissions: permissions.map((permission) => ({
      key: permission.key,
      domain: permission.domain,
      description: permission.description,
    })),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      scope: role.scope,
      isSystem: role.isSystem,
      permissionKeys: role.rolePermissions.map((rolePermission) => rolePermission.permissionKey),
      memberCount:
        role.scope === "company"
          ? members.companyMemberships.filter((membership) => membership.roleId === role.id).length
          : members.agencyMemberships.filter((membership) => membership.roleId === role.id).length,
    })),
    users: members.companyMemberships.map((membership) => ({
      id: membership.user.id,
      fullName: membership.user.fullName,
      email: membership.user.email,
      companyMembershipId: membership.id,
      companyRoleId: membership.roleId,
      companyRoleName: membership.role.name,
    })),
    agencies: agencies.map((agency) => ({ id: agency.id, name: agency.name, code: agency.code })),
    agencyMemberships: members.agencyMemberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      agencyId: membership.agencyId,
      agencyName: membership.agency.name,
      roleId: membership.roleId,
      roleName: membership.role.name,
      status: membership.status,
    })),
    overrides: overrides.map((override) => ({
      id: override.id,
      userId: override.userId,
      agencyId: override.agencyMembership.agencyId,
      agencyMembershipId: override.agencyMembershipId,
      permissionKey: override.permissionKey,
      effect: override.effect,
      expiresAt: override.expiresAt?.toISOString() ?? null,
    })),
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="shield"
          breadcrumb={fr.workspace.permissions.breadcrumb}
          title={fr.workspace.permissions.title}
          description={fr.workspace.permissions.description}
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>
      <WorkspacePermissionsClient data={data} labels={fr.workspace.permissions} />
    </div>
  );
}
