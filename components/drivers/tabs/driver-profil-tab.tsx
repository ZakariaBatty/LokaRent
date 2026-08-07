"use client"

import { Calendar, ExternalLink, FileCheck2, FileX2, IdCard, Mail, Phone, ShieldAlert } from "lucide-react"
import { type Driver, formatDate, daysUntil } from "@/lib/drivers-data"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-900">{value || "—"}</div>
      </div>
    </div>
  )
}

function DocBadge({ scanned }: { scanned: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
      scanned ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
    )}>
      {scanned ? <FileCheck2 className="h-3 w-3" /> : <FileX2 className="h-3 w-3" />}
      {scanned ? fr.drivers.documents.uploaded : fr.drivers.documents.notUploaded}
    </span>
  )
}

function ExpiryBadge({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-sm text-slate-400">{fr.drivers.documents.noExpiry}</span>
  const days = daysUntil(iso)
  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-sm font-semibold text-slate-900">{formatDate(iso)}</span>
      <span className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        days > 90 ? "bg-emerald-50 text-emerald-700" : days > 0 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700",
      )}>
        {days > 0 ? `${days}${fr.drivers.daysShort}` : fr.drivers.documents.expired}
      </span>
    </div>
  )
}

export function DriverProfilTab({ driver }: { driver: Driver }) {
  const cinDoc = driver.documents.find((document) => document.type === "national_id")
  const licenseDoc = driver.documents.find((document) => document.type === "driving_license")

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{fr.drivers.sections.identity}</h3>
        </div>
        <div className="divide-y divide-slate-50 px-5 py-2">
          <Row icon={IdCard} label={fr.drivers.fullName} value={`${driver.firstName} ${driver.lastName}`} />
          <Row icon={IdCard} label={fr.drivers.reference} value={driver.reference} />
          <Row icon={Phone} label={fr.drivers.phone} value={driver.phone ? <a href={`tel:${driver.phone}`} className="hover:text-blue-600 tabular-nums">{driver.phone}</a> : "—"} />
          <Row icon={Mail} label={fr.drivers.email} value={driver.email ? <a href={`mailto:${driver.email}`} className="hover:text-blue-600">{driver.email}</a> : "—"} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{fr.drivers.documentTypes.national_id}</h3>
          <DocBadge scanned={cinDoc?.scanned ?? false} />
        </div>
        <div className="grid grid-cols-2 gap-4 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fr.drivers.documentNumber}</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{driver.cinNumber || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fr.drivers.expiresAt}</p>
            <div className="mt-1"><ExpiryBadge iso={driver.cinExpiry} /></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{fr.drivers.documentTypes.driving_license}</h3>
          <DocBadge scanned={licenseDoc?.scanned ?? false} />
        </div>
        <div className="grid grid-cols-2 gap-4 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fr.drivers.documentNumber}</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{driver.licenseNumber || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fr.drivers.expiresAt}</p>
            <div className="mt-1"><ExpiryBadge iso={driver.licenseExpiry} /></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{fr.drivers.sections.documents}</h3>
        </div>
        {driver.documents.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-slate-400">{fr.drivers.documents.empty}</p>
        ) : (
          <div className="divide-y divide-slate-50 px-5 py-1">
            {driver.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{fr.drivers.documentTypes[doc.type]}</p>
                  {doc.expiry && <p className="text-[11px] text-slate-400">{fr.drivers.documents.expiresOn} {formatDate(doc.expiry)}</p>}
                </div>
                {doc.documentUrl ? (
                  <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                    <ExternalLink className="h-3 w-3" />
                    {fr.drivers.documents.open}
                  </a>
                ) : (
                  <DocBadge scanned={false} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fr.drivers.createdAt}</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{formatDate(driver.createdAt)}</span>
        </div>
      </section>
    </div>
  )
}
