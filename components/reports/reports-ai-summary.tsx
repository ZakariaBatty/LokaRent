"use client"

import { motion } from "motion/react"
import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsKpi, ReportsVehicleRow } from "@/modules/reports/services/reports.service"

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ReportsAiSummary({
  kpi,
  vehicles,
  currency,
}: {
  kpi: ReportsKpi
  vehicles: ReportsVehicleRow[]
  currency: string
}) {
  const { t } = useI18n()
  const bestCar = vehicles.slice().sort((a, b) => b.occupancy - a.occupancy)[0]
  const worstCar = vehicles.slice().sort((a, b) => a.occupancy - b.occupancy)[0]
  const insights = [
    {
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      title: t("reports.ai.growthTitle"),
      text: t("reports.ai.growthText")
        .replace("{revenueDelta}", kpi.revenueDelta.toFixed(1))
        .replace("{rentalsDelta}", kpi.rentalsDelta.toFixed(1)),
    },
    worstCar && {
      icon: AlertCircle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      title: t("reports.ai.underperformingTitle"),
      text: t("reports.ai.underperformingText")
        .replace("{vehicle}", `${worstCar.brand} ${worstCar.model}`)
        .replace("{plate}", worstCar.plate)
        .replace("{occupancy}", worstCar.occupancy.toFixed(0)),
    },
    bestCar && {
      icon: Lightbulb,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
      title: t("reports.ai.fleetStarTitle"),
      text: t("reports.ai.fleetStarText")
        .replace("{vehicle}", `${bestCar.brand} ${bestCar.model}`)
        .replace("{revenue}", formatMoney(bestCar.revenue, currency))
        .replace("{occupancy}", bestCar.occupancy.toFixed(0))
        .replace("{category}", bestCar.category),
    },
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/40 p-5 shadow-sm"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-300/30 to-violet-300/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-br from-violet-300/20 to-indigo-300/30 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 opacity-30 blur" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("reports.ai.title")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("reports.ai.subtitle")}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 md:grid-cols-3">
        {insights.map((ins, i) => {
          if (!ins) return null
          const Icon = ins.icon
          return (
            <motion.div
              key={ins.title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
              className="rounded-xl border border-white/60 bg-white/70 p-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${ins.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${ins.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">{ins.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{ins.text}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
