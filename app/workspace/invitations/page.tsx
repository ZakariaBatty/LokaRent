"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Mail, RotateCw, Trash2, Plus, X, Send, Building2, Clock } from "lucide-react"
import { toast } from "sonner"
import {
  mockInvitations,
  mockAgencies,
  getAgencyById,
  getUserName,
  roleLabels,
  roleBadgeStyles,
  type TeamInvitation,
  type UserRole,
} from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs"
import { cn } from "@/lib/utils"

const ALL_ROLES: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE"]

type StatusFilter = "all" | "pending" | "accepted" | "expired"

function daysLeft(expiresAt: string) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function seedInvitations(): TeamInvitation[] {
  const base = mockInvitations.map((i) => ({ ...i }))
  // Add a few more mock entries for richer table
  base.push(
    {
      id: "invite_3",
      agencyId: "agency_marrakech",
      email: "driver.marrakech@lokarent.ma",
      role: "EMPLOYEE",
      status: "accepted",
      invitedBy: "user_ahmed_global",
      invitedAt: "2026-05-10T08:00:00Z",
      expiresAt: "2026-05-24T08:00:00Z",
      acceptedAt: "2026-05-12T09:30:00Z",
      token: "token_3",
    },
    {
      id: "invite_4",
      agencyId: "agency_agadir",
      email: "fleet.agadir@lokarent.ma",
      role: "MANAGER",
      status: "expired",
      invitedBy: "user_salma_global",
      invitedAt: "2026-04-01T10:00:00Z",
      expiresAt: "2026-04-15T10:00:00Z",
      token: "token_4",
    },
  )
  return base
}

export default function InvitationsPage() {
  const [invites, setInvites] = useState<TeamInvitation[]>(seedInvitations)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [panelOpen, setPanelOpen] = useState(false)

  // New invitation form state
  const [form, setForm] = useState({
    email: "",
    agencyId: mockAgencies[0]?.id ?? "",
    role: "EMPLOYEE" as UserRole,
    message: "",
  })

  const filtered = useMemo(() => {
    if (statusFilter === "all") return invites
    return invites.filter((i) => i.status === statusFilter)
  }, [invites, statusFilter])

  const counts: Record<StatusFilter, number> = {
    all: invites.length,
    pending: invites.filter((i) => i.status === "pending").length,
    accepted: invites.filter((i) => i.status === "accepted").length,
    expired: invites.filter((i) => i.status === "expired").length,
  }

  function handleResend(invite: TeamInvitation) {
    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    setInvites((prev) =>
      prev.map((i) =>
        i.id === invite.id
          ? { ...i, invitedAt: now.toISOString(), expiresAt: expires.toISOString(), status: "pending" }
          : i,
      ),
    )
    toast.success("Invitation renvoyée", { description: `Email envoyé à ${invite.email}` })
  }

  function handleCancel(id: string) {
    setInvites((prev) => prev.filter((i) => i.id !== id))
    toast.success("Invitation annulée")
  }

  function handleSend() {
    if (!form.email || !form.agencyId) {
      toast.error("Veuillez remplir tous les champs requis.")
      return
    }
    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const newInvite: TeamInvitation = {
      id: `invite_${Date.now()}`,
      agencyId: form.agencyId,
      email: form.email,
      role: form.role,
      status: "pending",
      invitedBy: "user_ahmed_global",
      invitedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      token: `token_${Date.now()}`,
    }
    setInvites((prev) => [newInvite, ...prev])
    setForm({ email: "", agencyId: mockAgencies[0]?.id ?? "", role: "EMPLOYEE", message: "" })
    setPanelOpen(false)
    toast.success("Invitation envoyée", { description: `Email envoyé à ${form.email}` })
  }

  const statusConfig: Record<
    TeamInvitation["status"],
    { label: string; dot: string; bg: string }
  > = {
    pending: { label: "En attente", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
    accepted: { label: "Acceptée", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
    expired: { label: "Expirée", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500" },
  }

  const filterTabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Toutes" },
    { value: "pending", label: "En attente" },
    { value: "accepted", label: "Acceptées" },
    { value: "expired", label: "Expirées" },
  ]

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon={Mail}
          breadcrumb="Invitations"
          title="Invitations"
          description="Suivez et gérez toutes les invitations envoyées aux nouveaux membres."
          actions={
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Nouvelle invitation
            </button>
          }
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200/60 bg-white p-1 shadow-sm w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap",
              statusFilter === tab.value
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {tab.label}
            <span className={cn(
              "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
              statusFilter === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
            )}>
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Mail className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Aucune invitation</p>
          <p className="mt-1 text-xs text-slate-500">
            {statusFilter === "all"
              ? "Envoyez une invitation pour ajouter un membre."
              : "Aucune invitation pour ce filtre."}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="text-xs font-semibold text-slate-500">
              {filtered.length} invitation{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Destinataire</th>
                  <th className="px-4 py-3">Agence</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Invité par</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((invite, idx) => {
                    const agency = getAgencyById(invite.agencyId)
                    const days = daysLeft(invite.expiresAt)
                    const sc = statusConfig[invite.status]
                    return (
                      <motion.tr
                        key={invite.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.02 }}
                        className="group border-b border-slate-100/50 hover:bg-slate-50/40 transition"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                              {invite.email[0].toUpperCase()}
                            </span>
                            <span className="font-medium text-slate-900">{invite.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {agency?.name ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", roleBadgeStyles[invite.role])}>
                            {roleLabels[invite.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {getUserName(invite.invitedBy)}
                        </td>
                        <td className="px-4 py-3.5">
                          {invite.status === "accepted" && invite.acceptedAt ? (
                            <span className="text-xs text-slate-400">
                              Acceptée le {new Date(invite.acceptedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                            </span>
                          ) : invite.status === "expired" ? (
                            <span className="text-xs text-slate-400">Expirée</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                              <span className={cn("text-xs font-medium", days <= 3 ? "text-amber-600" : "text-slate-500")}>
                                {days > 0 ? `${days} jour${days !== 1 ? "s" : ""}` : "Expirée"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", sc.bg)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            {invite.status !== "accepted" && (
                              <button
                                type="button"
                                onClick={() => handleResend(invite)}
                                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                aria-label="Renvoyer"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCancel(invite.id)}
                              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Send invitation slide panel */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm"
              onClick={() => setPanelOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                    <Send className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Nouvelle invitation</h2>
                    <p className="text-xs text-slate-500">Invitez un membre par email</p>
                  </div>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                <Field label="Adresse email *">
                  <input
                    type="email"
                    placeholder="nom@exemple.ma"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="input-base"
                  />
                </Field>

                <Field label="Agence *">
                  <select
                    value={form.agencyId}
                    onChange={(e) => setForm((f) => ({ ...f, agencyId: e.target.value }))}
                    className="input-base"
                  >
                    {mockAgencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Rôle *">
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                    className="input-base"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Message (optionnel)">
                  <textarea
                    placeholder="Ajoutez un message personnalisé..."
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={3}
                    className="input-base resize-none"
                  />
                </Field>

                <p className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-700 leading-relaxed">
                  L&apos;invitation sera valide <strong>7 jours</strong>. Après expiration, vous devrez en envoyer une nouvelle.
                </p>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleSend}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <Send className="h-4 w-4" />
                  Envoyer l&apos;invitation
                </button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240 / 0.8);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-base:focus {
          border-color: rgb(99 102 241 / 0.6);
          box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  )
}
