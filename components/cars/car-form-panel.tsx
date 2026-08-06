"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Car as CarIcon,
  Check,
  ChevronDown,
  Gauge,
  Palette,
  ShieldCheck,
  Sticker,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  type Car,
  type CarCategory,
  type CarStatus,
  type FuelType,
  statusConfig,
} from "@/lib/cars-data"
import { uploadCarDocumentAction } from "@/modules/cars/actions/upload-car-file.action"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

const categories: CarCategory[] = ["Citadine", "Berline", "SUV", "Utilitaire"]
const fuels: FuelType[] = ["Essence", "Diesel", "Hybride"]
const statuses: CarStatus[] = ["disponible", "louee", "maintenance", "hors_service"]

export type CarFormDraft = {
  brand: string
  model: string
  year: number | ""
  plate: string
  color: string
  category: CarCategory
  fuel: FuelType
  seats: number | ""
  km: number | ""
  status: CarStatus
  insuranceCompany: string
  insuranceEnd: string
  insuranceDocumentUrl: string
  vignetteEnd: string
  vignetteDocumentUrl: string
  visiteNext: string
  inspectionDocumentUrl: string
}

type Errors = Partial<Record<keyof CarFormDraft, string>>

const currentYear = new Date().getFullYear()

function buildDraft(car?: Car | null): CarFormDraft {
  return {
    brand: car?.brand ?? "",
    model: car?.model ?? "",
    year: car?.year ?? "",
    plate: car?.plate ?? "",
    color: car?.color ?? "",
    category: car?.category ?? "Citadine",
    fuel: car?.fuel ?? "Essence",
    seats: car?.seats ?? "",
    km: car?.km ?? "",
    status: car?.status ?? "disponible",
    insuranceCompany: car?.insurance.company ?? "",
    insuranceEnd: car?.insurance.endDate ?? "",
    insuranceDocumentUrl: "",
    vignetteEnd: car?.vignette.endDate ?? "",
    vignetteDocumentUrl: "",
    visiteNext: car?.visiteTechnique.nextDate ?? "",
    inspectionDocumentUrl: "",
  }
}

