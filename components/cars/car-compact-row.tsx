"use client"

import { motion } from "motion/react"
import { type Car, statusConfig } from "@/lib/cars-data"
import { CarIllustration } from "./car-illustration"
import { cn } from "@/lib/utils"

/**
 * Compact row used in the shrunk left panel (when a car is selected).
 */
export function CarCompactRow({
  car,
  selected,
  onSelect,
}: {
  car: Car
  selected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[car.status]

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-white p-3 text-left transition-all",
        selected
          ? "border-indigo-300 shadow-[0_2px_8px_rgba(99,102,241,0.12)]"
          : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60",
      )}
    >
      {selected && (
        <motion.div
          layoutId="car-card-accent"
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500"
        />
      )}
      <div className="flex items-center gap-3">
        <CarIllustration category={car.category} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-slate-900">
              {car.brand} {car.model}
            </p>
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status.dotClass)} />
          </div>
          <p className="mt-0.5 font-mono text-[10px] font-medium tracking-wider text-slate-500">
            {car.plate}
          </p>
        </div>
      </div>
    </button>
  )
}
