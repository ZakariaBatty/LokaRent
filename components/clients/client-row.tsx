"use client"

import { motion } from "motion/react"
import { Pencil, Trash2 } from "lucide-react"
import {
  type Client,
  formatMAD,
  formatRelative,
  maskId,
  statusConfig,
  tierConfig,
} from "@/lib/clients-data"
import { ClientAvatar } from "./client-avatar"
import { cn } from "@/lib/utils"

export function ClientRow({
  client,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  client: Client
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const status = statusConfig[client.status]
  const tier = tierConfig[client.tier]

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onSelect}
      className={cn(
        "group cursor-pointer border-b border-slate-100 transition",
        selected ? "bg-indigo-50/50" : "hover:bg-slate-50/80",
      )}
    >
      {/* Avatar + name */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <ClientAvatar
            id={client.id}
            name={client.fullName}
            nationality={client.nationality}
            showFlag
            vip={client.tier === "vip"}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-900">{client.fullName}</p>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  tier.pillClass,
                  tier.textClass,
                )}
              >
                {tier.label}
              </span>
            </div>
            <p className="truncate text-xs text-slate-500">{client.email}</p>
          </div>
        </div>
      </td>

      {/* Phone */}
      <td className="py-3.5 px-3">
        <p className="text-sm font-medium text-slate-700 tabular-nums">{client.phone}</p>
        <p className="text-[11px] text-slate-400">{client.city}</p>
      </td>

      {/* ID masked */}
      <td className="py-3.5 px-3">
        <div className="inline-flex items-center gap-1.5">
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {client.idType}
          </span>
          <span className="font-mono text-xs text-slate-700">{maskId(client.idNumber)}</span>
        </div>
      </td>

      {/* Rentals */}
      <td className="py-3.5 px-3 text-center">
        <p className="text-sm font-bold text-slate-900 tabular-nums">{client.totalRentals}</p>
        <p className="text-[10px] uppercase tracking-wider text-slate-400">location{client.totalRentals > 1 ? "s" : ""}</p>
      </td>

      {/* Total spent */}
      <td className="py-3.5 px-3 text-right">
        <p className="text-sm font-bold text-slate-900 tabular-nums">
          {formatMAD(client.totalSpent)}
        </p>
      </td>

      {/* Last rental */}
      <td className="py-3.5 px-3">
        <p className="text-xs text-slate-500">{formatRelative(client.lastRentalDate)}</p>
      </td>

      {/* Status */}
      <td className="py-3.5 px-3">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-1",
            status.pillClass,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", status.textClass)}>
            {status.label}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="Modifier"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
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
