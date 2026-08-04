"use client"

import { motion } from "motion/react"
import { CheckCircle2, Clock, XCircle, CalendarRange } from "lucide-react"
import { type Car, formatShortDate, formatMAD } from "@/lib/cars-data"
import { cn } from "@/lib/utils"

const statusMap = {
  completed: { label: "Terminée", icon: CheckCircle2, color: "emerald" },
  confirmed: { label: "Confirmée", icon: CalendarRange, color: "blue" },
  active: { label: "En cours", icon: Clock, color: "indigo" },
  cancelled: { label: "Annulée", icon: XCircle, color: "slate" },
}

const accentClasses: Record<string, { dot: string; text: string; bg: string; ring: string }> = {
  emerald: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  blue: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", ring: "ring-blue-200" },
  indigo: {
    dot: "bg-indigo-500",
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    ring: "ring-indigo-200",
  },
  slate: {
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-100",
    ring: "ring-slate-200",
  },
}

export function HistoriqueTab({ car }: { car: Car }) {
  const totalReservations = car.reservations.length
  const totalAmount = car.reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-5">
      {/* Summary header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Réservations
          </p>
          <p className="mt-1 font-serif text-2xl text-slate-900 tabular-nums">{totalReservations}</p>
          <p className="text-[11px] text-slate-500">5 derniers contrats</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Revenus</p>
          <p className="mt-1 font-serif text-2xl text-slate-900 tabular-nums">{formatMAD(totalAmount)}</p>
          <p className="text-[11px] text-slate-500">5 dernières locations</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Jours total
          </p>
          <p className="mt-1 font-serif text-2xl text-slate-900 tabular-nums">
            {car.reservations.reduce((s, r) => s + (r.status !== "cancelled" ? r.days : 0), 0)}
          </p>
          <p className="text-[11px] text-slate-500">période active</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Activité récente</h3>
          <button className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
            Historique complet →
          </button>
        </div>
        <div className="relative space-y-3 pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

          {car.reservations.map((res, i) => {
            const meta = statusMap[res.status]
            const accent = accentClasses[meta.color]
            const Icon = meta.icon

            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative"
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute -left-[26px] top-4 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white",
                    accent.bg,
                  )}
                >
                  <Icon className={cn("h-2.5 w-2.5", accent.text)} />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-xs font-bold text-white">
                      {res.clientInitials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {res.clientName}
                        </p>
                        <span className="font-mono text-[10px] text-slate-400">{res.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formatShortDate(res.startDate)} → {formatShortDate(res.endDate)} ·{" "}
                        {res.days} jour{res.days > 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatMAD(res.amount)}
                      </p>
                      <div
                        className={cn(
                          "mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          accent.bg,
                          accent.text,
                        )}
                      >
                        <span className={cn("h-1 w-1 rounded-full", accent.dot)} />
                        {meta.label}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
