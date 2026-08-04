"use client"

import { motion } from "motion/react"
import { CalendarRange } from "lucide-react"
import { dateRangeOptions, type DateRange } from "@/lib/finances-data"
import { cn } from "@/lib/utils"

export function FinancesDateRange({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (v: DateRange) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
          <CalendarRange className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Finances</h1>
          <p className="text-xs text-slate-500">Performance financière et rentabilité par véhicule</p>
        </div>
      </div>

      <div className="relative flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm">
        {dateRangeOptions.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {active && (
                <motion.span
                  layoutId="financesRangePill"
                  className="absolute inset-0 z-[-1] rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
