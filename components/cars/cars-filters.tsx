"use client"

import { motion, AnimatePresence } from "motion/react"
import { Search, LayoutGrid, List, Sparkles, X } from "lucide-react"
import type { CarStatus, CarCategory } from "@/lib/cars-data"
import { statusConfig } from "@/lib/cars-data"
import { cn } from "@/lib/utils"

const allStatuses: CarStatus[] = ["disponible", "louee", "maintenance", "hors_service"]
const allCategories: CarCategory[] = ["Citadine", "Berline", "SUV", "Utilitaire"]

export function CarsFilters({
  search,
  onSearch,
  statuses,
  onToggleStatus,
  categories,
  onToggleCategory,
  smartFilters,
  onToggleSmartFilters,
  view,
  onChangeView,
  onClear,
  resultCount,
  compact,
}: {
  search: string
  onSearch: (v: string) => void
  statuses: CarStatus[]
  onToggleStatus: (s: CarStatus) => void
  categories: CarCategory[]
  onToggleCategory: (c: CarCategory) => void
  smartFilters: boolean
  onToggleSmartFilters: () => void
  view: "grid" | "list"
  onChangeView: (v: "grid" | "list") => void
  onClear: () => void
  resultCount: number
  compact?: boolean
}) {
  const hasActive = statuses.length > 0 || categories.length > 0 || search.length > 0 || smartFilters

  return (
    <div className="space-y-3">
      {/* Top row: search + view */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={
              compact
                ? "Rechercher..."
                : "Rechercher par plaque, marque, modèle..."
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {!compact && (
          <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => onChangeView("grid")}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-lg transition",
                view === "grid" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
              aria-label="Vue grille"
            >
              {view === "grid" && (
                <motion.span
                  layoutId="view-toggle-bg"
                  className="absolute inset-0 rounded-lg bg-indigo-50"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <LayoutGrid className="relative h-4 w-4" />
            </button>
            <button
              onClick={() => onChangeView("list")}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-lg transition",
                view === "list" ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
              aria-label="Vue liste"
            >
              {view === "list" && (
                <motion.span
                  layoutId="view-toggle-bg"
                  className="absolute inset-0 rounded-lg bg-indigo-50"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <List className="relative h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter pills row */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 pr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Statut
          </div>
          {allStatuses.map((s) => {
            const cfg = statusConfig[s]
            const active = statuses.includes(s)
            return (
              <button
                key={s}
                onClick={() => onToggleStatus(s)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition",
                  active
                    ? `${cfg.pillClass} ring-2 ring-offset-1 ring-offset-white`
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  active && s === "disponible" && "ring-emerald-200",
                  active && s === "louee" && "ring-blue-200",
                  active && s === "maintenance" && "ring-amber-200",
                  active && s === "hors_service" && "ring-rose-200",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
                {cfg.label}
              </button>
            )
          })}

          <div className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-1 pr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Catégorie
          </div>
          {allCategories.map((c) => {
            const active = categories.includes(c)
            return (
              <button
                key={c}
                onClick={() => onToggleCategory(c)}
                className={cn(
                  "h-7 rounded-full border px-2.5 text-[11px] font-medium transition",
                  active
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100 ring-offset-1 ring-offset-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {c}
              </button>
            )
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onToggleSmartFilters}
              className={cn(
                "relative inline-flex h-7 items-center gap-1.5 overflow-hidden rounded-full border px-2.5 text-[11px] font-semibold transition",
                smartFilters
                  ? "border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {smartFilters && (
                <motion.span
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                />
              )}
              <Sparkles className="relative h-3 w-3" />
              <span className="relative">Smart Filters</span>
            </button>

            <AnimatePresence>
              {hasActive && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={onClear}
                  className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3 w-3" />
                  Effacer
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Result count */}
      {!compact && (
        <div className="flex items-center justify-between border-t border-slate-200/70 pt-3">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-900 tabular-nums">{resultCount}</span> véhicule
            {resultCount > 1 ? "s" : ""} {hasActive ? "filtré" : "au total"}
            {resultCount > 1 && hasActive ? "s" : ""}
          </p>
          {smartFilters && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-violet-700">
              <Sparkles className="h-3 w-3" />
              Tri intelligent: rentabilité + disponibilité
            </p>
          )}
        </div>
      )}
    </div>
  )
}
