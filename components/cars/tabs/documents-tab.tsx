"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "motion/react"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image,
  Pencil,
  ShieldCheck,
  Stamp,
  Wrench,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { type Car, type DocumentStatus, formatDate, formatMAD } from "@/lib/cars-data"
import { uploadCarDocumentAction } from "@/modules/cars/actions/upload-car-file.action"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

const t = fr.fleet.documents

type DocumentType = "insurance" | "registration" | "vignette" | "inspection"
type DocumentDraft = Record<string, string | number | undefined>

function statusLabel(status: DocumentStatus, daysLeft: number) {
  if (status === "unknown") return t.unknown
  if (status === "expired") return `${t.expired} (${Math.abs(daysLeft)}j)`
  if (status === "warning") return `${t.expiresIn} ${daysLeft}j`
  return t.valid
}

function StatusBadge({ status, daysLeft }: { status: DocumentStatus; daysLeft: number }) {
  const Icon = status === "expired" ? XCircle : status === "warning" || status === "unknown" ? AlertTriangle : CheckCircle2
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
        status === "expired" && "border-rose-200 bg-rose-50 text-rose-700",
        status === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "unknown" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      <Icon className="h-3 w-3" />
      {statusLabel(status, daysLeft)}
    </div>
  )
}

function TimelineBar({ status, daysLeft }: { status: DocumentStatus; daysLeft: number }) {
  if (status === "unknown") {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{t.unknown}</span>
          <span className="font-medium text-slate-700">{t.noExpiryDate}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100" />
      </div>
    )
  }
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

function dateInput(value?: string | null) {
  return value ? value.slice(0, 10) : ""
}

function Input({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string
  value: string | number | undefined
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  )
}

function DocCard({
  icon: Icon,
  title,
  status,
  daysLeft,
  documentUrl,
  onEdit,
  editing,
  editForm,
  children,
}: {
  icon: React.ElementType
  title: string
  status: DocumentStatus
  daysLeft: number
  documentUrl?: string
  onEdit?: () => void
  editing?: boolean
  editForm?: React.ReactNode
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
            status === "unknown" && "bg-slate-100 text-slate-500",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <StatusBadge status={status} daysLeft={daysLeft} />
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t.edit}
            </button>
          )}
        </div>
      </div>
      {editing && editForm ? editForm : (
        <>
          <div className="mt-4 space-y-2 text-xs">{children}</div>
          <TimelineBar status={status} daysLeft={daysLeft} />
        </>
      )}
    </div>
  )
}

