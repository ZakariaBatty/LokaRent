import { ReservationStatus } from "@lokarent/db"
import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, requirePermission } from "@/shared/permissions"
import { listReservationsService } from "@/modules/reservations/services/reservations.service"
import { mapReservationToUi } from "@/modules/reservations/mappers/reservation.mapper"
import { ReservationsPageClient } from "@/components/reservations/reservations-page-client"
import type { ReservationStatus as UiReservationStatus } from "@/lib/reservations-data"
import type { ReservationsFiltersState } from "@/components/reservations/reservations-filters"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | undefined): ReservationStatus | undefined {
  if (value === "demande") return ReservationStatus.enquiry
  if (value === "confirmee") return ReservationStatus.confirmed
  if (value === "en_cours") return ReservationStatus.active
  if (value === "terminee") return ReservationStatus.completed
  if (value === "annulee") return ReservationStatus.cancelled
  return undefined
}

function parseUiStatus(value: string | undefined): UiReservationStatus | "all" {
  if (value === "demande" || value === "confirmee" || value === "en_cours" || value === "terminee" || value === "annulee") return value
  return "all"
}

function parseSort(value: string | undefined): ReservationsFiltersState["sort"] {
  if (value === "amount_desc" || value === "date_asc") return value
  return "recent"
}

export default async function ReservationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.RESERVATIONS_VIEW, context)

  const search = first(params.search)?.trim() ?? ""
  const status = parseUiStatus(first(params.status))
  const sort = parseSort(first(params.sort))
  const result = await listReservationsService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    page: parsePage(first(params.page)),
    pageSize: 50,
    search,
    status: parseStatus(status),
    orderBy: sort === "amount_desc" ? "totalAmount" : sort === "date_asc" ? "startsAt" : "createdAt",
    direction: sort === "date_asc" ? "asc" : "desc",
  })

  return (
    <ReservationsPageClient
      initialReservations={result.data.map(mapReservationToUi)}
      initialFilters={{ search, status, payment: "all", onlyOverdue: false, sort }}
    />
  )
}
