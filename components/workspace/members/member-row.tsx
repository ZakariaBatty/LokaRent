"use client"

import { motion } from "motion/react"
import { Pencil, Trash2 } from "lucide-react"
import {
  type GlobalUser,
  type AgencyMembership,
  roleLabels,
  roleBadgeStyles,
} from "@/lib/mock-workspaces"
import { cn } from "@/lib/utils"

function MemberAvatar({ user, size = "md" }: { user: GlobalUser; size?: "sm" | "md" | "lg" }) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`
  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"
  // deterministic color from name
  const colors = [
    "from-indigo-500 to-violet-600",
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-sky-600",
    "from-fuchsia-500 to-pink-600",
  ]
  const colorIdx = (user.firstName.charCodeAt(0) + user.lastName.charCodeAt(0)) % colors.length
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold uppercase text-white shadow-sm",
        sizeClass,
        `bg-gradient-to-br ${colors[colorIdx]}`,
      )}
    >
      {initials}
    </span>
  )
}

export { MemberAvatar }

function statusDot(status: AgencyMembership["status"]) {
  if (status === "active") return "bg-emerald-500"
  if (status === "pending") return "bg-amber-400"
  return "bg-slate-400"
}

function statusPill(status: AgencyMembership["status"]) {
  if (status === "active")
    return { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", label: "Actif" }
  if (status === "pending")
    return { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-400", label: "En attente" }
  return { bg: "bg-slate-100 text-slate-500", dot: "bg-slate-400", label: "Inactif" }
}

export interface MemberRowData {
  user: GlobalUser
  membership: AgencyMembership
  agencyName: string
  agencyCount: number // how many agencies this user belongs to
}

export function MemberRow({
  row,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  row: MemberRowData
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { user, membership, agencyName, agencyCount } = row
  const pill = statusPill(membership.status)
  const role = roleBadgeStyles[membership.role]

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onSelect}
      className={cn(
        "group cursor-pointer border-b border-slate-100 transition",
        selected ? "bg-indigo-50/50" : "hover:bg-slate-50/80",
      )}
    >
      {/* Avatar + name */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <MemberAvatar user={user} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Primary agency */}
      <td className="py-3.5 px-3">
        <p className="text-sm text-slate-700">{agencyName}</p>
        {agencyCount > 1 && (
          <p className="text-[11px] text-slate-400">+{agencyCount - 1} autre{agencyCount > 2 ? "s" : ""}</p>
        )}
      </td>

      {/* Role */}
      <td className="py-3.5 px-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
            role,
          )}
        >
          {roleLabels[membership.role]}
        </span>
      </td>

      {/* Joined */}
      <td className="py-3.5 px-3">
        <p className="text-xs text-slate-500 tabular-nums">
          {new Date(membership.joinedAt).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </td>

      {/* Last login */}
      <td className="py-3.5 px-3">
        <p className="text-xs text-slate-500">
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
              })
            : "—"}
        </p>
      </td>

      {/* Status */}
      <td className="py-3.5 px-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            pill.bg,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", pill.dot)} />
          {pill.label}
        </span>
      </td>

      {/* Row actions */}
      <td className="py-3.5 pl-3 pr-5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="Modifier"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

export function MemberCompactRow({
  row,
  selected,
  onSelect,
}: {
  row: MemberRowData
  selected: boolean
  onSelect: () => void
}) {
  const { user, membership } = row
  const pill = statusPill(membership.status)

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition",
        selected
          ? "border-indigo-300 shadow-[0_4px_16px_rgba(99,102,241,0.18)] ring-1 ring-indigo-200"
          : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm",
      )}
    >
      {selected && (
        <motion.span
          layoutId="member-selector"
          className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-blue-500"
        />
      )}
      <MemberAvatar user={user} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="truncate text-[11px] text-slate-400">{roleLabels[membership.role]}</p>
      </div>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", pill.dot)} />
    </motion.button>
  )
}
