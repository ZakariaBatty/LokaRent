"use client"

import { getInitials, type TeamUser } from "@/lib/users-data"

export function UserAvatar({ user, size = "md" }: { user: TeamUser; size?: "sm" | "md" | "lg" }) {
  const initials = getInitials(user.firstName, user.lastName)
  const sizeCls =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"
  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white shadow-sm ring-2 ring-white ${sizeCls} ${user.avatarColor}`}
    >
      {initials}
    </div>
  )
}
