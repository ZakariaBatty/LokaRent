"use client"

import { motion } from "motion/react"
import { Search, X, ChevronDown, FileDown, Plus } from "lucide-react"
import { type Nationality, type ClientStatus } from "@/lib/clients-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

export type SortKey = "lastRental" | "totalSpent" | "mostActive"

const sortLabels: Record<SortKey, string> = {
  lastRental: "Dernière location",
  totalSpent: fr.clients.finance.paidAmount,
  mostActive: "Plus actifs",
}

const nationalityOptions: { value: Nationality | "all" | "etranger"; label: string }[] = [
  { value: "all", label: "Toutes nationalités" },
  { value: "Marocain", label: "Marocain" },
  { value: "etranger", label: "Étranger" },
]

const statusOptions: { value: ClientStatus | "all"; label: string; dot: string }[] = [
  { value: "all", label: "Tous statuts", dot: "bg-slate-300" },
  { value: "actif", label: "Actif", dot: "bg-emerald-500" },
  { value: "inactif", label: "Inactif", dot: "bg-slate-400" },
  { value: "blacklist", label: "Blacklisté", dot: "bg-rose-500" },
]

export function ClientsFilters({
  search,
  onSearch,
  nationalityFilter,
  onNationality,
  statusFilter,
  onStatus,
  sort,
  onSort,
  onAdd,
  onExport,
  resultCount,
  compact,
}: {
  search: string
  onSearch: (v: string) => void
  nationalityFilter: Nationality | "all" | "etranger"
  onNationality: (v: Nationality | "all" | "etranger") => void
  statusFilter: ClientStatus | "all"
  onStatus: (v: ClientStatus | "all") => void
  sort: SortKey
  onSort: (s: SortKey) => void
  onAdd: () => void
  onExport: () => void
  resultCount: number
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>
    )
  }

  const currentNationalityLabel =
    nationalityOptions.find((n) => n.value === nationalityFilter)?.label ?? "Toutes nationalités"
  const currentStatus = statusOptions.find((s) => s.value === statusFilter) ?? statusOptions[0]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, CIN/passeport…"
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

        {/* Nationality filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Nationalité
              </span>
              <span>{currentNationalityLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Filtrer par nationalité</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {nationalityOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onNationality(opt.value)}
                className={cn(
                  "cursor-pointer",
                  nationalityFilter === opt.value && "bg-indigo-50 text-indigo-700",
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className={cn("h-2 w-2 rounded-full", currentStatus.dot)} />
              <span>{currentStatus.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onStatus(opt.value)}
                className={cn(
                  "cursor-pointer gap-2",
                  statusFilter === opt.value && "bg-indigo-50 text-indigo-700",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", opt.dot)} />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Trier
              </span>
              <span>{sortLabels[sort]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Trier par</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
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

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <FileDown className="h-4 w-4 text-slate-500" />
              <span>Exporter</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Format d&apos;export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport()} className="cursor-pointer">
              CSV (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport()} className="cursor-pointer">
              PDF (.pdf)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport()} className="cursor-pointer">
              Excel (.xlsx)
            </DropdownMenuItem>
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
          <span className="relative">Ajouter client</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700 tabular-nums">{resultCount}</span>
        <span>résultat{resultCount > 1 ? "s" : ""}</span>
      </div>
    </div>
  )
}
