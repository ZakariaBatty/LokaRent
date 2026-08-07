"use client"

import { Search, SlidersHorizontal } from "lucide-react"
import { type DriverStatus, type PaymentType } from "@/lib/drivers-data"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

export type DriversFiltersState = {
  search: string
  status: DriverStatus | "all"
  pricingType: PaymentType | "all"
  sort: "name_asc" | "recent" | "status" | "updated"
}

const statusOptions: { value: DriversFiltersState["status"]; label: string }[] = [
  { value: "all", label: fr.drivers.filters.allStatuses },
  { value: "active", label: fr.drivers.status.active },
  { value: "inactive", label: fr.drivers.status.inactive },
  { value: "suspended", label: fr.drivers.status.suspended },
]

const paymentOptions: { value: DriversFiltersState["pricingType"]; label: string }[] = [
  { value: "all", label: fr.drivers.filters.allPricingTypes },
  { value: "monthly", label: fr.drivers.pricing.monthly },
  { value: "hourly", label: fr.drivers.pricing.hourly },
  { value: "mission", label: fr.drivers.pricing.mission },
]

const sortOptions: { value: DriversFiltersState["sort"]; label: string }[] = [
  { value: "recent", label: fr.drivers.filters.recent },
  { value: "name_asc", label: fr.drivers.filters.nameAsc },
  { value: "status", label: fr.drivers.filters.statusSort },
  { value: "updated", label: fr.drivers.filters.updated },
]

const selectCls =
  "h-11 appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.75rem_center] bg-no-repeat"

export function DriversFilters({
  filters,
  onChange,
  total,
}: {
  filters: DriversFiltersState
  onChange: (f: DriversFiltersState) => void
  total: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder={fr.drivers.filters.searchPlaceholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as DriversFiltersState["status"] })}
        className={selectCls}
      >
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Payment type */}
      <select
        value={filters.pricingType}
        onChange={(e) => onChange({ ...filters, pricingType: e.target.value as DriversFiltersState["pricingType"] })}
        className={selectCls}
      >
        {paymentOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Sort */}
      <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as DriversFiltersState["sort"] })}
          className={cn(selectCls, "h-9 pl-3 text-xs")}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="whitespace-nowrap font-semibold tabular-nums text-slate-700">
          {total} {fr.drivers.filters.results}
        </span>
      </div>
    </div>
  )
}
