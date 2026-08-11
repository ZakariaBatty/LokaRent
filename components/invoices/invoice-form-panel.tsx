"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import {
  X,
  Plus,
  Trash2,
  Car,
  User,
  Building2,
  ChevronDown,
  Calculator,
  FileText,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  type Invoice,
  type InvoiceType,
  type InvoiceLineItem,
  formatMAD,
} from "@/lib/invoices-data"
import type { InvoiceableReservationOption } from "@/modules/finances/mappers/invoice.mapper"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DraftLineItem = Omit<InvoiceLineItem, "subtotal" | "total"> & {
  subtotal: number
  total: number
}

type FormState = {
  type: InvoiceType
  customerName: string
  customerPhone: string
  customerEmail: string
  customerType: "individual" | "company"
  reservationId: string
  issueDate: string
  dueDate: string
  notes: string
  lineItems: DraftLineItem[]
}

const today = new Date().toISOString().split("T")[0]
const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]

function emptyLine(idx: number): DraftLineItem {
  return {
    id: `new-li-${idx}-${Date.now()}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 20,
    subtotal: 0,
    total: 0,
  }
}

function recalc(li: Omit<DraftLineItem, "subtotal" | "total">): DraftLineItem {
  const subtotal = li.quantity * li.unitPrice
  const total = subtotal * (1 + li.taxRate / 100)
  return { ...li, subtotal, total }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </h3>
  )
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

function inputClass(error?: boolean) {
  return cn(
    "h-10 w-full rounded-xl border text-sm transition focus-visible:ring-2 focus-visible:ring-blue-500/20",
    error
      ? "border-rose-300 bg-rose-50 placeholder:text-rose-300"
      : "border-slate-200 bg-white placeholder:text-slate-400",
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function InvoiceFormPanel({
  initial,
  reservationOptions = [],
  saving: externalSaving,
  onClose,
  onSave,
}: {
  initial?: Invoice | null
  reservationOptions?: InvoiceableReservationOption[]
  saving?: boolean
  onClose: () => void
  onSave: (data: Partial<Invoice>) => void
}) {
  const isEdit = !!initial

  const [form, setForm] = useState<FormState>(() => {
    if (initial) {
      return {
        type:           initial.type,
        customerName:   initial.customerName,
        customerPhone:  initial.customerPhone,
        customerEmail:  initial.customerEmail ?? "",
        customerType:   initial.customerType,
        reservationId:  initial.reservationId ?? "",
        issueDate:      initial.issueDate,
        dueDate:        initial.dueDate,
        notes:          initial.notes ?? "",
        lineItems:      initial.lineItems.map((li) => ({ ...li })),
      }
    }
    return {
      type:           "rental",
      customerName:   "",
      customerPhone:  "",
      customerEmail:  "",
      customerType:   "individual",
      reservationId:  "",
      issueDate:      today,
      dueDate:        twoWeeks,
      notes:          "",
      lineItems:      [emptyLine(0)],
    }
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const isSaving = externalSaving ?? saving

  // Auto-populate rental fields when a reservation is selected
  useEffect(() => {
    if (form.type !== "rental" || !form.reservationId) return
    const opt = reservationOptions.find((r) => r.id === form.reservationId)
    if (!opt) return
    setForm((prev) => ({
      ...prev,
      customerName:  opt.customerName,
      customerPhone: opt.customerPhone,
      customerEmail: opt.customerEmail,
      customerType:  opt.customerType,
      lineItems:     prev.lineItems,
    }))
  }, [form.reservationId, form.type, reservationOptions])

  const update = useCallback(
    <K extends keyof FormState>(key: K, val: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: val }))
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    },
    [],
  )

  // ── Line item helpers ──────────────────────────────────────────────────
  const updateLine = (idx: number, field: keyof DraftLineItem, raw: string | number) => {
    setForm((prev) => {
      const items = prev.lineItems.map((li, i) => {
        if (i !== idx) return li
        const updated = { ...li, [field]: typeof raw === "string" ? (field === "description" ? raw : parseFloat(raw) || 0) : raw }
        return recalc(updated)
      })
      return { ...prev, lineItems: items }
    })
  }

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, emptyLine(prev.lineItems.length)],
    }))
  }

  const removeLine = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== idx),
    }))
  }

  // ── Totals ──────────────────────────────────────────────────────────────
  const subtotalHT = form.lineItems.reduce((s, li) => s + li.subtotal, 0)
  const taxTotal   = form.lineItems.reduce((s, li) => s + (li.total - li.subtotal), 0)
  const totalTTC   = subtotalHT + taxTotal

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const e: typeof errors = {}
    if (!form.customerName.trim()) e.customerName = "Requis"
    if (!form.customerPhone.trim()) e.customerPhone = "Requis"
    if (!form.issueDate) e.issueDate = "Requis"
    if (!form.dueDate) e.dueDate = "Requis"
    if (form.type === "rental" && !form.reservationId) e.reservationId = "Sélectionnez une réservation"
    if (form.lineItems.length === 0) e.lineItems = "Au moins une ligne requise"
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    if (externalSaving === undefined) {
      setSaving(true)
      await new Promise((r) => setTimeout(r, 900))
      setSaving(false)
    }
    onSave({
      type:          form.type,
      customerName:  form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail || undefined,
      customerType:  form.customerType,
      reservationId: form.reservationId || undefined,
      issueDate:     form.issueDate,
      dueDate:       form.dueDate,
      notes:         form.notes || undefined,
      lineItems:     form.lineItems,
      subtotal:      subtotalHT,
      taxTotal,
      total:         totalTTC,
      paid:          initial?.paid ?? 0,
      remaining:     totalTTC - (initial?.paid ?? 0),
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEdit ? `Modifier ${initial?.number}` : "Nouvelle facture"}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit ? "Modifiez les champs puis sauvegardez." : "Remplissez les informations ci-dessous."}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-6 p-6 lg:grid-cols-2">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Type selector */}
            <div>
              <SectionHeading>Type de facture</SectionHeading>
              <div className="grid grid-cols-2 gap-2">
                {(["rental", "manual"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update("type", t)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm font-medium transition-all",
                      form.type === t
                        ? "border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-300"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {t === "rental" ? (
                      <Car className="h-4 w-4 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0" />
                    )}
                    {t === "rental" ? "Location" : "Manuelle"}
                  </button>
                ))}
              </div>
            </div>

            {/* Reservation (rental only) */}
            {form.type === "rental" && (
              <div>
                <SectionHeading>Réservation liée</SectionHeading>
                <Field label="Sélectionner une réservation" required>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm transition",
                          errors.reservationId
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : form.reservationId
                            ? "border-slate-200 bg-white text-slate-900"
                            : "border-slate-200 bg-white text-slate-400",
                          "hover:border-blue-300",
                        )}
                      >
                        <span className="truncate">
                          {form.reservationId
                            ? reservationOptions.find((r) => r.id === form.reservationId)
                              ? `${reservationOptions.find((r) => r.id === form.reservationId)!.code} · ${reservationOptions.find((r) => r.id === form.reservationId)!.carLabel}`
                              : form.reservationId
                            : "Choisir une réservation…"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-full max-w-sm rounded-xl">
                      {reservationOptions.map((r) => (
                        <DropdownMenuItem
                          key={r.id}
                          onClick={() => update("reservationId", r.id)}
                          className="cursor-pointer gap-2 text-sm"
                        >
                          <Car className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="font-mono text-xs text-indigo-600">{r.code}</span>
                          <span className="truncate text-slate-700">{r.carLabel}</span>
                          {!r.taxReady && <span className="ml-auto text-[10px] text-amber-600">TVA manquante</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {errors.reservationId && (
                    <p className="mt-1 text-[11px] text-rose-500">{errors.reservationId}</p>
                  )}
                </Field>
              </div>
            )}

            {/* Customer */}
            <div>
              <SectionHeading>Informations client</SectionHeading>
              <div className="space-y-3">
                {/* Customer type toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {(["individual", "company"] as const).map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => update("customerType", ct)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all",
                        form.customerType === ct
                          ? "border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {ct === "individual" ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5" />
                      )}
                      {ct === "individual" ? "Particulier" : "Entreprise"}
                    </button>
                  ))}
                </div>

                <Field label="Nom" required>
                  <Input
                    value={form.customerName}
                    onChange={(e) => update("customerName", e.target.value)}
                    placeholder={form.customerType === "company" ? "Raison sociale…" : "Prénom et nom…"}
                    className={inputClass(!!errors.customerName)}
                    disabled={form.type === "rental" && !!form.reservationId}
                  />
                  {errors.customerName && (
                    <p className="mt-0.5 text-[11px] text-rose-500">{errors.customerName}</p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Téléphone" required>
                    <Input
                      value={form.customerPhone}
                      onChange={(e) => update("customerPhone", e.target.value)}
                      placeholder="+212 6xx xxx xxx"
                      className={inputClass(!!errors.customerPhone)}
                      disabled={form.type === "rental" && !!form.reservationId}
                    />
                    {errors.customerPhone && (
                      <p className="mt-0.5 text-[11px] text-rose-500">{errors.customerPhone}</p>
                    )}
                  </Field>
                  <Field label="Email">
                    <Input
                      value={form.customerEmail}
                      onChange={(e) => update("customerEmail", e.target.value)}
                      placeholder="email@exemple.ma"
                      className={inputClass()}
                      type="email"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <SectionHeading>Dates</SectionHeading>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date d'émission" required>
                  <Input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => update("issueDate", e.target.value)}
                    className={inputClass(!!errors.issueDate)}
                  />
                </Field>
                <Field label="Date d'échéance" required>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => update("dueDate", e.target.value)}
                    className={inputClass(!!errors.dueDate)}
                  />
                </Field>
              </div>
            </div>

            {/* Notes */}
            <div>
              <SectionHeading>Notes internes</SectionHeading>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Notes, conditions particulières, instructions de paiement…"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* ── RIGHT COLUMN — Line items ────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading>Lignes de facture</SectionHeading>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une ligne
              </button>
            </div>

            {errors.lineItems && (
              <p className="text-xs text-rose-500">{errors.lineItems}</p>
            )}

            <div className="space-y-2">
              {form.lineItems.map((li, idx) => (
                <motion.div
                  key={li.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                >
                  {/* Row header */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Ligne {idx + 1}
                    </span>
                    {form.lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="rounded-md p-0.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <Input
                    value={li.description}
                    onChange={(e) => updateLine(idx, "description", e.target.value)}
                    placeholder="Description de la prestation…"
                    className="mb-2 h-9 rounded-lg border-slate-200 bg-slate-50/60 text-sm"
                    disabled={form.type === "rental" && !!form.reservationId}
                  />

                  {/* Qty / Price / Tax */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-400">Quantité</label>
                      <Input
                        type="number"
                        min={1}
                        value={li.quantity}
                        onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                        className="h-9 rounded-lg border-slate-200 bg-slate-50/60 text-sm"
                        disabled={form.type === "rental" && !!form.reservationId}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-400">Prix unitaire</label>
                      <Input
                        type="number"
                        min={0}
                        value={li.unitPrice}
                        onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                        className="h-9 rounded-lg border-slate-200 bg-slate-50/60 text-sm"
                        disabled={form.type === "rental" && !!form.reservationId}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-slate-400">TVA %</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={li.taxRate}
                        onChange={(e) => updateLine(idx, "taxRate", e.target.value)}
                        className="h-9 rounded-lg border-slate-200 bg-slate-50/60 text-sm"
                      />
                    </div>
                  </div>

                  {/* Row totals */}
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-600">
                    <span>HT : {formatMAD(li.subtotal)}</span>
                    <span className="font-semibold text-slate-900">TTC : {formatMAD(li.total)}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Grand total card */}
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/60">
              <div className="flex items-center gap-2 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white px-4 py-2.5">
                <Calculator className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Récapitulatif
                </span>
              </div>
              <div className="divide-y divide-slate-100 px-4">
                {[
                  { label: "Sous-total HT", value: subtotalHT, muted: true },
                  { label: "TVA",            value: taxTotal,   muted: true },
                  { label: "Total TTC",      value: totalTTC,   muted: false },
                ].map(({ label, value, muted }) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <span className={cn("text-sm", muted ? "text-slate-500" : "font-semibold text-slate-900")}>
                      {label}
                    </span>
                    <span className={cn("tabular-nums", muted ? "text-sm text-slate-700" : "text-base font-bold text-slate-900")}>
                      {formatMAD(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200/80 bg-white/90 px-6 py-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-blue-600 to-indigo-700 px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] disabled:opacity-70"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {isSaving ? (
            <span className="relative">Enregistrement…</span>
          ) : (
            <span className="relative">{isEdit ? "Enregistrer les modifications" : "Créer la facture"}</span>
          )}
        </button>
      </div>
    </div>
  )
}
