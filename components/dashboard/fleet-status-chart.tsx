"use client"

import { motion } from "motion/react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useI18n } from "@/contexts/i18n-context"
import type { DashboardFleetStatus } from "@/modules/dashboard/services/dashboard.service"

function CustomTooltip({ active, payload, t }: any) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: item.payload.color }} />
        <span className="text-xs font-medium text-slate-700">{t(`dashboard.fleet.status.${item.payload.id}`)}</span>
      </div>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">
        {item.value} {t("dashboard.fleet.vehicles")}
      </p>
    </div>
  )
}

export function FleetStatusChart({ data }: { data: DashboardFleetStatus[] }) {
  const { t } = useI18n()
  const total = data.reduce((acc, s) => acc + s.value, 0)
  const available = data.find((s) => s.id === "available")?.value ?? 0
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.fleet.title")}</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {t("dashboard.fleet.subtitle").replace("{total}", String(total))}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-6">
        {/* Donut */}
        <div className="relative h-[180px] w-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={3}
                stroke="none"
                animationDuration={900}
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip t={t} />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {availablePct}%
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{t("dashboard.fleet.availableShort")}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((s) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
            return (
              <div key={s.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm font-medium text-slate-700">{t(`dashboard.fleet.status.${s.id}`)}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{s.value}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
