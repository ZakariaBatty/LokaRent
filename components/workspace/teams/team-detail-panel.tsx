"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { X, Info, Users, Shield, Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { AgencyTeam, UserRole } from "@/lib/mock-workspaces"
import {
  mockMemberships,
  getAgencyById,
  getGlobalUserById,
  rolePermissions,
  roleLabels,
  roleBadgeStyles,
  permissionPages,
  permissionActions,
} from "@/lib/mock-workspaces"
import { cn } from "@/lib/utils"

type TabId = "info" | "members" | "permissions"

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "info", label: "Informations", icon: Info },
  { id: "members", label: "Membres", icon: Users },
  { id: "permissions", label: "Permissions", icon: Shield },
]

export function TeamDetailPanel({ team, onClose }: { team: AgencyTeam; onClose: () => void }) {
  const [tab, setTab] = useState<TabId>("info")

  const agency = getAgencyById(team.agencyId)
  const members = team.memberIds
    .map((mid) => mockMemberships.find((m) => m.id === mid))
    .filter((m): m is NonNullable<typeof m> => !!m)

  // Permission baseline from highest member role in the team
  const roleRank: UserRole[] = ["CLIENT", "EMPLOYEE", "TEAM_LEAD", "MANAGER", "ADMIN", "OWNER"]
  const topRole =
    members
      .map((m) => m.role)
      .sort((a, b) => roleRank.indexOf(b) - roleRank.indexOf(a))[0] ?? "EMPLOYEE"
  const seed = rolePermissions[topRole]

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
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{team.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{agency?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

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
            className="space-y-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nom de l&apos;équipe
              </p>
              <p className="mt-1 text-sm text-slate-900">{team.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Description
              </p>
              <p className="mt-1 text-sm text-slate-900">{team.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Agence
              </p>
              <p className="mt-1 text-sm text-slate-900">{agency?.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Membres
              </p>
              <p className="mt-1 text-sm text-slate-900">{members.length}</p>
            </div>
          </motion.div>
        )}

        {tab === "members" && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {members.length > 0 ? (
              members.map((member) => {
                const user = getGlobalUserById(member.userId)
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                        {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}
                        </p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                        roleBadgeStyles[member.role],
                      )}
                    >
                      {roleLabels[member.role]}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-slate-500">Aucun membre</p>
            )}
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
                Permissions de l&apos;équipe
              </p>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                  roleBadgeStyles[topRole],
                )}
              >
                {roleLabels[topRole]}
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
                  {permissionPages.map((page) => {
                    const resource = seed[page.key as keyof typeof seed] as string[] | undefined
                    return (
                      <tr key={page.key} className="border-b border-slate-100/70 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-slate-800">{page.label}</td>
                        {permissionActions.map((action) => {
                          const allowed = Boolean(resource?.includes(action.key))
                          return (
                            <td key={action.key} className="px-2 py-2.5 text-center">
                              {allowed ? (
                                <span className="mx-auto grid h-5 w-5 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                                  <Check className="h-3 w-3" />
                                </span>
                              ) : (
                                <span className="mx-auto block h-1 w-3 rounded-full bg-slate-200" />
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
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
