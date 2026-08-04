"use client"

import { motion } from "motion/react"
import { Car, KeyRound, TrendingUp, RotateCcw, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { CountUp } from "@/components/app/count-up"
import { useAgency } from "@/contexts/agency-context"

const iconMap = { Car, KeyRound, TrendingUp, RotateCcw }

const accentStyles = {
  blue: {
    iconBg: "bg-blue-50 text-blue-600 ring-blue-100",
    spark: "stroke-blue-500",
    sparkFill: "fill-blue-500/10",
  },
  violet: {
    iconBg: "bg-violet-50 text-violet-600 ring-violet-100",
    spark: "stroke-violet-500",
    sparkFill: "fill-violet-500/10",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    spark: "stroke-emerald-500",
    sparkFill: "fill-emerald-500/10",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600 ring-amber-100",
    spark: "stroke-amber-500",
    sparkFill: "fill-amber-500/10",
  },
} as const

function Sparkline({ data, color, fill }: { data: number[]; color: string; fill: string }) {
  const width = 96
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 4) - 2
    return [x, y] as const
  })

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")
  const area = `${path} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={area}
        className={fill}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      />
      <motion.path
        d={path}
        className={`fill-none ${color}`}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
      />
    </svg>
  )
}

export function KpiGrid() {
  const { agencyData } = useAgency()
  const dk = agencyData.dashboardKpis

  const kpis = [
    {
      id: "available",
      label: "Voitures disponibles",
      value: dk.availableCars,
      suffix: ` / ${dk.totalCars}`,
      delta: `+${dk.availableCars}`,
      deltaLabel: "disponibles",
      trend: "up" as const,
      icon: "Car",
      accent: "blue" as const,
      spark: [dk.availableCars - 2, dk.availableCars - 1, dk.availableCars, dk.availableCars - 1, dk.availableCars, dk.availableCars + 1, dk.availableCars],
    },
    {
      id: "active",
      label: "Locations actives",
      value: dk.activeRentals,
      delta: dk.overdueReturns > 0 ? `${dk.overdueReturns} en retard` : "Tout à jour",
      deltaLabel: "",
      trend: dk.overdueReturns > 0 ? ("down" as const) : ("up" as const),
      icon: "KeyRound",
      accent: "violet" as const,
      spark: [dk.activeRentals - 2, dk.activeRentals - 1, dk.activeRentals, dk.activeRentals, dk.activeRentals + 1, dk.activeRentals, dk.activeRentals],
    },
    {
      id: "revenue",
      label: "CA du mois",
      value: dk.monthlyRevenue,
      suffix: " DH",
      delta: `+${dk.revenueDelta}%`,
      deltaLabel: "vs mois dernier",
      trend: "up" as const,
      icon: "TrendingUp",
      accent: "emerald" as const,
      spark: [12, 14, 13, 18, 17, 21, Math.round(dk.monthlyRevenue / 1000)],
    },
    {
      id: "docs",
      label: "Documents à renouveler",
      value: dk.expiringDocuments,
      delta: dk.expiringDocuments > 0 ? "À surveiller" : "Tous valides",
      deltaLabel: "",
      trend: dk.expiringDocuments > 2 ? ("down" as const) : ("neutral" as const),
      icon: "RotateCcw",
      accent: "amber" as const,
      spark: [1, 2, 1, 3, 2, dk.expiringDocuments, dk.expiringDocuments],
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => {
        const Icon = iconMap[kpi.icon as keyof typeof iconMap]
        const accent = accentStyles[kpi.accent]
        const TrendIcon = kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : null

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-slate-200/60"
          >
            {/* Top: icon + sparkline */}
            <div className="flex items-start justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${accent.iconBg}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <Sparkline data={kpi.spark} color={accent.spark} fill={accent.sparkFill} />
            </div>

            {/* Value */}
            <div className="mt-5">
              <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-slate-900">
                  <CountUp value={kpi.value} />
                </span>
                {kpi.suffix && <span className="text-sm font-medium text-slate-400">{kpi.suffix}</span>}
              </div>
            </div>

            {/* Delta */}
            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
                  kpi.trend === "up"
                    ? "bg-emerald-50 text-emerald-700"
                    : kpi.trend === "down"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700"
                }`}
              >
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                {kpi.delta}
              </span>
              {kpi.deltaLabel && <span className="text-xs text-slate-400">{kpi.deltaLabel}</span>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
