"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X, Pencil, Trash2,
  User, Building2, Shield, Users2, Lock, Activity,
  Mail, Phone, Clock, Calendar, CheckCircle2, Circle, MinusCircle,
  ChevronDown, AlertTriangle,
} from "lucide-react"
import {
  type GlobalUser,
  type AgencyMembership,
  type AgencyTeam,
  type AuditLog,
  mockMemberships,
  getAgencyById,
  getTeamsByUser,
  getAuditLogsByUser,
  roleLabels,
  roleBadgeStyles,
  rolePermissions,
  permissionPages,
  permissionActions,
} from "@/lib/mock-workspaces"
import { MemberAvatar } from "./member-row"
import { cn } from "@/lib/utils"

type Tab = "info" | "acces" | "roles" | "equipes" | "permissions" | "activite"

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info",        label: "Informations",  icon: User },
  { key: "acces",       label: "Accès agences", icon: Building2 },
  { key: "roles",       label: "Rôles",         icon: Shield },
  { key: "equipes",     label: "Équipes",        icon: Users2 },
  { key: "permissions", label: "Permissions",   icon: Lock },
  { key: "activite",    label: "Activité",       icon: Activity },
]

const actionIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  create: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  update: { icon: Pencil,       color: "text-sky-600",     bg: "bg-sky-50"    },
  delete: { icon: Trash2,       color: "text-rose-600",    bg: "bg-rose-50"   },
  export: { icon: Activity,     color: "text-violet-600",  bg: "bg-violet-50" },
  sign:   { icon: CheckCircle2, color: "text-indigo-600",  bg: "bg-indigo-50" },
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  )
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm text-slate-800">{value}</p>
      </div>
    </div>
  )
}

