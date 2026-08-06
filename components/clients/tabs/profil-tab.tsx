"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Phone,
  Mail,
  MapPin,
  CreditCard,
  IdCard,
  FileCheck2,
  FileX2,
  ShieldAlert,
  Calendar,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { type Client, formatDate, maskId, nationalityFlag } from "@/lib/clients-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function Row({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  iconClass?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500",
          iconClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function EditableRow({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  iconClass,
}: {
  icon: React.ElementType
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  iconClass?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500",
          iconClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>
    </div>
  )
}

export function ProfilTab({ client }: { client: Client }) {
  const idExpiry = client.idExpiry ?? client.createdAt
  const licenseExpiry = client.licenseExpiry ?? client.createdAt
  const [editMode, setEditMode] = useState(false)
  const [blacklisted, setBlacklisted] = useState(client.status === "blacklist")
  const [blacklistReason, setBlacklistReason] = useState(client.blacklistReason ?? "")
  const [form, setForm] = useState({
    fullName: client.fullName,
    phone: client.phone,
    email: client.email,
    city: client.city,
    idNumber: client.idNumber ?? "",
    licenseNumber: client.licenseNumber ?? "",
  })

  const idDaysLeft = Math.floor(
    (new Date(idExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  const licenseDaysLeft = Math.floor(
    (new Date(licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  const save = () => {
    toast.success("Profil mis à jour", {
      description: "Les modifications ont été enregistrées.",
    })
    setEditMode(false)
  }

  const cancel = () => {
    setForm({
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      idNumber: client.idNumber ?? "",
      licenseNumber: client.licenseNumber ?? "",
    })
    setEditMode(false)
  }

  return (
    <div className="space-y-5">
      {/* Edit mode toggle */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Pencil className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">Mode édition</p>
            <p className="text-[11px] text-slate-500">Modifier les informations du client</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {!editMode ? (
            <motion.button
              key="edit"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-1.5"
            >
              <button
                onClick={cancel}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3 w-3" />
                Annuler
              </button>
              <button
                onClick={save}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:shadow"
              >
                <Check className="h-3 w-3" />
                Enregistrer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Identity card */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Identité & contact
          </h3>
        </div>
        <div className="divide-y divide-slate-50 px-5 py-2">
          {editMode ? (
            <>
              <EditableRow
                icon={IdCard}
                label="Nom complet"
                value={form.fullName}
                onChange={(v) => setForm({ ...form, fullName: v })}
              />
              <EditableRow
                icon={Phone}
                label="Téléphone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <EditableRow
                icon={Mail}
                label="Email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <EditableRow
                icon={MapPin}
                label="Ville"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
            </>
          ) : (
            <>
              <Row icon={IdCard} label="Nom complet" value={client.fullName} />
              <Row
                icon={Phone}
                label="Téléphone"
                value={
                  <a href={`tel:${client.phone}`} className="hover:text-indigo-600 tabular-nums">
                    {client.phone}
                  </a>
                }
              />
              <Row
                icon={Mail}
                label="Email"
                value={
                  <a href={`mailto:${client.email}`} className="hover:text-indigo-600">
                    {client.email}
                  </a>
                }
              />
              <Row
                icon={MapPin}
                label="Ville"
                value={
                  <span className="inline-flex items-center gap-2">
                    {client.city}
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {nationalityFlag[client.nationality]} {client.nationality}
                    </span>
                  </span>
                }
              />
            </>
          )}
        </div>
      </section>

      {/* ID document */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {client.idType === "CIN" ? "Carte d'identité" : "Passeport"}
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              client.idScanned
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {client.idScanned ? (
              <>
                <FileCheck2 className="h-3 w-3" />
                Scan dispo
              </>
            ) : (
              <>
                <FileX2 className="h-3 w-3" />
                Scan manquant
              </>
            )}
          </span>
        </div>
        <div className="px-5 py-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Numéro
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                {maskId(client.idNumber ?? "")}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Expiration
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">{formatDate(idExpiry)}</p>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    idDaysLeft > 90
                      ? "bg-emerald-50 text-emerald-700"
                      : idDaysLeft > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700",
                  )}
                >
                  {idDaysLeft > 0 ? `${idDaysLeft}j` : "Expiré"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* License */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Permis de conduire
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              client.licenseScanned
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {client.licenseScanned ? (
              <>
                <FileCheck2 className="h-3 w-3" />
                Scan dispo
              </>
            ) : (
              <>
                <FileX2 className="h-3 w-3" />
                Scan manquant
              </>
            )}
          </span>
        </div>
        <div className="px-5 py-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Numéro
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                {client.licenseNumber}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Catégorie
              </p>
              <p className="mt-1 inline-flex items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-sm font-bold text-slate-900">
                {client.licenseCategory}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Expiration
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(licenseExpiry)}
                </p>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    licenseDaysLeft > 90
                      ? "bg-emerald-50 text-emerald-700"
                      : licenseDaysLeft > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700",
                  )}
                >
                  {licenseDaysLeft > 0 ? `${licenseDaysLeft}j` : "Expiré"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blacklist */}
      <section
        className={cn(
          "rounded-2xl border bg-white transition",
          blacklisted ? "border-rose-200 bg-rose-50/30" : "border-slate-200",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                blacklisted ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500",
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Blacklist
              </p>
              <p className="text-[11px] text-slate-500">
                Empêcher toute nouvelle location pour ce client
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setBlacklisted(!blacklisted)
              toast[blacklisted ? "success" : "error"](
                blacklisted ? "Client retiré de la blacklist" : "Client blacklisté",
                {
                  description: blacklisted
                    ? "Le client peut à nouveau effectuer des locations."
                    : "Aucune nouvelle location ne sera possible.",
                },
              )
            }}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition",
              blacklisted ? "bg-rose-500" : "bg-slate-200",
            )}
            aria-pressed={blacklisted}
          >
            <motion.span
              layout
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
              style={{ left: blacklisted ? "1.375rem" : "0.125rem" }}
            />
          </button>
        </div>
        <AnimatePresence>
          {blacklisted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 py-3">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                  Motif du blacklist
                </label>
                <textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Indiquez la raison du blacklist…"
                  rows={3}
                  className="mt-1 block w-full resize-none rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Lifecycle */}
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Client depuis
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-700">{formatDate(client.createdAt)}</span>
        </div>
      </section>
    </div>
  )
}
