"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ArrowDown, ArrowUp, ArrowUpDown, Car as CarIcon, Minus, TrendingDown, TrendingUp } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { ReportsVehicleRow } from "@/modules/reports/services/reports.service"

const reportCategoryAccent: Record<string, string> = {
  économique: "bg-sky-100 text-sky-700",
  compacte: "bg-blue-100 text-blue-700",
  berline: "bg-indigo-100 text-indigo-700",
  SUV: "bg-emerald-100 text-emerald-700",
  premium: "bg-violet-100 text-violet-700",
  utilitaire: "bg-amber-100 text-amber-700",
}

type SortKey = "rentals" | "revenue" | "profit" | "occupancy" | "roi"

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ReportsCarsTable({ rows, currency }: { rows: ReportsVehicleRow[]; currency: string }) {
  const { t } = useI18n()
  const [sortKey, setSortKey] = useState<SortKey>("revenue")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? Number.NEGATIVE_INFINITY
    const bv = b[sortKey] ?? Number.NEGATIVE_INFINITY
    return sortDir === "desc" ? bv - av : av - bv
  })

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "desc" ? "asc" : "desc")
    else {
      setSortKey(k)
      setSortDir("desc")
    }
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="inline-flex items-center gap-1 transition hover:text-slate-900"
    >
      {label}
      {sortKey === k ? (
        sortDir === "desc" ? (
          <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
            <CarIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{t("reports.vehicleTable.title")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {rows.length} {t("reports.vehicleTable.vehiclesAnalyzed")}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">{t("reports.vehicleTable.vehicle")}</th>
              <th className="px-3 py-3">
                <SortBtn k="rentals" label={t("reports.labels.rentals")} />
              </th>
              <th className="px-3 py-3">{t("reports.vehicleTable.days")}</th>
              <th className="px-3 py-3">
                <SortBtn k="revenue" label={t("reports.labels.revenue")} />
              </th>
              <th className="px-3 py-3">
                <SortBtn k="profit" label={t("reports.labels.profit")} />
              </th>
              <th className="px-3 py-3">
                <SortBtn k="occupancy" label={t("reports.labels.occupancy")} />
              </th>
              <th className="px-3 py-3">
                <SortBtn k="roi" label="ROI" />
              </th>
              <th className="px-5 py-3 text-right">{t("reports.vehicleTable.trend")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((c) => {
              const accent = reportCategoryAccent[c.category] ?? "bg-slate-100 text-slate-700"
              return (
                <tr key={c.id} className="group transition hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-xl ${accent}`}>
                        <CarIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {c.brand} {c.model}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono">{c.plate}</span>
                          <span>·</span>
                          <span className="capitalize">{c.category}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-medium tabular-nums text-slate-700">
                    {c.rentals}
                  </td>
                  <td className="px-3 py-3 text-sm tabular-nums text-slate-500">
                    {c.daysRented} / {c.daysAvailable}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold tabular-nums text-slate-900">
                    {formatMoney(c.revenue, currency)}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold tabular-nums">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        c.profit >= 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {c.profit >= 0 ? "+" : ""}
                      {formatMoney(c.profit, currency)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className={`h-full rounded-full ${
                            c.occupancy >= 70
                              ? "bg-emerald-500"
                              : c.occupancy >= 50
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${c.occupancy}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-slate-700">
                        {c.occupancy.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        c.roi === null
                          ? "text-slate-400"
                          : c.roi >= 30
                          ? "text-emerald-600"
                          : c.roi >= 15
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {c.roi === null ? t("reports.vehicleTable.unavailable") : `${c.roi.toFixed(1)}%`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.trend === "up" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {t("reports.trends.up")}
                      </span>
                    ) : c.trend === "down" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                        <TrendingDown className="h-3.5 w-3.5" />
                        {t("reports.trends.down")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Minus className="h-3.5 w-3.5" />
                        {t("reports.trends.flat")}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
