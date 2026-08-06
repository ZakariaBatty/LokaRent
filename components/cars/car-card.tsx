"use client"

import { motion } from "motion/react"
import { Eye, AlertTriangle, Wrench, ShieldAlert } from "lucide-react"
import { type Car, statusConfig, categoryGradients } from "@/lib/cars-data"
import { CarIllustration } from "./car-illustration"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

type Alert = { type: "insurance" | "vignette" | "maintenance"; severity: "warning" | "danger" }

function getAlerts(car: Car): Alert[] {
  const alerts: Alert[] = []
  if (car.insurance.daysLeft < 0)
    alerts.push({ type: "insurance", severity: "danger" })
  else if (car.insurance.daysLeft <= 30)
    alerts.push({ type: "insurance", severity: "warning" })

  if (car.vignette.daysLeft < 0)
    alerts.push({ type: "vignette", severity: "danger" })
  else if (car.vignette.daysLeft <= 30)
    alerts.push({ type: "vignette", severity: "warning" })

  if (car.visiteTechnique.daysLeft < 0)
    alerts.push({ type: "maintenance", severity: "danger" })
  else if (car.visiteTechnique.daysLeft <= 30)
    alerts.push({ type: "maintenance", severity: "warning" })

  return alerts
}

export function CarCard({
  car,
  selected,
  onSelect,
}: {
  car: Car
  selected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[car.status]
  const alerts = getAlerts(car)
  const hasDanger = alerts.some((a) => a.severity === "danger")

  return (
    <motion.button
      layout
      onClick={onSelect}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border bg-white p-5 text-left transition-shadow",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)]",
        "hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_12px_28px_rgba(15,23,42,0.10)]",
        selected ? "border-indigo-300 ring-2 ring-indigo-200" : "border-slate-200/80",
      )}
    >
      {/* Category gradient overlay */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          categoryGradients[car.category],
        )}
      />

      {/* Selected accent bar */}
      {selected && (
        <motion.div
          layoutId="car-card-accent"
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500"
        />
      )}

      <div className="relative">
        {/* Top row */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <CarIllustration category={car.category} size="md" />

          <div className="flex items-center gap-1.5">
            {alerts.length > 0 && (
              <div
                className={cn(
                  "flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold",
                  hasDanger
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                <motion.span
                  animate={hasDanger ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  transition={{ duration: 1.4, repeat: hasDanger ? Number.POSITIVE_INFINITY : 0 }}
                  className={cn("h-1.5 w-1.5 rounded-full", hasDanger ? "bg-rose-500" : "bg-amber-500")}
                />
                {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
              </div>
            )}
            <div
              className={cn(
                "flex h-6 items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold",
                status.pillClass,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
              {status.label}
            </div>
          </div>
        </div>

        {/* Car identity */}
        <div className="mb-4">
          <h3 className="font-serif text-lg leading-tight text-slate-900">
            {car.brand} {car.model}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {car.year} · {car.color} · {car.fuel}
          </p>
        </div>

        {/* Plate badge */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-50 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-800 shadow-sm">
            {car.plate}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {car.km.toLocaleString("fr-FR")} km
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between gap-3 border-t border-slate-200/70 pt-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {car.seats}
              </span>
              <span className="text-xs font-medium text-slate-500">{fr.fleet.seats}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">{car.category}</div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {alerts.length > 0 && (
              <div className="flex gap-1">
                {alerts.slice(0, 3).map((alert, i) => {
                  const Icon =
                    alert.type === "insurance"
                      ? ShieldAlert
                      : alert.type === "vignette"
                        ? AlertTriangle
                        : Wrench
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md",
                        alert.severity === "danger"
                          ? "bg-rose-100 text-rose-600"
                          : "bg-amber-100 text-amber-600",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white/80 px-2 text-[10px] font-medium text-slate-600 opacity-0 backdrop-blur transition group-hover:opacity-100">
              <Eye className="h-3 w-3" />
              Aperçu
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
