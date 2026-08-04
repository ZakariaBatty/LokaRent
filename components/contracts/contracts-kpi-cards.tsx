"use client"

import { motion } from "motion/react"
import { Activity, CheckCircle2, Coins, ShieldAlert, XCircle } from "lucide-react"
import { CountUp } from "@/components/app/count-up"
import { cn } from "@/lib/utils"
import { formatMAD } from "@/lib/contracts-data"

export function ContractsKpiCards({
  active,
  completed,
  cancelled,
  revenue,
  pendingCautions,
}: {
  active: number
  completed: number
  cancelled: number
  revenue: number
  pendingCautions: number
}) {
  const cards = [
    {
      label: "Contrats actifs",
      value: active,
      icon: Activity,
      iconWrap: "bg-blue-50 text-blue-600 ring-blue-100",
      bg: "from-blue-50/60 to-white",
      suffix: null as string | null,
    },
    {
      label: "Contrats terminés",
      value: completed,
      icon: CheckCircle2,
      iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      bg: "from-emerald-50/60 to-white",
      suffix: null,
    },
    {
      label: "Revenus générés",
      value: revenue,
      icon: Coins,
      iconWrap: "bg-indigo-50 text-indigo-600 ring-indigo-100",
      bg: "from-indigo-50/60 to-white",
      suffix: "DH",
    },
    {
      label: "Cautions en attente",
      value: pendingCautions,
      icon: ShieldAlert,
      iconWrap: "bg-amber-50 text-amber-600 ring-amber-100",
      bg: "from-amber-50/60 to-white",
      suffix: null,
    },
    {
      label: "Contrats annulés",
      value: cancelled,
      icon: XCircle,
      iconWrap: "bg-rose-50 text-rose-600 ring-rose-100",
      bg: "from-rose-50/60 to-white",
      suffix: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => {
        const Icon = c.icon
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
            whileHover={{ y: -2 }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md",
              c.bg,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {c.label}
              </p>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset",
                  c.iconWrap,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums text-slate-900">
                <CountUp
                  value={c.value}
                  format={(n) =>
                    c.suffix === "DH"
                      ? Math.round(n).toLocaleString("fr-FR")
                      : Math.round(n).toString()
                  }
                />
              </span>
              {c.suffix && (
                <span className="text-sm font-semibold text-slate-500">{c.suffix}</span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export { formatMAD }
