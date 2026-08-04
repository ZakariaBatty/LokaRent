"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  Building2,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  X,
} from "lucide-react"
import {
  mockAgencies,
  planLabels,
  formatMAD,
  type Agency,
} from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { AgencyDetailPanel } from "@/components/workspace/agencies/agency-detail-panel"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ── Static config ──────────────────────────────────────────────

const planColors: Record<Agency["plan"], string> = {
  STARTER: "bg-sky-50 text-sky-700 ring-sky-100",
  PRO: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  BUSINESS: "bg-violet-50 text-violet-700 ring-violet-100",
}

const statusStyles: Record<Agency["status"], { dot: string; pill: string; label: string }> = {
  active:    { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700",  label: "Actif" },
  suspended: { dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700",     label: "Suspendu" },
  cancelled: { dot: "bg-rose-500",    pill: "bg-rose-50 text-rose-700",       label: "Annulé" },
}

type SortKey = "name" | "plan" | "memberCount" | "carCount" | "reservationCount" | "revenue" | "status"
type SortDir = "asc" | "desc"

const STATUS_OPTS: { value: Agency["status"] | "all"; label: string }[] = [
  { value: "all",       label: "Tous" },
  { value: "active",    label: "Actif" },
  { value: "suspended", label: "Suspendu" },
  { value: "cancelled", label: "Annulé" },
]

const PLAN_OPTS: { value: Agency["plan"] | "all"; label: string }[] = [
  { value: "all",      label: "Tous les plans" },
  { value: "STARTER",  label: "Starter" },
  { value: "PRO",      label: "Pro" },
  { value: "BUSINESS", label: "Business" },
]

// ── Component ──────────────────────────────────────────────────

import { WorkspaceTabs } from "@/components/workspace/workspace-tabs"

export default function AgenciesPage() {
  const [search, setSearch]     = useState("")
  const [status, setStatus]     = useState<Agency["status"] | "all">("all")
  const [plan, setPlan]         = useState<Agency["plan"] | "all">("all")
  const [sortKey, setSortKey]   = useState<SortKey>("name")
  const [sortDir, setSortDir]   = useState<SortDir>("asc")
  const [selected, setSelected] = useState<Agency | null>(null)

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = mockAgencies.filter((a) => {
      if (status !== "all" && a.status !== status) return false
      if (plan   !== "all" && a.plan   !== plan)   return false
      if (q) {
        const hay = `${a.name} ${a.city} ${a.email} ${a.phone}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":             cmp = a.name.localeCompare(b.name);                   break
        case "plan":             cmp = a.plan.localeCompare(b.plan);                   break
        case "memberCount":      cmp = a.memberCount - b.memberCount;                  break
        case "carCount":         cmp = a.carCount - b.carCount;                        break
        case "reservationCount": cmp = a.reservationCount - b.reservationCount;        break
        case "revenue":          cmp = a.revenue - b.revenue;                          break
        case "status":           cmp = a.status.localeCompare(b.status);               break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [search, status, plan, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("asc") }
  }

  const hasFilters = search !== "" || status !== "all" || plan !== "all"

  const clearFilters = () => {
    setSearch("")
    setStatus("all")
    setPlan("all")
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon={Building2}
          breadcrumb="Agences"
          title="Gestion des agences"
          description="Gérez toutes vos agences, abonnements et statistiques."
          actions={
            <button
              type="button"
              onClick={() => toast.info("Création d'agence (à venir)")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Ajouter une agence
            </button>
          }
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une agence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                status === opt.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Plan filter */}
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as Agency["plan"] | "all")}
          className="rounded-xl border border-slate-200/80 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
        >
          {PLAN_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Clear */}
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm hover:text-slate-800"
            >
              <X className="h-3 w-3" />
              Effacer
            </motion.button>
          )}
        </AnimatePresence>

        {/* Count */}
        <div className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm">
          <SlidersHorizontal className="h-3 w-3" />
          {filtered.length} agence{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Aucune agence trouvée</p>
          <p className="mt-1 text-xs text-slate-400">Modifiez vos filtres ou créez une nouvelle agence.</p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <SortTh label="Agence"        col="name"             current={sortKey} dir={sortDir} onSort={handleSort} className="pl-5" />
                  <SortTh label="Abonnement"    col="plan"             current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Membres"        col="memberCount"      current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Véhicules"      col="carCount"         current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Réservations"  col="reservationCount" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="CA"             col="revenue"          current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortTh label="Statut"         col="status"           current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 pr-5" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((agency, idx) => {
                    const st = statusStyles[agency.status]
                    const isActive = selected?.id === agency.id
                    const profit = agency.revenue - agency.expenses
                    return (
                      <motion.tr
                        key={agency.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, delay: idx * 0.025 }}
                        onClick={() => setSelected(isActive ? null : agency)}
                        className={cn(
                          "cursor-pointer border-b border-slate-100/60 transition-colors last:border-0",
                          isActive ? "bg-indigo-50/70" : "hover:bg-slate-50/60",
                        )}
                      >
                        {/* Agence */}
                        <td className="pl-5 py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-sm">
                              {agency.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold leading-tight text-slate-900">{agency.name}</p>
                              <p className="text-[11px] text-slate-400">{agency.city} · {agency.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-4">
                          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", planColors[agency.plan])}>
                            {planLabels[agency.plan]}
                          </span>
                        </td>

                        {/* Membres */}
                        <td className="px-4 py-4 tabular-nums text-slate-600">
                          {agency.memberCount}
                        </td>

                        {/* Véhicules */}
                        <td className="px-4 py-4 tabular-nums text-slate-600">
                          {agency.carCount}
                        </td>

                        {/* Réservations */}
                        <td className="px-4 py-4 tabular-nums text-slate-600">
                          {agency.reservationCount.toLocaleString("fr-FR")}
                        </td>

                        {/* CA + marge */}
                        <td className="px-4 py-4">
                          <p className="font-semibold tabular-nums text-slate-900">{formatMAD(agency.revenue)}</p>
                          <p className={cn(
                            "text-[11px] tabular-nums font-medium",
                            profit >= 0 ? "text-emerald-600" : "text-rose-500",
                          )}>
                            {profit >= 0 ? "+" : ""}{formatMAD(profit)}
                          </p>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            st.pill,
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                            {st.label}
                          </span>
                        </td>

                        {/* Arrow */}
                        <td className="pr-5 py-4 pl-4 text-right">
                          <span className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition",
                            isActive && "bg-indigo-100 text-indigo-600 rotate-45",
                          )}>
                            <Plus className="h-4 w-4" />
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3">
            <p className="text-[11px] text-slate-400">
              {filtered.length} agence{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
            </p>
            <p className="text-[11px] font-semibold text-slate-600">
              CA total :{" "}
              <span className="text-slate-900">
                {formatMAD(filtered.reduce((s, a) => s + a.revenue, 0))}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Slide-over sheet (mirrors Reservations pattern) ── */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 md:w-[85%] lg:w-[80%]"
            >
              <AgencyDetailPanel
                agency={selected}
                onClose={() => setSelected(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── SortTh helper ──────────────────────────────────────────────

function SortTh({
  label,
  col,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  col: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = current === col
  return (
    <th
      className={cn("cursor-pointer select-none px-4 py-3 transition-colors hover:text-slate-700", className)}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUp className="h-3 w-3 text-indigo-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-indigo-500" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  )
}
