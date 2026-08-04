"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Calculator,
  Calendar,
  Crown,
  Mail,
  Send,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react"
import { roleStyles, type UserRole } from "@/lib/users-data"

const roleIcons: Record<UserRole, typeof Crown> = {
  Gérant: Crown,
  Réceptionniste: Calendar,
  Comptable: Calculator,
}

export function InvitationPanel({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    firstName: string
    lastName: string
    email: string
    role: UserRole
    message: string
  }) => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("Réceptionniste")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = firstName.trim() && lastName.trim() && email.trim().includes("@")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setTimeout(() => {
      onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
        message: message.trim(),
      })
      setFirstName("")
      setLastName("")
      setEmail("")
      setRole("Réceptionniste")
      setMessage("")
      setSubmitting(false)
    }, 700)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Inviter un utilisateur
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    L&apos;invitation expire dans 7 jours
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                {/* Identity */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Identité
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        className="field-input pl-9"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      className="field-input"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Email professionnel
                  </label>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="prenom.nom@entreprise.ma"
                      className="field-input pl-9"
                      required
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    L&apos;invitation sera envoyée à cette adresse avec un lien sécurisé.
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Rôle attribué
                  </label>
                  <div className="mt-1.5 grid grid-cols-1 gap-2">
                    {(Object.keys(roleStyles) as UserRole[]).map((r) => {
                      const Icon = roleIcons[r]
                      const style = roleStyles[r]
                      const active = role === r
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                            active
                              ? "border-indigo-300 bg-indigo-50/40 ring-2 ring-indigo-200"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${
                              style.badge
                            } ${style.ring}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-900">{r}</span>
                              {active && (
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white">
                                  <svg
                                    className="h-3 w-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                              {style.scope}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Message personnalisé
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">(optionnel)</span>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Bienvenue dans l'équipe ! Tu auras accès à..."
                    className="field-input mt-1.5 resize-none"
                  />
                </div>

                {/* Tip */}
                <div className="flex items-start gap-3 rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 p-3.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <p className="text-xs leading-relaxed text-slate-700">
                    L&apos;utilisateur recevra un email contenant un lien de connexion sécurisé. Il
                    devra créer son mot de passe à la première connexion.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {submitting ? (
                    <svg
                      className="relative h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeOpacity="0.25"
                        strokeWidth="3"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <Send className="relative h-4 w-4" />
                  )}
                  <span className="relative">
                    {submitting ? "Envoi..." : "Envoyer l'invitation"}
                  </span>
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
