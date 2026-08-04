"use client"

import { motion } from "motion/react"
import { ChevronDown, Plus, Search, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { expenseTypes, expenseTypeStyles, type ExpenseType } from "@/lib/expenses-data"
import { cars } from "@/lib/cars-data"

export type ExpensesSortKey = "date" | "amount"
export type DateRange = "this_month" | "last_month" | "last_30" | "all"

const sortLabels: Record<ExpensesSortKey, string> = {
  date: "Date ↓",
  amount: "Montant ↓",
}

const dateRangeLabels: Record<DateRange, string> = {
  this_month: "Ce mois",
  last_month: "Mois dernier",
  last_30: "30 derniers jours",
  all: "Toutes périodes",
}

export function ExpensesFilters({
  search,
  onSearch,
  typeFilter,
  onType,
  carFilter,
  onCar,
  dateRange,
  onDateRange,
  sort,
  onSort,
  resultCount,
  onAdd,
}: {
  search: string
  onSearch: (v: string) => void
  typeFilter: ExpenseType | "all"
  onType: (v: ExpenseType | "all") => void
  carFilter: string | "all"
  onCar: (v: string | "all") => void
  dateRange: DateRange
  onDateRange: (v: DateRange) => void
  sort: ExpensesSortKey
  onSort: (v: ExpensesSortKey) => void
  resultCount: number
  onAdd: () => void
}) {
  const currentTypeLabel =
    typeFilter === "all" ? "Tous les types" : expenseTypeStyles[typeFilter].label
  const currentCarLabel =
    carFilter === "all"
      ? "Toutes les voitures"
      : (() => {
          const c = cars.find((x) => x.id === carFilter)
          return c ? `${c.brand} ${c.model}` : "Toutes les voitures"
        })()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher par description…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Type</span>
              {typeFilter !== "all" && (
                <span className={cn("h-2 w-2 rounded-full", expenseTypeStyles[typeFilter].dot)} />
              )}
              <span className="max-w-[140px] truncate">{currentTypeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onType("all")}
              className={cn("cursor-pointer", typeFilter === "all" && "bg-indigo-50 text-indigo-700")}
            >
              Tous les types
            </DropdownMenuItem>
            {expenseTypes.map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => onType(t)}
                className={cn(
                  "cursor-pointer gap-2",
                  typeFilter === t && "bg-indigo-50 text-indigo-700",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", expenseTypeStyles[t].dot)} />
                {expenseTypeStyles[t].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Car filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Voiture</span>
              <span className="max-w-[160px] truncate">{currentCarLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[320px] w-60 overflow-y-auto">
            <DropdownMenuLabel>Filtrer par voiture</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCar("all")}
              className={cn("cursor-pointer", carFilter === "all" && "bg-indigo-50 text-indigo-700")}
            >
              Toutes les voitures
            </DropdownMenuItem>
            {cars.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => onCar(c.id)}
                className={cn(
                  "cursor-pointer",
                  carFilter === c.id && "bg-indigo-50 text-indigo-700",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span>
                    {c.brand} {c.model}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">{c.plate}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Période</span>
              <span>{dateRangeLabels[dateRange]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Période</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(dateRangeLabels) as DateRange[]).map((k) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onDateRange(k)}
                className={cn("cursor-pointer", dateRange === k && "bg-indigo-50 text-indigo-700")}
              >
                {dateRangeLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trier</span>
              <span>{sortLabels[sort]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Trier par</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(sortLabels) as ExpensesSortKey[]).map((k) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onSort(k)}
                className={cn("cursor-pointer", sort === k && "bg-indigo-50 text-indigo-700")}
              >
                {sortLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Primary add */}
        <button
          onClick={onAdd}
          className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)]"
        >
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <Plus className="relative h-4 w-4" />
          <span className="relative">Ajouter une dépense</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700 tabular-nums">{resultCount}</span>
        <span>résultat{resultCount > 1 ? "s" : ""}</span>
      </div>
    </div>
  )
}
