"use client"

import { motion } from "motion/react"
import { Calculator, CreditCard, Percent, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMAD } from "@/lib/cars-data"
import { useWizard, type PaymentMethod } from "./wizard-context"
import { StepHeader } from "./step-header"
import { AnimatedNumber } from "./animated-number"

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Chèque", "Carte", "Virement"]

export function StepPricing() {
  const { state, setState, totals, cars } = useWizard()
  const car = cars.find((c) => c.id === state.selectedCarId)
  const basePrice = car?.priceDay ?? 0
  const effectivePrice = state.pricePerDayOverride ?? basePrice
  const isCustomPrice =
    state.pricePerDayOverride !== null && state.pricePerDayOverride !== basePrice

  return (
    <div>
      <StepHeader
        icon={Calculator}
        eyebrow="Étape 3 sur 5"
        title="Tarification & paiement"
        description="Le moteur calcule en temps réel. Ajustez le tarif, appliquez une remise, et enregistrez les paiements."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {/* Pricing breakdown card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Calculator className="h-4 w-4 text-blue-600" />
              Détails du tarif
            </div>

            {car && (
              <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {car.brand} {car.model}
                  </div>
                  <div className="text-xs text-slate-500">
                    {car.plate} · {totals.days} jour{totals.days > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tarif officiel
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {formatMAD(basePrice)}/j
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Prix par jour (DH)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={effectivePrice}
                    onChange={(e) =>
                      setState({ pricePerDayOverride: Number(e.target.value) || 0 })
                    }
                    className="field-input pr-20 font-mono text-base font-semibold"
                  />
                  {isCustomPrice && (
                    <button
                      type="button"
                      onClick={() => setState({ pricePerDayOverride: null })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-100"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <Row label="Sous-total" value={totals.subtotal} bold />

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5 text-slate-400" />
                    Remise
                  </span>
                  <span className="font-mono text-rose-600">
                    {state.discountPct}%
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={state.discountPct}
                  onChange={(e) =>
                    setState({ discountPct: Number(e.target.value) })
                  }
                  className="w-full accent-rose-500"
                />
                {state.discountPct > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-2 overflow-hidden"
                  >
                    <input
                      placeholder="Motif de la remise (obligatoire)..."
                      value={state.discountReason}
                      onChange={(e) =>
                        setState({ discountReason: e.target.value })
                      }
                      className="field-input text-xs"
                    />
                  </motion.div>
                )}
              </div>

              {state.discountPct > 0 && (
                <Row
                  label={`Remise (${state.discountPct}%)`}
                  value={-totals.discountAmount}
                  tone="rose"
                />
              )}
            </div>
          </div>

          {/* Caution + Avance */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PaymentCard
              icon={Wallet}
              label="Caution"
              accent="amber"
              amount={state.cautionAmount}
              onAmountChange={(v) => setState({ cautionAmount: v })}
              method={state.cautionMethod}
              onMethodChange={(v) => setState({ cautionMethod: v })}
            />
            <PaymentCard
              icon={CreditCard}
              label="Avance versée"
              accent="blue"
              amount={state.avanceAmount}
              onAmountChange={(v) => setState({ avanceAmount: v })}
              method={state.avanceMethod}
              onMethodChange={(v) => setState({ avanceMethod: v })}
            />
          </div>
        </div>

        {/* Total KPI sticky card */}
        <div className="lg:col-span-2">
          <div className="sticky top-4 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-[0_20px_60px_rgba(59,130,246,0.25)]">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">
                Total à facturer
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif text-4xl font-bold tabular-nums">
                  <AnimatedNumber value={totals.afterDiscount} />
                </span>
                <span className="text-sm font-semibold text-blue-100">DH</span>
              </div>
              <div className="mt-1 text-xs text-blue-100">
                Hors options · {totals.days} j × {formatMAD(totals.pricePerDay)}
              </div>

              <div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
                <SummaryRow label="Sous-total" value={formatMAD(totals.subtotal)} />
                {state.discountPct > 0 && (
                  <SummaryRow
                    label={`Remise ${state.discountPct}%`}
                    value={`− ${formatMAD(totals.discountAmount)}`}
                  />
                )}
                <SummaryRow
                  label="Caution"
                  value={formatMAD(state.cautionAmount)}
                  muted
                />
                <SummaryRow
                  label="Avance"
                  value={formatMAD(state.avanceAmount)}
                  muted
                />
                <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-3 text-sm font-bold">
                  <span>Reste à payer</span>
                  <span className="tabular-nums">
                    {formatMAD(Math.max(0, totals.afterDiscount - state.avanceAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string
  value: number
  bold?: boolean
  tone?: "rose"
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          bold && "font-bold text-slate-900",
          tone === "rose" && "text-rose-600",
          !bold && !tone && "text-slate-800",
        )}
      >
        <AnimatedNumber value={value} suffix=" DH" />
      </span>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(muted ? "text-blue-100/80" : "text-blue-100")}>
        {label}
      </span>
      <span className={cn("tabular-nums", muted ? "text-blue-100/80" : "text-white font-semibold")}>
        {value}
      </span>
    </div>
  )
}

function PaymentCard({
  icon: Icon,
  label,
  accent,
  amount,
  onAmountChange,
  method,
  onMethodChange,
}: {
  icon: typeof Wallet
  label: string
  accent: "amber" | "blue"
  amount: number
  onAmountChange: (v: number) => void
  method: PaymentMethod
  onMethodChange: (v: PaymentMethod) => void
}) {
  const accentMap = {
    amber: "text-amber-600",
    blue: "text-blue-600",
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={cn("mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider", accentMap[accent])}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <input
        type="number"
        value={amount}
        onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
        className="field-input mb-3 font-mono text-base font-semibold"
        placeholder="0"
      />
      <div className="grid grid-cols-2 gap-1.5">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMethodChange(m)}
            className={cn(
              "rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
              method === m
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
