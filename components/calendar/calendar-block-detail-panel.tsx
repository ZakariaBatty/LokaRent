"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  X,
  Calendar,
  User,
  MapPin,
  Wallet,
  Phone,
  Car,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  CreditCard,
  ArrowRight,
} from "lucide-react"
import {
  type CalendarBlock,
  type CalendarVehicle,
  blockStyle,
  formatDateFr,
  formatMAD,
  parseISO,
  daysBetween,
} from "@/lib/calendar-data"
import { cn } from "@/lib/utils"

type TabId = "details" | "payment" | "timeline" | "contract"

const tabs: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: "details", label: "Détails", icon: Calendar },
  { id: "contract", label: "Contrat", icon: FileText },
  { id: "payment", label: "Paiement", icon: CreditCard },
  { id: "timeline", label: "Timeline", icon: Clock },
]

export function CalendarBlockDetailPanel({
  block,
  vehicle,
  onClose,
}: {
  block: CalendarBlock
  vehicle: CalendarVehicle
  onClose: () => void
}) {
  const [tab, setTab] = useState<TabId>("details")
  const style = blockStyle[block.status]
  const isMaintenance = block.type === "maintenance"
  const start = parseISO(block.startDate)
  const end = parseISO(block.endDate)
  const days = daysBetween(start, end) + 1

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isMaintenance ? (
                <Wrench className="h-4 w-4 text-slate-500" />
              ) : (
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {block.reservationCode}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {isMaintenance ? "Maintenance planifiée" : block.clientName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                {style.label}
              </span>
              {block.overdue && (
                <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                  <AlertCircle className="h-3 w-3" />
                  En retard
                </span>
              )}
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {days} jour{days > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 px-5">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition",
                  active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {active && (
                  <motion.span
                    layoutId="calendar-block-tab"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === "details" && (
          <div className="space-y-5">
            {/* Dates */}
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Période</h3>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Départ
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDateFr(start)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex-1 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    Retour
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDateFr(end)}
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle */}
            <div className="rounded-2xl border border-slate-200/80 p-4">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Véhicule</h3>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-inset ring-slate-200">
                  <Car className="h-6 w-6 text-slate-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                      {vehicle.plate}
                    </span>
                    <span className="text-[11px] text-slate-500">{vehicle.category}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client (if reservation) */}
            {!isMaintenance && (
              <div className="rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Client</h3>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-bold text-white">
                    {block.clientInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {block.clientName}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Phone className="h-3 w-3" />
                      +212 6 12 34 56 78
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isMaintenance && (
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Motif</h3>
                </div>
                <p className="mt-2 text-sm text-slate-700">{block.maintenanceReason}</p>
              </div>
            )}

            {/* Locations */}
            {!isMaintenance && (
              <div className="rounded-2xl border border-slate-200/80 p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Lieux</h3>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Départ</span>
                    <span className="font-medium text-slate-900">Agence Casablanca</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Retour</span>
                    <span className="font-medium text-slate-900">Aéroport Mohammed V</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "payment" && !isMaintenance && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 to-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Montant total
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {formatMAD(block.total ?? 0)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Avance versée</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {formatMAD(Math.round((block.total ?? 0) * 0.5))}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Caution</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-slate-900">
                  {formatMAD(2000)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-medium text-amber-800">Reste à percevoir</span>
                </div>
                <span className="text-sm font-bold tabular-nums text-amber-900">
                  {formatMAD(Math.round((block.total ?? 0) * 0.5))}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "contract" && (
          <div className="space-y-4">
            {isMaintenance ? (
              <EmptyState
                icon={Wrench}
                title="Aucun contrat"
                description="Période de maintenance interne — aucun contrat client associé."
              />
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200/80 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">État du contrat</h3>
                  <div className="mt-3 space-y-2">
                    {[
                      { label: "Signature client", ok: true },
                      { label: "État des lieux départ", ok: true },
                      { label: "Photos véhicule", ok: true },
                      { label: "État des lieux retour", ok: block.status !== "en_cours" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{row.label}</span>
                        {row.ok ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Complet
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <Clock className="h-3 w-3" />
                            En attente
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "timeline" && (
          <div className="space-y-3">
            {[
              { label: "Réservation créée", date: "il y a 8 jours", ok: true },
              { label: "Avance versée", date: "il y a 6 jours", ok: true },
              { label: "Contrat signé", date: "il y a 5 jours", ok: true },
              {
                label: block.status === "en_cours" ? "Location en cours" : "Récupération véhicule",
                date: "aujourd'hui",
                ok: block.status === "en_cours",
                current: block.status === "en_cours",
              },
            ].map((ev, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-full",
                      ev.ok
                        ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
                        : "border border-slate-200 bg-white text-slate-400",
                      ev.current && "ring-4 ring-indigo-200",
                    )}
                  >
                    {ev.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </span>
                  {i < arr.length - 1 && <span className="my-1 h-8 w-px bg-slate-200" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-semibold text-slate-900">{ev.label}</p>
                  <p className="text-xs text-slate-500">{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "payment" && isMaintenance && (
          <EmptyState
            icon={Wallet}
            title="Aucun paiement"
            description="Période de maintenance — aucune information de paiement."
          />
        )}
      </div>

      {/* Footer actions */}
      {!isMaintenance && (
        <div className="border-t border-slate-200/80 bg-slate-50/60 px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
              Modifier
            </button>
            <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition hover:shadow-[0_8px_20px_rgba(79,70,229,0.35)]">
              Ouvrir la réservation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Wrench
  title: string
  description: string
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-[260px] text-xs text-slate-500">{description}</p>
    </div>
  )
}
