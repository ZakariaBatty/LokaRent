"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"
import {
  AlertTriangle,
  ChevronDown,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  UsersRound,
  X,
} from "lucide-react"
import { SettingsCard } from "@/components/settings/settings-card"
import { useAgency } from "@/contexts/agency-context"
import {
  mockMemberships,
  mockGlobalUsers,
  mockTeams,
  type AgencyTeam,
} from "@/lib/mock-workspaces"
import type { GlobalUser } from "@/lib/mock-workspaces"

// ─── colour palette for team avatars ────────────────────────────────────────
const TEAM_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-fuchsia-600",
]

const MEMBER_COLORS = [
  "from-indigo-400 to-violet-500",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-400",
  "from-rose-400 to-pink-500",
  "from-violet-400 to-fuchsia-500",
]

function initials(name: string) {
  const p = name.trim().split(" ")
  return p.length >= 2
    ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ─── types ───────────────────────────────────────────────────────────────────
interface TeamLocal extends AgencyTeam {
  colorIdx: number
}

// ─── page ────────────────────────────────────────────────────────────────────
export default function TeamsSettingsPage() {
  const { activeAgency } = useAgency()
  const agencyId = activeAgency?.id ?? "agency_casablanca"

  // Seed teams from mock data filtered to this agency
  const [teams, setTeams] = useState<TeamLocal[]>(() =>
    mockTeams
      .filter((t) => t.agencyId === agencyId)
      .map((t, i) => ({ ...t, colorIdx: i % TEAM_COLORS.length }))
  )

  // Reset when agency switches
  useEffect(() => {
    setTeams(
      mockTeams
        .filter((t) => t.agencyId === agencyId)
        .map((t, i) => ({ ...t, colorIdx: i % TEAM_COLORS.length }))
    )
  }, [agencyId])

  // Active memberships for this agency → resolve to GlobalUser
  const agencyMemberIds = mockMemberships
    .filter((m) => m.agencyId === agencyId && m.status === "active")
    .map((m) => m.userId)
  const agencyMembers: GlobalUser[] = mockGlobalUsers.filter((u) =>
    agencyMemberIds.includes(u.id)
  )

  // Panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<TeamLocal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<TeamLocal | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    if (openMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [openMenu])

  function openCreate() {
    setEditing(null)
    setPanelOpen(true)
  }

  function openEdit(team: TeamLocal) {
    setEditing(team)
    setPanelOpen(true)
    setOpenMenu(null)
  }

  function handleSave(data: { name: string; description: string; memberIds: string[] }) {
    if (editing) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === editing.id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        )
      )
      toast.success("Équipe mise à jour", { description: data.name })
    } else {
      const newTeam: TeamLocal = {
        id: `team_${Date.now()}`,
        agencyId,
        name: data.name,
        description: data.description,
        memberIds: data.memberIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        colorIdx: teams.length % TEAM_COLORS.length,
      }
      setTeams((prev) => [...prev, newTeam])
      toast.success("Équipe créée", { description: data.name })
    }
    setPanelOpen(false)
  }

  function handleDelete(team: TeamLocal) {
    setTeams((prev) => prev.filter((t) => t.id !== team.id))
    toast.success(`Équipe supprimée`, { description: team.name })
    setConfirmDelete(null)
    setOpenMenu(null)
  }

  // Resolve memberIds → users for display
  function resolveMembers(memberIds: string[]): GlobalUser[] {
    // memberIds are AgencyMembership.ids — map to userId first
    const userIds = mockMemberships
      .filter((m) => memberIds.includes(m.id))
      .map((m) => m.userId)
    return mockGlobalUsers.filter((u) => userIds.includes(u.id))
  }

  return (
    <>
      {/* ── page header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 flex flex-wrap items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Paramètres
              </p>
              <span className="text-slate-300">/</span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Équipes
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Équipes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Organisez les membres de{" "}
              <span className="font-semibold text-slate-700">
                {activeAgency?.name ?? "l'agence"}
              </span>{" "}
              en groupes de travail.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Plus className="relative h-4 w-4" />
          <span className="relative">Nouvelle équipe</span>
        </button>
      </motion.div>

      {/* ── empty state ──────────────────────────────────────────────────── */}
      {teams.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <UsersRound className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">Aucune équipe pour le moment</p>
          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
            Créez votre première équipe pour organiser les membres de{" "}
            {activeAgency?.name ?? "l'agence"} par rôle ou spécialité.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Créer une équipe
          </button>
        </motion.div>
      )}

      {/* ── teams table ──────────────────────────────────────────────────── */}
      {teams.length > 0 && (
        <SettingsCard
          title="Équipes de l'agence"
          description={`${teams.length} équipe${teams.length > 1 ? "s" : ""} · ${agencyMembers.length} membre${agencyMembers.length > 1 ? "s" : ""} au total`}
          icon={<UsersRound className="h-4 w-4" />}
          delay={0.05}
        >
          <div className="-mx-6 -mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Équipe</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Membres</th>
                  <th className="px-4 py-3">Créée le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {teams.map((team, idx) => {
                    const members = resolveMembers(team.memberIds)
                    return (
                      <motion.tr
                        key={team.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="group border-b border-slate-100 last:border-0 transition hover:bg-slate-50/50"
                      >
                        {/* Team name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-sm ${
                                TEAM_COLORS[team.colorIdx]
                              }`}
                            >
                              {initials(team.name)}
                            </div>
                            <span className="font-semibold text-slate-900">{team.name}</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">
                            {team.description || (
                              <span className="italic text-slate-400">Aucune description</span>
                            )}
                          </span>
                        </td>

                        {/* Member avatars */}
                        <td className="px-4 py-4">
                          {members.length === 0 ? (
                            <span className="text-xs text-slate-400">Aucun membre</span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="flex -space-x-2">
                                {members.slice(0, 4).map((m, mi) => (
                                  <div
                                    key={m.id}
                                    title={`${m.firstName} ${m.lastName}`}
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ring-2 ring-white ${
                                      MEMBER_COLORS[mi % MEMBER_COLORS.length]
                                    }`}
                                  >
                                    {initials(`${m.firstName} ${m.lastName}`)}
                                  </div>
                                ))}
                                {members.length > 4 && (
                                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white">
                                    +{members.length - 4}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-slate-500">
                                {members.length} membre{members.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Created at */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600">
                            {new Date(team.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="relative inline-block" ref={openMenu === team.id ? menuRef : null}>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenu(openMenu === team.id ? null : team.id)
                              }
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <AnimatePresence>
                              {openMenu === team.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 z-20 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-slate-200/70 bg-white p-1 text-left shadow-xl shadow-slate-900/10"
                                >
                                  <button
                                    type="button"
                                    onClick={() => openEdit(team)}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Modifier
                                  </button>
                                  <div className="my-1 h-px bg-slate-100" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDelete(team)
                                      setOpenMenu(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </SettingsCard>
      )}

      {/* ── members overview card ─────────────────────────────────────────── */}
      {agencyMembers.length > 0 && (
        <SettingsCard
          title="Membres disponibles"
          description={`${agencyMembers.length} membre${agencyMembers.length > 1 ? "s" : ""} actif${agencyMembers.length > 1 ? "s" : ""} dans ${activeAgency?.name ?? "cette agence"}`}
          icon={<UsersRound className="h-4 w-4" />}
          delay={0.1}
        >
          <div className="-mx-6 -mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Membre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Équipes assignées</th>
                </tr>
              </thead>
              <tbody>
                {agencyMembers.map((member, idx) => {
                  const memberTeams = teams.filter((t) => {
                    const membership = mockMemberships.find(
                      (m) =>
                        m.userId === member.id &&
                        m.agencyId === agencyId &&
                        t.memberIds.includes(m.id)
                    )
                    return !!membership
                  })
                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: idx * 0.03 }}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white ring-2 ring-white ${
                              MEMBER_COLORS[idx % MEMBER_COLORS.length]
                            }`}
                          >
                            {initials(`${member.firstName} ${member.lastName}`)}
                          </div>
                          <span className="font-semibold text-slate-900">
                            {member.firstName} {member.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-sm">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {memberTeams.length === 0 ? (
                          <span className="text-xs text-slate-400">Aucune équipe</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {memberTeams.map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100"
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SettingsCard>
      )}

      {/* ── create / edit panel ───────────────────────────────────────────── */}
      <TeamFormPanel
        open={panelOpen}
        team={editing}
        agencyMembers={agencyMembers}
        agencyId={agencyId}
        onClose={() => setPanelOpen(false)}
        onSubmit={handleSave}
      />

      {/* ── confirm delete dialog ─────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl">
                <div className="flex items-start gap-4 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900">
                      Supprimer cette équipe ?
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">
                      L&apos;équipe{" "}
                      <span className="font-semibold text-slate-900">
                        {confirmDelete.name}
                      </span>{" "}
                      sera définitivement supprimée. Les membres ne seront pas retirés de l&apos;agence.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(confirmDelete)}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Team form panel (create & edit) ─────────────────────────────────────────
function TeamFormPanel({
  open,
  team,
  agencyMembers,
  agencyId,
  onClose,
  onSubmit,
}: {
  open: boolean
  team: TeamLocal | null
  agencyMembers: GlobalUser[]
  agencyId: string
  onClose: () => void
  onSubmit: (data: { name: string; description: string; memberIds: string[] }) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Seed form when editing
  useEffect(() => {
    if (!open) return
    if (team) {
      setName(team.name)
      setDescription(team.description)
      // Resolve memberIds (AgencyMembership.ids) → userIds
      const userIds = mockMemberships
        .filter((m) => team.memberIds.includes(m.id))
        .map((m) => m.userId)
      setSelectedUserIds(userIds)
    } else {
      setName("")
      setDescription("")
      setSelectedUserIds([])
    }
  }, [open, team])

  function toggleMember(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    // Convert userIds → membershipIds for this agency
    const memberIds = mockMemberships
      .filter((m) => m.agencyId === agencyId && selectedUserIds.includes(m.userId))
      .map((m) => m.id)
    setTimeout(() => {
      onSubmit({ name: name.trim(), description: description.trim(), memberIds })
      setSubmitting(false)
    }, 500)
  }

  const canSubmit = name.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 py-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {team ? "Modifier l'équipe" : "Nouvelle équipe"}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Équipe rattachée à cette agence uniquement
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

                {/* Name */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Nom de l&apos;équipe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Opérations, Finance, Accueil…"
                    maxLength={60}
                    required
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Description
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">(optionnel)</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Décrivez le rôle de cette équipe…"
                    maxLength={200}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Members */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Membres
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {selectedUserIds.length} sélectionné{selectedUserIds.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {agencyMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                      <p className="text-xs text-slate-500">
                        Aucun membre actif dans cette agence.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-2">
                      {agencyMembers.map((member, mi) => {
                        const selected = selectedUserIds.includes(member.id)
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleMember(member.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                              selected
                                ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white ring-2 ring-white ${
                                MEMBER_COLORS[mi % MEMBER_COLORS.length]
                              }`}
                            >
                              {initials(`${member.firstName} ${member.lastName}`)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="truncate text-xs text-slate-500">{member.email}</p>
                            </div>
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${
                                selected
                                  ? "bg-indigo-600 text-white"
                                  : "border border-slate-300 bg-white"
                              }`}
                            >
                              {selected && (
                                <svg
                                  className="h-3 w-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
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
                    <svg className="relative h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <Send className="relative h-4 w-4" />
                  )}
                  <span className="relative">
                    {submitting ? "Enregistrement…" : team ? "Enregistrer" : "Créer l'équipe"}
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
