"use client"

import { Search, Filter, Plus, Sparkles, X } from "lucide-react"
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
import { type ReservationStatus, statusConfig, reservationStatuses } from "@/lib/reservations-data"
import { ViewToggle, type ReservationView } from "./view-toggle"
import { cn } from "@/lib/utils"

export type ReservationsFiltersState = {
  search: string
  status: ReservationStatus | "all"
  payment: "all" | "paid" | "partial" | "unpaid"
  onlyOverdue: boolean
  sort: "recent" | "amount_desc" | "date_asc"
}

export function ReservationsFilters({
  state,
  onChange,
  view,
  onViewChange,
  count,
  onNew,
}: {
  state: ReservationsFiltersState
  onChange: (s: ReservationsFiltersState) => void
  view: ReservationView
  onViewChange: (v: ReservationView) => void
  count: number
  onNew: () => void
}) {
  const update = <K extends keyof ReservationsFiltersState>(key: K, val: ReservationsFiltersState[K]) =>
    onChange({ ...state, [key]: val })

  const activeFilters =
    (state.status !== "all" ? 1 : 0) + (state.payment !== "all" ? 1 : 0) + (state.onlyOverdue ? 1 : 0)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={state.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Rechercher par client, voiture, immatriculation, code..."
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
            <DropdownMenuLabel>Statut</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.status}
              onValueChange={(v) => update("status", v as ReservationsFiltersState["status"])}
            >
              <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
              {reservationStatuses.map((s) => (
                <DropdownMenuRadioItem key={s} value={s}>
                  <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", statusConfig[s].dot)} />
                  {statusConfig[s].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Paiement</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={state.payment}
              onValueChange={(v) => update("payment", v as ReservationsFiltersState["payment"])}
            >
              <DropdownMenuRadioItem value="all">Tous</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="paid">Payé</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="partial">Partiel</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="unpaid">Impayé</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Spécifique</DropdownMenuLabel>
            <button
              type="button"
              onClick={() => update("onlyOverdue", !state.onlyOverdue)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <span>En retard uniquement</span>
              <span
                className={cn(
                  "h-4 w-7 rounded-full p-0.5 transition-colors",
                  state.onlyOverdue ? "bg-rose-500" : "bg-slate-200",
                )}
              >
                <motion.span
                  layout
                  className={cn(
                    "block h-3 w-3 rounded-full bg-white",
                    state.onlyOverdue && "ml-auto",
                  )}
                />
              </span>
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Trier
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuRadioGroup
              value={state.sort}
              onValueChange={(v) => update("sort", v as ReservationsFiltersState["sort"])}
            >
              <DropdownMenuRadioItem value="recent">Plus récentes</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="amount_desc">Montant (haut → bas)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date_asc">Début (proche → loin)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden md:block">
          <ViewToggle value={view} onChange={onViewChange} />
        </div>

        <span className="hidden text-xs font-medium text-slate-500 md:inline-block">
          {count} résultat{count > 1 ? "s" : ""}
        </span>

        <button
          type="button"
          onClick={onNew}
          className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-blue-600 to-indigo-700 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] transition-shadow hover:shadow-[0_10px_28px_rgba(37,99,235,0.35)]"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Plus className="relative h-4 w-4" />
          <span className="relative">Nouvelle réservation</span>
        </button>
      </div>

      <div className="-mt-1 md:hidden">
        <ViewToggle value={view} onChange={onViewChange} />
      </div>
    </div>
  )
}
