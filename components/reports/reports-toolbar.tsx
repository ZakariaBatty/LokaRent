"use client"

import { motion } from "motion/react"
import { Calendar, Download, FileText, Mail } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsPeriod } from "@/modules/reports/services/reports.service"

const PERIODS: ReportsPeriod[] = ["this_month", "last_month", "quarter", "year", "custom"]
const periodLabelKeys: Record<ReportsPeriod, string> = {
  this_month: "finances.range.thisMonth",
  last_month: "finances.range.lastMonth",
  quarter: "finances.range.quarter",
  year: "finances.range.year",
  custom: "finances.range.custom",
}

export function ReportsToolbar({
  period,
  onPeriodChange,
}: {
  period: ReportsPeriod
  onPeriodChange: (p: ReportsPeriod) => void
}) {
  const { t } = useI18n()
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = (kind: "pdf" | "excel" | "email") => {
    setExporting(kind)
    setTimeout(() => {
      setExporting(null)
      toast.error(t("reports.export.unavailable"))
    }, 900)
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{t("navigation.reports")}</h1>
          <p className="text-sm text-slate-500">{t("reports.header.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-white p-1 shadow-sm">
          <Calendar className="ml-2 h-4 w-4 text-slate-400" />
          <div className="relative flex items-center">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  period === p ? "text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {period === p && (
                  <motion.span
                    layoutId="reports-period-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 shadow"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{t(periodLabelKeys[p])}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting === "pdf" ? t("reports.export.preparing") : "PDF"}
        </button>
        <button
          onClick={() => handleExport("excel")}
          disabled={exporting !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting === "excel" ? t("reports.export.preparing") : "Excel"}
        </button>
        <button
          onClick={() => handleExport("email")}
          disabled={exporting !== null}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Mail className="relative h-3.5 w-3.5" />
          <span className="relative">{exporting === "email" ? t("reports.export.sending") : "Email"}</span>
        </button>
      </div>
    </div>
  )
}
