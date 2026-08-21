"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search,
  Activity,
  Plus,
  Pencil,
  Trash2,
  Download,
  FileSignature,
  Building2,
  ChevronRight,
  X,
  User,
} from "lucide-react"
import {
  mockAuditLogs,
  mockAgencies,
  getUserName,
  getAgencyById,
  type AuditLog,
} from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs"
import { cn } from "@/lib/utils"

const actionConfig: Record<
  AuditLog["action"],
  { label: string; icon: typeof Plus; dot: string; bg: string }
> = {
  create: { label: "Création", icon: Plus, dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  update: { label: "Modification", icon: Pencil, dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  delete: { label: "Suppression", icon: Trash2, dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700" },
  export: { label: "Export", icon: Download, dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  sign: { label: "Signature", icon: FileSignature, dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-700" },
}

const resourceLabels: Record<AuditLog["resource"], string> = {
  car: "Véhicule",
  reservation: "Réservation",
  client: "Client",
  contract: "Contrat",
  expense: "Dépense",
  team: "Équipe",
  settings: "Paramètres",
}

const resourceColors: Record<AuditLog["resource"], string> = {
  car: "bg-sky-50 text-sky-700",
  reservation: "bg-indigo-50 text-indigo-700",
  client: "bg-violet-50 text-violet-700",
  contract: "bg-amber-50 text-amber-700",
  expense: "bg-rose-50 text-rose-700",
  team: "bg-teal-50 text-teal-700",
  settings: "bg-slate-100 text-slate-600",
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function WorkspaceActivityPage() {
  const [query, setQuery] = useState("")
  const [agencyFilter, setAgencyFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [resourceFilter, setResourceFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return mockAuditLogs
      .filter((log) => {
        if (agencyFilter !== "all" && log.agencyId !== agencyFilter) return false
        if (actionFilter !== "all" && log.action !== actionFilter) return false
        if (resourceFilter !== "all" && log.resource !== resourceFilter) return false
        if (query.trim()) {
          const hay = `${getUserName(log.userId)} ${log.details} ${resourceLabels[log.resource]}`.toLowerCase()
          if (!hay.includes(query.toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [query, agencyFilter, actionFilter, resourceFilter])

  const selectedLog = filtered.find((l) => l.id === selectedId) ?? null
  const hasSelection = !!selectedLog

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="activity"
          breadcrumb="Journaux"
          title="Journal d&apos;activité"
          description="Suivez toutes les actions effectuées par vos membres, toutes agences confondues."
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans les journaux..."
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
        <select
          value={agencyFilter}
          onChange={(e) => setAgencyFilter(e.target.value)}
          className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
        >
          <option value="all">Toutes les agences</option>
          {mockAgencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
        >
          <option value="all">Toutes les actions</option>
          {(Object.keys(actionConfig) as AuditLog["action"][]).map((key) => (
            <option key={key} value={key}>{actionConfig[key].label}</option>
          ))}
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
        >
          <option value="all">Toutes les ressources</option>
          {(Object.keys(resourceLabels) as AuditLog["resource"][]).map((key) => (
            <option key={key} value={key}>{resourceLabels[key]}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-5">
        {/* LEFT — table */}
        <motion.div
          layout
          animate={{ width: hasSelection ? "40%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Activity className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Aucune activité trouvée</p>
              <p className="mt-1 text-xs text-slate-500">Modifiez vos filtres de recherche.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <p className="text-xs font-semibold text-slate-500">
                  {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Action</th>
                      {!hasSelection && (
                        <>
                          <th className="px-4 py-3">Détail</th>
                          <th className="px-4 py-3">Ressource</th>
                          <th className="px-4 py-3">Utilisateur</th>
                          <th className="px-4 py-3">Agence</th>
                        </>
                      )}
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {filtered.map((log, idx) => {
                        const cfg = actionConfig[log.action]
                        const ActionIcon = cfg.icon
                        const active = selectedId === log.id
                        return (
                          <motion.tr
                            key={log.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2, delay: idx * 0.02 }}
                            onClick={() => setSelectedId(active ? null : log.id)}
                            className={cn(
                              "cursor-pointer border-b border-slate-100/50 transition",
                              active ? "bg-indigo-50/60" : "hover:bg-slate-50/60",
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", cfg.bg)}>
                                <ActionIcon className="h-3 w-3 shrink-0" />
                                {cfg.label}
                              </span>
                            </td>
                            {!hasSelection && (
                              <>
                                <td className="px-4 py-3.5 max-w-[240px]">
                                  <p className="truncate text-xs text-slate-700">{log.details}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", resourceColors[log.resource])}>
                                    {resourceLabels[log.resource]}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                                  {getUserName(log.userId)}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                    <span className="truncate">{getAgencyById(log.agencyId)?.city ?? "—"}</span>
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                              {fmt(log.createdAt)}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <ChevronRight className={cn("h-4 w-4 transition", active ? "text-indigo-500 rotate-90" : "text-slate-300")} />
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* RIGHT — detail panel */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "60%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="min-w-0 shrink-0"
              style={{ alignSelf: "flex-start" }}
            >
              <LogDetailPanel log={selectedLog} onClose={() => setSelectedId(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function LogDetailPanel({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const cfg = actionConfig[log.action]
  const ActionIcon = cfg.icon
  const agency = getAgencyById(log.agencyId)

  return (
    <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset", cfg.bg)}>
            <ActionIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Détail de l&apos;action</h2>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold mt-0.5", cfg.bg)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
              {cfg.label}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">
        {/* Description */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</p>
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 px-4 py-3">
            <p className="text-sm text-slate-800 leading-relaxed">{log.details}</p>
          </div>
        </section>

        {/* Meta */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Informations</p>
          <div className="space-y-2">
            <MetaRow label="Ressource">
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", resourceColors[log.resource])}>
                {resourceLabels[log.resource]}
              </span>
            </MetaRow>
            <MetaRow label="Identifiant ressource">
              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{log.resourceId}</code>
            </MetaRow>
            <MetaRow label="Utilisateur">
              <div className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600 uppercase">
                  <User className="h-3 w-3" />
                </span>
                <span className="text-xs font-medium text-slate-800">{getUserName(log.userId)}</span>
              </div>
            </MetaRow>
            <MetaRow label="Agence">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">{agency?.name ?? "—"}</span>
              </div>
            </MetaRow>
            <MetaRow label="Date et heure">
              <span className="text-xs font-medium text-slate-800 tabular-nums">
                {new Date(log.createdAt).toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </MetaRow>
            {log.ipAddress && (
              <MetaRow label="Adresse IP">
                <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{log.ipAddress}</code>
              </MetaRow>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/60 px-3 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <div>{children}</div>
    </div>
  )
}
