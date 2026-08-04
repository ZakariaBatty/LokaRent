"use client"

import { motion } from "motion/react"
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Clock,
  type LucideIcon,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { CountUp } from "@/components/app/count-up"
import { formatMAD, reportsKpi } from "@/lib/reports-data"

type SummaryCard = {
  label: string
  value: number
  delta: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
  formatValue?: (n: number) => string
  suffix?: string
  highlight?: boolean
  invertedDelta?: boolean
}

export function ReportsSummaryCards() {
  const cards: SummaryCard[] = [
    {
      label: "Revenus",
      value: reportsKpi.revenue,
      delta: reportsKpi.revenueDelta,
      icon: Wallet,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      formatValue: (n) => formatMAD(Math.round(n)),
    },
    {
      label: "Profit net",
      value: reportsKpi.netProfit,
      delta: reportsKpi.netProfitDelta,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      formatValue: (n) => formatMAD(Math.round(n)),
      highlight: true,
    },
    {
      label: "Locations",
      value: reportsKpi.rentals,
      delta: reportsKpi.rentalsDelta,
      icon: Calendar,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Durée moyenne",
      value: reportsKpi.avgDuration,
      delta: reportsKpi.avgDurationDelta,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      suffix: "j",
      formatValue: (n) =>
        n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    },
    {
      label: "Taux d'occupation",
      value: reportsKpi.fleetOccupancy,
      delta: reportsKpi.fleetOccupancyDelta,
      icon: Users,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      suffix: "%",
    },
    {
      label: "Panier moyen",
      value: reportsKpi.avgTicket,
      delta: reportsKpi.avgTicketDelta,
      icon: Receipt,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      formatValue: (n) => formatMAD(Math.round(n)),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c, i) => {
        const Icon = c.icon
        const positiveTrend = c.invertedDelta ? c.delta < 0 : c.delta >= 0
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
              c.highlight
                ? "border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-white"
                : "border-slate-200/70 bg-white"
            }`}
          >
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-slate-100/60 to-transparent blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${c.iconBg} ring-1 ring-inset ring-white/60`}>
                <Icon className={`h-4 w-4 ${c.iconColor}`} />
              </div>
              <div
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  positiveTrend ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {c.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(c.delta).toFixed(1)}%
              </div>
            </div>
            <div className="relative mt-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{c.label}</div>
              <div className="mt-1 flex items-baseline gap-1 text-xl font-bold tabular-nums text-slate-900">
                <CountUp
                  value={c.value}
                  format={c.formatValue ?? ((n) => Math.round(n).toLocaleString("fr-FR"))}
                />
                {c.suffix && <span className="text-sm font-semibold text-slate-500">{c.suffix}</span>}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
