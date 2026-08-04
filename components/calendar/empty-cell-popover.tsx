"use client"

import Link from "next/link"
import { Plus, CalendarPlus, X } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { CalendarVehicle } from "@/lib/calendar-data"
import { formatDateFr } from "@/lib/calendar-data"

export function EmptyCellPopover({
  vehicle,
  date,
  position,
  onClose,
}: {
  vehicle: CalendarVehicle
  date: Date
  position: { x: number; y: number }
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      <motion.div
        key="empty-cell-popover"
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          position: "fixed",
          left: Math.min(position.x, typeof window !== "undefined" ? window.innerWidth - 280 : position.x),
          top: position.y,
          zIndex: 60,
        }}
        className="w-[260px] overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 pb-2 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Cellule disponible
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-[11px] text-slate-500">{formatDateFr(date)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="p-2">
          <Link
            href={`/reservations/new?carId=${vehicle.id}&date=${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
            onClick={onClose}
            className="group flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition hover:shadow-[0_8px_20px_rgba(79,70,229,0.35)]"
          >
            <CalendarPlus className="h-4 w-4" />
            Nouvelle réservation
          </Link>
          <button
            onClick={onClose}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Bloquer pour maintenance
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
