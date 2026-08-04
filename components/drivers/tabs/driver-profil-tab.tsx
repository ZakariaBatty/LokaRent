"use client"

import {
  Phone, Mail, MapPin, IdCard, FileCheck2, FileX2, Calendar, ShieldAlert,
} from "lucide-react"
import {
  type Driver, formatDate, daysUntil,
} from "@/lib/drivers-data"
import { cn } from "@/lib/utils"

function Row({ icon: Icon, label, value, iconClass }: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  iconClass?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500", iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-900">{value}</div>
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
      {scanned ? "Scan dispo" : "Scan manquant"}
    </span>
  )
}

function ExpiryBadge({ iso }: { iso: string }) {
  const days = daysUntil(iso)
  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-sm font-semibold text-slate-900">{formatDate(iso)}</span>
      <span className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        days > 90 ? "bg-emerald-50 text-emerald-700" : days > 0 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700",
      )}>
        {days > 0 ? `${days}j` : "Expiré"}
      </span>
    </div>
  )
}

export function DriverProfilTab({ driver }: { driver: Driver }) {
  const cinDoc = driver.documents.find((d) => d.type === "cin")
  const licenseDoc = driver.documents.find((d) => d.type === "license")
  const contractDoc = driver.documents.find((d) => d.type === "contract")

  return (
    <div className="space-y-5">
      {/* Identity & contact */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Identité & contact</h3>
        </div>
        <div className="divide-y divide-slate-50 px-5 py-2">
          <Row icon={IdCard} label="Nom complet" value={`${driver.firstName} ${driver.lastName}`} />
          <Row
            icon={Phone}
            label="Téléphone"
            value={<a href={`tel:${driver.phone}`} className="hover:text-blue-600 tabular-nums">{driver.phone}</a>}
          />
          <Row
            icon={Mail}
            label="Email"
            value={<a href={`mailto:${driver.email}`} className="hover:text-blue-600">{driver.email}</a>}
          />
          <Row icon={MapPin} label="Adresse" value={`${driver.address}, ${driver.city}`} />
        </div>
      </section>

      {/* CIN */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Carte Nationale (CIN)</h3>
          <DocBadge scanned={cinDoc?.scanned ?? false} />
        </div>
        <div className="grid grid-cols-2 gap-4 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Numéro</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{driver.cinNumber}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expiration</p>
            <div className="mt-1"><ExpiryBadge iso={driver.cinExpiry} /></div>
          </div>
        </div>
      </section>

      {/* License */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Permis de conduire</h3>
          <DocBadge scanned={licenseDoc?.scanned ?? false} />
        </div>
        <div className="grid grid-cols-3 gap-4 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Numéro</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{driver.licenseNumber}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Catégorie</p>
            <p className="mt-1 inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-900">
              {driver.licenseCategory}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Expiration</p>
            <div className="mt-1"><ExpiryBadge iso={driver.licenseExpiry} /></div>
          </div>
        </div>
      </section>

      {/* Documents */}
      {driver.documents.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Documents</h3>
          </div>
          <div className="divide-y divide-slate-50 px-5 py-1">
            {driver.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                  {doc.expiry && (
                    <p className="text-[11px] text-slate-400">Expire le {formatDate(doc.expiry)}</p>
                  )}
                </div>
                <DocBadge scanned={doc.scanned} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hire date */}
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Embauche</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{formatDate(driver.hireDate)}</span>
        </div>
      </section>
    </div>
  )
}
