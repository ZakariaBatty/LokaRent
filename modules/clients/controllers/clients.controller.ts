import { requireCurrentAgencyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { listCustomersService, getCustomerService } from "../services/clients.service";
import { mapCustomerToClient, mapCustomerToDetail } from "../mappers/client.mapper";

export async function listClientsController(input: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive" | "blacklisted";
  type?: "individual" | "company";
  includeDeleted?: boolean;
}) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(PERMISSIONS.CLIENTS_VIEW, context);

  const result = await listCustomersService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    page: input.page,
    pageSize: input.pageSize,
    search: input.search,
    status: input.status,
    type: input.type,
    includeDeleted: input.includeDeleted,
    orderBy: "createdAt",
    direction: "desc",
  });

  return {
    ...result,
    data: result.data.map(mapCustomerToClient),
  };
}

export async function getClientController(input: { customerId: string }) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(PERMISSIONS.CLIENTS_VIEW, context);
  const customer = await getCustomerService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    customerId: input.customerId,
  });

  return mapCustomerToDetail(customer);
}
