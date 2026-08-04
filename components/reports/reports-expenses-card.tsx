"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"
import { expensesByCategory, formatMAD } from "@/lib/reports-data"

export function ReportsExpensesCard() {
  const total = expensesByCategory.reduce((s, e) => s + e.amount, 0)
  const max = Math.max(...expensesByCategory.map((e) => e.amount))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 ring-1 ring-orange-100">
            <Wallet className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Charges par poste</h3>
            <p className="mt-0.5 text-xs text-slate-500">vs période précédente</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold tabular-nums text-slate-900">{formatMAD(total)}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</div>
        </div>
      </div>

      <ul className="space-y-3 p-5">
        {expensesByCategory.map((e, i) => {
          const delta = e.prevAmount > 0 ? ((e.amount - e.prevAmount) / e.prevAmount) * 100 : 0
          const pct = (e.amount / max) * 100
          return (
            <li key={e.id}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="font-medium text-slate-700">{e.label}</span>
                  {delta !== 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        delta < 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {delta < 0 ? (
                        <ArrowDownRight className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      )}
                      {Math.abs(delta).toFixed(0)}%
                    </span>
                  )}
                </div>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatMAD(e.amount)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: e.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}
