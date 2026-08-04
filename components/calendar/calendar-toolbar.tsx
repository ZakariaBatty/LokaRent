"use client"

import { motion } from "motion/react"
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react"
import { cn } from "@/lib/utils"

export type CalendarView = "month" | "twoweeks" | "week"

const viewOptions: { id: CalendarView; label: string }[] = [
  { id: "month", label: "Mois" },
  { id: "twoweeks", label: "2 Semaines" },
  { id: "week", label: "Semaine" },
]

export function CalendarToolbar({
  view,
  onViewChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
}: {
  view: CalendarView
  onViewChange: (v: CalendarView) => void
  rangeLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_8px_20px_rgba(79,70,229,0.25)]">
          <CalendarRange className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 lg:text-2xl">
            Calendrier de disponibilités
          </h1>
          <p className="text-sm text-slate-500">{rangeLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Date navigation */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_2px_6px_rgba(15,23,42,0.04)]">
          <button
            onClick={onPrev}
            aria-label="Précédent"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={onNext}
            aria-label="Suivant"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* View segmented control */}
        <div className="relative flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_2px_6px_rgba(15,23,42,0.04)]">
          {viewOptions.map((opt) => {
            const active = view === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => onViewChange(opt.id)}
                className="relative rounded-lg px-3 py-1.5 text-sm font-medium transition"
              >
                {active && (
                  <motion.span
                    layoutId="calendar-view-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 transition-colors",
                    active ? "text-white" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
