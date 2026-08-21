"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  X,
  Info,
  Users,
  Activity,
  CalendarDays,
  MoreHorizontal,
  MapPin,
  Mail,
  Phone,
  Globe,
  Building2,
  Clock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Agency } from "@/lib/mock-workspaces"
import {
  getMembersByAgency,
  getAuditLogsByAgency,
  getGlobalUserById,
  getUserName,
  roleLabels,
  roleBadgeStyles,
} from "@/lib/mock-workspaces"
import { cn } from "@/lib/utils"

type TabId = "overview" | "operations" | "members" | "activity"

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Agence", icon: Info },
  { id: "operations", label: "Opérations", icon: CalendarDays },
  { id: "members", label: "Membres", icon: Users },
  { id: "activity", label: "Activité", icon: Activity },
]

const statusBadge: Record<Agency["status"], { dot: string; bg: string; label: string }> = {
  active: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700", label: "Actif" },
  suspended: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700", label: "Suspendu" },
  cancelled: { dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700", label: "Annulé" },
}

const actionBadge: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-sky-50 text-sky-700",
  delete: "bg-rose-50 text-rose-700",
  export: "bg-amber-50 text-amber-700",
  sign: "bg-indigo-50 text-indigo-700",
}

const actionLabel: Record<string, string> = {
  create: "Créé",
  update: "Modifié",
  delete: "Supprimé",
  export: "Exporté",
  sign: "Signé",
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function fmtShort(d: string) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function KpiCell({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: "emerald" | "rose" | "indigo" | "amber"
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "rose"
        ? "text-rose-600"
        : accent === "indigo"
          ? "text-indigo-600"
          : accent === "amber"
            ? "text-amber-600"
            : "text-slate-900"
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn("mt-2 text-xl font-bold tabular-nums leading-none", color)}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

export function AgencyDetailPanel({
  agency,
  onClose,
}: {
  agency: Agency
  onClose: () => void
}) {
  const [tab, setTab] = useState<TabId>("overview")

  const members = getMembersByAgency(agency.id)
  const activityLogs = getAuditLogsByAgency(agency.id, 12)
  const status = statusBadge[agency.status]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {agency.id.replace("agency_", "AG-").toUpperCase()}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.bg)}>
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", status.dot)} />
                {status.label}
              </span>
            </div>

            <h2 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-900">
              {agency.name}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {agency.city}
              </span>
              <span className="text-slate-300">·</span>
              <span>{agency.memberCount} membres</span>
              <span className="text-slate-300">·</span>
              <span>{agency.carCount} véhicules</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-3 border-t border-slate-200/80 px-5">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {active && (
                    <motion.span
                      layoutId="agency-detail-tab"
                      className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50/40 px-5 py-5">

        {/* OVERVIEW ─────────────────────────────────────────── */}
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Quick KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCell label="Véhicules" value={agency.carCount.toString()} />
              <KpiCell label="Réservations" value={agency.reservationCount.toLocaleString("fr-FR")} />
              <KpiCell label="Clients" value={agency.customerCount.toLocaleString("fr-FR")} />
              <KpiCell label="Membres" value={agency.memberCount.toString()} />
            </div>

            {/* Contact info */}
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">Informations de contact</p>
              </div>
              <div className="divide-y divide-slate-100">
                <InfoRow icon={MapPin} label="Adresse" value={agency.address} />
                <InfoRow icon={Mail} label="Email" value={agency.email} href={`mailto:${agency.email}`} />
                <InfoRow icon={Phone} label="Téléphone" value={agency.phone} href={`tel:${agency.phone}`} />
                {agency.website && (
                  <InfoRow icon={Globe} label="Site web" value={`https://${agency.website}`} href={`https://${agency.website}`} />
                )}
                <InfoRow icon={Building2} label="Propriétaire" value={getUserName(agency.ownerId)} />
                <InfoRow icon={Clock} label="Créée le" value={fmt(agency.createdAt)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* OPERATIONS ───────────────────────────────────────── */}
        {tab === "operations" && (
          <motion.div key="operations" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <KpiCell label="Réservations" value={agency.reservationCount.toLocaleString("fr-FR")} sub="Total toutes périodes" />
              <KpiCell label="Véhicules actifs" value={agency.carCount.toString()} sub="Parc total" />
              <KpiCell label="Clients uniques" value={agency.customerCount.toLocaleString("fr-FR")} sub="Base clientèle" accent="indigo" />
              <KpiCell label="Taux occupation" value={`${Math.min(98, Math.round((agency.reservationCount / (agency.carCount * 12)) * 10))}%`} sub="Estimation annuelle" accent="emerald" />
            </div>

            {/* Reservation breakdown */}
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">Répartition des réservations</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Terminées", pct: 72, color: "bg-emerald-500" },
                  { label: "En cours", pct: 18, color: "bg-indigo-500" },
                  { label: "En attente", pct: 7, color: "bg-amber-400" },
                  { label: "Annulées", pct: 3, color: "bg-rose-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", row.color)} />
                    <span className="flex-1 text-xs text-slate-700">{row.label}</span>
                    <div className="w-24 overflow-hidden rounded-full bg-slate-100 h-1.5">
                      <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-700">{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fleet status */}
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">État de la flotte</p>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Disponibles", count: Math.round(agency.carCount * 0.43), color: "bg-emerald-500" },
                  { label: "En location", count: Math.round(agency.carCount * 0.39), color: "bg-indigo-500" },
                  { label: "En maintenance", count: Math.round(agency.carCount * 0.14), color: "bg-amber-400" },
                  { label: "Hors service", count: Math.round(agency.carCount * 0.04), color: "bg-rose-400" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", row.color)} />
                      <span className="text-xs text-slate-700">{row.label}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-slate-900">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* MEMBERS ──────────────────────────────────────────── */}
        {tab === "members" && (
          <motion.div key="members" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">{members.length} membre{members.length !== 1 ? "s" : ""}</p>
              </div>
              {members.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2.5">Membre</th>
                      <th className="px-4 py-2.5">Rôle</th>
                      <th className="px-4 py-2.5">Rejoint</th>
                      <th className="px-4 py-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const user = getGlobalUserById(member.userId)
                      return (
                        <tr key={member.id} className="border-b border-slate-100/60 last:border-0 hover:bg-slate-50/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                                {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-900">
                                  {user ? `${user.firstName} ${user.lastName}` : getUserName(member.userId)}
                                </p>
                                <p className="text-[11px] text-slate-400">{user?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset", roleBadgeStyles[member.role])}>
                              {roleLabels[member.role]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500">
                            {fmt(member.joinedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                            )}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", member.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                              {member.status === "active" ? "Actif" : "Inactif"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Aucun membre.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ACTIVITY ─────────────────────────────────────────── */}
        {tab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-700">Activité récente</p>
              </div>
              {activityLogs.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2.5">Action</th>
                      <th className="px-4 py-2.5">Détail</th>
                      <th className="px-4 py-2.5">Utilisateur</th>
                      <th className="px-4 py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100/60 last:border-0 hover:bg-slate-50/40">
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            actionBadge[log.action] ?? "bg-slate-100 text-slate-600",
                          )}>
                            {actionLabel[log.action] ?? log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">{log.details}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{getUserName(log.userId)}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-400 tabular-nums">{fmtShort(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Aucune activité récente.</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* ── Small sub-components ────────────────────────────── */

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 block truncate text-sm text-indigo-600 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 truncate text-sm text-slate-900">{value}</p>
        )}
      </div>
    </div>
  )
}
