"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Shield, Users, Building2, Check, Minus, ChevronUp,
  ChevronDown, Search, X, Save, RotateCcw, Info,
  LayoutDashboard, Car, CalendarDays, UserRound,
  FileText, TrendingUp, BarChart2, Settings, Briefcase,
} from "lucide-react"
import {
  type UserRole,
  type PermissionModule,
  type PermissionAction,
  rolePermissions,
  roleLabels,
  roleBadgeStyles,
  permissionPages,
  permissionActions,
  mockGlobalUsers,
  mockMemberships,
  mockAgencies,
  mockUserPermissionOverrides,
  getAgencyById,
  getGlobalUserById,
} from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ---------- constants ----------

type ViewMode = "role" | "user" | "agency"

const roleOrder: UserRole[] = ["OWNER", "ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "CLIENT"]

const roleDescriptions: Record<UserRole, string> = {
  OWNER: "Accès complet — gestion, facturation, workspace.",
  ADMIN: "Gestion agence, utilisateurs et opérations.",
  MANAGER: "Supervise réservations, clients et rapports.",
  TEAM_LEAD: "Encadre une équipe, accès opérationnel étendu.",
  EMPLOYEE: "Accès quotidien réservations et clients.",
  CLIENT: "Lecture seule sur ses propres données.",
}

const moduleIcons: Record<PermissionModule, React.ElementType> = {
  dashboard: LayoutDashboard,
  cars: Car,
  reservations: CalendarDays,
  clients: UserRound,
  contracts: FileText,
  finances: TrendingUp,
  reports: BarChart2,
  settings: Settings,
  workspace: Briefcase,
}

const ALL_ACTIONS: PermissionAction[] = ["read", "create", "update", "delete", "export"]

// ---------- helpers ----------

function initRoleMatrix(role: UserRole): Record<PermissionModule, Set<PermissionAction>> {
  const base = rolePermissions[role]
  const result = {} as Record<PermissionModule, Set<PermissionAction>>
  for (const page of permissionPages) {
    const key = page.key as PermissionModule
    result[key] = new Set((base as any)[key] ?? [])
  }
  return result
}

function initUserMatrix(
  userId: string,
  agencyId: string,
): Record<PermissionModule, Set<PermissionAction>> {
  const membership = mockMemberships.find(
    (m) => m.userId === userId && m.agencyId === agencyId,
  )
  const role: UserRole = membership?.role ?? "EMPLOYEE"
  const matrix = initRoleMatrix(role)

  // Apply overrides
  const overrides = mockUserPermissionOverrides.filter(
    (o) => o.userId === userId && o.agencyId === agencyId,
  )
  for (const o of overrides) {
    matrix[o.module as PermissionModule] = new Set(o.actions)
  }
  return matrix
}

type MatrixState = Record<PermissionModule, Set<PermissionAction>>

function matricesEqual(a: MatrixState, b: MatrixState): boolean {
  for (const page of permissionPages) {
    const key = page.key as PermissionModule
    const setA = a[key]
    const setB = b[key]
    if (setA.size !== setB.size) return false
    for (const action of ALL_ACTIONS) {
      if (setA.has(action) !== setB.has(action)) return false
    }
  }
  return true
}

function countGranted(matrix: MatrixState): number {
  let n = 0
  for (const page of permissionPages) {
    n += matrix[page.key as PermissionModule].size
  }
  return n
}

// ---------- sub-components ----------

function ActionHeader({ actions }: { actions: typeof permissionActions }) {
  return (
    <>
      {actions.map((a) => (
        <th
          key={a.key}
          className="min-w-[72px] px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500"
        >
          {a.label}
        </th>
      ))}
    </>
  )
}

function CellToggle({
  granted,
  editable,
  onToggle,
}: {
  granted: boolean
  editable: boolean
  onToggle?: () => void
}) {
  if (!editable) {
    return (
      <td className="px-2 py-3 text-center">
        {granted ? (
          <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </span>
        ) : (
          <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-300">
            <Minus className="h-3 w-3" strokeWidth={2} />
          </span>
        )}
      </td>
    )
  }

  return (
    <td className="px-2 py-3 text-center">
      <button
        onClick={onToggle}
        className={cn(
          "mx-auto flex h-5 w-5 items-center justify-center rounded-full transition-all",
          granted
            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:text-emerald-700 ring-2 ring-emerald-200 ring-offset-1"
            : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500",
        )}
        aria-label={granted ? "Révoquer" : "Accorder"}
      >
        {granted ? (
          <Check className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <Minus className="h-3 w-3" strokeWidth={2} />
        )}
      </button>
    </td>
  )
}

function MatrixTable({
  matrix,
  editable,
  onToggle,
  className,
}: {
  matrix: MatrixState
  editable: boolean
  onToggle?: (module: PermissionModule, action: PermissionAction) => void
  className?: string
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
            <th className="w-44 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Module
            </th>
            <ActionHeader actions={permissionActions} />
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Accordés
            </th>
          </tr>
        </thead>
        <tbody>
          {permissionPages.map((page, idx) => {
            const key = page.key as PermissionModule
            const Icon = moduleIcons[key]
            const actions = matrix[key]
            const grantedCount = actions.size
            const totalCount = ALL_ACTIONS.length

            return (
              <motion.tr
                key={key}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.025 }}
                className={cn(
                  "border-b border-slate-100/70 last:border-0",
                  grantedCount === 0 && "opacity-60",
                )}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-medium text-slate-800 text-sm">{page.label}</span>
                  </div>
                </td>
                {permissionActions.map((action) => {
                  const isGranted = actions.has(action.key as PermissionAction)
                  return (
                    <CellToggle
                      key={action.key}
                      granted={isGranted}
                      editable={editable}
                      onToggle={
                        editable
                          ? () => onToggle?.(key, action.key as PermissionAction)
                          : undefined
                      }
                    />
                  )
                })}
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      grantedCount === totalCount
                        ? "text-emerald-600"
                        : grantedCount === 0
                          ? "text-slate-300"
                          : "text-slate-500",
                    )}
                  >
                    {grantedCount}/{totalCount}
                  </span>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MatrixLegend({ editable }: { editable: boolean }) {
  return (
    <div className="flex items-center gap-5 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={2.5} />
        </span>
        <span className="text-xs text-slate-500">Autorisé</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100">
          <Minus className="h-2.5 w-2.5 text-slate-300" strokeWidth={2} />
        </span>
        <span className="text-xs text-slate-500">Non autorisé</span>
      </div>
      {editable && (
        <p className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          Cliquez sur une cellule pour modifier
        </p>
      )}
    </div>
  )
}

// ---------- VIEW: By Role ----------

function RoleView() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [search, setSearch] = useState("")
  const [editMatrix, setEditMatrix] = useState<MatrixState | null>(null)
  const [baseMatrix, setBaseMatrix] = useState<MatrixState | null>(null)

  const filtered = roleOrder.filter((r) =>
    search ? roleLabels[r].toLowerCase().includes(search.toLowerCase()) : true,
  )

  const countByRole = (role: UserRole) =>
    mockMemberships.filter((m) => m.role === role && m.status === "active").length

  const selectRole = (role: UserRole) => {
    if (selectedRole === role) {
      setSelectedRole(null)
      setEditMatrix(null)
      setBaseMatrix(null)
      return
    }
    const m = initRoleMatrix(role)
    setSelectedRole(role)
    setEditMatrix(m)
    setBaseMatrix(m)
  }

  const toggleCell = (module: PermissionModule, action: PermissionAction) => {
    if (!editMatrix) return
    const next = { ...editMatrix }
    const set = new Set(next[module])
    set.has(action) ? set.delete(action) : set.add(action)
    next[module] = set
    setEditMatrix(next)
  }

  const isDirty = editMatrix && baseMatrix && !matricesEqual(editMatrix, baseMatrix)

  const handleSave = () => {
    if (!selectedRole) return
    toast.success(`Permissions du rôle ${roleLabels[selectedRole]} mises à jour`)
    setBaseMatrix(editMatrix)
  }

  const handleReset = () => {
    if (!selectedRole) return
    const m = initRoleMatrix(selectedRole)
    setEditMatrix(m)
    setBaseMatrix(m)
  }

  return (
    <div className="flex gap-5">
      {/* Left: role list */}
      <motion.div
        layout
        animate={{ width: selectedRole ? "320px" : "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        className="shrink-0"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* search */}
          {!selectedRole && (
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un rôle…"
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Rôle</th>
                {!selectedRole && <th className="hidden px-4 py-3 md:table-cell">Description</th>}
                <th className="px-4 py-3 text-right">Membres</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((role, idx) => {
                const count = countByRole(role)
                const active = selectedRole === role
                return (
                  <motion.tr
                    key={role}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.03 }}
                    onClick={() => selectRole(role)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100/50 transition",
                      active
                        ? "bg-indigo-50/60"
                        : "hover:bg-slate-50/60",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                            roleBadgeStyles[role],
                          )}
                        >
                          {roleLabels[role]}
                        </span>
                      </div>
                    </td>
                    {!selectedRole && (
                      <td className="hidden max-w-[220px] truncate px-4 py-3.5 text-xs text-slate-500 md:table-cell">
                        {roleDescriptions[role]}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-right">
                      <span className="tabular-nums text-sm font-semibold text-slate-700">
                        {count}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Right: matrix panel */}
      <AnimatePresence>
        {selectedRole && editMatrix && (
          <motion.div
            key="role-matrix"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="min-w-0 flex-1"
          >
            <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {/* panel header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 ring-1 ring-inset ring-indigo-100">
                    <Shield className="h-4.5 w-4.5 text-indigo-700" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ring-inset",
                          roleBadgeStyles[selectedRole],
                        )}
                      >
                        {roleLabels[selectedRole]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {countGranted(editMatrix)} droit
                        {countGranted(editMatrix) !== 1 ? "s" : ""} accordés
                      </span>
                    </div>
                    <p className="mt-0.5 max-w-xs text-xs text-slate-500">
                      {roleDescriptions[selectedRole]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDirty && (
                    <>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Réinitialiser
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Enregistrer
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelectedRole(null); setEditMatrix(null); setBaseMatrix(null) }}
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <MatrixTable
                matrix={editMatrix}
                editable
                onToggle={toggleCell}
              />
              <MatrixLegend editable />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- VIEW: By User ----------

function UserView() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [editMatrix, setEditMatrix] = useState<MatrixState | null>(null)
  const [baseMatrix, setBaseMatrix] = useState<MatrixState | null>(null)

  // Unique users that have at least one active membership
  const usersWithMembership = useMemo(() => {
    const ids = new Set(
      mockMemberships.filter((m) => m.status === "active").map((m) => m.userId),
    )
    return mockGlobalUsers.filter((u) => ids.has(u.id))
  }, [])

  const filtered = usersWithMembership.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const selectedUser = mockGlobalUsers.find((u) => u.id === selectedUserId) ?? null

  // Agencies for selected user
  const userAgencies = useMemo(() => {
    if (!selectedUserId) return []
    const agencyIds = mockMemberships
      .filter((m) => m.userId === selectedUserId && m.status === "active")
      .map((m) => m.agencyId)
    return agencyIds.map((id) => getAgencyById(id)).filter(Boolean) as typeof mockAgencies
  }, [selectedUserId])

  // When user changes → pick first agency
  const selectUser = (userId: string) => {
    if (selectedUserId === userId) {
      setSelectedUserId(null)
      setSelectedAgencyId(null)
      setEditMatrix(null)
      setBaseMatrix(null)
      return
    }
    const agencyIds = mockMemberships
      .filter((m) => m.userId === userId && m.status === "active")
      .map((m) => m.agencyId)
    const firstAgencyId = agencyIds[0] ?? null
    setSelectedUserId(userId)
    setSelectedAgencyId(firstAgencyId)
    if (firstAgencyId) {
      const m = initUserMatrix(userId, firstAgencyId)
      setEditMatrix(m)
      setBaseMatrix(m)
    }
  }

  const switchAgency = (agencyId: string) => {
    if (!selectedUserId) return
    setSelectedAgencyId(agencyId)
    const m = initUserMatrix(selectedUserId, agencyId)
    setEditMatrix(m)
    setBaseMatrix(m)
  }

  const toggleCell = (module: PermissionModule, action: PermissionAction) => {
    if (!editMatrix) return
    const next = { ...editMatrix }
    const set = new Set(next[module])
    set.has(action) ? set.delete(action) : set.add(action)
    next[module] = set
    setEditMatrix(next)
  }

  const isDirty = editMatrix && baseMatrix && !matricesEqual(editMatrix, baseMatrix)

  const handleSave = () => {
    toast.success(`Permissions de ${selectedUser?.firstName} ${selectedUser?.lastName} mises à jour`)
    setBaseMatrix(editMatrix)
  }

  const handleReset = () => {
    if (selectedUserId && selectedAgencyId) {
      const m = initUserMatrix(selectedUserId, selectedAgencyId)
      setEditMatrix(m)
      setBaseMatrix(m)
    }
  }

  // Role of user in selected agency
  const roleInAgency = useMemo((): UserRole | null => {
    if (!selectedUserId || !selectedAgencyId) return null
    const m = mockMemberships.find(
      (m) => m.userId === selectedUserId && m.agencyId === selectedAgencyId,
    )
    return m?.role ?? null
  }, [selectedUserId, selectedAgencyId])

  return (
    <div className="flex gap-5">
      {/* Left: user list */}
      <motion.div
        layout
        animate={{ width: selectedUserId ? "280px" : "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        className="shrink-0"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Utilisateur</th>
                {!selectedUserId && <th className="px-4 py-3">Agences</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => {
                const memberships = mockMemberships.filter(
                  (m) => m.userId === user.id && m.status === "active",
                )
                const primaryRole = memberships[0]?.role ?? ("EMPLOYEE" as UserRole)
                const active = selectedUserId === user.id
                const initials = `${user.firstName[0]}${user.lastName[0]}`

                return (
                  <motion.tr
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.03 }}
                    onClick={() => selectUser(user.id)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100/50 transition",
                      active ? "bg-indigo-50/60" : "hover:bg-slate-50/60",
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          {!selectedUserId && (
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {!selectedUserId && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                              roleBadgeStyles[primaryRole],
                            )}
                          >
                            {roleLabels[primaryRole]}
                          </span>
                          {memberships.length > 1 && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                              +{memberships.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Right: user permission matrix */}
      <AnimatePresence>
        {selectedUserId && selectedUser && editMatrix && (
          <motion.div
            key="user-matrix"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="min-w-0 flex-1"
          >
            <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {/* header */}
              <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDirty && (
                    <>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Réinitialiser
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Enregistrer
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelectedUserId(null); setSelectedAgencyId(null); setEditMatrix(null); setBaseMatrix(null) }}
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* agency tab switcher */}
              {userAgencies.length > 1 && (
                <div className="flex items-center gap-1 border-b border-slate-100 px-5 py-2.5">
                  {userAgencies.map((agency) => {
                    const membership = mockMemberships.find(
                      (m) => m.userId === selectedUserId && m.agencyId === agency.id,
                    )
                    const role = membership?.role ?? ("EMPLOYEE" as UserRole)
                    return (
                      <button
                        key={agency.id}
                        onClick={() => switchAgency(agency.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                          selectedAgencyId === agency.id
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        {agency.city}
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-px text-[10px] font-semibold ring-1 ring-inset",
                            selectedAgencyId === agency.id
                              ? "bg-white/20 text-white ring-white/20"
                              : roleBadgeStyles[role],
                          )}
                        >
                          {roleLabels[role]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* role context banner */}
              {roleInAgency && (
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2">
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs text-slate-500">
                    Rôle de base :{" "}
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                        roleBadgeStyles[roleInAgency],
                      )}
                    >
                      {roleLabels[roleInAgency]}
                    </span>
                    {" "}— les modifications ci-dessous créent des exceptions individuelles.
                  </p>
                </div>
              )}

              <MatrixTable matrix={editMatrix} editable onToggle={toggleCell} />
              <MatrixLegend editable />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- VIEW: By Agency ----------

function AgencyView() {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null)
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null)
  const [editMatrix, setEditMatrix] = useState<MatrixState | null>(null)
  const [baseMatrix, setBaseMatrix] = useState<MatrixState | null>(null)

  const selectedAgency = mockAgencies.find((a) => a.id === selectedAgencyId) ?? null

  const agencyMembers = useMemo(() => {
    if (!selectedAgencyId) return []
    return mockMemberships
      .filter((m) => m.agencyId === selectedAgencyId && m.status === "active")
      .map((m) => ({
        membership: m,
        user: getGlobalUserById(m.userId),
      }))
      .filter((r): r is { membership: typeof r.membership; user: NonNullable<typeof r.user> } =>
        Boolean(r.user),
      )
  }, [selectedAgencyId])

  const selectedMembership = agencyMembers.find(
    (r) => r.membership.id === selectedMembershipId,
  ) ?? null

  const selectAgency = (agencyId: string) => {
    if (selectedAgencyId === agencyId) {
      setSelectedAgencyId(null)
      setSelectedMembershipId(null)
      setEditMatrix(null)
      setBaseMatrix(null)
      return
    }
    setSelectedAgencyId(agencyId)
    setSelectedMembershipId(null)
    setEditMatrix(null)
    setBaseMatrix(null)
  }

  const selectMember = (membershipId: string, userId: string, agencyId: string) => {
    if (selectedMembershipId === membershipId) {
      setSelectedMembershipId(null)
      setEditMatrix(null)
      setBaseMatrix(null)
      return
    }
    setSelectedMembershipId(membershipId)
    const m = initUserMatrix(userId, agencyId)
    setEditMatrix(m)
    setBaseMatrix(m)
  }

  const toggleCell = (module: PermissionModule, action: PermissionAction) => {
    if (!editMatrix) return
    const next = { ...editMatrix }
    const set = new Set(next[module])
    set.has(action) ? set.delete(action) : set.add(action)
    next[module] = set
    setEditMatrix(next)
  }

  const isDirty = editMatrix && baseMatrix && !matricesEqual(editMatrix, baseMatrix)

  const handleSave = () => {
    if (!selectedMembership) return
    toast.success(
      `Permissions de ${selectedMembership.user.firstName} ${selectedMembership.user.lastName} mises à jour`,
    )
    setBaseMatrix(editMatrix)
  }

  const handleReset = () => {
    if (!selectedMembership) return
    const m = initUserMatrix(
      selectedMembership.membership.userId,
      selectedMembership.membership.agencyId,
    )
    setEditMatrix(m)
    setBaseMatrix(m)
  }

  return (
    <div className="flex gap-5">
      {/* Col 1: agency list */}
      <motion.div
        layout
        animate={{ width: selectedAgencyId ? "220px" : "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        className="shrink-0"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Agence</th>
                {!selectedAgencyId && <th className="px-4 py-3 text-right">Membres</th>}
              </tr>
            </thead>
            <tbody>
              {mockAgencies.map((agency, idx) => {
                const count = mockMemberships.filter(
                  (m) => m.agencyId === agency.id && m.status === "active",
                ).length
                const active = selectedAgencyId === agency.id
                return (
                  <motion.tr
                    key={agency.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.04 }}
                    onClick={() => selectAgency(agency.id)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100/50 transition last:border-0",
                      active ? "bg-indigo-50/60" : "hover:bg-slate-50/60",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 text-sm">
                            {agency.city}
                          </p>
                          {!selectedAgencyId && (
                            <p className="truncate text-xs text-slate-400">{agency.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {!selectedAgencyId && (
                      <td className="px-4 py-3.5 text-right">
                        <span className="tabular-nums text-sm font-semibold text-slate-700">
                          {count}
                        </span>
                      </td>
                    )}
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Col 2: member list for selected agency */}
      <AnimatePresence>
        {selectedAgencyId && (
          <motion.div
            key="agency-members"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            animate-width={selectedMembershipId ? "240px" : "1fr"}
            style={{ width: selectedMembershipId ? "240px" : undefined, flex: selectedMembershipId ? "0 0 240px" : "1" }}
            className="shrink-0"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <p className="text-xs font-semibold text-slate-500">
                  {selectedAgency?.city} — {agencyMembers.length} membre
                  {agencyMembers.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => { setSelectedAgencyId(null); setSelectedMembershipId(null); setEditMatrix(null); setBaseMatrix(null) }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Membre</th>
                    {!selectedMembershipId && <th className="px-4 py-3">Rôle</th>}
                  </tr>
                </thead>
                <tbody>
                  {agencyMembers.map(({ membership, user }, idx) => {
                    const active = selectedMembershipId === membership.id
                    const initials = `${user.firstName[0]}${user.lastName[0]}`
                    return (
                      <motion.tr
                        key={membership.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.03 }}
                        onClick={() =>
                          selectMember(membership.id, membership.userId, membership.agencyId)
                        }
                        className={cn(
                          "cursor-pointer border-b border-slate-100/50 transition last:border-0",
                          active ? "bg-indigo-50/60" : "hover:bg-slate-50/60",
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                              {initials}
                            </span>
                            <p className="truncate font-medium text-slate-800 text-sm">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </td>
                        {!selectedMembershipId && (
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                                roleBadgeStyles[membership.role],
                              )}
                            >
                              {roleLabels[membership.role]}
                            </span>
                          </td>
                        )}
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Col 3: member permission matrix */}
      <AnimatePresence>
        {selectedMembershipId && selectedMembership && editMatrix && (
          <motion.div
            key="member-matrix"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="min-w-0 flex-1"
          >
            <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {selectedMembership.user.firstName[0]}
                    {selectedMembership.user.lastName[0]}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {selectedMembership.user.firstName} {selectedMembership.user.lastName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                          roleBadgeStyles[selectedMembership.membership.role],
                        )}
                      >
                        {roleLabels[selectedMembership.membership.role]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedAgency?.city}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDirty && (
                    <>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Réinitialiser
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Enregistrer
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSelectedMembershipId(null); setEditMatrix(null); setBaseMatrix(null) }}
                    className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <MatrixTable matrix={editMatrix} editable onToggle={toggleCell} />
              <MatrixLegend editable />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- ROOT PAGE ----------

const views: { key: ViewMode; label: string; icon: React.ElementType }[] = [
  { key: "role", label: "Par rôle", icon: Shield },
  { key: "user", label: "Par utilisateur", icon: Users },
  { key: "agency", label: "Par agence", icon: Building2 },
]

export default function PermissionsPage() {
  const [view, setView] = useState<ViewMode>("role")

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon={Shield}
          breadcrumb="Permissions"
          title="Permissions"
          description="Source de vérité unique pour les droits d'accès — par rôle, utilisateur ou agence."
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm w-fit">
        {views.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              view === key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* View content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {view === "role" && <RoleView />}
          {view === "user" && <UserView />}
          {view === "agency" && <AgencyView />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
