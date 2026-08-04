"use client"

import { motion } from "motion/react"
import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from "lucide-react"
import { bestCar, formatMAD, reportsKpi, worstCar } from "@/lib/reports-data"

export function ReportsAiSummary() {
  const insights = [
    {
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      title: "Croissance solide",
      text: `Les revenus ont progressé de +${reportsKpi.revenueDelta}% vs la période précédente, portés par une hausse du nombre de locations (+${reportsKpi.rentalsDelta}%).`,
    },
    {
      icon: AlertCircle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      title: "Véhicule sous-performant",
      text: `${worstCar.brand} ${worstCar.model} (${worstCar.plate}) n'affiche que ${worstCar.occupancy.toFixed(0)}% d'occupation. À repositionner ou baisser le prix de ${formatMAD(50)}/j.`,
    },
    {
      icon: Lightbulb,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
      title: "Star de la flotte",
      text: `${bestCar.brand} ${bestCar.model} génère ${formatMAD(bestCar.revenue)} avec ${bestCar.occupancy.toFixed(0)}% d'occupation. Envisager d'acquérir un second exemplaire pour le segment ${bestCar.category}.`,
    },
  ]

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
          <h3 className="text-sm font-semibold text-slate-900">Synthèse IA</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Analyse automatique de la performance sur la période
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 md:grid-cols-3">
        {insights.map((ins, i) => {
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
