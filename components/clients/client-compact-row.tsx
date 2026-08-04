"use client"

import { motion } from "motion/react"
import { type Client, formatMAD, statusConfig } from "@/lib/clients-data"
import { ClientAvatar } from "./client-avatar"
import { cn } from "@/lib/utils"

export function ClientCompactRow({
  client,
  selected,
  onSelect,
}: {
  client: Client
  selected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[client.status]

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
          layoutId="client-selector"
          className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-blue-500"
        />
      )}
      <ClientAvatar
        id={client.id}
        name={client.fullName}
        nationality={client.nationality}
        showFlag
        vip={client.tier === "vip"}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{client.fullName}</p>
        <p className="truncate text-xs text-slate-500">{formatMAD(client.totalSpent)}</p>
      </div>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", status.dotClass)} />
    </motion.button>
  )
}
