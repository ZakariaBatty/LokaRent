import { ContractStatus } from "@lokarent/db"
import { ContractsPageClient } from "@/components/contracts/contracts-page-client"
import { mapContractToUi } from "@/modules/contracts/mappers/contract.mapper"
import { listContractsService } from "@/modules/contracts/services/contracts.service"
import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, requirePermission } from "@/shared/permissions"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseStatus(value: string | undefined): ContractStatus | undefined {
  if (value === "termine") return ContractStatus.completed
  if (value === "annule") return ContractStatus.cancelled
  if (value === "en_cours") return ContractStatus.active
  return undefined
}

export default async function ContractsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.CONTRACTS_VIEW, context)

  const result = await listContractsService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    page: 1,
    pageSize: 50,
    search: first(params.search)?.trim() ?? "",
    status: parseStatus(first(params.status)),
    orderBy: "createdAt",
    direction: "desc",
  })

  return <ContractsPageClient contracts={result.data.map(mapContractToUi)} />
}
