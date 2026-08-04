"use client"

import { motion } from "motion/react"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Trophy } from "lucide-react"
import { type CarFinance } from "@/lib/finances-data"
import { useAgency } from "@/contexts/agency-context"

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const car: CarFinance = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-900">
        {car.brand} {car.model}
      </p>
      <p className="text-[10px] font-medium text-slate-400">{car.plate}</p>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Revenus</span>
          <span className="ml-auto text-xs font-semibold text-slate-900 tabular-nums">
            {car.revenue.toLocaleString("fr-FR")} DH
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Profit</span>
          <span
            className={`ml-auto text-xs font-semibold tabular-nums ${
              car.profit >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {car.profit >= 0 ? "+" : ""}
            {car.profit.toLocaleString("fr-FR")} DH
          </span>
        </div>
      </div>
    </div>
  )
}

export function RevenuePerCarChart() {
  const { agencyData } = useAgency()
  const topCars: CarFinance[] = agencyData.cars
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      brand: c.brand,
      model: c.model,
      plate: c.plate,
      category: c.category,
      revenue: c.revenue,
      expenses: c.expenses,
      profit: c.revenue - c.expenses,
      occupancyRate: c.occupancyRate,
      roi: c.expenses > 0 ? Math.round(((c.revenue - c.expenses) / c.expenses) * 100) : 0,
      monthlyRevenue: c.monthlyRevenue,
      recentExpenses: c.recentExpenses,
    }))
  const data = topCars.map((c) => ({
    ...c,
    label: `${c.brand.slice(0, 3)} ${c.model.slice(0, 6)}`,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Revenus par véhicule</h3>
          <p className="mt-0.5 text-xs text-slate-500">Top 8 véhicules les plus rentables</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
          <Trophy className="h-4 w-4" strokeWidth={2.25} />
        </div>
      </div>

      <div className="mt-6 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            barCategoryGap="22%"
          >
            <defs>
              <linearGradient id="topCarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="topCarGradLeader" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#fb923c" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
              width={92}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="revenue" radius={[0, 8, 8, 0]} maxBarSize={26}>
              {data.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "url(#topCarGradLeader)" : "url(#topCarGrad)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
