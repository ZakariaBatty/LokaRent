"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, UserPlus, Save, User, Mail, Phone, Building2, Shield } from "lucide-react"
import {
  type GlobalUser,
  type AgencyMembership,
  type UserRole,
  mockAgencies,
  roleLabels,
} from "@/lib/mock-workspaces"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export type MemberFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  agencyId: string
  role: UserRole
}

const defaultValues: MemberFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "+212 6",
  agencyId: mockAgencies[0]?.id ?? "",
  role: "EMPLOYEE",
}

const roles: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE"]

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
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"

export function MemberFormSheet({
  open,
  mode,
  member,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  member?: { user: GlobalUser; membership: AgencyMembership } | null
  onClose: () => void
  onSubmit: (values: MemberFormValues) => void
}) {
  const [values, setValues] = useState<MemberFormValues>(defaultValues)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === "edit" && member) {
      setValues({
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        phone: member.user.phone ?? "+212 6",
        agencyId: member.membership.agencyId,
        role: member.membership.role,
      })
    } else {
      setValues(defaultValues)
    }
  }, [open, mode, member])

  const valid =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    values.email.includes("@") &&
    values.agencyId.length > 0

  const submit = async () => {
    if (!valid) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    onSubmit(values)
    setSaving(false)
    toast.success(mode === "create" ? "Membre ajouté" : "Membre mis à jour", {
      description:
        mode === "create"
          ? `${values.firstName} ${values.lastName} a été ajouté au workspace.`
          : "Les informations ont été enregistrées.",
    })
    onClose()
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
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                    mode === "create" ? "from-indigo-500 to-blue-600" : "from-amber-500 to-orange-500",
                  )}>
                    {mode === "create" ? <UserPlus className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-slate-900">
                      {mode === "create" ? "Ajouter un membre" : "Modifier le membre"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {mode === "create"
                        ? "Invitez un nouveau collaborateur au workspace"
                        : "Mettez à jour le profil et les accès"}
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
                <div className="grid grid-cols-2 gap-4">
                  <Field icon={User} label="Prénom" required>
                    <input
                      value={values.firstName}
                      onChange={(e) => setValues({ ...values, firstName: e.target.value })}
                      placeholder="Ahmed"
                      className={inputCls}
                    />
                  </Field>
                  <Field icon={User} label="Nom" required>
                    <input
                      value={values.lastName}
                      onChange={(e) => setValues({ ...values, lastName: e.target.value })}
                      placeholder="Bennani"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field icon={Mail} label="Email" required>
                  <input
                    type="email"
                    value={values.email}
                    onChange={(e) => setValues({ ...values, email: e.target.value })}
                    placeholder="ahmed@lokarent.ma"
                    className={inputCls}
                  />
                </Field>

                <Field icon={Phone} label="Téléphone">
                  <input
                    value={values.phone}
                    onChange={(e) => setValues({ ...values, phone: e.target.value })}
                    placeholder="+212 6 12 34 56 78"
                    className={cn(inputCls, "font-mono tabular-nums")}
                  />
                </Field>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Accès & rôle
                  </h3>
                  <Field icon={Building2} label="Agence" required>
                    <select
                      value={values.agencyId}
                      onChange={(e) => setValues({ ...values, agencyId: e.target.value })}
                      className={cn(inputCls, "appearance-none")}
                    >
                      {mockAgencies.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field icon={Shield} label="Rôle" required>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setValues({ ...values, role: r })}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                            values.role === r
                              ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          {roleLabels[r]}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)] transition hover:shadow-[0_6px_24px_rgba(99,102,241,0.40)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enregistrement…
                    </>
                  ) : mode === "create" ? (
                    <><UserPlus className="h-4 w-4" />Ajouter le membre</>
                  ) : (
                    <><Save className="h-4 w-4" />Enregistrer</>
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
