"use client"

import { motion } from "motion/react"
import { CalendarCheck, Activity, TrendingUp, BadgeCheck, XCircle, AlertTriangle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CountUp } from "@/components/app/count-up"
import { type Reservation, formatMAD } from "@/lib/reservations-data"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/i18n-context"

type KpiCardProps = {
  label: string
  value: number
  display?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  ringFrom: string
  ringTo: string
  delay: number
  live?: boolean
  prefix?: string
  suffix?: string
}

function KpiCard({ label, value, display, icon: Icon, iconBg, iconColor, ringFrom, ringTo, delay, live, prefix, suffix }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r opacity-70",
          ringFrom,
          ringTo,
        )}
      />
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-gradient-to-br from-transparent to-slate-100/60 blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
            {live && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {display ? (
              display
            ) : (
              <>
                {prefix}
                <CountUp value={value} duration={1.2} />
                {suffix}
              </>
            )}
          </div>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </motion.div>
  )
}

export function ReservationsKpiBar({ reservations }: { reservations: Reservation[] }) {
  const { t } = useI18n()
  const total = reservations.length
  const active = reservations.filter((r) => r.status === "en_cours").length
  const cancelled = reservations.filter((r) => r.status === "annulee").length
  const overdue = reservations.filter((r) => r.overdue).length

  const bookedValue = reservations
    .filter((r) => r.status === "confirmee" || r.status === "en_cours" || r.status === "terminee")
    .reduce((sum, r) => sum + r.total, 0)

  const confirmable = reservations.filter((r) => r.status !== "annulee").length
  const confirmRate = total === 0 ? 0 : Math.round((confirmable / total) * 100)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      <KpiCard
        label={t("reservations.kpi.total")}
        value={total}
        icon={CalendarCheck}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        ringFrom="from-blue-300"
        ringTo="to-transparent"
        delay={0}
        live
      />
      <KpiCard
        label={t("reservations.kpi.active")}
        value={active}
        icon={Activity}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        ringFrom="from-indigo-300"
        ringTo="to-transparent"
        delay={0.05}
        live
      />
      <KpiCard
        label={t("reservations.kpi.bookedValue")}
        value={bookedValue}
        display={formatMAD(bookedValue)}
        icon={TrendingUp}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        ringFrom="from-emerald-300"
        ringTo="to-transparent"
        delay={0.1}
      />
      <KpiCard
        label={t("reservations.kpi.confirmation")}
        value={confirmRate}
        suffix="%"
        icon={BadgeCheck}
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        ringFrom="from-sky-300"
        ringTo="to-transparent"
        delay={0.15}
      />
      <KpiCard
        label={t("reservations.kpi.cancellations")}
        value={cancelled}
        icon={XCircle}
        iconBg="bg-slate-100"
        iconColor="text-slate-600"
        ringFrom="from-slate-300"
        ringTo="to-transparent"
        delay={0.2}
      />
      <KpiCard
        label={t("reservations.kpi.overdue")}
        value={overdue}
        icon={AlertTriangle}
        iconBg="bg-rose-50"
        iconColor="text-rose-600"
        ringFrom="from-rose-300"
        ringTo="to-transparent"
        delay={0.25}
      />
    </div>
  )
}
