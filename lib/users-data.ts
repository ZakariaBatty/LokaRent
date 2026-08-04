export type UserRole = "Gérant" | "Réceptionniste" | "Comptable"

export type UserStatus = "Actif" | "Inactif" | "Invitation en attente"

export type TeamUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  status: UserStatus
  lastConnection: string | null // ISO
  invitedAt?: string // ISO
  expiresAt?: string // ISO
  avatarColor: string
}

export const users: TeamUser[] = [
  {
    id: "u-1",
    firstName: "Youssef",
    lastName: "El Amrani",
    email: "youssef.elamrani@lokarent.ma",
    role: "Gérant",
    status: "Actif",
    lastConnection: "2026-05-20T08:42:00Z",
    avatarColor: "from-indigo-500 to-violet-600",
  },
  {
    id: "u-2",
    firstName: "Salma",
    lastName: "Benjelloun",
    email: "salma.benjelloun@lokarent.ma",
    role: "Réceptionniste",
    status: "Actif",
    lastConnection: "2026-05-20T07:15:00Z",
    avatarColor: "from-sky-500 to-blue-600",
  },
  {
    id: "u-3",
    firstName: "Karim",
    lastName: "Tazi",
    email: "karim.tazi@finance-pro.ma",
    role: "Comptable",
    status: "Invitation en attente",
    lastConnection: null,
    invitedAt: "2026-05-18T14:30:00Z",
    expiresAt: "2026-05-25T14:30:00Z",
    avatarColor: "from-violet-500 to-fuchsia-600",
  },
]

export const planConfig = {
  name: "PRO" as "STARTER" | "PRO" | "BUSINESS",
  maxSeats: 5,
}

// Role configuration
export type RoleStyle = {
  badge: string
  dot: string
  ring: string
  description: string
  scope: string
}

export const roleStyles: Record<UserRole, RoleStyle> = {
  Gérant: {
    badge: "bg-slate-900 text-white",
    dot: "bg-emerald-400",
    ring: "ring-slate-700",
    description: "Accès complet à toutes les fonctionnalités",
    scope: "Toutes les opérations, configuration et facturation",
  },
  Réceptionniste: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    ring: "ring-blue-200",
    description: "Gestion des réservations & des clients",
    scope: "Réservations, contrats et fiches clients",
  },
  Comptable: {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    ring: "ring-violet-200",
    description: "Accès aux finances en lecture/écriture",
    scope: "Finances, dépenses et rapports comptables",
  },
}

export type StatusStyle = {
  badge: string
  dot: string
  pulse: boolean
}

export const statusStyles: Record<UserStatus, StatusStyle> = {
  Actif: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
    pulse: false,
  },
  Inactif: {
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    pulse: false,
  },
  "Invitation en attente": {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    dot: "bg-amber-500",
    pulse: true,
  },
}

// Permissions matrix
export type Permission = "full" | "view" | "edit" | "none"

export type PermissionCell = {
  level: Permission
  label?: string
}

export type ModuleRow = {
  module: string
  description: string
  permissions: Record<UserRole, PermissionCell>
}

export const permissionsMatrix: ModuleRow[] = [
  {
    module: "Dashboard",
    description: "Vue d'ensemble et indicateurs clés",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "full" },
      Comptable: { level: "full" },
    },
  },
  {
    module: "Flotte",
    description: "Gestion des véhicules",
    permissions: {
      Gérant: { level: "edit", label: "Modifier" },
      Réceptionniste: { level: "view", label: "Voir" },
      Comptable: { level: "view", label: "Voir" },
    },
  },
  {
    module: "Clients",
    description: "Fiches clients et historique",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "full" },
      Comptable: { level: "none" },
    },
  },
  {
    module: "Réservations",
    description: "Création et gestion des locations",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "full" },
      Comptable: { level: "view", label: "Voir" },
    },
  },
  {
    module: "Contrats",
    description: "Contrats de location signés",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "full" },
      Comptable: { level: "view", label: "Voir" },
    },
  },
  {
    module: "Finances",
    description: "Encaissements et trésorerie",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "none" },
      Comptable: { level: "full" },
    },
  },
  {
    module: "Dépenses",
    description: "Achats et charges opérationnelles",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "none" },
      Comptable: { level: "full" },
    },
  },
  {
    module: "Rapports",
    description: "Analytics et exports comptables",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "none" },
      Comptable: { level: "full" },
    },
  },
  {
    module: "Alertes",
    description: "Notifications et rappels",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "full" },
      Comptable: { level: "none" },
    },
  },
  {
    module: "Paramètres",
    description: "Configuration de l'agence",
    permissions: {
      Gérant: { level: "full" },
      Réceptionniste: { level: "none" },
      Comptable: { level: "none" },
    },
  },
]

// Helpers
export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

export function formatLastConnection(iso: string | null): string {
  if (!iso) return "Jamais"
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days} j`
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatExpirationCountdown(iso: string): { label: string; urgent: boolean } {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  if (diffMs <= 0) return { label: "Expirée", urgent: true }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days >= 1) return { label: `Expire dans ${days} j`, urgent: days <= 2 }
  return { label: `Expire dans ${hours} h`, urgent: true }
}

export function formatInvitedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
