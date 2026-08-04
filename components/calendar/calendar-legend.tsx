"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const items = [
  { id: "en_cours", label: "En cours", dot: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "confirmee", label: "Confirmée", dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "maintenance", label: "Maintenance", dot: "bg-slate-400", bg: "bg-slate-100", border: "border-slate-200" },
  { id: "available", label: "Disponible", dot: "bg-white border border-slate-200", bg: "bg-white", border: "border-slate-200" },
  { id: "overdue", label: "Retour en retard", dot: "bg-rose-500", bg: "bg-rose-50", border: "border-rose-200", glow: true },
]

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
      <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Légende
      </span>
      {items.map((it, i) => (
        <motion.div
          key={it.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.25 }}
          whileHover={{ y: -1 }}
          className={cn(
            "group flex items-center gap-2 rounded-lg border px-2.5 py-1 transition-shadow hover:shadow-sm",
            it.bg,
            it.border,
          )}
        >
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full",
              it.dot,
              it.glow && "ring-2 ring-rose-300/50",
            )}
          />
          <span className="text-xs font-medium text-slate-700">{it.label}</span>
        </motion.div>
      ))}
    </div>
  )
}
