import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { listActiveAgenciesService } from "@/modules/workspace/agencies/services/agencies.service";
import { listInvitationsService } from "@/modules/workspace/invitations/services/invitations.service";
import { ensureCompanySystemRolesService, listRolesService } from "@/modules/workspace/permissions/services/permissions.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import fr from "@/translations/fr";
import { WorkspaceInvitationsClient, type WorkspaceInvitationsData } from "./workspace-invitations-client";

export default async function InvitationsPage() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_VIEW, context);
  await ensureCompanySystemRolesService({ companyId: context.companyId });

  const [invitations, agencies, roles] = await Promise.all([
    listInvitationsService({ companyId: context.companyId }),
    listActiveAgenciesService(context.companyId),
    listRolesService({ companyId: context.companyId }),
  ]);

  const data: WorkspaceInvitationsData = {
    agencies: agencies.map((agency) => ({ id: agency.id, name: agency.name })),
    roles: roles.map((role) => ({ id: role.id, name: role.name, scope: role.scope })),
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      agencyId: invitation.agencyId,
      agencyName: invitation.agency?.name ?? null,
      roleId: invitation.roleId,
      roleName: invitation.role.name,
      invitedByName: invitation.invitedByUser.fullName,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
      createdAt: invitation.createdAt.toISOString(),
    })),
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="mail"
          breadcrumb="Invitations"
          title="Invitations"
          description="Suivez et gérez les invitations persistées du workspace."
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>
      <WorkspaceInvitationsClient data={data} labels={fr.workspace.invitations} />
    </div>
  );
}
