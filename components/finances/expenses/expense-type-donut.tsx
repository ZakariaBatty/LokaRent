"use client"

import { motion } from "motion/react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { expensesByType, formatMoney, getExpenseTypeStyle, type ExpenseRecord } from "@/lib/expenses-data"

function TooltipDot({ active, payload, currency }: any) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-xs font-medium text-slate-700">
          {getExpenseTypeStyle(item.payload.type).label}
        </span>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatMoney(item.value, currency)}</p>
    </div>
  )
}

export function ExpenseTypeDonut({ records, currency }: { records: ExpenseRecord[]; currency: string }) {
  const { t } = useI18n()
  const data = expensesByType(records).sort((a, b) => b.amount - a.amount)
  const total = data.reduce((acc, d) => acc + d.amount, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <PieChartIcon className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("expenses.charts.byTypeTitle")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t("expenses.charts.selectedPeriod")}</p>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-500">
          {t("expenses.charts.empty")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="relative h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="type"
                  innerRadius={58}
                  outerRadius={85}
                  paddingAngle={3}
                  stroke="none"
                  animationDuration={900}
                >
                  {data.map((d) => (
                    <Cell key={d.type} fill={d.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<TooltipDot currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-semibold tabular-nums text-slate-900">
                {formatMoney(total, currency)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {t("expenses.charts.total")}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((d) => {
              const pct = Math.round((d.amount / total) * 100)
              const label = getExpenseTypeStyle(d.type).label
              return (
                <div key={d.type}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      {label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {formatMoney(d.amount, currency)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: d.color }}
                      />
                    </div>
                    <span className="w-9 text-right text-[11px] font-medium tabular-nums text-slate-500">
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
