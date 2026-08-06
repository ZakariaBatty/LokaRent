"use client"

import { motion } from "motion/react"
import {
  ShieldCheck,
  Stamp,
  Wrench,
  FileText,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarDays,
} from "lucide-react"
import { type Car, type DocumentStatus, formatDate, formatMAD } from "@/lib/cars-data"
import { cn } from "@/lib/utils"

function StatusBadge({ status, daysLeft }: { status: DocumentStatus; daysLeft: number }) {
  if (status === "expired") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
        <XCircle className="h-3 w-3" />
        Expiré ({Math.abs(daysLeft)}j)
      </div>
    )
  }
  if (status === "warning") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Expire dans {daysLeft}j
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Valide
    </div>
  )
}

function TimelineBar({ status, daysLeft }: { status: DocumentStatus; daysLeft: number }) {
  const total = 365
  const remaining = Math.max(0, Math.min(daysLeft, total))
  const pct = (remaining / total) * 100

  const color =
    status === "expired"
      ? "bg-rose-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>0j</span>
        <span className="font-medium text-slate-700">{daysLeft > 0 ? `${daysLeft}j restants` : "Expiré"}</span>
        <span>365j</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  )
}

function DocCard({
  icon: Icon,
  title,
  status,
  daysLeft,
  children,
  showTimeline = true,
}: {
  icon: React.ElementType
  title: string
  status: DocumentStatus
  daysLeft: number
  children: React.ReactNode
  showTimeline?: boolean
}) {
  const iconBg =
    status === "expired"
      ? "bg-rose-100 text-rose-600"
      : status === "warning"
        ? "bg-amber-100 text-amber-600"
        : "bg-emerald-100 text-emerald-600"

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <StatusBadge status={status} daysLeft={daysLeft} />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-xs">{children}</div>
      {showTimeline && <TimelineBar status={status} daysLeft={daysLeft} />}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-900">{value}</span>
    </div>
  )
}

export function DocumentsTab({ car }: { car: Car }) {
  const uploaded = car.carteGriseUploaded

  const docs = [
    { status: car.insurance.status, label: "Assurance" },
    { status: car.vignette.status, label: "Vignette" },
    { status: car.visiteTechnique.status, label: "Visite tech." },
    { status: uploaded ? ("ok" as const) : ("warning" as const), label: "Carte grise" },
  ]
  const okCount = docs.filter((d) => d.status === "ok").length
  const warnCount = docs.filter((d) => d.status === "warning").length
  const expiredCount = docs.filter((d) => d.status === "expired").length

  const healthColor =
    expiredCount > 0
      ? "from-rose-500 to-red-500"
      : warnCount > 0
        ? "from-amber-500 to-orange-500"
        : "from-emerald-500 to-teal-500"

  return (
    <div className="space-y-5">
      {/* Health summary */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 text-white",
          healthColor,
        )}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
              Conformité documentaire
            </p>
            <p className="mt-1 font-serif text-2xl">
              {expiredCount > 0 ? "Action requise" : warnCount > 0 ? "Surveillance" : "Tout est en règle"}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <p className="text-lg font-bold tabular-nums">{okCount}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">OK</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <p className="text-lg font-bold tabular-nums">{warnCount}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">Alerte</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <p className="text-lg font-bold tabular-nums">{expiredCount}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">Expiré</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <DocCard
          icon={ShieldCheck}
          title="Assurance"
          status={car.insurance.status}
          daysLeft={car.insurance.daysLeft}
        >
          <DataRow label="Compagnie" value={car.insurance.company} />
          <DataRow label="Début" value={formatDate(car.insurance.startDate)} />
          <DataRow label="Échéance" value={formatDate(car.insurance.endDate)} />
        </DocCard>

        <DocCard
          icon={Stamp}
          title="Vignette"
          status={car.vignette.status}
          daysLeft={car.vignette.daysLeft}
        >
          <DataRow label="Année" value={String(car.vignette.year)} />
          <DataRow label="Échéance" value={formatDate(car.vignette.endDate)} />
        </DocCard>

        <DocCard
          icon={Wrench}
          title="Visite technique"
          status={car.visiteTechnique.status}
          daysLeft={car.visiteTechnique.daysLeft}
        >
          <DataRow label="Dernière visite" value={formatDate(car.visiteTechnique.lastDate)} />
          <DataRow label="Prochaine" value={formatDate(car.visiteTechnique.nextDate)} />
        </DocCard>

        {/* Carte grise upload */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  uploaded ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500",
                )}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Carte grise</h4>
                {uploaded ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Document téléversé
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    Non téléversé
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Credit auto */}
        {car.creditAuto && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Crédit auto</h4>
                  <p className="text-[11px] text-slate-500">Suivi de financement bancaire</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                <CalendarDays className="h-3 w-3" />
                Fin: {formatDate(car.creditAuto.endDate)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Banque</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{car.creditAuto.bank}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Mensualité
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {formatMAD(car.creditAuto.monthlyPayment)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Fin prévue</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formatDate(car.creditAuto.endDate)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
