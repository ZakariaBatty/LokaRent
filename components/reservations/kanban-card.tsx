"use client"

import { motion } from "motion/react"
import { Calendar, Eye, Pencil, AlertTriangle, GripVertical } from "lucide-react"
import { type Reservation, statusConfig, formatMAD, formatDate } from "@/lib/reservations-data"
import { cn } from "@/lib/utils"

export function KanbanCard({
  reservation,
  onOpen,
  index,
}: {
  reservation: Reservation
  onOpen: (r: Reservation) => void
  index: number
}) {
  const cfg = statusConfig[reservation.status]
  const isOverdue = !!reservation.overdue
  const isActive = reservation.status === "en_cours"
  const isCompleted = reservation.status === "terminee"

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onOpen(reservation)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.025 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]",
        isOverdue
          ? "border-rose-300"
          : isActive
            ? "border-blue-200"
            : isCompleted
              ? "border-emerald-200/80"
              : "border-slate-200/80",
        isCompleted && "opacity-90",
      )}
    >
      {isOverdue && (
        <motion.span
          className="absolute inset-x-0 top-0 h-0.5 bg-rose-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {reservation.code}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-700">
                <AlertTriangle className="h-2.5 w-2.5" />
                Retard
              </span>
            )}
          </div>
          <h4 className="mt-1 truncate text-sm font-semibold text-slate-900">{reservation.client.name}</h4>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {reservation.car.brand} {reservation.car.model}
            <span className="mx-1 text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-500">{reservation.car.plate}</span>
          </p>
        </div>
        <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
        <Calendar className="h-3 w-3 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-600">
          {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
        </span>
        <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
          {reservation.days}j
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">{formatMAD(reservation.total)}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            cfg.pillBg,
            cfg.pillText,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-1 border-t border-slate-100 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700">
          <Eye className="h-3 w-3" />
          Voir
        </span>
        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700">
          <Pencil className="h-3 w-3" />
          Éditer
        </span>
      </div>
    </motion.button>
  )
}