// ─── Tab: Informations ───────────────────────────────────────────────────────
function InfoTab({ user }: { user: GlobalUser }) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="divide-y divide-slate-100">
          <InfoLine icon={Mail}     label="Email"             value={user.email} />
          <InfoLine icon={Phone}    label="Téléphone"         value={user.phone ?? "—"} />
          <InfoLine icon={Calendar} label="Membre depuis"     value={new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
          <InfoLine icon={Clock}    label="Dernière connexion" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Jamais"} />
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Accès agences ──────────────────────────────────────────────────────
function AccesTab({
  user,
  onRoleChange,
}: {
  user: GlobalUser
  onRoleChange: (membershipId: string, role: AgencyMembership["role"]) => void
}) {
  const memberships = mockMemberships.filter((m) => m.userId === user.id)

  return (
    <div className="space-y-3">
      <SectionLabel>Agences ({memberships.length})</SectionLabel>
      {memberships.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune agence assignée.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5">Agence</th>
                <th className="px-4 py-2.5">Rôle</th>
                <th className="px-4 py-2.5">Statut</th>
                <th className="px-4 py-2.5">Rejoint le</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => {
                const agency = getAgencyById(m.agencyId)
                return (
                  <tr key={m.id} className="border-b border-slate-100/60 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{agency?.name ?? "—"}</p>
                          <p className="text-[11px] text-slate-400">{agency?.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset", roleBadgeStyles[m.role])}>
                        {roleLabels[m.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        m.status === "active" ? "bg-emerald-50 text-emerald-700" :
                        m.status === "pending" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-500",
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full",
                          m.status === "active" ? "bg-emerald-500" :
                          m.status === "pending" ? "bg-amber-400" : "bg-slate-400",
                        )} />
                        {m.status === "active" ? "Actif" : m.status === "pending" ? "En attente" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">
                      {new Date(m.joinedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Rôles ──────────────────────────────────────────────────────────────
function RolesTab({ user }: { user: GlobalUser }) {
  const memberships = mockMemberships.filter((m) => m.userId === user.id)

  return (
    <div className="space-y-4">
      <SectionLabel>Rôle par agence</SectionLabel>
      {memberships.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun rôle assigné.</p>
      ) : (
        <div className="space-y-2">
          {memberships.map((m) => {
            const agency = getAgencyById(m.agencyId)
            const perms = rolePermissions[m.role]
            const totalPerms = Object.values(perms).reduce((acc, arr) => acc + arr.length, 0)
            return (
              <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{agency?.name ?? "—"}</p>
                      <p className="text-[11px] text-slate-400">{totalPerms} permissions actives</p>
                    </div>
                  </div>
                  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", roleBadgeStyles[m.role])}>
                    {roleLabels[m.role]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Équipes ────────────────────────────────────────────────────────────
function EquipesTab({ user }: { user: GlobalUser }) {
  const teams = getTeamsByUser(user.id)

  return (
    <div className="space-y-4">
      <SectionLabel>Équipes ({teams.length})</SectionLabel>
      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-8 text-center">
          <Users2 className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Pas encore dans une équipe.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => {
            const agency = getAgencyById(team.agencyId)
            return (
              <div key={team.id} className="rounded-2xl border border-slate-200/80 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{team.name}</p>
                    <p className="text-xs text-slate-500">{team.description}</p>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {agency?.city ?? "—"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  {team.memberIds.length} membre{team.memberIds.length > 1 ? "s" : ""}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Permissions ────────────────────────────────────────────────────────
function PermissionsTab({ user }: { user: GlobalUser }) {
  const memberships = mockMemberships.filter((m) => m.userId === user.id && m.status === "active")
  const [activeAgency, setActiveAgency] = useState(memberships[0]?.agencyId ?? "")

  const activeMembership = memberships.find((m) => m.agencyId === activeAgency)

  if (!activeMembership) {
    return <p className="text-sm text-slate-400">Aucune agence active.</p>
  }

  const perms = rolePermissions[activeMembership.role]

  return (
    <div className="space-y-4">
      {/* Agency selector */}
      {memberships.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {memberships.map((m) => {
            const agency = getAgencyById(m.agencyId)
            return (
              <button
                key={m.agencyId}
                onClick={() => setActiveAgency(m.agencyId)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                  activeAgency === m.agencyId
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {agency?.city ?? m.agencyId}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <SectionLabel>Matrice des accès — {roleLabels[activeMembership.role]}</SectionLabel>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-2.5 w-32">Ressource</th>
              {permissionActions.map((a) => (
                <th key={a.key} className="px-3 py-2.5 text-center">{a.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionPages.map((page) => {
              const pagePerms = (perms as Record<string, string[]>)[page.key] ?? []
              return (
                <tr key={page.key} className="border-b border-slate-100/60 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold text-slate-700">{page.label}</span>
                  </td>
                  {permissionActions.map((action) => {
                    const has = pagePerms.includes(action.key)
                    return (
                      <td key={action.key} className="px-3 py-2.5 text-center">
                        {has ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : (
                          <MinusCircle className="mx-auto h-4 w-4 text-slate-200" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Activité ───────────────────────────────────────────────────────────
function ActiviteTab({ user }: { user: GlobalUser }) {
  const logs = getAuditLogsByUser(user.id)

  const resourceLabels: Record<string, string> = {
    car: "Véhicule", reservation: "Réservation", client: "Client",
    contract: "Contrat", expense: "Charge", team: "Équipe",
    settings: "Paramètres",
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-8 text-center">
        <Activity className="h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-400">Aucune activité enregistrée.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <SectionLabel>Dernières actions ({logs.length})</SectionLabel>
      {logs.map((log) => {
        const meta = actionIcons[log.action] ?? actionIcons.update
        const IconComp = meta.icon
        const agency = getAgencyById(log.agencyId)
        return (
          <div key={log.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200">
            <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.bg)}>
              <IconComp className={cn("h-3.5 w-3.5", meta.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-800">{log.details}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {resourceLabels[log.resource] ?? log.resource}
                </span>
                {agency && (
                  <span className="text-[11px] text-slate-400">{agency.city}</span>
                )}
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {new Date(log.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main detail panel ───────────────────────────────────────────────────────
export function MemberDetailPanel({
  user,
  primaryMembership,
  agencyName,
  onClose,
  onEdit,
  onDelete,
  onRoleChange,
}: {
  user: GlobalUser
  primaryMembership: AgencyMembership
  agencyName: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onRoleChange: (membershipId: string, role: AgencyMembership["role"]) => void
}) {
  const [activeTab, setActiveTab] = useState<Tab>("info")

  const allMemberships = mockMemberships.filter((m) => m.userId === user.id)
  const activeMemberships = allMemberships.filter((m) => m.status === "active").length

  return (
    <motion.div
      key={user.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
    >
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <MemberAvatar user={user} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                    roleBadgeStyles[primaryMembership.role],
                  )}>
                    {roleLabels[primaryMembership.role]}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    primaryMembership.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : primaryMembership.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-500",
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full",
                      primaryMembership.status === "active" ? "bg-emerald-500" :
                      primaryMembership.status === "pending" ? "bg-amber-400" : "bg-slate-400",
                    )} />
                    {primaryMembership.status === "active" ? "Actif" : primaryMembership.status === "pending" ? "En attente" : "Inactif"}
                  </span>
                </div>
                <h2 className="mt-1 font-serif text-2xl text-slate-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                onClick={onDelete}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="mx-1 h-6 w-px bg-slate-200" />
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Agences</p>
              <p className="text-base font-bold text-slate-900 tabular-nums">{allMemberships.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Actives</p>
              <p className="text-base font-bold text-emerald-700 tabular-nums">{activeMemberships}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Équipes</p>
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {getTeamsByUser(user.id).length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto border-t border-slate-200/80 px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-xs font-semibold transition whitespace-nowrap",
                  active ? "text-indigo-700" : "text-slate-500 hover:text-slate-900",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {active && (
                  <motion.span
                    layoutId="member-tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-5"
          >
            {activeTab === "info"        && <InfoTab user={user} />}
            {activeTab === "acces"       && <AccesTab user={user} onRoleChange={onRoleChange} />}
            {activeTab === "roles"       && <RolesTab user={user} />}
            {activeTab === "equipes"     && <EquipesTab user={user} />}
            {activeTab === "permissions" && <PermissionsTab user={user} />}
            {activeTab === "activite"    && <ActiviteTab user={user} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
