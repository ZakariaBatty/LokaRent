import { DriverPricingType, DriverStatus } from "@lokarent/db"
import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, can, requirePermission } from "@/shared/permissions"
import { paginateDriversService } from "@/modules/drivers/services/drivers.service"
import { mapDriverToUi } from "@/modules/drivers/mappers/driver.mapper"
import { DriversPageClient } from "@/components/drivers/drivers-page-client"
import type { DriversFiltersState } from "@/components/drivers/drivers-filters"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | undefined): DriverStatus | undefined {
  if (value === "active") return DriverStatus.active
  if (value === "inactive") return DriverStatus.inactive
  if (value === "suspended") return DriverStatus.suspended
  return undefined
}

function parsePricingType(value: string | undefined): DriverPricingType | undefined {
  if (value === "monthly") return DriverPricingType.monthly
  if (value === "hourly") return DriverPricingType.hourly
  if (value === "mission") return DriverPricingType.mission
  return undefined
}

function parseUiStatus(value: string | undefined): DriversFiltersState["status"] {
  if (value === "active" || value === "inactive" || value === "suspended") return value
  return "all"
}

function parseUiPricingType(value: string | undefined): DriversFiltersState["pricingType"] {
  if (value === "monthly" || value === "hourly" || value === "mission") return value
  return "all"
}

function parseUiSort(value: string | undefined): DriversFiltersState["sort"] {
  if (value === "name_asc" || value === "status" || value === "updated") return value
  return "recent"
}

function parseSort(value: string | undefined): "createdAt" | "lastName" | "status" | "updatedAt" {
  if (value === "name_asc") return "lastName"
  if (value === "status") return "status"
  if (value === "updated") return "updatedAt"
  return "createdAt"
}

export default async function DriversPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.FLEET_VIEW, context)

  const search = first(params.search)?.trim() ?? ""
  const status = parseUiStatus(first(params.status))
  const pricingType = parseUiPricingType(first(params.pricingType))
  const sort = parseUiSort(first(params.sort))
  const page = parsePage(first(params.page))
  const [result, canDelete] = await Promise.all([
    paginateDriversService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      page,
      pageSize: 24,
      search,
      status: parseStatus(status),
      pricingType: parsePricingType(pricingType),
      orderBy: parseSort(sort),
      direction: sort === "name_asc" ? "asc" : "desc",
    }),
    can(PERMISSIONS.FLEET_DELETE, context),
  ])

  return (
    <DriversPageClient
      initialResult={{ data: result.data.map(mapDriverToUi), pagination: result.pagination }}
      initialFilters={{ search, status, pricingType, sort }}
      canDelete={canDelete}
    />
  )
}
