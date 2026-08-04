"use client"

import { roleStyles, type UserRole } from "@/lib/users-data"
import { Crown, Calendar, Calculator } from "lucide-react"

const roleIcon: Record<UserRole, typeof Crown> = {
  Gérant: Crown,
  Réceptionniste: Calendar,
  Comptable: Calculator,
}

export function RoleBadge({ role, size = "sm" }: { role: UserRole; size?: "sm" | "md" }) {
  const style = roleStyles[role]
  const Icon = roleIcon[role]
  return (
    <span
      title={style.description}
      className={`group inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset transition ${
        style.badge
      } ${style.ring} ${size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"}`}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {role}
    </span>
  )
}
