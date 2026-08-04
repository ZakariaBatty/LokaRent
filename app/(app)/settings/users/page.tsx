"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { ShieldCheck, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { planConfig, users as initialUsers, type TeamUser, type UserRole } from "@/lib/users-data"
import { PlanLimitBanner } from "@/components/settings/users/plan-limit-banner"
import { TeamTable } from "@/components/settings/users/team-table"
import { InvitationPanel } from "@/components/settings/users/invitation-panel"
import { PermissionsMatrix } from "@/components/settings/users/permissions-matrix"

const colorPalette = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-fuchsia-600",
]

export default function UsersSettingsPage() {
  const [team, setTeam] = useState<TeamUser[]>(initialUsers)
  const [panelOpen, setPanelOpen] = useState(false)

  const used = team.filter((u) => u.status !== "Inactif").length
  const atLimit = used >= planConfig.maxSeats

  function handleInvite(data: {
    firstName: string
    lastName: string
    email: string
    role: UserRole
    message: string
  }) {
    const id = `u-${Date.now()}`
    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const newUser: TeamUser = {
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      status: "Invitation en attente",
      lastConnection: null,
      invitedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      avatarColor: colorPalette[team.length % colorPalette.length],
    }
    setTeam((prev) => [...prev, newUser])
    setPanelOpen(false)
    toast.success("Invitation envoyée", {
      description: `Un email a été envoyé à ${data.email}`,
    })
  }

  function handleRoleChange(id: string) {
    const user = team.find((u) => u.id === id)
    if (!user) return
    const order: UserRole[] = ["Gérant", "Réceptionniste", "Comptable"]
    const next = order[(order.indexOf(user.role) + 1) % order.length]
    setTeam((prev) => prev.map((u) => (u.id === id ? { ...u, role: next } : u)))
    toast.success(`Rôle modifié`, {
      description: `${user.firstName} ${user.lastName} est maintenant ${next}`,
    })
  }

  function handleDeactivate(id: string) {
    const user = team.find((u) => u.id === id)
    if (!user) return
    const next = user.status === "Actif" ? "Inactif" : "Actif"
    setTeam((prev) => prev.map((u) => (u.id === id ? { ...u, status: next } : u)))
    toast.success(next === "Inactif" ? "Utilisateur désactivé" : "Utilisateur réactivé")
  }

  function handleDelete(id: string) {
    setTeam((prev) => prev.filter((u) => u.id !== id))
  }

  function handleResend(id: string) {
    const user = team.find((u) => u.id === id)
    if (!user) return
    const now = new Date()
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    setTeam((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, invitedAt: now.toISOString(), expiresAt: expires.toISOString() } : u
      )
    )
    toast.success("Invitation renvoyée", {
      description: `Un nouvel email a été envoyé à ${user.email}`,
    })
  }

  function handleCancelInvite(id: string) {
    setTeam((prev) => prev.filter((u) => u.id !== id))
    toast.success("Invitation annulée")
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Paramètres
              </p>
              <span className="text-slate-300">/</span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Utilisateurs
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Gestion Équipe
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gérez les accès et permissions de votre équipe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sécurité activée
          </span>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            disabled={atLimit}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <UserPlus className="relative h-4 w-4" />
            <span className="relative">Inviter un utilisateur</span>
          </button>
        </div>
      </motion.div>

      {/* Plan banner */}
      <PlanLimitBanner plan={planConfig.name} used={used} max={planConfig.maxSeats} />

      {/* Team table */}
      <TeamTable
        users={team}
        onRoleChange={handleRoleChange}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
        onResend={handleResend}
        onCancelInvite={handleCancelInvite}
      />

      {/* Permissions matrix */}
      <PermissionsMatrix />

      {/* Invitation panel */}
      <InvitationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSubmit={handleInvite}
      />
    </div>
  )
}