export function DocumentsTab({
  car,
  onEdit,
  onSaveDocument,
}: {
  car: Car
  onEdit?: () => void
  onSaveDocument?: (documentType: DocumentType, draft: DocumentDraft) => Promise<boolean>
}) {
  const [editing, setEditing] = useState<DocumentType | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draft, setDraft] = useState<DocumentDraft>({})
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

  function startEdit(documentType: DocumentType) {
    setEditing(documentType)
    if (documentType === "insurance") {
      setDraft({
        provider: car.insurance.company,
        policyNumber: car.insurance.policyNumber ?? "",
        startsAt: dateInput(car.insurance.startDate),
        expiresAt: dateInput(car.insurance.endDate),
        premiumAmount: car.insurance.premiumAmount,
        documentUrl: car.insurance.documentUrl ?? "",
      })
    } else if (documentType === "registration") {
      setDraft({
        registrationNumber: registration?.number ?? "",
        issuedAt: dateInput(registration?.issuedAt),
        expiresAt: dateInput(registration?.expiresAt),
        issuingAuthority: registration?.issuingAuthority ?? "",
        documentUrl: registration?.documentUrl ?? "",
      })
    } else if (documentType === "vignette") {
      setDraft({
        taxYear: car.vignette.year,
        paidAt: dateInput(car.vignette.paidAt),
        expiresAt: dateInput(car.vignette.endDate),
        amount: car.vignette.amount,
        documentUrl: car.vignette.documentUrl ?? "",
      })
    } else {
      setDraft({
        inspectedAt: dateInput(car.visiteTechnique.lastDate),
        expiresAt: dateInput(car.visiteTechnique.nextDate),
        result: car.visiteTechnique.result ?? "pass",
        center: car.visiteTechnique.center ?? "",
        cost: car.visiteTechnique.cost,
        documentUrl: car.visiteTechnique.documentUrl ?? "",
      })
    }
  }

  async function saveEdit(documentType: DocumentType) {
    if (!onSaveDocument) return
    setSaving(true)
    try {
      const ok = await onSaveDocument(documentType, draft)
      if (ok) setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function uploadDocument(event: React.ChangeEvent<HTMLInputElement>, documentType: DocumentType) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", `fleet/${documentType}`)
    setUploading(true)
    try {
      const result = await uploadCarDocumentAction(formData)
      if (!result.success) {
        toast.error(fr.fleet.upload.errors.generic)
        return
      }
      setDraft((current) => ({ ...current, documentUrl: result.upload.url }))
      toast.success(fr.fleet.upload.uploaded)
    } finally {
      setUploading(false)
    }
  }

  function editForm(documentType: DocumentType, fields: React.ReactNode) {
    return (
      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-2 gap-3">{fields}</div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2">
            {draft.documentUrl ? (
              <a href={String(draft.documentUrl)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-indigo-700">
                {fr.fleet.upload.openFile}
              </a>
            ) : (
              <span className="text-[11px] text-slate-500">{t.noDocument}</span>
            )}
            <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">
              {uploading ? fr.fleet.upload.uploading : draft.documentUrl ? fr.fleet.upload.replaceFile : fr.fleet.upload.chooseFile}
              <input className="hidden" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => uploadDocument(event, documentType)} />
            </label>
            {draft.documentUrl && (
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, documentUrl: "" }))}
                className="text-[11px] font-semibold text-rose-600"
              >
                {fr.fleet.upload.removeFile}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setEditing(null)} className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600">
              {t.cancel}
            </button>
            <button type="button" disabled={saving} onClick={() => saveEdit(documentType)} className="h-8 rounded-lg bg-indigo-600 px-3 text-[11px] font-semibold text-white disabled:opacity-60">
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>
    )
  }

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
          onEdit={onSaveDocument ? () => startEdit("insurance") : onEdit}
          editing={editing === "insurance"}
          editForm={editForm("insurance", (
            <>
              <Input label={t.company} value={draft.provider} onChange={(value) => setDraft((current) => ({ ...current, provider: value }))} />
              <Input label={t.policyNumber} value={draft.policyNumber} onChange={(value) => setDraft((current) => ({ ...current, policyNumber: value }))} />
              <Input label={t.startDate} type="date" value={draft.startsAt} onChange={(value) => setDraft((current) => ({ ...current, startsAt: value }))} />
              <Input label={t.expiryDate} type="date" value={draft.expiresAt} onChange={(value) => setDraft((current) => ({ ...current, expiresAt: value }))} />
              <Input label={t.amount} type="number" value={draft.premiumAmount} onChange={(value) => setDraft((current) => ({ ...current, premiumAmount: value === "" ? undefined : Number(value) }))} />
            </>
          ))}
        >
          <DataRow label={t.company} value={car.insurance.company} />
          <DataRow label={t.policyNumber} value={car.insurance.policyNumber} />
          <DataRow label={t.startDate} value={formatDate(car.insurance.startDate ?? "")} />
          <DataRow label={t.expiryDate} value={formatDate(car.insurance.endDate ?? "")} />
          <DataRow label={t.amount} value={car.insurance.premiumAmount ? formatMAD(car.insurance.premiumAmount) : "-"} />
        </DocCard>

        {registration ? (
          <DocCard
            icon={FileText}
            title={t.registration}
            status={registration.status}
            daysLeft={registration.daysLeft}
            documentUrl={registration.documentUrl}
            onEdit={onSaveDocument ? () => startEdit("registration") : onEdit}
            editing={editing === "registration"}
            editForm={editForm("registration", (
              <>
                <Input label={t.registration} value={draft.registrationNumber} onChange={(value) => setDraft((current) => ({ ...current, registrationNumber: value }))} />
                <Input label={t.issuedAt} type="date" value={draft.issuedAt} onChange={(value) => setDraft((current) => ({ ...current, issuedAt: value }))} />
                <Input label={t.expiryDate} type="date" value={draft.expiresAt} onChange={(value) => setDraft((current) => ({ ...current, expiresAt: value }))} />
                <Input label={t.authority} value={draft.issuingAuthority} onChange={(value) => setDraft((current) => ({ ...current, issuingAuthority: value }))} />
              </>
            ))}
          >
            <DataRow label={t.registration} value={registration.number} />
            <DataRow label={t.issuedAt} value={formatDate(registration.issuedAt)} />
            <DataRow label={t.expiryDate} value={formatDate(registration.expiresAt)} />
            <DataRow label={t.authority} value={registration.issuingAuthority} />
          </DocCard>
        ) : (
          <DocCard
            icon={FileText}
            title={t.registration}
            status="unknown"
            daysLeft={0}
            onEdit={onSaveDocument ? () => startEdit("registration") : onEdit}
            editing={editing === "registration"}
            editForm={editForm("registration", (
              <>
                <Input label={t.registration} value={draft.registrationNumber} onChange={(value) => setDraft((current) => ({ ...current, registrationNumber: value }))} />
                <Input label={t.issuedAt} type="date" value={draft.issuedAt} onChange={(value) => setDraft((current) => ({ ...current, issuedAt: value }))} />
                <Input label={t.expiryDate} type="date" value={draft.expiresAt} onChange={(value) => setDraft((current) => ({ ...current, expiresAt: value }))} />
                <Input label={t.authority} value={draft.issuingAuthority} onChange={(value) => setDraft((current) => ({ ...current, issuingAuthority: value }))} />
              </>
            ))}
          >
            <p className="text-xs text-slate-500">{t.noRecord}</p>
          </DocCard>
        )}

        <DocCard
          icon={Stamp}
          title={t.vignette}
          status={car.vignette.status}
          daysLeft={car.vignette.daysLeft}
          documentUrl={car.vignette.documentUrl}
          onEdit={onSaveDocument ? () => startEdit("vignette") : onEdit}
          editing={editing === "vignette"}
          editForm={editForm("vignette", (
            <>
              <Input label={t.taxYear} type="number" value={draft.taxYear} onChange={(value) => setDraft((current) => ({ ...current, taxYear: value === "" ? undefined : Number(value) }))} />
              <Input label={t.paidAt} type="date" value={draft.paidAt} onChange={(value) => setDraft((current) => ({ ...current, paidAt: value }))} />
              <Input label={t.expiryDate} type="date" value={draft.expiresAt} onChange={(value) => setDraft((current) => ({ ...current, expiresAt: value }))} />
              <Input label={t.amount} type="number" value={draft.amount} onChange={(value) => setDraft((current) => ({ ...current, amount: value === "" ? undefined : Number(value) }))} />
            </>
          ))}
        >
          <DataRow label={t.taxYear} value={car.vignette.year} />
          <DataRow label={t.paidAt} value={car.vignette.paidAt ? formatDate(car.vignette.paidAt) : "-"} />
          <DataRow label={t.expiryDate} value={formatDate(car.vignette.endDate ?? "")} />
          <DataRow label={t.amount} value={car.vignette.amount ? formatMAD(car.vignette.amount) : "-"} />
        </DocCard>

        <DocCard
          icon={Wrench}
          title={t.inspection}
          status={car.visiteTechnique.status}
          daysLeft={car.visiteTechnique.daysLeft}
          documentUrl={car.visiteTechnique.documentUrl}
          onEdit={onSaveDocument ? () => startEdit("inspection") : onEdit}
          editing={editing === "inspection"}
          editForm={editForm("inspection", (
            <>
              <Input label={t.inspectedAt} type="date" value={draft.inspectedAt} onChange={(value) => setDraft((current) => ({ ...current, inspectedAt: value }))} />
              <Input label={t.nextDate} type="date" value={draft.expiresAt} onChange={(value) => setDraft((current) => ({ ...current, expiresAt: value }))} />
              <label className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">{t.result}</span>
                <select
                  value={String(draft.result ?? "pass")}
                  onChange={(event) => setDraft((current) => ({ ...current, result: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="pass">{t.ok}</option>
                  <option value="conditional">{t.alert}</option>
                  <option value="fail">{t.expired}</option>
                </select>
              </label>
              <Input label={t.provider} value={draft.center} onChange={(value) => setDraft((current) => ({ ...current, center: value }))} />
              <Input label={t.amount} type="number" value={draft.cost} onChange={(value) => setDraft((current) => ({ ...current, cost: value === "" ? undefined : Number(value) }))} />
            </>
          ))}
        >
          <DataRow label={t.inspectedAt} value={formatDate(car.visiteTechnique.lastDate ?? "")} />
          <DataRow label={t.nextDate} value={formatDate(car.visiteTechnique.nextDate ?? "")} />
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

function EmptyDocCard({ icon: Icon, title, onEdit }: { icon: React.ElementType; title: string; onEdit?: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">{t.noRecord}</p>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t.edit}
          </button>
        )}
      </div>
    </div>
  )
}
