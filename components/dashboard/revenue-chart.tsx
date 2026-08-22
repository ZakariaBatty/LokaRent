"use client"

import { motion } from "motion/react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { DashboardChartPoint } from "@/modules/dashboard/services/dashboard.service"

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label} 2026</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">
        {formatMoney(payload[0].value, currency)}
      </p>
    </div>
  )
}

export function RevenueChart({
  data,
  delta,
  currency,
}: {
  data: DashboardChartPoint[]
  delta: number
  currency: string
}) {
  const { t } = useI18n()
  const total = data.reduce((acc, d) => acc + d.value, 0)
  const avg = data.length > 0 ? total / data.length : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.chart.bookedValueTitle")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{t("dashboard.chart.bookedValueSubtitle")}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 ring-1 ring-inset ring-emerald-100">
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
            <TrendingUp className="h-3 w-3" />
            {delta > 0 ? "+" : ""}
            {delta}%
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900">
          {total.toLocaleString("fr-FR")}
        </span>
        <span className="text-sm font-medium text-slate-400">{currency} {t("dashboard.chart.total")}</span>
        <span className="ml-auto text-xs text-slate-400">
          {t("dashboard.chart.average")} {formatMoney(Math.round(avg), currency)}/{t("dashboard.chart.month")}
        </span>
      </div>

      {/* Chart */}
      <div className="mt-6 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: -16, bottom: 0 }} barCategoryGap="28%">
            <defs>
              <linearGradient id="revBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.75} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="value" fill="url(#revBarGrad)" radius={[8, 8, 2, 2]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
