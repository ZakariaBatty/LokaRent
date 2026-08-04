"use client"

import { motion } from "motion/react"
import { TrendingUp, TrendingDown, Wallet, Wrench, Fuel, ShieldCheck, Stamp } from "lucide-react"
import { type Car, formatMAD, formatDate } from "@/lib/cars-data"
import { cn } from "@/lib/utils"

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string
  value: string
  trend?: { value: number; positive: boolean }
  icon: React.ElementType
  accent: "indigo" | "emerald" | "rose" | "amber"
  highlight?: boolean
}) {
  const accentClasses = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-600",
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 transition-shadow",
        highlight
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 shadow-[0_4px_16px_rgba(16,185,129,0.08)]"
          : "border-slate-200/80 bg-white shadow-sm hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accentClasses[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              trend.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
            )}
          >
            {trend.positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {trend.positive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 font-serif text-2xl text-slate-900 tabular-nums">{value}</p>
    </motion.div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 240
  const height = 60
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(" ")
  const area = `0,${height} ${points} ${width},${height}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        fill={`url(#spark-${color})`}
        points={area}
      />
      <motion.polyline
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

const expenseIcon: Record<string, React.ElementType> = {
  Maintenance: Wrench,
  Réparation: Wrench,
  Assurance: ShieldCheck,
  Vignette: Stamp,
  Carburant: Fuel,
}

export function FinancesTab({ car }: { car: Car }) {
  const profit = car.revenue - car.expenses
  const profitable = profit >= 0
  const margin = car.revenue > 0 ? Math.round((profit / car.revenue) * 100) : 0

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Revenus générés"
          value={formatMAD(car.revenue)}
          trend={{ value: 12.4, positive: true }}
          icon={Wallet}
          accent="indigo"
        />
        <KpiCard
          label="Total dépenses"
          value={formatMAD(car.expenses)}
          trend={{ value: 3.2, positive: false }}
          icon={Wrench}
          accent="amber"
        />
        <KpiCard
          label={profitable ? "Profit net" : "Perte nette"}
          value={formatMAD(Math.abs(profit))}
          trend={{ value: Math.abs(margin), positive: profitable }}
          icon={profitable ? TrendingUp : TrendingDown}
          accent={profitable ? "emerald" : "rose"}
          highlight
        />
        <KpiCard
          label="Taux d'occupation"
          value={`${car.occupancyRate}%`}
          icon={TrendingUp}
          accent="emerald"
        />
      </div>

      {/* Revenue evolution + occupancy */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Évolution des revenus</h3>
              <p className="text-[11px] text-slate-500">12 derniers mois</p>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700">+12.4% YoY</p>
          </div>
          <div className="mt-4">
            <Sparkline data={car.monthlyRevenue} color="#6366f1" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Jan</span>
            <span>Avr</span>
            <span>Juil</span>
            <span>Oct</span>
            <span>Déc</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900">Performance</h3>
          <p className="text-[11px] text-slate-500">Indicateur d&apos;activité</p>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium text-slate-600">Taux d&apos;occupation</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{car.occupancyRate}%</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${car.occupancyRate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">{car.totalDays} jours loués sur 12 mois</p>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium text-slate-600">Marge nette</p>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  profitable ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {margin}%
              </p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={cn(
                  "h-full rounded-full bg-gradient-to-r",
                  profitable ? "from-indigo-500 to-blue-500" : "from-rose-500 to-red-500",
                )}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              {formatMAD(profit)} sur {formatMAD(car.revenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent expenses */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dernières dépenses</h3>
            <p className="text-[11px] text-slate-500">3 derniers mouvements</p>
          </div>
          <button className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
            Voir tout →
          </button>
        </div>
        <div className="space-y-2">
          {car.recentExpenses.map((exp, i) => {
            const Icon = expenseIcon[exp.type] || Wrench
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{exp.type}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {formatDate(exp.date)}
                    {exp.note ? ` · ${exp.note}` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-rose-700 tabular-nums">
                  -{formatMAD(exp.amount)}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
