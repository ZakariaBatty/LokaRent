"use client"

import { motion } from "motion/react"
import { Car, CalendarCheck, Wrench, BadgeCheck, Activity } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CountUp } from "@/components/app/count-up"
import { cn } from "@/lib/utils"

type KpiCard = {
  id: string
  label: string
  value: number
  suffix?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  ring: string
}

export function CalendarKpiBar({
  totalVehicles,
  availableToday,
  activeReservations,
  inMaintenance,
  occupancy,
}: {
  totalVehicles: number
  availableToday: number
  activeReservations: number
  inMaintenance: number
  occupancy: number
}) {
  const cards: KpiCard[] = [
    {
      id: "total",
      label: "Total véhicules",
      value: totalVehicles,
      icon: Car,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
      ring: "from-slate-50 to-white",
    },
    {
      id: "available",
      label: "Disponibles aujourd'hui",
      value: availableToday,
      icon: BadgeCheck,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      ring: "from-emerald-50 to-white",
    },
    {
      id: "active",
      label: "Réservations actives",
      value: activeReservations,
      icon: CalendarCheck,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      ring: "from-blue-50 to-white",
    },
    {
      id: "maintenance",
      label: "En maintenance",
      value: inMaintenance,
      icon: Wrench,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      ring: "from-amber-50 to-white",
    },
    {
      id: "occupancy",
      label: "Taux d'occupation",
      value: occupancy,
      suffix: "%",
      icon: Activity,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
      ring: "from-indigo-50 to-white",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => {
        const Icon = c.icon
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
            whileHover={{ y: -2 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_2px_8px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]",
              c.ring,
            )}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {c.label}
                </p>
                <div className="mt-1.5 flex items-baseline gap-1 text-2xl font-bold tabular-nums text-slate-900">
                  <CountUp value={c.value} />
                  {c.suffix && (
                    <span className="text-base font-semibold text-slate-500">{c.suffix}</span>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-white/60 transition-transform group-hover:scale-105",
                  c.iconBg,
                )}
              >
                <Icon className={cn("h-4 w-4", c.iconColor)} />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
