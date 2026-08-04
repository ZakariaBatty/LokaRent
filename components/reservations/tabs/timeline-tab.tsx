"use client"

import { motion } from "motion/react"
import { Sparkles, ArrowRightLeft, CreditCard, KeyRound, RotateCcw, MessageSquare } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { type Reservation, type TimelineEvent, formatDateTime } from "@/lib/reservations-data"
import { cn } from "@/lib/utils"

const iconMap: Record<TimelineEvent["type"], { icon: LucideIcon; bg: string; color: string; ring: string }> = {
  created: { icon: Sparkles, bg: "bg-blue-50", color: "text-blue-600", ring: "ring-blue-100" },
  status: { icon: ArrowRightLeft, bg: "bg-indigo-50", color: "text-indigo-600", ring: "ring-indigo-100" },
  payment: { icon: CreditCard, bg: "bg-emerald-50", color: "text-emerald-600", ring: "ring-emerald-100" },
  pickup: { icon: KeyRound, bg: "bg-amber-50", color: "text-amber-600", ring: "ring-amber-100" },
  return: { icon: RotateCcw, bg: "bg-slate-100", color: "text-slate-600", ring: "ring-slate-200" },
  note: { icon: MessageSquare, bg: "bg-slate-100", color: "text-slate-600", ring: "ring-slate-200" },
}

export function TimelineTab({ reservation }: { reservation: Reservation }) {
  const events = [...reservation.timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Historique d&apos;activité</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            {events.length} événement{events.length > 1 ? "s" : ""} · journal d&apos;audit
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 ring-1 ring-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Système actif
        </span>
      </div>

      <ol className="relative ml-3 space-y-5 border-l border-dashed border-slate-200 pl-6">
        {events.map((evt, idx) => {
          const cfg = iconMap[evt.type]
          const Icon = cfg.icon
          return (
            <motion.li
              key={evt.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="relative"
            >
              <span
                className={cn(
                  "absolute -left-[34px] top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4",
                  cfg.bg,
                  cfg.ring,
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
              </span>

              <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{evt.label}</p>
                    {evt.description && <p className="mt-0.5 text-xs text-slate-600">{evt.description}</p>}
                  </div>
                  <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
                    {formatDateTime(evt.timestamp)}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  par {evt.author}
                </p>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </motion.div>
  )
}
