import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { listActiveAgenciesService } from "@/modules/workspace/agencies/services/agencies.service";
import { listWorkspaceMembersService } from "@/modules/workspace/members/services/members.service";
import { ensureCompanySystemRolesService, listRolesService } from "@/modules/workspace/permissions/services/permissions.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { WorkspaceMembersClient, type WorkspaceMembersData } from "./workspace-members-client";

export default async function MembersPage() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_VIEW, context);
  await ensureCompanySystemRolesService({ companyId: context.companyId });

  const [members, agencies, roles] = await Promise.all([
    listWorkspaceMembersService({ companyId: context.companyId }),
    listActiveAgenciesService(context.companyId),
    listRolesService({ companyId: context.companyId }),
  ]);

  const data: WorkspaceMembersData = {
    currentUserId: context.userId,
    agencies: agencies.map((agency) => ({
      id: agency.id,
      name: agency.name,
      city: typeof agency.address === "object" && agency.address && "city" in agency.address
        ? String((agency.address as { city?: unknown }).city ?? "")
        : agency.code,
    })),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      scope: role.scope,
      isSystem: role.isSystem,
    })),
    companyMemberships: members.companyMemberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      roleId: membership.roleId,
      roleName: membership.role.name,
      status: membership.status,
      createdAt: membership.createdAt.toISOString(),
      user: {
        id: membership.user.id,
        fullName: membership.user.fullName,
        email: membership.user.email,
        phone: membership.user.phone,
        status: membership.user.status,
        lastLoginAt: membership.user.lastLoginAt?.toISOString() ?? null,
        createdAt: membership.user.createdAt.toISOString(),
      },
    })),
    agencyMemberships: members.agencyMemberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      agencyId: membership.agencyId,
      agencyName: membership.agency.name,
      agencyCode: membership.agency.code,
      roleId: membership.roleId,
      roleName: membership.role.name,
      status: membership.status,
      isPrimary: membership.isPrimary,
      joinedAt: membership.joinedAt?.toISOString() ?? membership.createdAt.toISOString(),
    })),
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="users"
          breadcrumb="Membres"
          title="Membres du workspace"
          description="Gestion centralisée des accès et rôles — toutes agences confondues."
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>
      <WorkspaceMembersClient data={data} />
    </div>
  );
}
