"use client"

import { motion } from "motion/react"
import { Plus } from "lucide-react"
import {
  type Reservation,
  type ReservationStatus,
  reservationStatuses,
  statusConfig,
} from "@/lib/reservations-data"
import { KanbanCard } from "./kanban-card"
import { cn } from "@/lib/utils"

export function KanbanBoard({
  reservations,
  onOpen,
  compact = false,
}: {
  reservations: Reservation[]
  onOpen: (r: Reservation) => void
  compact?: boolean
}) {
  const byStatus = (s: ReservationStatus) => reservations.filter((r) => r.status === s)

  return (
    <div
      className={cn(
        "grid gap-4",
        compact
          ? "grid-cols-1"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      )}
    >
      {reservationStatuses.map((status, colIdx) => {
        const cfg = statusConfig[status]
        const items = byStatus(status)
        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: colIdx * 0.04 }}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
              cfg.column,
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 bg-white/60 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                <h3 className="text-sm font-semibold text-slate-900">{cfg.label}</h3>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                  {items.length}
                </span>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Ajouter dans cette colonne"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex max-h-[640px] flex-col gap-2 overflow-y-auto p-3">
              {items.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                  Aucune réservation
                </div>
              )}
              {items.map((r, idx) => (
                <KanbanCard key={r.id} reservation={r} onOpen={onOpen} index={idx} />
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
