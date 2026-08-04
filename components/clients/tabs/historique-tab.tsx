"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Car, Calendar, ChevronLeft, ChevronRight, ReceiptText } from "lucide-react"
import { type Client, type Reservation, formatDate, formatMAD } from "@/lib/clients-data"
import { cn } from "@/lib/utils"

const statusBadge: Record<
  Reservation["status"],
  { label: string; classes: string; dot: string }
> = {
  completed: {
    label: "Terminée",
    classes: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  },
  active: {
    label: "En cours",
    classes: "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  upcoming: {
    label: "À venir",
    classes: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
  cancelled: {
    label: "Annulée",
    classes: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
}

const PAGE_SIZE = 5

export function HistoriqueTab({ client }: { client: Client }) {
  const [page, setPage] = useState(0)
  const total = client.reservations.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = page * PAGE_SIZE
  const visible = client.reservations.slice(start, start + PAGE_SIZE)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <ReceiptText className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">Aucune réservation</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Ce client n&apos;a pas encore effectué de location. Son historique s&apos;affichera ici dès
          la première réservation.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Réservations
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">{total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terminées</p>
          <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
            {client.reservations.filter((r) => r.status === "completed").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total facturé
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-700 tabular-nums">
            {formatMAD(client.reservations.reduce((s, r) => s + r.amount, 0))}
          </p>
        </div>
      </div>

      {/* Reservations list */}
      <div className="space-y-2">
        {visible.map((r, i) => {
          const badge = statusBadge[r.status]
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600">
                <Car className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {r.carBrand} {r.carModel}
                  </p>
                  <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                    {r.plate}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(r.startDate)} → {formatDate(r.endDate)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatMAD(r.amount)}
                </p>
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    badge.classes,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                  {badge.label}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-700">{page + 1}</span> / {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
