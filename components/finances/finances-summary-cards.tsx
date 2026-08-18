"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight, Percent, TrendingUp, Wallet, Wrench } from "lucide-react"
import { CountUp } from "@/components/app/count-up"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/i18n-context"
import type { FinanceReportingSummary } from "@/modules/finances/services/finances.service"

type SummaryCard = {
  id: string
  label: string
  value: number
  suffix: string
  delta: number
  invertedDelta?: boolean
  icon: typeof Wallet
  accent: { iconBg: string; spark: string }
  highlight?: boolean
  decimals?: number
}

export function FinancesSummaryCards({ summary, currency }: { summary: FinanceReportingSummary; currency: string }) {
  const { t } = useI18n()

  const cards: SummaryCard[] = [
    {
      id: "revenue",
      label: t("finances.cards.totalRevenue"),
      value: summary.totalRevenue,
      suffix: ` ${currency}`,
      delta: summary.revenueDelta,
      icon: Wallet,
      accent: { iconBg: "bg-blue-50 text-blue-600 ring-blue-100", spark: "#3b82f6" },
    },
    {
      id: "expenses",
      label: t("finances.cards.totalExpenses"),
      value: summary.totalExpenses,
      suffix: ` ${currency}`,
      delta: summary.expensesDelta,
      invertedDelta: true,
      icon: Wrench,
      accent: { iconBg: "bg-amber-50 text-amber-600 ring-amber-100", spark: "#f59e0b" },
    },
    {
      id: "profit",
      label: t("finances.cards.netProfit"),
      value: summary.netProfit,
      suffix: ` ${currency}`,
      delta: summary.profitDelta,
      icon: TrendingUp,
      accent: { iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100", spark: "#10b981" },
      highlight: true,
    },
    {
      id: "profitability",
      label: t("finances.cards.profitabilityRate"),
      value: summary.profitabilityRate,
      suffix: " %",
      delta: summary.profitabilityDelta,
      icon: Percent,
      accent: { iconBg: "bg-violet-50 text-violet-600 ring-violet-100", spark: "#8b5cf6" },
      decimals: 1,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon
        const deltaIsPositive = "invertedDelta" in c && c.invertedDelta ? c.delta < 0 : c.delta > 0
        const TrendIcon = c.delta === 0 ? null : c.delta > 0 ? ArrowUpRight : ArrowDownRight

        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-slate-200/60",
              c.highlight
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40"
                : "border-slate-200/70 bg-white",
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
                  c.accent.iconBg,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium text-slate-500">{c.label}</p>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-3xl font-semibold tracking-tight tabular-nums",
                    c.highlight ? "text-emerald-700" : "text-slate-900",
                  )}
                >
                  <CountUp
                    value={c.value}
                    format={(n) =>
                      "decimals" in c && c.decimals
                        ? n.toLocaleString("fr-FR", {
                            minimumFractionDigits: c.decimals,
                            maximumFractionDigits: c.decimals,
                          })
                        : Math.round(n).toLocaleString("fr-FR")
                    }
                  />
                </span>
                {c.suffix && <span className="text-sm font-medium text-slate-400">{c.suffix.trim()}</span>}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                  deltaIsPositive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              >
                {TrendIcon && <TrendIcon className="h-3 w-3" />}
                {c.delta > 0 ? "+" : ""}
                {c.delta}%
              </span>
              <span className="text-xs text-slate-400">{t("finances.cards.vsPrevious")}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
