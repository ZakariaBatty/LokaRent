"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  AlertTriangle,
  Ban,
  Check,
  CreditCard,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { avatarGradient, getInitials, statusConfig } from "@/lib/clients-data"
import { useWizard, type SelectedClient } from "./wizard-context"
import { StepHeader } from "./step-header"

function toSelected(c: ReturnType<typeof useWizard>["clients"][number]): SelectedClient {
  return {
    id: c.id,
    name: c.fullName,
    phone: c.phone,
    email: c.email,
    status: c.status,
    idType: c.idType ?? "CIN",
    idNumber: c.idNumber ?? "",
    licenseExpiry: c.licenseExpiry,
  }
}

function daysUntil(iso?: string) {
  if (!iso) return Infinity
  const d = new Date(iso).getTime()
  const now = Date.now()
  return Math.floor((d - now) / (1000 * 60 * 60 * 24))
}

export function StepClient() {
  const { state, setState, setNewClient, clients } = useWizard()
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients.slice(0, 5)
    return clients
      .filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          (c.idNumber ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query])

  const selected = state.selectedClient
  const selectedFull = selected ? clients.find((c) => c.id === selected.id) : null

  // Warnings
  const isBlacklisted = selected?.status === "blacklist"
  const permitDays = selected ? daysUntil(selected.licenseExpiry) : Infinity
  const permitWarning =
    selected && permitDays !== Infinity && permitDays < 30 && permitDays >= 0
  const permitExpired = selected && permitDays < 0

  return (
    <div>
      <StepHeader
        icon={Users}
        eyebrow="Étape 1 sur 5"
        title="Sélectionner un client"
        description="Recherchez un client existant ou créez-en un nouveau. Le système détecte automatiquement les risques (blacklist, permis expiré)."
      />

      {/* Mode toggle */}
      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(
          [
            { id: "existing", label: "Client existant", icon: Search },
            { id: "new", label: "Nouveau client", icon: UserPlus },
          ] as const
        ).map((m) => {
          const active = state.clientMode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                setState({ clientMode: m.id, selectedClient: m.id === "new" ? null : state.selectedClient })
              }
              className={cn(
                "relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {active && (
                <motion.span
                  layoutId="client-mode-pill"
                  className="absolute inset-0 rounded-lg bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/80"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <m.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{m.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {state.clientMode === "existing" ? (
          <motion.div
            key="existing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom, téléphone, CIN ou passeport..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:border-blue-300 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
              />
            </div>

            {/* Results list */}
            {!selected && (
              <div className="space-y-2">
                {results.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center text-sm text-slate-500">
                    Aucun client trouvé pour « {query} »
                  </div>
                ) : (
                  results.map((c, i) => {
                    const cfg = statusConfig[c.status]
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setState({ selectedClient: toSelected(c) })}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
                      >
                        <div
                          className={cn(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white",
                            avatarGradient(c.id),
                          )}
                        >
                          {getInitials(c.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {c.fullName}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                cfg.pillClass,
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
                              {cfg.label}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {c.idType}
                            </span>
                          </div>
                        </div>
                        <span className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 group-hover:border-blue-200 group-hover:text-blue-600">
                          Choisir
                        </span>
                      </motion.button>
                    )
                  })
                )}
              </div>
            )}

            {/* Selected card */}
            {selected && selectedFull && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold text-white shadow-md",
                      avatarGradient(selected.id),
                    )}
                  >
                    {getInitials(selected.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {selected.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        <Check className="h-3 w-3" />
                        Sélectionné
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {selected.phone}
                      </span>
                      {selected.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {selected.email}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        {selected.idType} · {selected.idNumber}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setState({ selectedClient: null })}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Changer
                  </button>
                </div>

                {/* Intelligence warnings */}
                <div className="mt-4 space-y-2">
                  {isBlacklisted && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3"
                    >
                      <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                      <div className="text-sm">
                        <div className="font-semibold text-rose-900">
                          Client blacklisté
                        </div>
                        <p className="mt-0.5 text-rose-700">
                          La création de réservation est bloquée pour ce client.
                          {selectedFull.blacklistReason && (
                            <span className="ml-1 italic">
                              Motif : {selectedFull.blacklistReason}
                            </span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {permitExpired && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                      <div className="text-sm">
                        <div className="font-semibold text-rose-900">Permis expiré</div>
                        <p className="mt-0.5 text-rose-700">
                          Le permis de conduire est expiré. Vérifiez avant de continuer.
                        </p>
                      </div>
                    </div>
                  )}
                  {permitWarning && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <div className="text-sm">
                        <div className="font-semibold text-amber-900">
                          Permis bientôt expiré
                        </div>
                        <p className="mt-0.5 text-amber-700">
                          Le permis expire dans {permitDays} jour{permitDays > 1 ? "s" : ""}.
                        </p>
                      </div>
                    </div>
                  )}
                  {!isBlacklisted && !permitExpired && !permitWarning && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div className="text-sm">
                        <div className="font-semibold text-emerald-900">
                          Aucune anomalie détectée
                        </div>
                        <p className="mt-0.5 text-emerald-700">
                          Le client peut louer en toute conformité.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <User className="h-4 w-4 text-blue-600" />
              Nouveau client
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nom" required>
                <input
                  value={state.newClient.lastName}
                  onChange={(e) => setNewClient({ lastName: e.target.value })}
                  className="field-input"
                  placeholder="Benali"
                />
              </Field>
              <Field label="Prénom" required>
                <input
                  value={state.newClient.firstName}
                  onChange={(e) => setNewClient({ firstName: e.target.value })}
                  className="field-input"
                  placeholder="Ahmed"
                />
              </Field>
              <Field label="Téléphone" required>
                <input
                  value={state.newClient.phone}
                  onChange={(e) => setNewClient({ phone: e.target.value })}
                  className="field-input"
                  placeholder="+212 6 12 34 56 78"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={state.newClient.email}
                  onChange={(e) => setNewClient({ email: e.target.value })}
                  className="field-input"
                  placeholder="ahmed@example.com"
                />
              </Field>

              <Field label="Type de pièce" required>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {(["CIN", "Passeport"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewClient({ idType: t })}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                        state.newClient.idType === t
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={state.newClient.idType === "CIN" ? "Numéro CIN" : "Numéro passeport"} required>
                <input
                  value={state.newClient.idNumber}
                  onChange={(e) => setNewClient({ idNumber: e.target.value })}
                  className="field-input font-mono"
                  placeholder={state.newClient.idType === "CIN" ? "AB123456" : "MA1234567"}
                />
              </Field>

              <Field label="Numéro permis">
                <input
                  value={state.newClient.licenseNumber}
                  onChange={(e) => setNewClient({ licenseNumber: e.target.value })}
                  className="field-input font-mono"
                  placeholder="123456/B"
                />
              </Field>
              <Field label="Expiration permis">
                <input
                  type="date"
                  value={state.newClient.licenseExpiry}
                  onChange={(e) => setNewClient({ licenseExpiry: e.target.value })}
                  className="field-input"
                />
              </Field>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Le client sera créé automatiquement et ajouté à votre base CRM lors de la confirmation.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </div>
      {children}
    </label>
  )
}
