"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  IdCard,
  Sparkles,
  UserPlus,
  Save,
  Building,
} from "lucide-react"
import { type Client, type Nationality } from "@/lib/clients-data"
import { cn } from "@/lib/utils"

const nationalities: Nationality[] = ["Marocain", "Français", "Espagnol", "Anglais", "Allemand"]

type Mode = "create" | "edit"

export type ClientFormValues = {
  type: "individual" | "company"
  // Individual
  fullName?: string
  phone: string
  email: string
  city: string
  nationality?: Nationality
  idType?: "CIN" | "Passeport"
  idNumber?: string
  licenseNumber?: string
  // Company
  companyName?: string
  registrationNumber?: string
  taxId?: string
  contactPersonName?: string
  contactPersonPhone?: string
}

const defaultValues: ClientFormValues = {
  type: "individual",
  fullName: "",
  phone: "+212 6",
  email: "",
  city: "",
  nationality: "Marocain",
  idType: "CIN",
  idNumber: "",
  licenseNumber: "",
  companyName: "",
  registrationNumber: "",
  taxId: "",
  contactPersonName: "",
  contactPersonPhone: "+212 6",
}

function Field({
  icon: Icon,
  label,
  required,
  hint,
  children,
}: {
  icon: React.ElementType
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="ml-1 font-normal normal-case text-slate-400">— {hint}</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function ClientFormDialog({
  open,
  mode,
  client,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: Mode
  client?: Client | null
  onClose: () => void
  onSubmit: (values: ClientFormValues) => Promise<boolean>
}) {
  const [values, setValues] = useState<ClientFormValues>(defaultValues)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && client) {
        setValues({
          type: client.type,
          fullName: client.fullName,
          phone: client.phone,
          email: client.email,
          city: client.city,
          nationality: client.nationality,
          idType: client.idType,
          idNumber: client.idNumber,
          licenseNumber: client.licenseNumber,
          companyName: client.companyName,
          registrationNumber: client.registrationNumber,
          taxId: client.taxId,
          contactPersonName: client.contactPersonName,
          contactPersonPhone: client.contactPersonPhone,
        })
      } else {
        setValues(defaultValues)
      }
    }
  }, [open, mode, client])

  const valid =
    values.phone.trim().length > 5 &&
    values.email.trim().length > 3 &&
    (values.type === "individual"
      ? (values.fullName?.trim().length ?? 0) > 1 && (values.idNumber?.trim().length ?? 0) > 2
      : (values.companyName?.trim().length ?? 0) > 1 &&
        (values.registrationNumber?.trim().length ?? 0) > 2 &&
        (values.contactPersonName?.trim().length ?? 0) > 1)

  const submit = async () => {
    if (!valid) return
    setSaving(true)
    try {
      const ok = await onSubmit(values)
      if (ok) onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-[0_0_60px_rgba(15,23,42,0.20)]"
          >
            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      mode === "create"
                        ? "from-indigo-500 to-blue-600"
                        : "from-amber-500 to-orange-500",
                    )}
                  >
                    {mode === "create" ? (
                      <UserPlus className="h-5 w-5" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-slate-900">
                      {mode === "create" ? "Ajouter un client" : "Modifier le client"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {mode === "create"
                        ? "Ajoutez un nouveau client à votre CRM"
                        : "Mettez à jour les informations du dossier"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {/* Client Type Selector */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Type de client
                  </label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {(["individual", "company"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        disabled={mode === "edit"}
                        onClick={() =>
                          setValues({
                            ...defaultValues,
                            type: t,
                            phone: values.phone || defaultValues.phone,
                            email: values.email || defaultValues.email,
                            city: values.city || defaultValues.city,
                          })
                        }
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition",
                          values.type === t
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900",
                          mode === "edit" && "cursor-not-allowed opacity-70",
                        )}
                      >
                        {t === "individual" ? (
                          <>
                            <User className="h-3.5 w-3.5" />
                            Particulier
                          </>
                        ) : (
                          <>
                            <Building className="h-3.5 w-3.5" />
                            Entreprise
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Fields */}
                {values.type === "individual" && (
                  <>
                    <Field icon={User} label="Nom complet" required>
                  <input
                    value={values.fullName}
                    onChange={(e) => setValues({ ...values, fullName: e.target.value })}
                    placeholder="Ahmed Benali"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field icon={Phone} label="Téléphone" required>
                    <input
                      value={values.phone}
                      onChange={(e) => setValues({ ...values, phone: e.target.value })}
                      placeholder="+212 6 12 34 56 78"
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </Field>
                  <Field icon={Mail} label="Email" required>
                    <input
                      type="email"
                      value={values.email}
                      onChange={(e) => setValues({ ...values, email: e.target.value })}
                      placeholder="ahmed@email.com"
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field icon={MapPin} label="Ville">
                    <input
                      value={values.city}
                      onChange={(e) => setValues({ ...values, city: e.target.value })}
                      placeholder="Casablanca"
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </Field>
                  <Field icon={Globe} label="Nationalité">
                    <select
                      value={values.nationality}
                      onChange={(e) =>
                        setValues({ ...values, nationality: e.target.value as Nationality })
                      }
                      className="block w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2.5 pr-9 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {nationalities.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pièce d&apos;identité
                    </h3>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                      {(["CIN", "Passeport"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setValues({ ...values, idType: t })}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                            values.idType === t
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-900",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field
                    icon={IdCard}
                    label={values.idType === "CIN" ? "Numéro CIN" : "Numéro Passeport"}
                    required
                  >
                    <input
                      value={values.idNumber}
                      onChange={(e) => setValues({ ...values, idNumber: e.target.value })}
                      placeholder={values.idType === "CIN" ? "BK485912" : "20FH48291"}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </Field>
                </div>

                <Field icon={Sparkles} label="Permis de conduire" hint="optionnel">
                  <input
                    value={values.licenseNumber}
                    onChange={(e) => setValues({ ...values, licenseNumber: e.target.value })}
                    placeholder="12/45891/CS"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </Field>
                  </>
                )}

                {/* Company Fields */}
                {values.type === "company" && (
                  <>
                    <Field icon={Building} label="Nom de l'entreprise" required>
                      <input
                        value={values.companyName || ""}
                        onChange={(e) => setValues({ ...values, companyName: e.target.value })}
                        placeholder="Société Example SARL"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field icon={IdCard} label="Numéro ICE" required hint="Identifiant Collecteur Entreprise">
                        <input
                          value={values.registrationNumber || ""}
                          onChange={(e) => setValues({ ...values, registrationNumber: e.target.value })}
                          placeholder="001234567890123"
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </Field>
                      <Field icon={IdCard} label="Numéro fiscal">
                        <input
                          value={values.taxId || ""}
                          onChange={(e) => setValues({ ...values, taxId: e.target.value })}
                          placeholder="12345678"
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </Field>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                        Personne de contact
                      </h3>
                      <Field icon={User} label="Nom et prénom" required>
                        <input
                          value={values.contactPersonName || ""}
                          onChange={(e) => setValues({ ...values, contactPersonName: e.target.value })}
                          placeholder="Ahmed Benali"
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </Field>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <Field icon={Phone} label="Téléphone">
                          <input
                            value={values.contactPersonPhone || ""}
                            onChange={(e) => setValues({ ...values, contactPersonPhone: e.target.value })}
                            placeholder="+212 6 12 34 56 78"
                            className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Common fields for company */}
                    <div className="grid grid-cols-2 gap-4">
                      <Field icon={Phone} label="Téléphone" required>
                        <input
                          value={values.phone}
                          onChange={(e) => setValues({ ...values, phone: e.target.value })}
                          placeholder="+212 6 12 34 56 78"
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </Field>
                      <Field icon={Mail} label="Email" required>
                        <input
                          type="email"
                          value={values.email}
                          onChange={(e) => setValues({ ...values, email: e.target.value })}
                          placeholder="info@company.com"
                          className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </Field>
                    </div>

                    <Field icon={MapPin} label="Ville">
                      <input
                        value={values.city}
                        onChange={(e) => setValues({ ...values, city: e.target.value })}
                        placeholder="Casablanca"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  onClick={submit}
                  disabled={!valid || saving}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement…
                    </>
                  ) : mode === "create" ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Ajouter le client
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
