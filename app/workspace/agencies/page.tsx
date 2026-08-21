import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { listWorkspaceAgenciesService } from "@/modules/workspace/agencies/services/agencies.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import fr from "@/translations/fr";
import { WorkspaceAgenciesClient, type WorkspaceAgenciesData } from "./workspace-agencies-client";

function getAddressField(address: unknown, key: string) {
  if (!address || typeof address !== "object" || Array.isArray(address)) return "";
  const value = (address as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export default async function AgenciesPage() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_VIEW, context);

  const agencies = await listWorkspaceAgenciesService(context.companyId);
  const data: WorkspaceAgenciesData = {
    agencies: agencies.map((agency) => ({
      id: agency.id,
      name: agency.name,
      code: agency.code,
      status: agency.status,
      phone: agency.phone ?? "",
      email: agency.email ?? "",
      addressLine1: getAddressField(agency.address, "line1"),
      city: getAddressField(agency.address, "city") || agency.code,
      createdAt: agency.createdAt.toISOString(),
      updatedAt: agency.updatedAt.toISOString(),
      memberCount: agency._count.agencyMemberships,
      vehicleCount: agency._count.vehicles,
      reservationCount: agency._count.reservations,
      customerCount: agency._count.customers,
    })),
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="building"
          breadcrumb={fr.workspace.agencies.breadcrumb}
          title={fr.workspace.agencies.title}
          description={fr.workspace.agencies.description}
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>
      <WorkspaceAgenciesClient data={data} labels={fr.workspace.agencies} />
    </div>
  );
}
