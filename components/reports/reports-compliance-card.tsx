"use client"

import { motion } from "motion/react"
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsOverview } from "@/modules/reports/services/reports.service"

const urgencyStyle = {
  expired: {
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    labelKey: "expired",
  },
  urgent: {
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
    labelKey: "urgent",
  },
  soon: {
    bar: "bg-blue-400",
    chip: "bg-blue-50 text-blue-700 ring-blue-100",
    labelKey: "soon",
  },
} as const

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function ReportsComplianceCard({
  items,
  totalCost,
  currency,
}: {
  items: ReportsOverview["complianceItems"]
  totalCost: number
  currency: string
}) {
  const { t } = useI18n()
  const expiredCount = items.filter((c) => c.urgency === "expired").length
  const urgentCount = items.filter((c) => c.urgency === "urgent").length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("reports.compliance.title")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {expiredCount + urgentCount > 0 ? (
                <>
                  <span className="font-semibold text-rose-600">{expiredCount}</span> {t("reports.compliance.expiredCount")} ·{" "}
                  <span className="font-semibold text-amber-600">{urgentCount}</span> {t("reports.compliance.urgentCount")}
                </>
              ) : (
                <span className="text-emerald-600">{t("reports.compliance.clear")}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold tabular-nums text-slate-900">
            {formatMoney(totalCost, currency)}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t("reports.compliance.estimatedCost")}
          </div>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {items.map((item) => {
          const style = urgencyStyle[item.urgency]
          return (
            <li
              key={item.id}
              className="group relative flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/50"
            >
              <span className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${style.bar}`} />
              <div className="ml-2 grid h-8 w-8 place-items-center rounded-lg bg-slate-50">
                {item.urgency === "expired" ? (
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{t(`finances.upcoming.types.${item.type}`)}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${style.chip}`}
                  >
                    {t(`reports.compliance.urgency.${style.labelKey}`)}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {item.car} <span className="font-mono">· {item.plate}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold tabular-nums text-slate-900">
                  {formatMoney(item.estimatedCost, currency)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.daysLeft < 0
                    ? t("reports.compliance.overdueInDays").replace("{days}", String(Math.abs(item.daysLeft)))
                    : t("reports.compliance.dueInDays").replace("{days}", String(item.daysLeft))}{" "}
                  · {formatDate(item.expiresAt)}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}
