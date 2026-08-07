"use client"

import { motion } from "motion/react"
import { Eye, AlertTriangle } from "lucide-react"
import { type Car, statusConfig, formatMAD } from "@/lib/cars-data"
import { CarIllustration } from "./car-illustration"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

function countAlerts(car: Car) {
  let n = 0
  if (car.insurance.daysLeft <= 30) n++
  if (car.vignette.daysLeft <= 30) n++
  if (car.visiteTechnique.daysLeft <= 30) n++
  return n
}

/**
 * Compact list view row (when no car selected, list view is toggled).
 */
export function CarListRow({
  car,
  selected,
  onSelect,
}: {
  car: Car
  selected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[car.status]
  const alerts = countAlerts(car)

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative flex w-full items-center gap-4 overflow-hidden rounded-xl border bg-white px-4 py-3 text-left transition-shadow",
        selected
          ? "border-indigo-300 shadow-[0_2px_8px_rgba(99,102,241,0.12)]"
          : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm",
      )}
    >
      {selected && (
        <motion.div
          layoutId="car-card-accent"
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500"
        />
      )}
      <CarIllustration category={car.category} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">
            {car.brand} {car.model}
          </p>
          <span className="text-[10px] text-slate-400">·</span>
          <p className="text-xs text-slate-500">{car.year}</p>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {car.category} · {car.fuel} · {car.km.toLocaleString("fr-FR")} km
        </p>
      </div>

      <div className="hidden font-mono text-xs font-bold tracking-wider text-slate-700 md:block">
        {car.plate}
      </div>

      <div
        className={cn(
          "hidden h-6 items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold md:flex",
          status.pillClass,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
        {status.label}
      </div>

      <div className="hidden text-right lg:block">
        <p className="text-sm font-bold text-slate-900 tabular-nums">{formatMAD(car.priceDay)}</p>
        <p className="text-[10px] text-slate-400">{fr.fleet.pricing.perDay}</p>
      </div>

      <div className="flex items-center gap-2">
        {alerts > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 opacity-0 transition group-hover:opacity-100">
          <Eye className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  )
}
