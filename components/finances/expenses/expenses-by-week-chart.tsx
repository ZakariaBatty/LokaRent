"use client"

import { motion } from "motion/react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3 } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { expensesByWeek, formatMoney, type ExpenseRecord } from "@/lib/expenses-data"

function TooltipDot({ active, payload, label, currency }: any) {
  const { t } = useI18n()
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {t("expenses.charts.weekLabel").replace("{week}", label.replace("S", ""))}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatMoney(payload[0].value, currency)}</p>
    </div>
  )
}

export function ExpensesByWeekChart({ records, currency }: { records: ExpenseRecord[]; currency: string }) {
  const { t } = useI18n()
  const data = expensesByWeek(records)
  const total = data.reduce((acc, d) => acc + d.amount, 0)
  const max = Math.max(...data.map((d) => d.amount), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
            <BarChart3 className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("expenses.charts.byWeekTitle")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("expenses.charts.totalForPeriod").replace("{amount}", formatMoney(total, currency))}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-[200px] w-full">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            {t("expenses.charts.empty")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="weekBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                width={48}
              />
              <RechartsTooltip
                content={<TooltipDot currency={currency} />}
                cursor={{ fill: "#f1f5f9", radius: 8 }}
              />
              <Bar dataKey="amount" radius={[8, 8, 4, 4]} animationDuration={900}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.amount === max ? "url(#weekBar)" : "#fcd34d"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
