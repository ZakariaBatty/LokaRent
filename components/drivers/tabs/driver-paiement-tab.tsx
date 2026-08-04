"use client"

import { Wallet, Clock, TrendingUp, ArrowUpRight, History } from "lucide-react"
import { type Driver, formatMAD, formatDate, paymentTypeConfig } from "@/lib/drivers-data"
import { cn } from "@/lib/utils"

const entryTypeConfig: Record<string, { label: string; color: string }> = {
  salary: { label: "Salaire", color: "bg-blue-50 text-blue-700 border-blue-200" },
  mission: { label: "Mission", color: "bg-violet-50 text-violet-700 border-violet-200" },
  bonus: { label: "Prime", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  advance: { label: "Avance", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

export function DriverPaiementTab({ driver }: { driver: Driver }) {
  const pt = paymentTypeConfig[driver.paymentType]

  return (
    <div className="space-y-5">
      {/* Current rate card */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Tarif actuel</p>
            <p className="text-[11px] text-blue-600">En vigueur depuis le {formatDate(driver.currentRate.startDate ?? driver.hireDate)}</p>
          </div>
          <span className={cn("ml-auto inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", pt.color)}>
            {pt.label}
          </span>
        </div>

        {driver.paymentType === "monthly" ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {formatMAD(driver.currentRate.monthlySalary ?? 0)}
            </span>
            <span className="text-sm text-slate-500">/ mois</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white bg-white/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Par mission</p>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {formatMAD(driver.currentRate.pricePerMission ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white bg-white/70 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Par heure</p>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {formatMAD(driver.currentRate.pricePerHour ?? 0)}
              </p>
            </div>
          </div>
        )}

        {driver.currentRate.note && (
          <p className="mt-3 text-xs text-slate-500 italic">{driver.currentRate.note}</p>
        )}
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-slate-400 mb-2">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Total versé</p>
          </div>
          <p className="text-xl font-bold text-emerald-700 tabular-nums">{formatMAD(driver.totalEarned)}</p>
          <p className="text-[11px] text-slate-400 mt-1">sur toute la période</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-slate-400 mb-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Versements</p>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{driver.paymentHistory.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">entrées enregistrées</p>
        </div>
      </div>

      {/* Rate history */}
      {driver.rateHistory.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <History className="h-3.5 w-3.5 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Historique des tarifs</h3>
          </div>
          <div className="divide-y divide-slate-50 px-5 py-1">
            {driver.rateHistory.map((rate) => (
              <div key={rate.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {rate.type === "monthly"
                      ? formatMAD(rate.monthlySalary ?? 0) + " / mois"
                      : `${formatMAD(rate.pricePerMission ?? 0)} / mission`}
                  </p>
                  {rate.note && <p className="text-[11px] text-slate-400 italic">{rate.note}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-500">{formatDate(rate.startDate ?? "")}</p>
                  <p className="text-[11px] text-slate-400">→ {rate.endDate ? formatDate(rate.endDate) : "Actuel"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Payment history */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Historique des versements</h3>
        </div>
        {driver.paymentHistory.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-400">Aucun versement enregistré</p>
        ) : (
          <div className="divide-y divide-slate-50 px-5 py-1">
            {driver.paymentHistory.map((entry) => {
              const cfg = entryTypeConfig[entry.type] ?? { label: entry.type, color: "bg-slate-100 text-slate-600 border-slate-200" }
              return (
                <div key={entry.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", cfg.color)}>
                      {cfg.label}
                    </span>
                    <div>
                      {entry.reference && <p className="font-mono text-xs text-slate-500">{entry.reference}</p>}
                      {entry.note && <p className="text-[11px] text-slate-400">{entry.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-slate-900">{formatMAD(entry.amount)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(entry.date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
