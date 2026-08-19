"use client"

import { motion } from "motion/react"
import { Activity } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsOverview } from "@/modules/reports/services/reports.service"

type WeekdayLoad = ReportsOverview["weekdayLoad"][number]

export function ReportsOccupancyChart({ data }: { data: WeekdayLoad[] }) {
  const { t } = useI18n()
  const total = data.reduce((s, d) => s + d.count, 0)
  const peak = data.reduce((m, d) => (d.count > m.count ? d : m), data[0] ?? { dayKey: "mon", count: 0 })
  const chartData = data.map((row) => ({ ...row, day: t(`reports.weekdays.${row.dayKey}`) }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("reports.occupancy.title")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t("reports.occupancy.subtitle")}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t("reports.occupancy.peak")}</div>
          <div className="text-sm font-bold text-emerald-600">
            {t(`reports.weekdays.${peak.dayKey}`)} <span className="font-normal text-slate-500">({peak.count})</span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-600">{t("reports.labels.rentals")}</span>
                        <span className="ml-auto text-xs font-semibold text-slate-900">
                          {payload[0].value as number}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      d.count === peak.count
                        ? "#10b981"
                        : d.count >= total / Math.max(1, chartData.length)
                          ? "#34d399"
                          : "#a7f3d0"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
