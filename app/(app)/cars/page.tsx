import { FuelType, Transmission, VehicleStatus } from "@lokarent/db"
import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, can, requirePermission } from "@/shared/permissions"
import { listVehicleCategoriesService, listVehiclesService } from "@/modules/cars/services/cars.service"
import { mapVehicleToCar } from "@/modules/cars/mappers/car.mapper"
import { getFinanceOverviewReportService } from "@/modules/finances/services/finances.service"
import { CarsPageClient } from "@/components/cars/cars-page-client"
import type { Car, CarCategory, CarStatus } from "@/lib/cars-data"
import type { FinanceReportingCar } from "@/modules/finances/services/finances.service"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | undefined): VehicleStatus | undefined {
  if (value === "disponible") return VehicleStatus.available
  if (value === "louee") return VehicleStatus.rented
  if (value === "maintenance") return VehicleStatus.maintenance
  if (value === "hors_service") return VehicleStatus.inactive
  return undefined
}

function parseUiStatus(value: string | undefined): CarStatus | "all" {
  if (value === "disponible" || value === "louee" || value === "maintenance" || value === "hors_service") {
    return value
  }
  return "all"
}

function parseCategory(value: string | undefined): CarCategory | "all" {
  if (value === "Citadine" || value === "Berline" || value === "SUV" || value === "Utilitaire") return value
  return "all"
}

function parseFuel(value: string | undefined): FuelType | undefined {
  if (value === "petrol" || value === "diesel" || value === "electric" || value === "hybrid" || value === "lpg") {
    return value
  }
  return undefined
}

function parseTransmission(value: string | undefined): Transmission | undefined {
  if (value === "manual" || value === "automatic") return value
  return undefined
}

function categoryIdForName(categories: Awaited<ReturnType<typeof listVehicleCategoriesService>>, name: CarCategory | "all") {
  if (name === "all") return undefined
  const candidates =
    name === "Citadine"
      ? ["Economy", "Citadine"]
      : name === "Berline"
        ? ["Sedan", "Compact", "Berline"]
        : name === "Utilitaire"
          ? ["Van", "Utilitaire"]
          : ["SUV"]
  return categories.find((category) => candidates.includes(category.name))?.id
}

function periodDays(period: { from: string; to: string }) {
  return Math.max(1, Math.ceil((new Date(period.to).getTime() - new Date(period.from).getTime()) / 86_400_000))
}

function applyVehicleFinance(car: Car, finance: FinanceReportingCar | undefined, daysInPeriod: number): Car {
  if (!finance) return car

  return {
    ...car,
    revenue: finance.revenue,
    expenses: finance.expenses,
    occupancyRate: finance.occupancyRate,
    totalDays: Math.round((finance.occupancyRate / 100) * daysInPeriod),
    recentExpenses: finance.recentExpenses,
    monthlyRevenue: finance.monthlyRevenue,
  }
}

export default async function CarsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.FLEET_VIEW, context)
  await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW, context)

  const search = first(params.search)?.trim() ?? ""
  const status = parseUiStatus(first(params.status))
  const category = parseCategory(first(params.category))
  const page = parsePage(first(params.page))
  const [categories, canDelete] = await Promise.all([
    listVehicleCategoriesService(context.companyId),
    can(PERMISSIONS.FLEET_DELETE, context),
  ])

  const result = await listVehiclesService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    page,
    pageSize: 24,
    search,
    status: parseStatus(status),
    categoryId: categoryIdForName(categories, category),
    fuelType: parseFuel(first(params.fuel)),
    transmission: parseTransmission(first(params.transmission)),
    orderBy: "createdAt",
    direction: "desc",
  })
  const financeReport = await getFinanceOverviewReportService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
    range: "year",
  })
  const financeByVehicle = new Map(financeReport.vehicles.map((vehicle) => [vehicle.id, vehicle]))
  const daysInFinancePeriod = periodDays(financeReport.period)

  return (
    <CarsPageClient
      initialResult={{
        data: result.data.map((vehicle) =>
          applyVehicleFinance(mapVehicleToCar(vehicle), financeByVehicle.get(vehicle.id), daysInFinancePeriod),
        ),
        pagination: result.pagination,
      }}
      initialFilters={{ search, status, category }}
      categories={categories.map((item) => ({ id: item.id, name: item.name }))}
      canDelete={canDelete}
    />
  )
}
