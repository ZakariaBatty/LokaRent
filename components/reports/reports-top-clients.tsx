"use client"

import { motion } from "motion/react"
import { Crown, Trophy } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsClientRow } from "@/modules/reports/services/reports.service"

const loyaltyStyles: Record<string, { bg: string; text: string }> = {
  vip: { bg: "bg-amber-50", text: "text-amber-700" },
  regular: { bg: "bg-blue-50", text: "text-blue-700" },
  new: { bg: "bg-emerald-50", text: "text-emerald-700" },
  inactive: { bg: "bg-slate-100", text: "text-slate-600" },
}

const nationalityFlag: Record<string, string> = {
  MA: "🇲🇦",
  FR: "🇫🇷",
  ES: "🇪🇸",
  DE: "🇩🇪",
  UK: "🇬🇧",
  BE: "🇧🇪",
  NL: "🇳🇱",
  IT: "🇮🇹",
}

export function ReportsTopClients({ rows, currency }: { rows: ReportsClientRow[]; currency: string }) {
  const { t } = useI18n()
  const top = [...rows].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 6)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("reports.clients.title")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t("reports.clients.subtitle")}</p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {top.map((c, i) => {
          const style = loyaltyStyles[c.loyalty]
          const name = c.name || t("reports.clients.fallbackName")
          return (
            <li
              key={c.id}
              className="group flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/50"
            >
              <div className="relative">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white shadow-sm">
                  {c.initials || name.slice(0, 2).toUpperCase()}
                </div>
                {i === 0 && (
                  <Crown className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-500" fill="#f59e0b" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
                  <span className="text-sm">{nationalityFlag[c.nationality]}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {c.rentals} {c.rentals > 1 ? t("reports.labels.rentalsPlural") : t("reports.labels.rentalSingular")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums text-slate-900">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  }).format(c.totalSpent)}
                </div>
                <span
                  className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}
                >
                  {t(`reports.clients.loyalty.${c.loyalty}`)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}
