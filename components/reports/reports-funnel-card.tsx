"use client"

import { motion } from "motion/react"
import { Filter } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsOverview } from "@/modules/reports/services/reports.service"

type FunnelRow = ReportsOverview["reservationFunnel"][number]
type CancellationReason = ReportsOverview["cancellationReasons"][number]

export function ReportsFunnelCard({
  funnel,
  cancellationReasons,
}: {
  funnel: FunnelRow[]
  cancellationReasons: CancellationReason[]
}) {
  const { t } = useI18n()
  const max = funnel[0]?.value ?? 0
  const conversion = (funnel[2]?.value ?? 0) / Math.max(1, funnel[0]?.value ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
            <Filter className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("reports.funnel.title")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t("reports.funnel.subtitle")}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold tabular-nums text-indigo-600">
            {(conversion * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{t("reports.funnel.rate")}</div>
        </div>
      </div>

      <div className="space-y-2 p-5">
        {funnel.map((s, i) => {
          const pct = (s.value / max) * 100
          return (
            <div key={s.stageKey}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{t(`reports.funnel.stages.${s.stageKey}`)}</span>
                <span className="font-semibold tabular-nums text-slate-900">{s.value}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.05 + i * 0.08, ease: "easeOut" }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {t("reports.funnel.cancellationReasons")}
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {cancellationReasons.map((r) => (
            <li
              key={r.reason ?? "other"}
              className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 ring-1 ring-inset ring-slate-100"
            >
              {r.reason ?? t("reports.funnel.otherReason")}
              <span className="font-semibold text-slate-900">{r.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
