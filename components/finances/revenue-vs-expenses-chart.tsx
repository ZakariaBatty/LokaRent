"use client"

import { motion } from "motion/react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label} 2026</p>
      <div className="mt-1 space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-xs font-medium text-slate-600">
              {p.dataKey === "revenue" ? "Revenus" : "Charges"}
            </span>
            <span className="ml-auto text-xs font-semibold text-slate-900 tabular-nums">
              {p.value.toLocaleString("fr-FR")} DH
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomLegend({ payload }: any) {
  if (!payload) return null
  return (
    <div className="flex items-center justify-center gap-5 pt-1">
      {payload.map((entry: any) => (
        <div key={entry.dataKey ?? entry.value} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-xs font-medium text-slate-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RevenueVsExpensesChart() {
  const { agencyData } = useAgency()
  const revenueVsExpensesData = agencyData.financeSummary.revenueVsExpenses
  const lastMonth = revenueVsExpensesData[revenueVsExpensesData.length - 1]
  const profit = lastMonth.revenue - lastMonth.expenses
  const margin = Math.round((profit / lastMonth.revenue) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Revenus vs Charges</h3>
          <p className="mt-0.5 text-xs text-slate-500">Évolution sur 6 mois</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 ring-1 ring-inset ring-emerald-100">
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
            <TrendingUp className="h-3 w-3" />
            Marge {margin}%
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Revenus</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-blue-600">
            {lastMonth.revenue.toLocaleString("fr-FR")} <span className="text-xs text-slate-400">DH</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Charges</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-600">
            {lastMonth.expenses.toLocaleString("fr-FR")} <span className="text-xs text-slate-400">DH</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Profit</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700">
            {profit.toLocaleString("fr-FR")} <span className="text-xs text-slate-400">DH</span>
          </p>
        </div>
      </div>

      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={revenueVsExpensesData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
            <Legend content={<CustomLegend />} />
            <Area
              key="area-revenue"
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#revArea)"
              legendType="none"
              isAnimationActive
              animationDuration={900}
            />
            <Area
              key="area-expenses"
              type="monotone"
              dataKey="expenses"
              stroke="none"
              fill="url(#expArea)"
              legendType="none"
              isAnimationActive
              animationDuration={900}
            />
            <Line
              key="line-revenue"
              type="monotone"
              dataKey="revenue"
              name="Revenus"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
              isAnimationActive
              animationDuration={1100}
            />
            <Line
              key="line-expenses"
              type="monotone"
              dataKey="expenses"
              name="Charges"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6 }}
              isAnimationActive
              animationDuration={1100}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
