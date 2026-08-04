"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { X, Info, Building2, Users2, Shield, Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { GlobalUser, UserRole } from "@/lib/mock-workspaces"
import {
  mockMemberships,
  mockAgencies,
  mockTeams,
  rolePermissions,
  roleLabels,
  roleBadgeStyles,
  permissionPages,
  permissionActions,
  getAgencyById,
} from "@/lib/mock-workspaces"
import { cn } from "@/lib/utils"

type TabId = "info" | "agencies" | "teams" | "permissions"

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "info", label: "Informations", icon: Info },
  { id: "agencies", label: "Accès Agences", icon: Building2 },
  { id: "teams", label: "Équipes", icon: Users2 },
  { id: "permissions", label: "Permissions", icon: Shield },
]

const allRoles: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "CLIENT"]

export function UserDetailPanel({
  user,
  onClose,
}: {
  user: GlobalUser
  onClose: () => void
}) {
  const [tab, setTab] = useState<TabId>("info")

  const userMemberships = mockMemberships.filter(
    (m) => m.userId === user.id && m.status === "active",
  )

  // Local interactive state (frontend only, no backend)
  const [agencyAccess, setAgencyAccess] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      mockAgencies.map((a) => [a.id, userMemberships.some((m) => m.agencyId === a.id)]),
    ),
  )
  const [rolePerAgency, setRolePerAgency] = useState<Record<string, UserRole>>(() =>
    Object.fromEntries(
      mockAgencies.map((a) => {
        const membership = userMemberships.find((m) => m.agencyId === a.id)
        return [a.id, membership?.role ?? "EMPLOYEE"]
      }),
    ),
  )

  const membershipIds = userMemberships.map((m) => m.id)
  const [teamAccess, setTeamAccess] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      mockTeams.map((t) => [t.id, t.memberIds.some((id) => membershipIds.includes(id))]),
    ),
  )

  // Primary role used to seed the permission matrix
  const primaryRole: UserRole = userMemberships[0]?.role ?? "EMPLOYEE"
  const seed = rolePermissions[primaryRole]
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(() =>
    Object.fromEntries(
      permissionPages.map((page) => [
        page.key,
        Object.fromEntries(
          permissionActions.map((action) => {
            const resource = seed[page.key as keyof typeof seed] as string[] | undefined
            return [action.key, Boolean(resource?.includes(action.key))]
          }),
        ),
      ]),
    ),
  )

  function togglePerm(pageKey: string, actionKey: string) {
    setPerms((prev) => ({
      ...prev,
      [pageKey]: { ...prev[pageKey], [actionKey]: !prev[pageKey][actionKey] },
    }))
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col overflow-hidden rounded-l-2xl border-l border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]"
    >
      {/* Header */}
      <div className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-200/80 px-5">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition",
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {tab === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <InfoRow label="Prénom" value={user.firstName} />
            <InfoRow label="Nom" value={user.lastName} />
            <InfoRow label="Email" value={user.email} className="col-span-2" />
            <InfoRow label="Téléphone" value={user.phone ?? "—"} />
            <InfoRow
              label="Date de création"
              value={new Date(user.createdAt).toLocaleDateString("fr-FR")}
            />
            {user.lastLoginAt && (
              <InfoRow
                label="Dernière connexion"
                value={new Date(user.lastLoginAt).toLocaleString("fr-FR")}
                className="col-span-2"
              />
            )}
          </motion.div>
        )}

        {tab === "agencies" && (
          <motion.div
            key="agencies"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accès aux agences & rôle attribué
            </p>
            {mockAgencies.map((agency) => {
              const enabled = agencyAccess[agency.id]
              return (
                <div
                  key={agency.id}
                  className={cn(
                    "rounded-xl border p-4 transition",
                    enabled ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-3">
                      <span
                        onClick={() =>
                          setAgencyAccess((prev) => ({ ...prev, [agency.id]: !prev[agency.id] }))
                        }
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-md border transition",
                          enabled
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white",
                        )}
                      >
                        {enabled && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {agency.name}
                        </span>
                        <span className="block text-xs text-slate-500">{agency.city}</span>
                      </span>
                    </label>

                    {enabled && (
                      <select
                        value={rolePerAgency[agency.id]}
                        onChange={(e) =>
                          setRolePerAgency((prev) => ({
                            ...prev,
                            [agency.id]: e.target.value as UserRole,
                          }))
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {allRoles.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        {tab === "teams" && (
          <motion.div
            key="teams"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assignation aux équipes
            </p>
            {mockTeams.map((team) => {
              const enabled = teamAccess[team.id]
              const agency = getAgencyById(team.agencyId)
              return (
                <label
                  key={team.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition",
                    enabled ? "border-indigo-200 bg-indigo-50/40" : "border-slate-200 bg-white",
                  )}
                >
                  <span
                    onClick={(e) => {
                      e.preventDefault()
                      setTeamAccess((prev) => ({ ...prev, [team.id]: !prev[team.id] }))
                    }}
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-md border transition",
                      enabled
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white",
                    )}
                  >
                    {enabled && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-900">{team.name}</span>
                    <span className="block text-xs text-slate-500">
                      {team.description} · {agency?.name}
                    </span>
                  </span>
                </label>
              )
            })}
          </motion.div>
        )}

        {tab === "permissions" && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Permissions par page
              </p>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                  roleBadgeStyles[primaryRole],
                )}
              >
                {roleLabels[primaryRole]}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 text-left">Page</th>
                    {permissionActions.map((a) => (
                      <th key={a.key} className="px-2 py-2.5 text-center">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionPages.map((page) => (
                    <tr key={page.key} className="border-b border-slate-100/70 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-slate-800">{page.label}</td>
                      {permissionActions.map((action) => {
                        const checked = perms[page.key][action.key]
                        return (
                          <td key={action.key} className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => togglePerm(page.key, action.key)}
                              className={cn(
                                "mx-auto grid h-5 w-5 place-items-center rounded-md border transition",
                                checked
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300 bg-white hover:border-slate-400",
                              )}
                              aria-label={`${action.label} ${page.label}`}
                            >
                              {checked && <Check className="h-3 w-3" />}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400">
              Les permissions sont pré-remplies selon le rôle principal. Ajustez-les manuellement si
              nécessaire.
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Enregistrer
        </button>
      </div>
    </motion.div>
  )
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  )
}
