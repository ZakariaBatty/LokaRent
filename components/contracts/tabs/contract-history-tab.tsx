"use client"

import { motion } from "motion/react"
import { CheckCircle2, FileSignature, FileText, Send, Clock, AlertTriangle, Edit } from "lucide-react"
import type { Contract, HistoryEvent } from "@/lib/contracts-data"

const iconMap: Record<HistoryEvent["type"], { icon: typeof CheckCircle2; tone: string }> = {
  created: { icon: FileText, tone: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
  signed_client: { icon: FileSignature, tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  signed_agency: { icon: FileSignature, tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  sent: { icon: Send, tone: "bg-blue-50 text-blue-600 ring-blue-100" },
  completed: { icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  expired: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600 ring-amber-100" },
  edited: { icon: Edit, tone: "bg-slate-100 text-slate-600 ring-slate-200" },
}

function relativeTime(iso: string) {
  const now = new Date()
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const diffH = Math.floor(diffMs / 3_600_000)
  if (diffH < 1) return "à l'instant"
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `il y a ${diffD}j`
  return then.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

export function ContractHistoryTab({ contract }: { contract: Contract }) {
  const events = [...contract.history].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 ring-1 ring-slate-200">
          <Clock className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">Historique d&apos;activité</h3>
      </div>

      <ol className="relative space-y-5 border-l border-dashed border-slate-200 pl-6">
        {events.map((e, i) => {
          const cfg = iconMap[e.type]
          const Icon = cfg.icon
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="relative"
            >
              <span
                className={`absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full ring-1 ring-white ${cfg.tone}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{e.label}</div>
                  {e.actor && (
                    <div className="mt-0.5 text-[12px] text-slate-500">par {e.actor}</div>
                  )}
                </div>
                <div className="shrink-0 text-[11px] font-medium text-slate-400">
                  {relativeTime(e.at)}
                </div>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </motion.div>
  )
}
