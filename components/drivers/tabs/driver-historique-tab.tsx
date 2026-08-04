"use client"

import { CarFront, Calendar, User, Car } from "lucide-react"
import { type Driver, formatDate } from "@/lib/drivers-data"
import { cn } from "@/lib/utils"

const assignmentStatusConfig = {
  completed: { label: "Terminé", pillClass: "border-emerald-200 bg-emerald-50", textClass: "text-emerald-700", dotClass: "bg-emerald-500" },
  ongoing: { label: "En cours", pillClass: "border-blue-200 bg-blue-50", textClass: "text-blue-700", dotClass: "bg-blue-500 animate-pulse" },
  cancelled: { label: "Annulé", pillClass: "border-slate-200 bg-slate-50", textClass: "text-slate-500", dotClass: "bg-slate-400" },
}

export function DriverHistoriqueTab({ driver }: { driver: Driver }) {
  if (driver.assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <CarFront className="h-6 w-6 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Aucune mission enregistrée</p>
        <p className="mt-1 text-xs text-slate-400">Les missions assignées apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CarFront className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total missions</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{driver.totalAssignments}</p>
        </div>
      </div>

      {/* Assignments list */}
      <div className="space-y-2">
        {driver.assignments.map((a) => {
          const st = assignmentStatusConfig[a.status]
          return (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", st.pillClass)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", st.dotClass)} />
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", st.textClass)}>{st.label}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-500">{a.reservationCode}</span>
                </div>
                {a.missionFee && (
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(a.missionFee)}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-700">{a.clientName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-700">{a.carLabel}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-700">
                    {formatDate(a.startDate)} → {formatDate(a.endDate)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
