"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  CalendarDays,
  ChevronDown,
  FileImage,
  FileText,
  Paperclip,
  Search,
  Upload,
  X,
} from "lucide-react"
import { cars, categoryAccent } from "@/lib/cars-data"
import {
  expenseTypes,
  expenseTypeStyles,
  type ExpenseRecord,
  type ExpenseType,
} from "@/lib/expenses-data"
import { cn } from "@/lib/utils"

export type ExpenseFormDraft = {
  type: ExpenseType
  carId: string | null
  date: string
  amount: number | ""
  description: string
  attachment: ExpenseRecord["attachment"]
  internalNote: string
}

export function ExpenseFormPanel({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit"
  initial?: ExpenseRecord | null
  onClose: () => void
  onSubmit: (draft: ExpenseFormDraft) => void
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [draft, setDraft] = useState<ExpenseFormDraft>({
    type: initial?.type ?? "Carburant",
    carId: initial?.carId ?? null,
    date: initial?.date ?? today,
    amount: initial?.amount ?? "",
    description: initial?.description ?? "",
    attachment: initial?.attachment ?? null,
    internalNote: initial?.internalNote ?? "",
  })
  const [typeOpen, setTypeOpen] = useState(false)
  const [carOpen, setCarOpen] = useState(false)
  const [carSearch, setCarSearch] = useState("")

  // Reset when reopened with new data
  useEffect(() => {
    if (initial) {
      setDraft({
        type: initial.type,
        carId: initial.carId,
        date: initial.date,
        amount: initial.amount,
        description: initial.description,
        attachment: initial.attachment,
        internalNote: initial.internalNote ?? "",
      })
    }
  }, [initial])

  const filteredCars = cars.filter((c) => {
    if (!carSearch) return true
    const q = carSearch.toLowerCase()
    return (
      c.brand.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.plate.toLowerCase().includes(q)
    )
  })

  const selectedCar = draft.carId ? cars.find((c) => c.id === draft.carId) : null
  const selectedTypeStyle = expenseTypeStyles[draft.type]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.description.trim() || draft.amount === "" || Number(draft.amount) <= 0) return
    onSubmit(draft)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const isImage = f.type.startsWith("image/")
    setDraft((d) => ({
      ...d,
      attachment: { name: f.name, kind: isImage ? "image" : "pdf" },
    }))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset", selectedTypeStyle.iconBg)}>
            <Paperclip className={cn("h-4 w-4", selectedTypeStyle.iconColor)} strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "add" ? "Ajouter une dépense" : "Modifier la dépense"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "add"
                ? "Enregistrez un nouveau mouvement comptable"
                : initial?.id}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Type */}
        <Field label="Type de dépense" required>
          <button
            type="button"
            onClick={() => {
              setTypeOpen((v) => !v)
              setCarOpen(false)
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-300"
          >
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", selectedTypeStyle.dot)} />
              {selectedTypeStyle.label}
            </span>
            <ChevronDown
              className={cn("h-4 w-4 text-slate-400 transition", typeOpen && "rotate-180")}
            />
          </button>
          {typeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
            >
              {expenseTypes.map((t) => {
                const s = expenseTypeStyles[t]
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => {
                      setDraft((d) => ({ ...d, type: t }))
                      setTypeOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition",
                      draft.type === t
                        ? cn(s.chip, "ring-1 ring-inset")
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                    {s.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </Field>

        {/* Car */}
        <Field label="Voiture concernée">
          <button
            type="button"
            onClick={() => {
              setCarOpen((v) => !v)
              setTypeOpen(false)
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-300"
          >
            {selectedCar ? (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-semibold",
                    categoryAccent[selectedCar.category],
                  )}
                >
                  {selectedCar.brand.slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate">
                  {selectedCar.brand} {selectedCar.model} · {selectedCar.plate}
                </span>
              </span>
            ) : (
              <span className="text-slate-500">Général / Agence</span>
            )}
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", carOpen && "rotate-180")} />
          </button>
          {carOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
            >
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={carSearch}
                  onChange={(e) => setCarSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="max-h-[240px] space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, carId: null }))
                    setCarOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition",
                    !draft.carId
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  Général / Agence
                </button>
                {filteredCars.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setDraft((d) => ({ ...d, carId: c.id }))
                      setCarOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs transition",
                      draft.carId === c.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-semibold",
                          categoryAccent[c.category],
                        )}
                      >
                        {c.brand.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-medium">
                        {c.brand} {c.model}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400">{c.plate}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </Field>

        {/* Date + Amount */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </Field>
          <Field label="Montant (DH)" required>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={draft.amount}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    amount: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                placeholder="0.00"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-12 text-right text-sm font-semibold tabular-nums text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                DH
              </span>
            </div>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description" required>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Ex: Révision 10 000 km — Dacia Logan"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </Field>

        {/* Attachment */}
        <Field label="Pièce jointe">
          {draft.attachment ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
              <div className="flex items-center gap-3">
                {draft.attachment.kind === "image" ? (
                  <FileImage className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-rose-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{draft.attachment.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {draft.attachment.kind === "image" ? "Image" : "PDF"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, attachment: null }))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-sm font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-700">
              <Upload className="h-4 w-4" />
              Cliquer pour téléverser une image ou un PDF
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          )}
        </Field>

        {/* Internal note */}
        <Field label="Note interne" optional>
          <textarea
            value={draft.internalNote}
            onChange={(e) => setDraft((d) => ({ ...d, internalNote: e.target.value }))}
            placeholder="Visible uniquement par l'équipe…"
            rows={2}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </Field>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)]"
        >
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <span className="relative">Enregistrer la dépense</span>
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        {required && <span className="text-[10px] font-medium text-rose-500">*</span>}
        {optional && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Optionnel
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
