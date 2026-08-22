"use client"

import { motion } from "motion/react"
import { CalendarRange } from "lucide-react"
import { dateRangeOptions, type DateRange } from "@/lib/finances-data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/i18n-context"

export function FinancesDateRange({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomChange,
  onCustomApply,
}: {
  value: DateRange
  onChange: (v: DateRange) => void
  customFrom: string
  customTo: string
  onCustomChange: (range: { from: string; to: string }) => void
  onCustomApply: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
          <CalendarRange className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">{t("navigation.finances")}</h1>
          <p className="text-xs text-slate-500">{t("finances.header.subtitle")}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm">
        {dateRangeOptions.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {active && (
                <motion.span
                  layoutId="financesRangePill"
                  className="absolute inset-0 z-[-1] rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {t(opt.labelKey)}
            </button>
          )
        })}
      </div>
      {value === "custom" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-2 shadow-sm">
          <input
            type="date"
            value={customFrom}
            onChange={(event) => onCustomChange({ from: event.target.value, to: customTo })}
            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            aria-label={t("finances.range.startDate")}
          />
          <input
            type="date"
            value={customTo}
            onChange={(event) => onCustomChange({ from: customFrom, to: event.target.value })}
            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            aria-label={t("finances.range.endDate")}
          />
          <button
            type="button"
            onClick={onCustomApply}
            className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            {t("finances.range.apply")}
          </button>
        </div>
      )}
    </div>
  )
}
