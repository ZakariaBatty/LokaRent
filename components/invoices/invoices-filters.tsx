"use client"

import { Search, Filter, Plus, X, ChevronDown } from "lucide-react"
import { motion } from "motion/react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type InvoiceStatus,
  type InvoiceType,
  type CustomerType,
  invoiceStatuses,
  statusConfig,
} from "@/lib/invoices-data"
import { cn } from "@/lib/utils"

export type InvoicesFiltersState = {
  search: string
  status: InvoiceStatus | "all"
  type: InvoiceType | "all"
  customerType: CustomerType | "all"
  dateRange: "all" | "this_month" | "last_month" | "quarter"
  sort: "recent" | "amount_desc" | "due_asc"
}

const dateRangeLabels: Record<InvoicesFiltersState["dateRange"], string> = {
  all:        "Toutes périodes",
  this_month: "Ce mois",
  last_month: "Mois dernier",
  quarter:    "Trimestre",
}

const sortLabels: Record<InvoicesFiltersState["sort"], string> = {
  recent:     "Plus récentes",
  amount_desc:"Montant (haut → bas)",
  due_asc:    "Échéance (proche → loin)",
}

export function InvoicesFilters({
  state,
  onChange,
  count,
  onNew,
}: {
  state: InvoicesFiltersState
  onChange: (s: InvoicesFiltersState) => void
  count: number
  onNew: () => void
}) {
  const update = <K extends keyof InvoicesFiltersState>(
    key: K,
    val: InvoicesFiltersState[K],
  ) => onChange({ ...state, [key]: val })

  const activeFilters =
    (state.status !== "all" ? 1 : 0) +
    (state.type !== "all" ? 1 : 0) +
    (state.customerType !== "all" ? 1 : 0) +
    (state.dateRange !== "all" ? 1 : 0)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={state.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Rechercher par n° facture, client, réservation..."
          className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20"
        />
        {state.search && (
          <button
            type="button"
            onClick={() => update("search", "")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Statut + type + customer + date all bundled in one Filters dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtres
              {activeFilters > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-bold text-blue-700">
                  {activeFilters}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl">
            {/* Statut */}
            <DropdownMenuLabel>Statut</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.status}
              onValueChange={(v) => update("status", v as InvoicesFiltersState["status"])}
            >
              <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
              {invoiceStatuses.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", statusConfig[s].dot)} />
                  {statusConfig[s].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            {/* Type de facture */}
            <DropdownMenuLabel>Type de facture</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.type}
              onValueChange={(v) => update("type", v as InvoicesFiltersState["type"])}
            >
              <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="rental">Location</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="manual">Manuelle</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            {/* Type de client */}
            <DropdownMenuLabel>Type de client</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.customerType}
              onValueChange={(v) => update("customerType", v as InvoicesFiltersState["customerType"])}
            >
              <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="individual">Particulier</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="company">Entreprise</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            {/* Période */}
            <DropdownMenuLabel>Période</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.dateRange}
              onValueChange={(v) => update("dateRange", v as InvoicesFiltersState["dateRange"])}
            >
              {(Object.keys(dateRangeLabels) as Array<InvoicesFiltersState["dateRange"]>).map((k) => (
                <DropdownMenuRadioItem key={k} value={k}>
                  {dateRangeLabels[k]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              {sortLabels[state.sort]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuRadioGroup
              value={state.sort}
              onValueChange={(v) => update("sort", v as InvoicesFiltersState["sort"])}
            >
              {(Object.keys(sortLabels) as Array<InvoicesFiltersState["sort"]>).map((k) => (
                <DropdownMenuRadioItem key={k} value={k}>
                  {sortLabels[k]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="hidden text-xs font-medium text-slate-500 md:inline-block">
          {count} résultat{count !== 1 ? "s" : ""}
        </span>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onNew}
          className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-blue-600 to-indigo-700 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] transition-shadow hover:shadow-[0_10px_28px_rgba(37,99,235,0.35)]"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Plus className="relative h-4 w-4" />
          <span className="relative">Créer une facture</span>
        </button>
      </div>
    </div>
  )
}
