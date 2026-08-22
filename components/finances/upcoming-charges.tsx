"use client"

import { motion } from "motion/react"
import { AlertCircle, CalendarClock, ShieldCheck, Stamp, Wrench } from "lucide-react"
import { type UpcomingCharge } from "@/lib/finances-data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/i18n-context"

const iconMap = {
  insurance: ShieldCheck,
  vignette: Stamp,
  inspection: Wrench,
  maintenance: Wrench,
} as const

const urgencyStyles = {
  high: {
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    bar: "bg-rose-500",
    labelKey: "finances.upcoming.urgent",
  },
  medium: {
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
    bar: "bg-amber-500",
    labelKey: "finances.upcoming.soon",
  },
  low: {
    chip: "bg-slate-50 text-slate-600 ring-slate-200",
    bar: "bg-slate-400",
    labelKey: "finances.upcoming.planned",
  },
} as const

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

export function UpcomingCharges({ charges, currency }: { charges: UpcomingCharge[]; currency: string }) {
  const { t } = useI18n()
  const upcomingCharges = charges
  const total = upcomingCharges.reduce((acc, c) => acc + c.amount, 0)
  const urgent = upcomingCharges.filter((c) => c.urgency === "high").length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
            <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("finances.upcoming.title")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("finances.upcoming.subtitle")} · {urgent} {t("finances.upcoming.urgentCount")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{t("finances.upcoming.forecastTotal")}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
            {total.toLocaleString("fr-FR")} {currency}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {upcomingCharges.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
            {t("finances.upcoming.empty")}
          </p>
        ) : upcomingCharges.map((charge, i) => {
          const Icon = iconMap[charge.type] ?? Wrench
          const urgency = urgencyStyles[charge.urgency]
          return (
            <motion.div
              key={charge.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.04, duration: 0.3 }}
              className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-200/70 bg-slate-50/40 p-3 transition hover:border-slate-300 hover:bg-white"
            >
              <span className={cn("absolute inset-y-2 left-0 w-1 rounded-r-full", urgency.bar)} />
              <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {t(`finances.upcoming.types.${charge.type}`)}
                  </p>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                      urgency.chip,
                    )}
                  >
                    {t(urgency.labelKey)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {charge.carLabel} · {charge.plate}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  -{charge.amount.toLocaleString("fr-FR")} {currency}
                </p>
                <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                  {charge.urgency === "high" && <AlertCircle className="h-3 w-3 text-rose-500" />}
                  {formatShortDate(charge.dueDate)} · J-{charge.daysUntil}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
