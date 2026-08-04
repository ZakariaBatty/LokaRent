"use client"

import { motion } from "motion/react"
import { Wallet, TrendingUp, CreditCard, ReceiptText, ShieldCheck, Check } from "lucide-react"
import { type Reservation, paymentStatusConfig, formatMAD, formatDateTime } from "@/lib/reservations-data"
import { cn } from "@/lib/utils"

export function PaymentTab({ reservation }: { reservation: Reservation }) {
  const r = reservation
  const cfg = paymentStatusConfig[r.paymentStatus]
  const paidPercent = r.total === 0 ? 0 : Math.min(100, Math.round((r.advance / r.total) * 100))

  const paymentEvents = r.timeline.filter((e) => e.type === "payment")

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Hero finance */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.15)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-blue-200/80">Montant total</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{formatMAD(r.total)}</p>
              <p className="mt-1 text-xs text-blue-200/80">
                {r.days} jours × {formatMAD(r.pricePerDay)} / jour
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur",
                "ring-1 ring-white/20",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {cfg.label}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-blue-200/80">
              <span>Avancé</span>
              <span className="font-semibold text-white">{paidPercent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${paidPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-blue-200/80">Payé · {formatMAD(r.advance)}</span>
              <span className="text-blue-100">Restant · {formatMAD(r.remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FinanceCard
          icon={Wallet}
          label="Caution"
          value={formatMAD(r.caution)}
          tone="slate"
          hint="Bloquée"
        />
        <FinanceCard
          icon={TrendingUp}
          label="Acompte"
          value={formatMAD(r.advance)}
          tone="emerald"
          hint="Encaissé"
        />
        <FinanceCard
          icon={ReceiptText}
          label="Restant"
          value={formatMAD(r.remaining)}
          tone={r.remaining > 0 ? "amber" : "emerald"}
          hint={r.remaining > 0 ? "À encaisser" : "Soldé"}
        />
        <FinanceCard
          icon={CreditCard}
          label="Méthode"
          value={r.paymentMethod}
          tone="blue"
          hint="Choisie"
        />
      </div>

      {/* Payment history */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Historique des paiements</h4>
        </div>

        {paymentEvents.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
            Aucun paiement enregistré pour le moment.
          </div>
        ) : (
          <ol className="space-y-2.5">
            {paymentEvents.map((evt) => (
              <li
                key={evt.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Check className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{evt.label}</p>
                  <p className="text-xs text-slate-500">{evt.description}</p>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {formatDateTime(evt.timestamp)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </motion.div>
  )
}

function FinanceCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Wallet
  label: string
  value: string
  hint: string
  tone: "slate" | "emerald" | "amber" | "blue"
}) {
  const tones: Record<typeof tone, { bg: string; ring: string; text: string }> = {
    slate: { bg: "bg-slate-50", ring: "ring-slate-200", text: "text-slate-600" },
    emerald: { bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700" },
    blue: { bg: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700" },
  }
  const t = tones[tone]
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl ring-1", t.bg, t.ring, t.text)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", t.text)}>{hint}</span>
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-base font-semibold text-slate-900">{value}</p>
    </div>
  )
}
