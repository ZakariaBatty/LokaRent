"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileImage,
  FileText,
  Hash,
  Paperclip,
  Search,
  Upload,
  X,
} from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { categoryAccent } from "@/lib/cars-data"
import {
  getExpenseTypeStyle,
  type ExpenseRecord,
} from "@/lib/expenses-data"
import { cn } from "@/lib/utils"

export type ExpenseCategoryOption = {
  id: string
  name: string
  isSystem: boolean
}

export type ExpenseVehicleOption = {
  id: string
  brand: string
  model: string
  plate: string
  category?: string
}

export type ExpenseReservationOption = {
  id: string
  code: string
  vehicleId: string
  vehicleLabel: string
  customerLabel: string
  startsAt: string
  endsAt: string
}

const paymentMethods = ["cash", "bank_transfer", "cheque", "card", "other"] as const

export type ExpenseFormDraft = {
  categoryId: string
  carId: string | null
  reservationId: string | null
  date: string
  amount: number | ""
  currency: string
  method: (typeof paymentMethods)[number] | null
  reference: string
  provider: string
  description: string
  attachment: ExpenseRecord["attachment"]
  documentUrl: string | null
  internalNote: string
}

export function ExpenseFormPanel({
  mode,
  initial,
  categories,
  vehicles,
  reservations,
  defaultCurrency,
  onClose,
  onSubmit,
  onUpload,
}: {
  mode: "add" | "edit"
  initial?: ExpenseRecord | null
  categories: ExpenseCategoryOption[]
  vehicles: ExpenseVehicleOption[]
  reservations: ExpenseReservationOption[]
  defaultCurrency: string
  onClose: () => void
  onSubmit: (draft: ExpenseFormDraft) => void
  onUpload: (file: File) => Promise<string | null>
}) {
  const { t } = useI18n()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaultCategory = initial?.categoryId && categories.some((category) => category.id === initial.categoryId)
    ? initial.categoryId
    : categories[0]?.id ?? ""
  const normalizedDefaultCurrency = defaultCurrency.trim().toUpperCase() || "MAD"
  const [draft, setDraft] = useState<ExpenseFormDraft>({
    categoryId: defaultCategory,
    carId: initial?.carId ?? null,
    reservationId: initial?.reservationId ?? null,
    date: initial?.date ?? today,
    amount: initial?.amount ?? "",
    currency: initial?.currency ?? normalizedDefaultCurrency,
    method: (initial?.method as ExpenseFormDraft["method"]) ?? null,
    reference: initial?.reference ?? "",
    provider: initial?.provider ?? "",
    description: initial?.description ?? "",
    attachment: initial?.attachment ?? null,
    documentUrl: initial?.documentUrl ?? null,
    internalNote: initial?.internalNote ?? "",
  })
  const [typeOpen, setTypeOpen] = useState(false)
  const [carOpen, setCarOpen] = useState(false)
  const [reservationOpen, setReservationOpen] = useState(false)
  const [carSearch, setCarSearch] = useState("")
  const [reservationSearch, setReservationSearch] = useState("")

  // Reset when reopened with new data
  useEffect(() => {
    if (initial) {
      setDraft({
        categoryId: initial.categoryId,
        carId: initial.carId,
        reservationId: initial.reservationId ?? null,
        date: initial.date,
        amount: initial.amount,
        currency: initial.currency,
        method: (initial.method as ExpenseFormDraft["method"]) ?? null,
        reference: initial.reference ?? "",
        provider: initial.provider ?? "",
        description: initial.description,
        attachment: initial.attachment,
        documentUrl: initial.documentUrl ?? null,
        internalNote: initial.internalNote ?? "",
      })
    } else {
      setDraft((current) => ({
        ...current,
        categoryId: categories.some((category) => category.id === current.categoryId)
          ? current.categoryId
          : categories[0]?.id ?? "",
        currency: current.currency || normalizedDefaultCurrency,
      }))
    }
  }, [categories, initial, normalizedDefaultCurrency])

  const filteredCars = vehicles.filter((c) => {
    if (!carSearch) return true
    const q = carSearch.toLowerCase()
    return (
      c.brand.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.plate.toLowerCase().includes(q)
    )
  })

  const selectedCar = draft.carId ? vehicles.find((c) => c.id === draft.carId) : null
  const selectedReservation = draft.reservationId ? reservations.find((r) => r.id === draft.reservationId) : null
  const selectedCategory = categories.find((category) => category.id === draft.categoryId) ?? null
  const selectedTypeStyle = getExpenseTypeStyle(selectedCategory?.name ?? initial?.type ?? "")
  const categoryError = categories.length === 0
    ? t("expenses.form.noCategoriesConfigured")
    : !selectedCategory
      ? t("expenses.form.categoryRequired")
      : null
  const filteredReservations = reservations.filter((reservation) => {
    if (!reservationSearch) return true
    const q = reservationSearch.toLowerCase()
    return (
      reservation.code.toLowerCase().includes(q) ||
      reservation.vehicleLabel.toLowerCase().includes(q) ||
      reservation.customerLabel.toLowerCase().includes(q)
    )
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCategory || !draft.description.trim() || draft.amount === "" || Number(draft.amount) <= 0 || !draft.currency.trim()) return
    onSubmit(draft)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const isImage = f.type.startsWith("image/")
    const documentUrl = await onUpload(f)
    if (!documentUrl) return
    setDraft((d) => ({
      ...d,
      attachment: { name: f.name, kind: isImage ? "image" : "pdf" },
      documentUrl,
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
              {t(mode === "add" ? "expenses.form.titleAdd" : "expenses.form.titleEdit")}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "add"
                ? t("expenses.form.subtitleAdd")
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
        <SectionTitle label={t("expenses.form.sections.information")} />
        {/* Type */}
        <Field label={t("expenses.form.fields.category")} required>
          <button
            type="button"
            onClick={() => {
              setTypeOpen((v) => !v)
              setCarOpen(false)
              setReservationOpen(false)
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-300"
          >
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", selectedTypeStyle.dot)} />
              {selectedCategory ? getExpenseTypeStyle(selectedCategory.name).label : t("expenses.form.categoryPlaceholder")}
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
              {categories.length === 0 ? (
                <p className="col-span-2 rounded-lg border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  {t("expenses.form.noCategoriesConfigured")}
                </p>
              ) : categories.map((category) => {
                const t = category.name
                const s = getExpenseTypeStyle(t)
                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => {
                      setDraft((d) => ({ ...d, categoryId: category.id }))
                      setTypeOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition",
                      draft.categoryId === category.id
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
          {categoryError && <p className="text-xs font-medium text-amber-700">{categoryError}</p>}
        </Field>

        <Field label={t("expenses.form.fields.date")} required>
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

        <SectionTitle label={t("expenses.form.sections.assignment")} />
        {/* Car */}
        <Field label={t("expenses.form.fields.vehicle")} optional>
          <button
            type="button"
            onClick={() => {
              setCarOpen((v) => !v)
              setTypeOpen(false)
              setReservationOpen(false)
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-300"
          >
            {selectedCar ? (
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-semibold",
                    categoryAccent[selectedCar.category as keyof typeof categoryAccent] ?? "bg-slate-100 text-slate-700",
                  )}
                >
                  {selectedCar.brand.slice(0, 2).toUpperCase()}
                </span>
                <span className="truncate">
                  {selectedCar.brand} {selectedCar.model} · {selectedCar.plate}
                </span>
              </span>
            ) : (
              <span className="text-slate-500">{t("expenses.form.generalAgency")}</span>
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
                  placeholder={t("expenses.form.search")}
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
                  {t("expenses.form.generalAgency")}
                </button>
                {filteredCars.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setDraft((d) => {
                        const reservation = d.reservationId ? reservations.find((item) => item.id === d.reservationId) : null
                        return {
                          ...d,
                          carId: c.id,
                          reservationId: reservation && reservation.vehicleId !== c.id ? null : d.reservationId,
                        }
                      })
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
                          categoryAccent[c.category as keyof typeof categoryAccent] ?? "bg-slate-100 text-slate-700",
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

        <Field label={t("expenses.form.fields.reservation")} optional>
          <button
            type="button"
            onClick={() => {
              setReservationOpen((v) => !v)
              setTypeOpen(false)
              setCarOpen(false)
            }}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-300"
          >
            {selectedReservation ? (
              <span className="min-w-0 truncate">
                {selectedReservation.code} · {selectedReservation.vehicleLabel}
              </span>
            ) : (
              <span className="text-slate-500">{t("expenses.form.noReservation")}</span>
            )}
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", reservationOpen && "rotate-180")} />
          </button>
          {reservationOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
            >
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={reservationSearch}
                  onChange={(e) => setReservationSearch(e.target.value)}
                  placeholder={t("expenses.form.search")}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="max-h-[240px] space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setDraft((d) => ({ ...d, reservationId: null }))
                    setReservationOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition",
                    !draft.reservationId
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {t("expenses.form.noReservation")}
                </button>
                {filteredReservations.map((reservation) => (
                  <button
                    type="button"
                    key={reservation.id}
                    onClick={() => {
                      setDraft((d) => ({
                        ...d,
                        reservationId: reservation.id,
                        carId: reservation.vehicleId,
                      }))
                      setReservationOpen(false)
                    }}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left text-xs transition",
                      draft.reservationId === reservation.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className="font-semibold">{reservation.code} · {reservation.customerLabel}</span>
                    <span className="text-[10px] text-slate-400">
                      {reservation.vehicleLabel} · {reservation.startsAt} - {reservation.endsAt}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </Field>

        <SectionTitle label={t("expenses.form.sections.details")} />
        <Field label={t("expenses.form.fields.provider")} optional>
          <input
            value={draft.provider}
            onChange={(e) => setDraft((d) => ({ ...d, provider: e.target.value }))}
            placeholder={t("expenses.form.placeholders.provider")}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </Field>

        {/* Description */}
        <Field label={t("expenses.form.fields.description")} required>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder={t("expenses.form.placeholders.description")}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </Field>

        <SectionTitle label={t("expenses.form.sections.amount")} />
        {/* Amount */}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("expenses.form.fields.amount")} required>
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
                placeholder={t("expenses.form.placeholders.amount")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-3 text-right text-sm font-semibold tabular-nums text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </Field>
          <Field label={t("expenses.form.fields.currency")} required>
            <input
              value={draft.currency}
              onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value.toUpperCase().slice(0, 3) }))}
              maxLength={3}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold uppercase tracking-wider text-slate-900 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </Field>
        </div>

        <SectionTitle label={t("expenses.form.sections.payment")} />
        <Field label={t("expenses.form.fields.method")} optional>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, method: null }))}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition",
                !draft.method ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              <CreditCard className="h-3.5 w-3.5" />
              {t("expenses.paymentMethods.none")}
            </button>
            {paymentMethods.map((method) => (
              <button
                type="button"
                key={method}
                onClick={() => setDraft((d) => ({ ...d, method }))}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition",
                  draft.method === method ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                <CreditCard className="h-3.5 w-3.5" />
                {t(`expenses.paymentMethods.${method}`)}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t("expenses.form.fields.reference")} optional>
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={draft.reference}
              onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
              placeholder={t("expenses.form.placeholders.reference")}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </Field>

        <SectionTitle label={t("expenses.form.sections.document")} />
        {/* Attachment */}
        <Field label={t("expenses.form.fields.document")} optional>
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
                    {draft.attachment.kind === "image" ? t("expenses.form.documentKinds.image") : t("expenses.form.documentKinds.pdf")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, attachment: null, documentUrl: null }))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-sm font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-700">
              <Upload className="h-4 w-4" />
              {t("expenses.form.uploadPrompt")}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFile}
                className="hidden"
              />
            </label>
          )}
        </Field>

        <SectionTitle label={t("expenses.form.sections.internal")} />
        {/* Internal note */}
        <Field label={t("expenses.form.fields.internalNote")} optional>
          <textarea
            value={draft.internalNote}
            onChange={(e) => setDraft((d) => ({ ...d, internalNote: e.target.value }))}
            placeholder={t("expenses.form.placeholders.internalNote")}
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
          {t("expenses.form.cancel")}
        </button>
        <button
          type="submit"
          disabled={Boolean(categoryError)}
          className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <span className="relative">{t("expenses.form.save")}</span>
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
  const { t } = useI18n()
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        {required && <span className="text-[10px] font-medium text-rose-500">*</span>}
        {optional && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {t("expenses.form.optional")}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="pt-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}
