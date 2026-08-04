"use client"

import { motion } from "motion/react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Globe } from "lucide-react"
import { nationalitySplit } from "@/lib/reports-data"

export function ReportsSegmentsDonut() {
  const total = nationalitySplit.reduce((s, d) => s + d.value, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 ring-1 ring-violet-100">
            <Globe className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Profil clients</h3>
            <p className="mt-0.5 text-xs text-slate-500">Marocains vs étrangers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div className="relative">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as (typeof nationalitySplit)[number]
                    const pct = ((p.value / total) * 100).toFixed(1)
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                        <div className="text-[11px] font-semibold text-slate-500">{p.name}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-900">
                          {p.value} <span className="text-slate-500">({pct}%)</span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Pie
                  data={nationalitySplit}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {nationalitySplit.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold tabular-nums text-slate-900">{total}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Clients</div>
          </div>
        </div>

        <ul className="flex flex-col justify-center gap-3">
          {nationalitySplit.map((d, i) => {
            const pct = (d.value / total) * 100
            return (
              <li key={d.name}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium text-slate-700">{d.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-semibold text-slate-900">{d.value}</span>
                    <span className="text-[10px] text-slate-500">({pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: d.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}