export function CarFormPanel({
  mode,
  car,
  onClose,
  onSubmit,
}: {
  mode: "add" | "edit"
  car?: Car | null
  onClose: () => void
  onSubmit: (draft: CarFormDraft) => Promise<boolean>
}) {
  const [draft, setDraft] = useState<CarFormDraft>(() => buildDraft(car))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<keyof CarFormDraft | null>(null)

  useEffect(() => {
    setDraft(buildDraft(car))
    setErrors({})
  }, [car])

  function set<K extends keyof CarFormDraft>(key: K, value: CarFormDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Errors = {}
    if (!draft.brand.trim()) e.brand = "Marque requise"
    if (!draft.model.trim()) e.model = "Modèle requis"
    if (draft.year === "" || Number(draft.year) < 1990 || Number(draft.year) > currentYear + 1)
      e.year = "Année invalide"
    if (!draft.plate.trim()) e.plate = "Immatriculation requise"
    if (draft.seats === "" || Number(draft.seats) < 1) e.seats = "Requis"
    if (draft.km === "" || Number(draft.km) < 0) e.km = "Requis"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSubmit(draft)
    } finally {
      setSaving(false)
    }
  }

  async function uploadDocument(
    ev: React.ChangeEvent<HTMLInputElement>,
    key: "insuranceDocumentUrl" | "vignetteDocumentUrl" | "inspectionDocumentUrl",
    folder: string,
  ) {
    const file = ev.target.files?.[0]
    ev.target.value = ""
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)
    setUploadingField(key)
    try {
      const result = await uploadCarDocumentAction(formData)
      if (!result.success) {
        const keyName = result.messageKey.split(".").at(-1) as keyof typeof fr.fleet.upload.errors
        toast.error(fr.fleet.upload.errors[keyName] ?? fr.fleet.upload.errors.generic)
        return
      }
      set(key, result.upload.url)
      toast.success(fr.fleet.upload.uploaded)
    } finally {
      setUploadingField(null)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col overflow-hidden bg-white"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/80 px-6 py-5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <CarIcon className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "add" ? "Ajouter un véhicule" : "Modifier le véhicule"}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === "add"
                ? "Enregistrez un nouveau véhicule dans votre flotte"
                : `${car?.brand} ${car?.model} · ${car?.plate}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
        {/* Identité */}
        <Section title="Identité" icon={CarIcon}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marque" required error={errors.brand}>
              <Input
                value={draft.brand}
                onChange={(v) => set("brand", v)}
                placeholder="Dacia"
                invalid={!!errors.brand}
              />
            </Field>
            <Field label="Modèle" required error={errors.model}>
              <Input
                value={draft.model}
                onChange={(v) => set("model", v)}
                placeholder="Logan"
                invalid={!!errors.model}
              />
            </Field>
            <Field label="Année" required error={errors.year}>
              <Input
                type="number"
                value={draft.year}
                onChange={(v) => set("year", v === "" ? "" : Number(v))}
                placeholder={`${currentYear}`}
                invalid={!!errors.year}
              />
            </Field>
            <Field label="Immatriculation" required error={errors.plate}>
              <Input
                value={draft.plate}
                onChange={(v) => set("plate", v.toUpperCase())}
                placeholder="12345-A-6"
                mono
                invalid={!!errors.plate}
              />
            </Field>
            <Field label="Couleur">
              <div className="relative">
                <Palette className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={draft.color}
                  onChange={(e) => set("color", e.target.value)}
                  placeholder="Gris métallisé"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </Field>
            <Field label="Nombre de places" required error={errors.seats}>
              <Input
                type="number"
                value={draft.seats}
                onChange={(v) => set("seats", v === "" ? "" : Number(v))}
                placeholder="5"
                invalid={!!errors.seats}
              />
            </Field>
          </div>
        </Section>

        {/* Caractéristiques */}
        <Section title="Caractéristiques" icon={Gauge}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <Dropdown
                value={draft.category}
                options={categories.map((c) => ({ value: c, label: c }))}
                onChange={(v) => set("category", v as CarCategory)}
              />
            </Field>
            <Field label="Carburant">
              <Dropdown
                value={draft.fuel}
                options={fuels.map((f) => ({ value: f, label: f }))}
                onChange={(v) => set("fuel", v as FuelType)}
              />
            </Field>
            <Field label="Kilométrage actuel" required error={errors.km}>
              <Input
                type="number"
                value={draft.km}
                onChange={(v) => set("km", v === "" ? "" : Number(v))}
                placeholder="45000"
                suffix="km"
                invalid={!!errors.km}
              />
            </Field>
            <Field label="Statut">
              <Dropdown
                value={draft.status}
                options={statuses.map((s) => ({
                  value: s,
                  label: statusConfig[s].label,
                  dot: statusConfig[s].dotClass,
                }))}
                onChange={(v) => set("status", v as CarStatus)}
              />
            </Field>
          </div>
        </Section>

        {/* Tarification */}
        <Section title={fr.fleet.pricing.title} icon={Gauge}>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-800">{fr.fleet.pricing.unsupportedTitle}</p>
            <p className="mt-0.5 text-[11px] text-amber-700">{fr.fleet.pricing.unsupportedDescription}</p>
          </div>
        </Section>

        {/* Documents */}
        <Section title="Documents & échéances" icon={ShieldCheck}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Compagnie d'assurance">
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={draft.insuranceCompany}
                    onChange={(e) => set("insuranceCompany", e.target.value)}
                    placeholder="Wafa Assurance"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </Field>
              <Field label="Assurance — fin de validité">
                <DateInput value={draft.insuranceEnd} onChange={(v) => set("insuranceEnd", v)} />
              </Field>
              <DocumentUploadField
                label={fr.fleet.upload.insuranceDocument}
                value={draft.insuranceDocumentUrl}
                uploading={uploadingField === "insuranceDocumentUrl"}
                onChange={(ev) => uploadDocument(ev, "insuranceDocumentUrl", "fleet/insurance")}
              />
              <Field label="Vignette — fin de validité">
                <DateInput value={draft.vignetteEnd} onChange={(v) => set("vignetteEnd", v)} />
              </Field>
              <DocumentUploadField
                label={fr.fleet.upload.vignetteDocument}
                value={draft.vignetteDocumentUrl}
                uploading={uploadingField === "vignetteDocumentUrl"}
                onChange={(ev) => uploadDocument(ev, "vignetteDocumentUrl", "fleet/vignettes")}
              />
              <Field label="Visite technique — prochaine">
                <DateInput value={draft.visiteNext} onChange={(v) => set("visiteNext", v)} />
              </Field>
              <DocumentUploadField
                label={fr.fleet.upload.inspectionDocument}
                value={draft.inspectionDocumentUrl}
                uploading={uploadingField === "inspectionDocumentUrl"}
                onChange={(ev) => uploadDocument(ev, "inspectionDocumentUrl", "fleet/inspections")}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
              <Sticker className="h-4 w-4 text-amber-500" />
              <p className="text-[11px] text-slate-500">
                Les statuts (à jour / bientôt expiré / expiré) sont calculés automatiquement à
                partir des dates renseignées.
              </p>
            </div>
          </div>
        </Section>

      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-slate-100 bg-white/90 px-6 py-4 backdrop-blur">
        <p className="text-[11px] text-slate-400">
          <span className="text-rose-500">*</span> Champs obligatoires
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)] disabled:opacity-70"
          >
            {!saving && (
              <motion.span
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
            )}
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span className="relative">Enregistrement…</span>
              </>
            ) : (
              <>
                <Check className="relative h-4 w-4" />
                <span className="relative">
                  {mode === "add" ? "Ajouter le véhicule" : "Enregistrer"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

/* ---------- Primitives ---------- */

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        {required && <span className="text-[10px] font-medium text-rose-500">*</span>}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-medium text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  suffix,
  mono,
  invalid,
}: {
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  suffix?: string
  mono?: boolean
  invalid?: boolean
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2",
          suffix && "pr-12",
          mono && "font-mono font-semibold tracking-wider",
          invalid
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-slate-200 focus:border-indigo-300 focus:ring-indigo-100",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
    />
  )
}

function DocumentUploadField({
  label,
  value,
  uploading,
  onChange,
}: {
  label: string
  value: string
  uploading: boolean
  onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <Field label={label}>
      <label className="flex h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700">
        <span className="flex min-w-0 items-center gap-2">
          {uploading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="truncate">
            {uploading
              ? fr.fleet.upload.uploading
              : value
                ? fr.fleet.upload.replaceFile
                : fr.fleet.upload.chooseFile}
          </span>
        </span>
        {value && !uploading && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            {fr.fleet.upload.uploaded}
          </span>
        )}
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={onChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      <p className="text-[10px] text-slate-400">{fr.fleet.upload.hint}</p>
    </Field>
  )
}

function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string; dot?: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <span className="flex items-center gap-2">
          {selected?.dot && <span className={cn("h-2 w-2 rounded-full", selected.dot)} />}
          {selected?.label}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10"
          >
            {options.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition",
                  value === o.value ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50",
                )}
              >
                <span className="flex items-center gap-2">
                  {o.dot && <span className={cn("h-2 w-2 rounded-full", o.dot)} />}
                  {o.label}
                </span>
                {value === o.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
