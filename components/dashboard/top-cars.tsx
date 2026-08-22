"use client"

import { motion } from "motion/react"
import { Car, TrendingUp } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { DashboardTopVehicle } from "@/modules/dashboard/services/dashboard.service"

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TopCars({ rows, currency }: { rows: DashboardTopVehicle[]; currency: string }) {
  const { t } = useI18n()

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.topCars.title")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{t("dashboard.topCars.subtitle")}</p>
        </div>
        <button className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
          {t("dashboard.actions.viewAll")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {rows.map((car, i) => (
          <motion.div
            key={car.plate}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
            whileHover={{ y: -2 }}
            className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md hover:shadow-slate-200/60"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-inset ring-blue-100">
                <Car className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{car.name}</p>
                <p className="font-mono text-[10px] text-slate-400">{car.plate}</p>
              </div>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                #{i + 1}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold tracking-tight text-slate-900">
                  {formatMoney(car.bookedValue, currency)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {car.trend}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{t("dashboard.topCars.bookedValue")}</p>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">{t("dashboard.topCars.occupancyRate")}</span>
                <span className="font-semibold text-slate-700">{car.occupancy}%</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${car.occupancy}%` }}
                  transition={{ delay: 0.7 + i * 0.08, duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
