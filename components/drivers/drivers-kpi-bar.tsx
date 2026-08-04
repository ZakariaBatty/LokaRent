"use client"

import { useMemo } from "react"
import { CarFront, Users, CheckCircle2, Clock, BanIcon, Wallet } from "lucide-react"
import { type Driver, formatMAD } from "@/lib/drivers-data"
import { cn } from "@/lib/utils"

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  valueClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  iconClass?: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={cn("text-xl font-bold tabular-nums text-slate-900", valueClass)}>{value}</p>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

export function DriversKpiBar({ drivers }: { drivers: Driver[] }) {
  const stats = useMemo(() => {
    const total = drivers.length
    const active = drivers.filter((d) => d.status === "active").length
    const inactive = drivers.filter((d) => d.status === "inactive").length
    const suspended = drivers.filter((d) => d.status === "suspended").length
    const totalEarned = drivers.reduce((s, d) => s + d.totalEarned, 0)
    const totalAssignments = drivers.reduce((s, d) => s + d.totalAssignments, 0)
    return { total, active, inactive, suspended, totalEarned, totalAssignments }
  }, [drivers])

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        icon={Users}
        label="Total"
        value={stats.total}
        sub="chauffeurs"
        iconClass="bg-slate-100 text-slate-600"
      />
      <KpiCard
        icon={CheckCircle2}
        label="Actifs"
        value={stats.active}
        iconClass="bg-emerald-50 text-emerald-600"
        valueClass="text-emerald-700"
      />
      <KpiCard
        icon={Clock}
        label="Inactifs"
        value={stats.inactive}
        iconClass="bg-slate-100 text-slate-500"
      />
      <KpiCard
        icon={BanIcon}
        label="Suspendus"
        value={stats.suspended}
        iconClass="bg-rose-50 text-rose-500"
        valueClass="text-rose-700"
      />
      <KpiCard
        icon={CarFront}
        label="Missions"
        value={stats.totalAssignments}
        sub="au total"
        iconClass="bg-blue-50 text-blue-600"
      />
      <KpiCard
        icon={Wallet}
        label="Total versé"
        value={formatMAD(stats.totalEarned)}
        iconClass="bg-indigo-50 text-indigo-600"
        valueClass="text-indigo-700"
      />
    </div>
  )
}
