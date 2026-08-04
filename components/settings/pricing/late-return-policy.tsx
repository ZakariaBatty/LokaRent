"use client"

import { useMemo } from "react"
import { motion } from "motion/react"
import { AlertTriangle, Clock } from "lucide-react"
import { type LatePolicy, formatMAD } from "@/lib/pricing-grid-data"
import { Field, FieldGrid, FieldLabel } from "@/components/settings/settings-card"

export function LateReturnPolicy({
  policy,
  onChange,
}: {
  policy: LatePolicy
  onChange: (patch: Partial<LatePolicy>) => void
}) {
  const example = useMemo(() => {
    const lateMinutes = 90
    const billable = Math.max(0, lateMinutes - policy.toleranceMinutes)
    const hours = Math.ceil(billable / 60)
    return {
      lateMinutes,
      billable,
      hours,
      fee: hours * policy.feePerHour,
    }
  }, [policy])

  return (
    <div className="space-y-5">
      <FieldGrid>
        <Field>
          <FieldLabel
            label="Tolérance"
            hint="Aucun frais en dessous"
          />
          <div className="relative">
            <input
              type="number"
              min={0}
              value={policy.toleranceMinutes}
              onChange={(e) =>
                onChange({ toleranceMinutes: Math.max(0, Number(e.target.value)) })
              }
              className="field-input pr-16"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-semibold text-slate-400">
              minutes
            </span>
          </div>
        </Field>
        <Field>
          <FieldLabel
            label="Frais par heure supplémentaire"
            hint="Au-delà de la tolérance"
          />
          <div className="relative">
            <input
              type="number"
              min={0}
              value={policy.feePerHour}
              onChange={(e) =>
                onChange({ feePerHour: Math.max(0, Number(e.target.value)) })
              }
              className="field-input pr-12"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-semibold text-slate-400">
              DH
            </span>
          </div>
        </Field>
      </FieldGrid>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-3.5">
        <button
          type="button"
          onClick={() => onChange({ cappedAtDay: !policy.cappedAtDay })}
          className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
            policy.cappedAtDay ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            className={`inline-block h-4 w-4 rounded-full bg-white shadow ${
              policy.cappedAtDay ? "ml-4" : "ml-0.5"
            }`}
          />
        </button>
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Plafonner au prix d&apos;une journée supplémentaire
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Au-delà d&apos;une certaine heure de retard, facturer une journée complète plutôt
            que des heures supplémentaires.
          </p>
        </div>
      </label>

      <div className="overflow-hidden rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-rose-50/40">
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-900">
              Exemple de calcul de retard
            </div>
            <p className="mt-0.5 text-xs text-amber-800/80">
              Un client rend la voiture <span className="font-semibold">90 min</span> après
              l&apos;heure prévue. Tolérance : {policy.toleranceMinutes} min.
            </p>
          </div>
          <motion.div
            key={example.fee}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-amber-200/60"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              À facturer
            </div>
            <div className="text-lg font-bold tabular-nums text-rose-700">
              {formatMAD(example.fee)}
            </div>
          </motion.div>
        </div>
        <div className="grid grid-cols-3 gap-px border-t border-amber-200/60 bg-amber-200/40 text-xs">
          <div className="bg-white/70 px-4 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Retard
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-900">
              <Clock className="h-3 w-3" />
              {example.lateMinutes} min
            </div>
          </div>
          <div className="bg-white/70 px-4 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Facturable
            </div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {example.billable} min · {example.hours} h
            </div>
          </div>
          <div className="bg-white/70 px-4 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Tarif horaire
            </div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMAD(policy.feePerHour)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
