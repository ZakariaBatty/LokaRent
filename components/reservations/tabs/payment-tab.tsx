"use client"

import { FormEvent, type ReactNode, useState, useTransition } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { Wallet, TrendingUp, CreditCard, ReceiptText, ShieldCheck, Check, RotateCcw, Ban, Plus } from "lucide-react"
import { type Reservation, type ReservationDepositSummary, paymentStatusConfig, formatMAD, formatDateTime } from "@/lib/reservations-data"
import {
  collectDepositAction,
  forfeitDepositAction,
  releaseDepositAction,
} from "@/modules/finances/actions/deposit.actions"
import { useI18n } from "@/contexts/i18n-context"
import { cn } from "@/lib/utils"

const depositMethods = ["cash", "cheque", "card", "other"] as const

function fallbackDepositSummary(reservation: Reservation): ReservationDepositSummary {
  return {
    agreedAmount: reservation.caution,
    collectedAmount: 0,
    releasedAmount: 0,
    heldAmount: 0,
    currency: "MAD",
    status: "not_collected",
    records: [],
  }
}

export function PaymentTab({
  reservation,
  onReservationUpdated,
}: {
  reservation: Reservation
  onReservationUpdated?: (reservation: Reservation) => void
}) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [collectOpen, setCollectOpen] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [forfeitOpen, setForfeitOpen] = useState(false)
  const [collectAmount, setCollectAmount] = useState("")
  const [collectMethod, setCollectMethod] = useState<(typeof depositMethods)[number]>("cash")
  const [releaseAmount, setReleaseAmount] = useState("")
  const [forfeitReason, setForfeitReason] = useState("")
  const r = reservation
  const cfg = paymentStatusConfig[r.paymentStatus]
  const paidPercent = r.total === 0 ? 0 : Math.min(100, Math.round((r.advance / r.total) * 100))
  const deposit = r.deposit ?? fallbackDepositSummary(r)
  const currentDeposit = deposit.records[0]
  const canCollectDeposit = deposit.agreedAmount > 0 && deposit.records.length === 0
  const canReleaseDeposit = Boolean(currentDeposit && ["held", "partially_released"].includes(currentDeposit.status) && currentDeposit.heldAmount > 0)
  const canForfeitDeposit = canReleaseDeposit

  const paymentEvents = r.timeline.filter((e) => e.type === "payment")

  const submitCollect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await collectDepositAction({
        reservationId: r.id,
        amount: collectAmount,
        method: collectMethod,
      })
      if (!result.success) {
        toast.error(t(result.messageKey))
        return
      }
      setCollectOpen(false)
      setCollectAmount("")
      onReservationUpdated?.(result.reservation)
      toast.success(t("deposits.actions.collected"))
    })
  }

  const submitRelease = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentDeposit) return
    startTransition(async () => {
      const result = await releaseDepositAction({
        depositId: currentDeposit.id,
        amount: releaseAmount,
      })
      if (!result.success) {
        toast.error(t(result.messageKey))
        return
      }
      setReleaseOpen(false)
      setReleaseAmount("")
      onReservationUpdated?.(result.reservation)
      toast.success(t("deposits.actions.released"))
    })
  }

  const submitForfeit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentDeposit) return
    startTransition(async () => {
      const result = await forfeitDepositAction({
        depositId: currentDeposit.id,
        reason: forfeitReason,
      })
      if (!result.success) {
        toast.error(t(result.messageKey))
        return
      }
      setForfeitOpen(false)
      setForfeitReason("")
      onReservationUpdated?.(result.reservation)
      toast.success(t("deposits.actions.forfeited"))
    })
  }

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
          label={t("deposits.details.agreed")}
          value={formatMAD(deposit.agreedAmount)}
          tone="slate"
          hint={t(`deposits.status.${deposit.status}`)}
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

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{t("deposits.details.title")}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCollectDeposit && (
              <button
                type="button"
                onClick={() => setCollectOpen((open) => !open)}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("deposits.actions.collect")}
              </button>
            )}
            {canReleaseDeposit && (
              <button
                type="button"
                onClick={() => setReleaseOpen((open) => !open)}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("deposits.actions.release")}
              </button>
            )}
            {canForfeitDeposit && (
              <button
                type="button"
                onClick={() => setForfeitOpen((open) => !open)}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" />
                {t("deposits.actions.forfeit")}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DepositStat label={t("deposits.details.collected")} value={formatMAD(deposit.collectedAmount)} />
          <DepositStat label={t("deposits.details.held")} value={formatMAD(deposit.heldAmount)} />
          <DepositStat label={t("deposits.details.released")} value={formatMAD(deposit.releasedAmount)} />
          <DepositStat label={t("deposits.details.currency")} value={deposit.currency} />
        </div>

        {collectOpen && (
          <form onSubmit={submitCollect} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
            <DepositField label={t("deposits.form.amount")}>
              <input
                value={collectAmount}
                onChange={(event) => setCollectAmount(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                max={deposit.agreedAmount}
                required
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </DepositField>
            <DepositField label={t("deposits.form.method")}>
              <select
                value={collectMethod}
                onChange={(event) => setCollectMethod(event.target.value as (typeof depositMethods)[number])}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {depositMethods.map((method) => (
                  <option key={method} value={method}>{t(`deposits.methods.${method}`)}</option>
                ))}
              </select>
            </DepositField>
            <div className="flex items-end justify-end gap-2">
              <button type="button" onClick={() => setCollectOpen(false)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
                {t("deposits.form.cancel")}
              </button>
              <button type="submit" disabled={isPending} className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-50">
                {t("deposits.form.collect")}
              </button>
            </div>
          </form>
        )}

        {releaseOpen && currentDeposit && (
          <form onSubmit={submitRelease} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_auto]">
            <DepositField label={t("deposits.form.releaseAmount")}>
              <input
                value={releaseAmount}
                onChange={(event) => setReleaseAmount(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                max={currentDeposit.heldAmount}
                placeholder={String(currentDeposit.heldAmount)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </DepositField>
            <div className="flex items-end justify-end gap-2">
              <button type="button" onClick={() => setReleaseOpen(false)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
                {t("deposits.form.cancel")}
              </button>
              <button type="submit" disabled={isPending} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white disabled:opacity-50">
                {t("deposits.form.release")}
              </button>
            </div>
          </form>
        )}

        {forfeitOpen && currentDeposit && (
          <form onSubmit={submitForfeit} className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <DepositField label={t("deposits.form.forfeitReason")}>
              <textarea
                value={forfeitReason}
                onChange={(event) => setForfeitReason(event.target.value)}
                required
                maxLength={1000}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
            </DepositField>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForfeitOpen(false)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
                {t("deposits.form.cancel")}
              </button>
              <button type="submit" disabled={isPending} className="h-9 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-white disabled:opacity-50">
                {t("deposits.form.forfeit")}
              </button>
            </div>
          </form>
        )}

        {deposit.records.length > 0 && (
          <ol className="mt-3 space-y-2">
            {deposit.records.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{formatMAD(item.amount)}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600 ring-1 ring-slate-200">
                    {t(`deposits.status.${item.status}`)}
                  </span>
                </div>
                <p className="mt-1">
                  {t("deposits.details.collectedAt")} {formatDateTime(item.collectedAt)}
                </p>
                {item.releasedAt && (
                  <p>{t("deposits.details.releasedAt")} {formatDateTime(item.releasedAt)}</p>
                )}
                {item.forfeitureReason && <p>{item.forfeitureReason}</p>}
              </li>
            ))}
          </ol>
        )}
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

function DepositStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function DepositField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-xs font-medium text-slate-600">
      <span>{label}</span>
      {children}
    </label>
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
