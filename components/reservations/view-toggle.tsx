"use client"

import { motion } from "motion/react"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

export type ReservationView = "kanban" | "list"

export function ViewToggle({
  value,
  onChange,
}: {
  value: ReservationView
  onChange: (v: ReservationView) => void
}) {
  const options: { id: ReservationView; label: string; icon: typeof LayoutGrid }[] = [
    { id: "kanban", label: "Kanban", icon: LayoutGrid },
    { id: "list", label: "Liste", icon: List },
  ]

  return (
    <div className="relative inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {options.map((opt) => {
        const Icon = opt.icon
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {active && (
              <motion.div
                layoutId="reservation-view-toggle"
                className="absolute inset-0 rounded-lg bg-gradient-to-b from-slate-50 to-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
