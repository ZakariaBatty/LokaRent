"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Users, Plus, Download } from "lucide-react"
import {
  mockGlobalUsers,
  mockMemberships,
  mockAgencies,
  getAgencyById,
  roleLabels,
  type UserRole,
  type GlobalUser,
  type AgencyMembership,
} from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs"
import {
  MemberRow,
  MemberCompactRow,
  type MemberRowData,
} from "@/components/workspace/members/member-row"
import { MemberDetailPanel } from "@/components/workspace/members/member-detail-panel"
import { MemberFormSheet, type MemberFormValues } from "@/components/workspace/members/member-form-sheet"
import { MemberDeleteDialog } from "@/components/workspace/members/member-delete-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────────────

type RoleFilter = UserRole | "all"
type StatusFilter = AgencyMembership["status"] | "all"
type AgencyFilter = string | "all"

type MemberState = {
  users: GlobalUser[]
  memberships: AgencyMembership[]
}

// ── Build flat rows from users × memberships ─────────────────────────────────
// One row per unique user, using their highest-privilege membership as primary.

const roleOrder: Record<UserRole, number> = {
  OWNER: 0, ADMIN: 1, MANAGER: 2, TEAM_LEAD: 3, EMPLOYEE: 4, CLIENT: 5,
}

function buildRows(users: GlobalUser[], memberships: AgencyMembership[]): MemberRowData[] {
  return users
    .map((user) => {
      const userMemberships = memberships.filter((m) => m.userId === user.id)
      if (userMemberships.length === 0) return null
      const primary = [...userMemberships].sort(
        (a, b) => roleOrder[a.role] - roleOrder[b.role],
      )[0]
      const agency = getAgencyById(primary.agencyId)
      return {
        user,
        membership: primary,
        agencyName: agency?.name ?? "—",
        agencyCount: userMemberships.length,
      } satisfies MemberRowData
    })
    .filter((r): r is MemberRowData => r !== null)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MembersPage() {
  const [state, setState] = useState<MemberState>({
    users: mockGlobalUsers,
    memberships: mockMemberships,
  })

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>("all")

  // CRUD state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingMember, setEditingMember] = useState<{ user: GlobalUser; membership: AgencyMembership } | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<GlobalUser | null>(null)

  const allRows = useMemo(
    () => buildRows(state.users, state.memberships),
    [state],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allRows.filter((r) => {
      if (roleFilter !== "all" && r.membership.role !== roleFilter) return false
      if (statusFilter !== "all" && r.membership.status !== statusFilter) return false
      if (agencyFilter !== "all" && !state.memberships.some(
        (m) => m.userId === r.user.id && m.agencyId === agencyFilter,
      )) return false
      if (q) {
        const hay = `${r.user.firstName} ${r.user.lastName} ${r.user.email} ${r.agencyName}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [allRows, search, roleFilter, statusFilter, agencyFilter, state.memberships])

  const selectedRow = allRows.find((r) => r.user.id === selectedUserId) ?? null
  const hasSelection = !!selectedRow

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setFormMode("create")
    setEditingMember(null)
    setFormOpen(true)
  }

  const openEdit = (row: MemberRowData) => {
    setFormMode("edit")
    setEditingMember({ user: row.user, membership: row.membership })
    setFormOpen(true)
  }

  const openDelete = (user: GlobalUser) => {
    setDeletingUser(user)
    setDeleteOpen(true)
  }

  const handleFormSubmit = (values: MemberFormValues) => {
    if (formMode === "create") {
      const newUser: GlobalUser = {
        id: `user_${Date.now()}`,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        createdAt: new Date().toISOString(),
        lastLoginAt: undefined,
      }
      const newMembership: AgencyMembership = {
        id: `membership_${Date.now()}`,
        userId: newUser.id,
        agencyId: values.agencyId,
        role: values.role,
        status: "pending",
        joinedAt: new Date().toISOString(),
        invitedAt: new Date().toISOString(),
      }
      setState((prev) => ({
        users: [newUser, ...prev.users],
        memberships: [newMembership, ...prev.memberships],
      }))
    } else if (editingMember) {
      setState((prev) => ({
        users: prev.users.map((u) =>
          u.id === editingMember.user.id
            ? { ...u, firstName: values.firstName, lastName: values.lastName, email: values.email, phone: values.phone }
            : u,
        ),
        memberships: prev.memberships.map((m) =>
          m.id === editingMember.membership.id
            ? { ...m, agencyId: values.agencyId, role: values.role }
            : m,
        ),
      }))
    }
  }

  const handleDelete = () => {
    if (!deletingUser) return
    setState((prev) => ({
      users: prev.users.filter((u) => u.id !== deletingUser.id),
      memberships: prev.memberships.filter((m) => m.userId !== deletingUser.id),
    }))
    if (selectedUserId === deletingUser.id) setSelectedUserId(null)
    toast.success("Membre supprimé", {
      description: `${deletingUser.firstName} ${deletingUser.lastName} a été retiré du workspace.`,
    })
  }

  const handleRoleChange = (membershipId: string, role: AgencyMembership["role"]) => {
    setState((prev) => ({
      ...prev,
      memberships: prev.memberships.map((m) =>
        m.id === membershipId ? { ...m, role } : m,
      ),
    }))
    toast.success("Rôle mis à jour")
  }

  const exportData = () => {
    toast.success("Export en cours", {
      description: `${filtered.length} membres seront téléchargés dans quelques instants.`,
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      {/* Page header */}
      <div>
        <WorkspacePageHeader
          icon={Users}
          breadcrumb="Membres"
          title="Membres du workspace"
          description="Gestion centralisée des accès, rôles et permissions — toutes agences confondues."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportData}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <Plus className="h-4 w-4" />
                Ajouter un membre
              </button>
            </div>
          }
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      {/* Split layout — exact Clients pattern */}
      <div className="flex gap-5">
        {/* ── LEFT — table ── */}
        <motion.div
          layout
          animate={{ width: hasSelection ? "20%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
          {/* Filters */}
          <AnimatePresence mode="wait">
            {!hasSelection ? (
              <motion.div
                key="full-filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative min-w-52 flex-1">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher un membre..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Filters row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Agency */}
                    <select
                      value={agencyFilter}
                      onChange={(e) => setAgencyFilter(e.target.value)}
                      className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="all">Toutes les agences</option>
                      {mockAgencies.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>

                    {/* Role */}
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                      className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="all">Tous les rôles</option>
                      {(["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE"] as UserRole[]).map((r) => (
                        <option key={r} value={r}>{roleLabels[r]}</option>
                      ))}
                    </select>

                    {/* Status pills */}
                    <div className="flex items-center rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-sm">
                      {(["all", "active", "pending", "inactive"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                            statusFilter === s
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-900",
                          )}
                        >
                          {s === "all" ? "Tous" : s === "active" ? "Actifs" : s === "pending" ? "En attente" : "Inactifs"}
                        </button>
                      ))}
                    </div>

                    {/* Result count */}
                    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
                      <Users className="h-3 w-3 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 tabular-nums">{filtered.length}</span>
                      <span className="text-[10px] font-medium text-slate-500">membres</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="compact-filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4"
              >
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Filtrer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-8 pr-3 text-xs placeholder:text-slate-400 shadow-sm focus:outline-none"
                  />
                </div>
                <p className="mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {filtered.length} membre{filtered.length > 1 ? "s" : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Aucun membre trouvé</p>
              <p className="mt-1 text-xs text-slate-500">
                Modifiez vos filtres ou ajoutez un nouveau membre.
              </p>
              <button
                onClick={openCreate}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                Ajouter un membre
              </button>
            </div>
          ) : hasSelection ? (
            <div className="space-y-2">
              {filtered.map((r) => (
                <MemberCompactRow
                  key={r.user.id}
                  row={r}
                  selected={r.user.id === selectedUserId}
                  onSelect={() => setSelectedUserId(r.user.id)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white">
                    <th className="py-3 pl-5 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Membre
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Agence principale
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Rôle
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Membre depuis
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Dernière connexion
                    </th>
                    <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Statut
                    </th>
                    <th className="py-3 pl-3 pr-5" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((r) => (
                      <MemberRow
                        key={r.user.id}
                        row={r}
                        selected={r.user.id === selectedUserId}
                        onSelect={() => setSelectedUserId(r.user.id === selectedUserId ? null : r.user.id)}
                        onEdit={() => openEdit(r)}
                        onDelete={() => openDelete(r.user)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ── RIGHT — sticky detail panel (80%) ── */}
        <AnimatePresence>
          {selectedRow && (
            <motion.div
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "80%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="sticky top-4 h-[calc(100vh-7rem)] min-w-0 shrink-0"
              style={{ alignSelf: "flex-start" }}
            >
              <MemberDetailPanel
                user={selectedRow.user}
                primaryMembership={selectedRow.membership}
                agencyName={selectedRow.agencyName}
                onClose={() => setSelectedUserId(null)}
                onEdit={() => openEdit(selectedRow)}
                onDelete={() => openDelete(selectedRow.user)}
                onRoleChange={handleRoleChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CRUD overlays ── */}
      <MemberFormSheet
        open={formOpen}
        mode={formMode}
        member={editingMember}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
      <MemberDeleteDialog
        open={deleteOpen}
        user={deletingUser}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
