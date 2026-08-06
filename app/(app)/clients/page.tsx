import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, requirePermission } from "@/shared/permissions"
import { listCustomersService } from "@/modules/clients/services/clients.service"
import { mapCustomerToClient } from "@/modules/clients/mappers/client.mapper"
import { ClientsPageClient } from "@/components/clients/clients-page-client"
import type { ClientStatus, Nationality } from "@/lib/clients-data"
import type { SortKey } from "@/components/clients/clients-filters"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseStatus(value: string | undefined) {
  if (value === "actif") return "active"
  if (value === "inactif") return "inactive"
  if (value === "blacklist") return "blacklisted"
  return undefined
}

function parseClientStatus(value: string | undefined): ClientStatus | "all" {
  if (value === "actif" || value === "inactif" || value === "blacklist") return value
  return "all"
}

function parseNationality(value: string | undefined): Nationality | "all" | "etranger" {
  if (
    value === "Marocain" ||
    value === "Français" ||
    value === "Espagnol" ||
    value === "Anglais" ||
    value === "Allemand" ||
    value === "etranger"
  ) {
    return value
  }
  return "all"
}

function parseSort(value: string | undefined): SortKey {
  if (value === "totalSpent" || value === "mostActive") return value
  return "lastRental"
}

function parseNationalityFilter(value: Nationality | "all" | "etranger") {
  if (value === "all") return {}
  if (value === "etranger") return { nationalityMode: "foreign" as const }

  const labels: Record<Nationality, string> = {
    Marocain: "MA",
    Français: "FR",
    Espagnol: "ES",
    Anglais: "GB",
    Allemand: "DE",
  }

  return { nationality: labels[value], nationalityMode: "exact" as const }
}

function parsePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.CLIENTS_VIEW, context)

  const search = first(params.search)?.trim() ?? ""
  const nationality = parseNationality(first(params.nationality))
  const status = parseClientStatus(first(params.status))
  const sort = parseSort(first(params.sort))
  const page = parsePage(first(params.page))

  const result = await listCustomersService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    page,
    pageSize: 25,
    search,
    status: parseStatus(status),
    ...parseNationalityFilter(nationality),
    orderBy: sort === "lastRental" ? "createdAt" : "updatedAt",
    direction: "desc",
  })

  return (
    <ClientsPageClient
      initialResult={{
        data: result.data.map(mapCustomerToClient),
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        },
      }}
      initialFilters={{
        search,
        nationality,
        status,
        sort,
      }}
    />
  )
}
