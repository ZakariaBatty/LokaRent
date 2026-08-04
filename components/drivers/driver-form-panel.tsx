"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  X, UserPlus, Save, User, Phone, Mail, MapPin, IdCard, CarFront, Calendar,
  Wallet, DollarSign, Clock,
} from "lucide-react"
import { type Driver, type PaymentType, type DriverStatus } from "@/lib/drivers-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type DriverFormValues = {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  city: string
  cinNumber: string
  cinExpiry: string
  licenseNumber: string
  licenseExpiry: string
  licenseCategory: string
  status: DriverStatus
  paymentType: PaymentType
  // Monthly
  monthlySalary: string
  // Mission
  pricePerHour: string
  pricePerMission: string
}

const defaultValues: DriverFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  cinNumber: "",
  cinExpiry: "",
  licenseNumber: "",
  licenseExpiry: "",
  licenseCategory: "B",
  status: "active",
  paymentType: "monthly",
  monthlySalary: "",
  pricePerHour: "",
  pricePerMission: "",
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

const inputCls =
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"

const selectCls =
  "block w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2.5 pr-9 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"

type Mode = "create" | "edit"

export function DriverFormPanel({
  open,
  mode,
  driver,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: Mode
  driver?: Driver | null
  onClose: () => void
  onSubmit: (values: DriverFormValues) => void
}) {
  const [values, setValues] = useState<DriverFormValues>(defaultValues)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && driver) {
        setValues({
          firstName: driver.firstName,
          lastName: driver.lastName,
          phone: driver.phone,
          email: driver.email,
          address: driver.address,
          city: driver.city,
          cinNumber: driver.cinNumber,
          cinExpiry: driver.cinExpiry.slice(0, 10),
          licenseNumber: driver.licenseNumber,
          licenseExpiry: driver.licenseExpiry.slice(0, 10),
          licenseCategory: driver.licenseCategory,
          status: driver.status,
          paymentType: driver.paymentType,
          monthlySalary: driver.currentRate.monthlySalary?.toString() ?? "",
          pricePerHour: driver.currentRate.pricePerHour?.toString() ?? "",
          pricePerMission: driver.currentRate.pricePerMission?.toString() ?? "",
        })
      } else {
        setValues(defaultValues)
      }
    }
  }, [open, mode, driver])

  const valid =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    values.phone.trim().length > 5 &&
    values.cinNumber.trim().length > 2 &&
    values.licenseNumber.trim().length > 2 &&
    (values.paymentType === "monthly"
      ? values.monthlySalary.trim().length > 0
      : values.pricePerMission.trim().length > 0)

  const submit = async () => {
    if (!valid) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    onSubmit(values)
    setSaving(false)
    toast.success(mode === "create" ? "Chauffeur ajouté" : "Chauffeur mis à jour", {
      description:
        mode === "create"
          ? `${values.firstName} ${values.lastName} a été ajouté.`
          : "Les informations ont été enregistrées.",
    })
    onClose()
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

          {/* Panel — slides from LEFT, ~80% width */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed left-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-white shadow-[4px_0_60px_rgba(15,23,42,0.18)]"
          >
            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      mode === "create" ? "from-blue-500 to-indigo-600" : "from-amber-500 to-orange-500",
                    )}
                  >
                    {mode === "create" ? <UserPlus className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-slate-900">
                      {mode === "create" ? "Ajouter un chauffeur" : "Modifier le chauffeur"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {mode === "create"
                        ? "Enregistrez un nouveau chauffeur dans le système"
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
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {/* Section: Informations personnelles */}
                <div className="col-span-2">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field icon={User} label="Prénom" required>
                      <input
                        value={values.firstName}
                        onChange={(e) => setValues({ ...values, firstName: e.target.value })}
                        placeholder="Youssef"
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={User} label="Nom" required>
                      <input
                        value={values.lastName}
                        onChange={(e) => setValues({ ...values, lastName: e.target.value })}
                        placeholder="Moukrim"
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={Phone} label="Téléphone" required>
                      <input
                        value={values.phone}
                        onChange={(e) => setValues({ ...values, phone: e.target.value })}
                        placeholder="+212 6 61 23 45 67"
                        className={cn(inputCls, "font-mono tabular-nums")}
                      />
                    </Field>
                    <Field icon={Mail} label="Email">
                      <input
                        type="email"
                        value={values.email}
                        onChange={(e) => setValues({ ...values, email: e.target.value })}
                        placeholder="chauffeur@email.com"
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={MapPin} label="Adresse">
                      <input
                        value={values.address}
                        onChange={(e) => setValues({ ...values, address: e.target.value })}
                        placeholder="12 Rue Ibn Batouta, Maarif"
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={MapPin} label="Ville">
                      <input
                        value={values.city}
                        onChange={(e) => setValues({ ...values, city: e.target.value })}
                        placeholder="Casablanca"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>

                {/* Divider */}
                <div className="col-span-2 h-px bg-slate-100" />

                {/* Section: Documents */}
                <div className="col-span-2">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Documents d&apos;identité
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field icon={IdCard} label="Numéro CIN" required>
                      <input
                        value={values.cinNumber}
                        onChange={(e) => setValues({ ...values, cinNumber: e.target.value.toUpperCase() })}
                        placeholder="BE482910"
                        className={cn(inputCls, "font-mono uppercase")}
                      />
                    </Field>
                    <Field icon={Calendar} label="Expiration CIN" required>
                      <input
                        type="date"
                        value={values.cinExpiry}
                        onChange={(e) => setValues({ ...values, cinExpiry: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={CarFront} label="Numéro Permis" required>
                      <input
                        value={values.licenseNumber}
                        onChange={(e) => setValues({ ...values, licenseNumber: e.target.value })}
                        placeholder="14/85291/CS"
                        className={cn(inputCls, "font-mono")}
                      />
                    </Field>
                    <Field icon={Calendar} label="Expiration Permis" required>
                      <input
                        type="date"
                        value={values.licenseExpiry}
                        onChange={(e) => setValues({ ...values, licenseExpiry: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={IdCard} label="Catégorie">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                        {["B", "B+C", "B+D", "C", "D"].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setValues({ ...values, licenseCategory: cat })}
                            className={cn(
                              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                              values.licenseCategory === cat
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-900",
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field icon={User} label="Statut">
                      <select
                        value={values.status}
                        onChange={(e) => setValues({ ...values, status: e.target.value as DriverStatus })}
                        className={selectCls}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="suspended">Suspendu</option>
                      </select>
                    </Field>
                  </div>
                </div>

                {/* Divider */}
                <div className="col-span-2 h-px bg-slate-100" />

                {/* Section: Paiement */}
                <div className="col-span-2">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Type de paiement
                  </h3>

                  {/* Payment type toggle */}
                  <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {([["monthly", "Salaire mensuel"], ["mission", "Mission / Heure"]] as const).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValues({ ...values, paymentType: type })}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition",
                          values.paymentType === type
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-900",
                        )}
                      >
                        {type === "monthly" ? <Wallet className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {values.paymentType === "monthly" ? (
                      <Field icon={DollarSign} label="Salaire mensuel (MAD)" required>
                        <input
                          type="number"
                          value={values.monthlySalary}
                          onChange={(e) => setValues({ ...values, monthlySalary: e.target.value })}
                          placeholder="4500"
                          min={0}
                          className={cn(inputCls, "font-mono tabular-nums")}
                        />
                      </Field>
                    ) : (
                      <>
                        <Field icon={DollarSign} label="Prix par mission (MAD)" required>
                          <input
                            type="number"
                            value={values.pricePerMission}
                            onChange={(e) => setValues({ ...values, pricePerMission: e.target.value })}
                            placeholder="350"
                            min={0}
                            className={cn(inputCls, "font-mono tabular-nums")}
                          />
                        </Field>
                        <Field icon={Clock} label="Prix par heure (MAD)" hint="optionnel">
                          <input
                            type="number"
                            value={values.pricePerHour}
                            onChange={(e) => setValues({ ...values, pricePerHour: e.target.value })}
                            placeholder="60"
                            min={0}
                            className={cn(inputCls, "font-mono tabular-nums")}
                          />
                        </Field>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={submit}
                  disabled={!valid || saving}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition",
                    valid && !saving
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-md"
                      : "cursor-not-allowed bg-slate-200 text-slate-400",
                  )}
                >
                  {saving ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                    />
                  ) : mode === "create" ? (
                    <UserPlus className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {mode === "create" ? "Ajouter le chauffeur" : "Enregistrer"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
