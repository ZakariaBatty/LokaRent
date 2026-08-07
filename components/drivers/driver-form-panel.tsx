"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Calendar, Clock, DollarSign, FileText, IdCard, Mail, Phone, Save, User, UserPlus, Wallet, X } from "lucide-react"
import { type Driver, type DriverStatus, type PaymentType } from "@/lib/drivers-data"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

export type DriverFormValues = {
  reference: string
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
  cinNumber: string
  cinExpiry: string
  licenseNumber: string
  licenseExpiry: string
  status: DriverStatus
  paymentType: PaymentType
  monthlySalary: string
  pricePerHour: string
  pricePerMission: string
}

const defaultValues: DriverFormValues = {
  reference: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  notes: "",
  cinNumber: "",
  cinExpiry: "",
  licenseNumber: "",
  licenseExpiry: "",
  status: "active",
  paymentType: "monthly",
  monthlySalary: "",
  pricePerHour: "",
  pricePerMission: "",
}

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : ""
}

function Field({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon: React.ElementType
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

const inputCls =
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"

const selectCls =
  "block w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"

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
  onSubmit: (values: DriverFormValues) => Promise<boolean>
}) {
  const [values, setValues] = useState<DriverFormValues>(defaultValues)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === "edit" && driver) {
      setValues({
        reference: driver.reference ?? "",
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
        email: driver.email,
        notes: driver.notes,
        cinNumber: driver.cinNumber,
        cinExpiry: dateOnly(driver.cinExpiry),
        licenseNumber: driver.licenseNumber,
        licenseExpiry: dateOnly(driver.licenseExpiry),
        status: driver.status,
        paymentType: driver.paymentType,
        monthlySalary: driver.currentRate.monthlySalary?.toString() ?? "",
        pricePerHour: driver.currentRate.pricePerHour?.toString() ?? "",
        pricePerMission: driver.currentRate.pricePerMission?.toString() ?? "",
      })
      return
    }
    setValues(defaultValues)
  }, [open, mode, driver])

  const valid =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    (values.paymentType === "monthly"
      ? values.monthlySalary.trim().length > 0
      : values.paymentType === "hourly"
        ? values.pricePerHour.trim().length > 0
        : values.pricePerMission.trim().length > 0)

  const submit = async () => {
    if (!valid || saving) return
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed left-0 top-0 z-50 flex h-full w-full max-w-4xl flex-col bg-white shadow-[4px_0_60px_rgba(15,23,42,0.18)]"
          >
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
                      {mode === "create" ? fr.drivers.addDriver : fr.drivers.editDriver}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {mode === "create" ? fr.drivers.form.createDescription : fr.drivers.form.editDescription}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={fr.drivers.form.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {fr.drivers.form.identity}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field icon={FileText} label={fr.drivers.reference}>
                      <input
                        value={values.reference}
                        onChange={(e) => setValues({ ...values, reference: e.target.value })}
                        placeholder={fr.drivers.form.referencePlaceholder}
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={User} label={fr.drivers.status.label}>
                      <select
                        value={values.status}
                        onChange={(e) => setValues({ ...values, status: e.target.value as DriverStatus })}
                        className={selectCls}
                      >
                        <option value="active">{fr.drivers.status.active}</option>
                        <option value="inactive">{fr.drivers.status.inactive}</option>
                        <option value="suspended">{fr.drivers.status.suspended}</option>
                      </select>
                    </Field>
                    <Field icon={User} label={fr.drivers.firstName} required>
                      <input
                        value={values.firstName}
                        onChange={(e) => setValues({ ...values, firstName: e.target.value })}
                        placeholder={fr.drivers.form.firstNamePlaceholder}
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={User} label={fr.drivers.lastName} required>
                      <input
                        value={values.lastName}
                        onChange={(e) => setValues({ ...values, lastName: e.target.value })}
                        placeholder={fr.drivers.form.lastNamePlaceholder}
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={Phone} label={fr.drivers.phone}>
                      <input
                        value={values.phone}
                        onChange={(e) => setValues({ ...values, phone: e.target.value })}
                        placeholder={fr.drivers.form.phonePlaceholder}
                        className={cn(inputCls, "font-mono tabular-nums")}
                      />
                    </Field>
                    <Field icon={Mail} label={fr.drivers.email}>
                      <input
                        type="email"
                        value={values.email}
                        onChange={(e) => setValues({ ...values, email: e.target.value })}
                        placeholder={fr.drivers.form.emailPlaceholder}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-slate-100 md:col-span-2" />

                <div className="md:col-span-2">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {fr.drivers.form.documents}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field icon={IdCard} label={fr.drivers.cinNumber}>
                      <input
                        value={values.cinNumber}
                        onChange={(e) => setValues({ ...values, cinNumber: e.target.value.toUpperCase() })}
                        placeholder={fr.drivers.form.cinPlaceholder}
                        className={cn(inputCls, "font-mono uppercase")}
                      />
                    </Field>
                    <Field icon={Calendar} label={fr.drivers.cinExpiry}>
                      <input
                        type="date"
                        value={values.cinExpiry}
                        onChange={(e) => setValues({ ...values, cinExpiry: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field icon={IdCard} label={fr.drivers.licenseNumber}>
                      <input
                        value={values.licenseNumber}
                        onChange={(e) => setValues({ ...values, licenseNumber: e.target.value })}
                        placeholder={fr.drivers.form.licensePlaceholder}
                        className={cn(inputCls, "font-mono")}
                      />
                    </Field>
                    <Field icon={Calendar} label={fr.drivers.licenseExpiry}>
                      <input
                        type="date"
                        value={values.licenseExpiry}
                        onChange={(e) => setValues({ ...values, licenseExpiry: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-slate-100 md:col-span-2" />

                <div className="md:col-span-2">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {fr.drivers.form.pricing}
                  </h3>
                  <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {(["monthly", "hourly", "mission"] as const).map((type) => (
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
                        {fr.drivers.pricing[type]}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {values.paymentType === "monthly" && (
                      <Field icon={DollarSign} label={fr.drivers.pricing.monthlyRate} required>
                        <input
                          type="number"
                          value={values.monthlySalary}
                          onChange={(e) => setValues({ ...values, monthlySalary: e.target.value })}
                          placeholder="4500"
                          min={0}
                          className={cn(inputCls, "font-mono tabular-nums")}
                        />
                      </Field>
                    )}
                    {values.paymentType === "hourly" && (
                      <Field icon={Clock} label={fr.drivers.pricing.hourlyRate} required>
                        <input
                          type="number"
                          value={values.pricePerHour}
                          onChange={(e) => setValues({ ...values, pricePerHour: e.target.value })}
                          placeholder="60"
                          min={0}
                          className={cn(inputCls, "font-mono tabular-nums")}
                        />
                      </Field>
                    )}
                    {values.paymentType === "mission" && (
                      <Field icon={DollarSign} label={fr.drivers.pricing.missionRate} required>
                        <input
                          type="number"
                          value={values.pricePerMission}
                          onChange={(e) => setValues({ ...values, pricePerMission: e.target.value })}
                          placeholder="350"
                          min={0}
                          className={cn(inputCls, "font-mono tabular-nums")}
                        />
                      </Field>
                    )}
                    <Field icon={FileText} label={fr.drivers.notes}>
                      <textarea
                        value={values.notes}
                        onChange={(e) => setValues({ ...values, notes: e.target.value })}
                        placeholder={fr.drivers.form.notesPlaceholder}
                        className={cn(inputCls, "min-h-24 resize-none")}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {fr.drivers.form.cancel}
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
                  {mode === "create" ? fr.drivers.form.createSubmit : fr.drivers.form.save}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
