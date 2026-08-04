"use client"

import { motion } from "motion/react"
import { ArrowRight, Clock } from "lucide-react"
import { upcomingReturns } from "@/lib/dashboard-data"

export function UpcomingReturns() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Retours à venir</h3>
          <p className="mt-0.5 text-xs text-slate-500">Aujourd&apos;hui et demain</p>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
          Calendrier
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <ul className="divide-y divide-slate-50">
        {upcomingReturns.map((r, i) => (
          <motion.li
            key={r.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.06, duration: 0.3 }}
            className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-slate-50/60"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                r.soon ? "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100" : "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-100"
              }`}
            >
              <Clock className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{r.vehicle}</p>
              <p className="truncate text-xs text-slate-500">
                {r.client} · <span className="font-mono">{r.plate}</span>
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-medium ${r.soon ? "text-amber-700" : "text-slate-700"}`}>{r.time}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
