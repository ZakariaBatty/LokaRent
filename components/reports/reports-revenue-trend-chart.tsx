"use client"

import { motion } from "motion/react"
import { TrendingUp } from "lucide-react"
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
import { formatMAD, monthlyRevenue } from "@/lib/reports-data"

export function ReportsRevenueTrendChart() {
  const total = monthlyRevenue.reduce((s, d) => s + d.revenue, 0)
  const last = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0
  const prev = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0
  const trend = prev > 0 ? ((last - prev) / prev) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Évolution Revenus / Charges</h3>
          <p className="mt-0.5 text-xs text-slate-500">12 derniers mois</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums text-slate-900">{formatMAD(total)}</div>
            <div
              className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyRevenue} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="reports-rev-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reports-exp-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const rev = payload.find((p) => p.dataKey === "revenue")?.value as number | undefined
                  const exp = payload.find((p) => p.dataKey === "expenses")?.value as number | undefined
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
                      {rev !== undefined && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span className="text-xs text-slate-600">Revenus</span>
                          <span className="ml-auto text-xs font-semibold text-slate-900">
                            {formatMAD(rev)}
                          </span>
                        </div>
                      )}
                      {exp !== undefined && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-xs text-slate-600">Charges</span>
                          <span className="ml-auto text-xs font-semibold text-slate-900">
                            {formatMAD(exp)}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="none"
                fill="url(#reports-rev-gradient)"
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="none"
                fill="url(#reports-exp-gradient)"
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenus"
                stroke="#6366f1"
                strokeWidth={2.4}
                dot={{ r: 3, fill: "#6366f1", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Charges"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 2.5, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
