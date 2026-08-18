"use client"

import { motion } from "motion/react"
import { CalendarRange, Car, Crown, Wallet, TrendingUp, Repeat } from "lucide-react"
import { type Client, formatMAD } from "@/lib/clients-data"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

const MONTHS_LABEL = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin"]

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "indigo",
}: {
  icon: React.ElementType
  label: string
  value: string
  hint?: string
  accent?: "indigo" | "emerald" | "amber" | "rose"
}) {
  const accents = {
    indigo: "from-indigo-50 to-blue-50 text-indigo-600 ring-indigo-100",
    emerald: "from-emerald-50 to-teal-50 text-emerald-600 ring-emerald-100",
    amber: "from-amber-50 to-orange-50 text-amber-600 ring-amber-100",
    rose: "from-rose-50 to-pink-50 text-rose-600 ring-rose-100",
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
          accents[accent],
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

export function StatistiquesTab({ client }: { client: Client }) {
  const max = Math.max(...client.monthly, 1)
  const trend =
    client.monthly[client.monthly.length - 1] - client.monthly[client.monthly.length - 2]
  const trendUp = trend >= 0
  const finance = client.finance

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CalendarRange}
          label={fr.clients.finance.totalRentals}
          value={`${client.totalRentals}`}
          hint={fr.clients.finance.sinceRegistration}
          accent="indigo"
        />
        <StatCard
          icon={Wallet}
          label={fr.clients.finance.invoicedAmount}
          value={formatMAD(finance?.invoiced ?? 0)}
          hint={fr.clients.finance.invoiced}
          accent="emerald"
        />
        <StatCard
          icon={Repeat}
          label={fr.clients.finance.paidAmount}
          value={formatMAD(finance?.paid ?? client.totalSpent)}
          hint={fr.clients.finance.paid}
          accent="amber"
        />
        <StatCard
          icon={Car}
          label={fr.clients.finance.outstanding}
          value={formatMAD(finance?.outstanding ?? 0)}
          hint={fr.clients.finance.depositsHeld}
          accent="rose"
        />
      </div>

      {/* Chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{fr.clients.finance.lastSixMonthsActivity}</h3>
            <p className="text-xs text-slate-500">{fr.clients.finance.revenueEvolution}</p>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trendUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
            )}
          >
            <TrendingUp className={cn("h-3 w-3", !trendUp && "rotate-180")} />
            {trendUp ? "+" : ""}
            {formatMAD(trend)}
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          {client.monthly.map((value, i) => {
            const height = (value / max) * 100
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-32 w-full items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "w-full rounded-lg bg-gradient-to-t",
                      i === client.monthly.length - 1
                        ? "from-indigo-500 to-blue-400"
                        : "from-slate-200 to-slate-100",
                    )}
                  />
                  {value > 0 && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600"
                      style={{ bottom: `${height}%`, marginBottom: 4 }}
                    >
                      {(value / 1000).toFixed(0)}k
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {MONTHS_LABEL[i]}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Frequency */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/50 to-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Crown className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {fr.clients.finance.rentalFrequency}
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {(client.totalRentals / 12).toFixed(1)}
            <span className="ml-1 text-sm font-medium text-slate-500">{fr.clients.finance.perMonth}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{fr.clients.finance.monthlyAverage}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {fr.clients.finance.depositsHeld}
            </p>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {formatMAD(finance?.depositsHeld ?? 0)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{fr.clients.finance.outstanding}</p>
        </div>
      </section>
    </div>
  )
}
