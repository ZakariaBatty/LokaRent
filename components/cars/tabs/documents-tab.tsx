"use client"

import { motion } from "motion/react"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image,
  ShieldCheck,
  Stamp,
  Wrench,
  XCircle,
} from "lucide-react"
import { type Car, type DocumentStatus, formatDate, formatMAD } from "@/lib/cars-data"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

const t = fr.fleet.documents

function statusLabel(status: DocumentStatus, daysLeft: number) {
  if (status === "expired") return `${t.expired} (${Math.abs(daysLeft)}j)`
  if (status === "warning") return `${t.expiresIn} ${daysLeft}j`
  return t.valid
}

function StatusBadge({ status, daysLeft }: { status: DocumentStatus; daysLeft: number }) {
  const Icon = status === "expired" ? XCircle : status === "warning" ? AlertTriangle : CheckCircle2
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        status === "expired" && "border-rose-200 bg-rose-50 text-rose-700",
        status === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <Icon className="h-3 w-3" />
      {statusLabel(status, daysLeft)}
    </div>
  )
}

function TimelineBar({ status, daysLeft }: { status: DocumentStatus; daysLeft: number }) {
  const total = 365
  const remaining = Math.max(0, Math.min(daysLeft, total))
  const pct = (remaining / total) * 100

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>0j</span>
        <span className="font-medium text-slate-700">
          {daysLeft > 0 ? `${daysLeft} ${t.daysRemaining}` : t.expired}
        </span>
        <span>365j</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            status === "expired" && "bg-rose-500",
            status === "warning" && "bg-amber-500",
            status === "ok" && "bg-emerald-500",
          )}
        />
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-900">{value || "-"}</span>
    </div>
  )
}

function DocCard({
  icon: Icon,
  title,
  status,
  daysLeft,
  documentUrl,
  children,
}: {
  icon: React.ElementType
  title: string
  status: DocumentStatus
  daysLeft: number
  documentUrl?: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              status === "expired" && "bg-rose-100 text-rose-600",
              status === "warning" && "bg-amber-100 text-amber-600",
              status === "ok" && "bg-emerald-100 text-emerald-600",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <StatusBadge status={status} daysLeft={daysLeft} />
          </div>
        </div>
        {documentUrl ? (
          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {fr.fleet.upload.openFile}
          </a>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {t.noDocument}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-2 text-xs">{children}</div>
      <TimelineBar status={status} daysLeft={daysLeft} />
    </div>
  )
}

export function DocumentsTab({ car }: { car: Car }) {
  const registration = car.registration
  const docs = [
    car.insurance.status,
    car.vignette.status,
    car.visiteTechnique.status,
    registration?.status ?? ("warning" as const),
  ]
  const okCount = docs.filter((status) => status === "ok").length
  const warnCount = docs.filter((status) => status === "warning").length
  const expiredCount = docs.filter((status) => status === "expired").length

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 text-white",
          expiredCount > 0
            ? "from-rose-500 to-red-500"
            : warnCount > 0
              ? "from-amber-500 to-orange-500"
              : "from-emerald-500 to-teal-500",
        )}
      >
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{t.summaryTitle}</p>
            <p className="mt-1 font-serif text-2xl">
              {expiredCount > 0 ? t.actionRequired : warnCount > 0 ? t.watch : t.allClear}
            </p>
          </div>
          <div className="flex gap-2">
            <SummaryPill label={t.ok} value={okCount} />
            <SummaryPill label={t.alert} value={warnCount} />
            <SummaryPill label={t.expired} value={expiredCount} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Image className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">{t.photos}</h4>
        </div>
        {car.photos && car.photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {car.photos.map((photo, index) => (
              <a
                key={`${photo.url}-${index}`}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
              >
                <img src={photo.url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {t.primaryPhoto}
                  </span>
                )}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">{t.noRecord}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <DocCard
          icon={ShieldCheck}
          title={t.insurance}
          status={car.insurance.status}
          daysLeft={car.insurance.daysLeft}
          documentUrl={car.insurance.documentUrl}
        >
          <DataRow label={t.company} value={car.insurance.company} />
          <DataRow label={t.policyNumber} value={car.insurance.policyNumber} />
          <DataRow label={t.startDate} value={formatDate(car.insurance.startDate)} />
          <DataRow label={t.expiryDate} value={formatDate(car.insurance.endDate)} />
          <DataRow label={t.amount} value={car.insurance.premiumAmount ? formatMAD(car.insurance.premiumAmount) : "-"} />
        </DocCard>

        {registration ? (
          <DocCard
            icon={FileText}
            title={t.registration}
            status={registration.status}
            daysLeft={registration.daysLeft}
            documentUrl={registration.documentUrl}
          >
            <DataRow label={t.registration} value={registration.number} />
            <DataRow label={t.issuedAt} value={formatDate(registration.issuedAt)} />
            <DataRow label={t.expiryDate} value={formatDate(registration.expiresAt)} />
            <DataRow label={t.authority} value={registration.issuingAuthority} />
          </DocCard>
        ) : (
          <EmptyDocCard icon={FileText} title={t.registration} />
        )}

        <DocCard
          icon={Stamp}
          title={t.vignette}
          status={car.vignette.status}
          daysLeft={car.vignette.daysLeft}
          documentUrl={car.vignette.documentUrl}
        >
          <DataRow label={t.taxYear} value={car.vignette.year} />
          <DataRow label={t.paidAt} value={car.vignette.paidAt ? formatDate(car.vignette.paidAt) : "-"} />
          <DataRow label={t.expiryDate} value={formatDate(car.vignette.endDate)} />
          <DataRow label={t.amount} value={car.vignette.amount ? formatMAD(car.vignette.amount) : "-"} />
        </DocCard>

        <DocCard
          icon={Wrench}
          title={t.inspection}
          status={car.visiteTechnique.status}
          daysLeft={car.visiteTechnique.daysLeft}
          documentUrl={car.visiteTechnique.documentUrl}
        >
          <DataRow label={t.inspectedAt} value={formatDate(car.visiteTechnique.lastDate)} />
          <DataRow label={t.nextDate} value={formatDate(car.visiteTechnique.nextDate)} />
          <DataRow label={t.result} value={car.visiteTechnique.result} />
          <DataRow label={t.provider} value={car.visiteTechnique.center} />
          <DataRow label={t.amount} value={car.visiteTechnique.cost ? formatMAD(car.visiteTechnique.cost) : "-"} />
        </DocCard>
      </div>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
    </div>
  )
}

function EmptyDocCard({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">{t.noRecord}</p>
        </div>
      </div>
    </div>
  )
}
