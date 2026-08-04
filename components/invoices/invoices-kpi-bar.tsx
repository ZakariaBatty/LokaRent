"use client"

import { motion } from "motion/react"
import {
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { type Invoice, formatMAD, getInvoiceKpis } from "@/lib/invoices-data"
import { CountUp } from "@/components/app/count-up"
import { cn } from "@/lib/utils"

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
  suffix?: string
}

function KpiCard({
  label,
  value,
  display,
  icon: Icon,
  iconBg,
  iconColor,
  ringFrom,
  ringTo,
  delay,
  suffix,
}: KpiCardProps) {
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
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {display ? (
              display
            ) : (
              <>
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

export function InvoicesKpiBar({ invoices }: { invoices: Invoice[] }) {
  const { total, totalRevenue, totalPaid, totalRemaining, overdueCount, paidCount } =
    getInvoiceKpis(invoices)

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      <KpiCard
        label="Total"
        value={total}
        icon={Receipt}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        ringFrom="from-blue-300"
        ringTo="to-transparent"
        delay={0}
      />
      <KpiCard
        label="CA facturé"
        value={totalRevenue}
        display={formatMAD(totalRevenue)}
        icon={TrendingUp}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        ringFrom="from-indigo-300"
        ringTo="to-transparent"
        delay={0.05}
      />
      <KpiCard
        label="Encaissé"
        value={totalPaid}
        display={formatMAD(totalPaid)}
        icon={Wallet}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        ringFrom="from-emerald-300"
        ringTo="to-transparent"
        delay={0.1}
      />
      <KpiCard
        label="Restant dû"
        value={totalRemaining}
        display={formatMAD(totalRemaining)}
        icon={Clock}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        ringFrom="from-amber-300"
        ringTo="to-transparent"
        delay={0.15}
      />
      <KpiCard
        label="Payées"
        value={paidCount}
        icon={CheckCircle2}
        iconBg="bg-sky-50"
        iconColor="text-sky-600"
        ringFrom="from-sky-300"
        ringTo="to-transparent"
        delay={0.2}
      />
      <KpiCard
        label="En retard"
        value={overdueCount}
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
