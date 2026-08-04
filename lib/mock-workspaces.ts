// Multi-tenant mock data structure aligned with ARCHITECTURE_AUDIT.md
// All entities follow the SaaS multi-tenant model with agency isolation

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE' | 'CLIENT'
export type SubscriptionPlan = 'STARTER' | 'PRO' | 'BUSINESS'
export type BillingCycle = 'monthly' | '6_months' | 'annual'

// Platform-level user (can belong to multiple agencies)
export interface GlobalUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  createdAt: string
  lastLoginAt?: string
}

// Agency entity (per-agency)
export interface Agency {
  id: string
  name: string
  city: string
  address: string
  email: string
  phone: string
  website?: string
  logo?: string
  plan: SubscriptionPlan
  status: 'active' | 'suspended' | 'cancelled'
  createdAt: string
  updatedAt: string
  ownerId: string // GlobalUser.id
  carCount: number
  memberCount: number
  // Operational statistics (mock figures, in MAD)
  reservationCount: number
  customerCount: number
  revenue: number
  expenses: number
}

// Cross-agency membership (many-to-many user-agency)
export interface AgencyMembership {
  id: string
  userId: string // GlobalUser.id
  agencyId: string
  role: UserRole
  status: 'active' | 'pending' | 'inactive'
  joinedAt: string
  invitedAt?: string
  invitedBy?: string
}

// Subscription & billing (per-agency)
export interface Subscription {
  id: string
  agencyId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  status: 'trialing' | 'active' | 'past_due' | 'cancelled'
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndDate?: string
  nextBillingDate: string
  autoRenew: boolean
  createdAt: string
}

// Invoices & payments
export interface Invoice {
  id: string
  agencyId: string
  invoiceNumber: string
  amount: number
  currency: 'MAD'
  status: 'pending' | 'sent' | 'paid' | 'failed' | 'refunded'
  issuedAt: string
  dueAt: string
  paidAt?: string
  pdfUrl?: string
  createdAt: string
}

// Audit logs (per-agency compliance tracking)
export interface AuditLog {
  id: string
  agencyId: string
  userId: string
  action: 'create' | 'update' | 'delete' | 'export' | 'sign'
  resource: 'car' | 'reservation' | 'client' | 'contract' | 'expense' | 'team' | 'settings'
  resourceId: string
  details: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// Team (group of users within an agency)
export interface AgencyTeam {
  id: string
  agencyId: string
  name: string
  description: string
  memberIds: string[] // AgencyMembership.ids
  createdAt: string
  updatedAt: string
}

// Invitation (pending user acceptance)
export interface TeamInvitation {
  id: string
  agencyId: string
  email: string
  role: UserRole
  status: 'pending' | 'accepted' | 'expired'
  invitedBy: string
  invitedAt: string
  expiresAt: string
  acceptedAt?: string
  token: string // For email link
}

// Role-based permissions (per the architecture audit Section 5)
export interface RolePermission {
  role: UserRole
  resources: {
    dashboard: ('read')[]
    cars: ('create' | 'read' | 'update' | 'delete' | 'export')[]
    reservations: ('create' | 'read' | 'update' | 'delete' | 'export')[]
    clients: ('create' | 'read' | 'update' | 'delete' | 'export')[]
    contracts: ('create' | 'read' | 'update' | 'delete')[]
    finances: ('create' | 'read' | 'update' | 'delete' | 'export')[]
    reports: ('read' | 'export')[]
    settings: ('create' | 'read' | 'update' | 'delete')[]
    workspace: ('create' | 'read' | 'update' | 'delete')[]
  }
}

// Current logged-in user (for testing/demo)
export const CURRENT_USER_ID = 'user_ahmed_global'

// Mock global users
export const mockGlobalUsers: GlobalUser[] = [
  {
    id: 'user_ahmed_global',
    firstName: 'Ahmed',
    lastName: 'Bennani',
    email: 'ahmed@lokarent.ma',
    phone: '+212 661 234 567',
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2026-06-24T14:30:00Z',
  },
  {
    id: 'user_fatima_global',
    firstName: 'Fatima',
    lastName: 'Hassan',
    email: 'fatima@lokarent-casa.ma',
    phone: '+212 662 345 678',
    createdAt: '2024-02-01T10:00:00Z',
    lastLoginAt: '2026-06-23T10:15:00Z',
  },
  {
    id: 'user_salma_global',
    firstName: 'Salma',
    lastName: 'Karim',
    email: 'salma@lokarent.ma',
    phone: '+212 663 456 789',
    createdAt: '2024-02-01T10:00:00Z',
    lastLoginAt: '2026-06-24T09:00:00Z',
  },
  {
    id: 'user_youssef_global',
    firstName: 'Youssef',
    lastName: 'El Amrani',
    email: 'youssef@lokarent-mkh.ma',
    phone: '+212 664 567 890',
    createdAt: '2024-03-05T08:00:00Z',
    lastLoginAt: '2026-06-22T16:45:00Z',
  },
  {
    id: 'user_nadia_global',
    firstName: 'Nadia',
    lastName: 'Chraibi',
    email: 'nadia@lokarent-casa.ma',
    phone: '+212 665 678 901',
    createdAt: '2024-03-20T09:00:00Z',
    lastLoginAt: '2026-06-20T11:30:00Z',
  },
  {
    id: 'user_omar_global',
    firstName: 'Omar',
    lastName: 'Tazi',
    email: 'omar@lokarent-agadir.ma',
    phone: '+212 666 789 012',
    createdAt: '2024-04-01T10:00:00Z',
    lastLoginAt: '2026-06-18T09:20:00Z',
  },
  {
    id: 'user_meryem_global',
    firstName: 'Meryem',
    lastName: 'Alaoui',
    email: 'meryem@lokarent.ma',
    phone: '+212 667 890 123',
    createdAt: '2024-04-15T11:00:00Z',
    lastLoginAt: '2026-06-21T14:10:00Z',
  },
  {
    id: 'user_karim_global',
    firstName: 'Karim',
    lastName: 'Idrissi',
    email: 'karim@lokarent-mkh.ma',
    phone: '+212 668 901 234',
    createdAt: '2024-05-01T09:00:00Z',
    lastLoginAt: '2026-06-19T17:00:00Z',
  },
]

// Mock agencies (per architecture audit section 4)
export const mockAgencies: Agency[] = [
  {
    id: 'agency_marrakech',
    name: 'LokaRent Marrakech',
    city: 'Marrakech',
    address: '12 Avenue Mohammed VI, Guéliz, Marrakech',
    email: 'info@lokarent-marrakech.ma',
    phone: '+212 612 345 678',
    website: 'lokarent-marrakech.ma',
    plan: 'PRO',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
    ownerId: 'user_ahmed_global',
    carCount: 28,
    memberCount: 5,
    reservationCount: 412,
    customerCount: 287,
    revenue: 842000,
    expenses: 318000,
  },
  {
    id: 'agency_casablanca',
    name: 'LokaRent Casablanca',
    city: 'Casablanca',
    address: '45 Boulevard Zerktouni, Maârif, Casablanca',
    email: 'info@lokarent-casablanca.ma',
    phone: '+212 612 345 679',
    website: 'lokarent-casablanca.ma',
    plan: 'PRO',
    status: 'active',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2026-06-19T14:20:00Z',
    ownerId: 'user_fatima_global',
    carCount: 42,
    memberCount: 8,
    reservationCount: 638,
    customerCount: 451,
    revenue: 1287000,
    expenses: 504000,
  },
  {
    id: 'agency_agadir',
    name: 'LokaRent Agadir',
    city: 'Agadir',
    address: '8 Rue de la Plage, Secteur Touristique, Agadir',
    email: 'info@lokarent-agadir.ma',
    phone: '+212 612 345 680',
    plan: 'STARTER',
    status: 'active',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2026-06-15T11:00:00Z',
    ownerId: 'user_salma_global',
    carCount: 15,
    memberCount: 3,
    reservationCount: 196,
    customerCount: 142,
    revenue: 384000,
    expenses: 165000,
  },
]

// Mock cross-agency memberships (current user has multiple roles across agencies)
export const mockMemberships: AgencyMembership[] = [
  {
    id: 'membership_ahmed_mkh',
    userId: 'user_ahmed_global',
    agencyId: 'agency_marrakech',
    role: 'OWNER',
    status: 'active',
    joinedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'membership_ahmed_casa',
    userId: 'user_ahmed_global',
    agencyId: 'agency_casablanca',
    role: 'MANAGER',
    status: 'active',
    joinedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'membership_ahmed_agadir',
    userId: 'user_ahmed_global',
    agencyId: 'agency_agadir',
    role: 'EMPLOYEE',
    status: 'active',
    joinedAt: '2024-06-10T10:00:00Z',
  },
  {
    id: 'membership_fatima_casa',
    userId: 'user_fatima_global',
    agencyId: 'agency_casablanca',
    role: 'OWNER',
    status: 'active',
    joinedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'membership_salma_mkh',
    userId: 'user_salma_global',
    agencyId: 'agency_marrakech',
    role: 'MANAGER',
    status: 'active',
    joinedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'membership_salma_agadir',
    userId: 'user_salma_global',
    agencyId: 'agency_agadir',
    role: 'OWNER',
    status: 'active',
    joinedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'membership_youssef_mkh',
    userId: 'user_youssef_global',
    agencyId: 'agency_marrakech',
    role: 'TEAM_LEAD',
    status: 'active',
    joinedAt: '2024-03-05T08:00:00Z',
    invitedBy: 'user_ahmed_global',
    invitedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'membership_nadia_casa',
    userId: 'user_nadia_global',
    agencyId: 'agency_casablanca',
    role: 'EMPLOYEE',
    status: 'active',
    joinedAt: '2024-03-20T09:00:00Z',
    invitedBy: 'user_fatima_global',
    invitedAt: '2024-03-18T10:00:00Z',
  },
  {
    id: 'membership_nadia_mkh',
    userId: 'user_nadia_global',
    agencyId: 'agency_marrakech',
    role: 'EMPLOYEE',
    status: 'active',
    joinedAt: '2024-05-10T09:00:00Z',
    invitedBy: 'user_ahmed_global',
    invitedAt: '2024-05-08T10:00:00Z',
  },
  {
    id: 'membership_omar_agadir',
    userId: 'user_omar_global',
    agencyId: 'agency_agadir',
    role: 'TEAM_LEAD',
    status: 'active',
    joinedAt: '2024-04-01T10:00:00Z',
    invitedBy: 'user_salma_global',
    invitedAt: '2024-03-28T10:00:00Z',
  },
  {
    id: 'membership_meryem_casa',
    userId: 'user_meryem_global',
    agencyId: 'agency_casablanca',
    role: 'ADMIN',
    status: 'active',
    joinedAt: '2024-04-15T11:00:00Z',
    invitedBy: 'user_fatima_global',
    invitedAt: '2024-04-12T10:00:00Z',
  },
  {
    id: 'membership_meryem_mkh',
    userId: 'user_meryem_global',
    agencyId: 'agency_marrakech',
    role: 'MANAGER',
    status: 'pending',
    joinedAt: '2026-06-20T11:00:00Z',
    invitedBy: 'user_ahmed_global',
    invitedAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 'membership_karim_mkh',
    userId: 'user_karim_global',
    agencyId: 'agency_marrakech',
    role: 'EMPLOYEE',
    status: 'active',
    joinedAt: '2024-05-01T09:00:00Z',
    invitedBy: 'user_salma_global',
    invitedAt: '2024-04-28T10:00:00Z',
  },
]

// Mock subscriptions (per-agency billing)
export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub_mkh_1',
    agencyId: 'agency_marrakech',
    plan: 'PRO',
    billingCycle: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-06-01T00:00:00Z',
    currentPeriodEnd: '2026-07-01T00:00:00Z',
    nextBillingDate: '2026-07-01T00:00:00Z',
    autoRenew: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'sub_casa_1',
    agencyId: 'agency_casablanca',
    plan: 'PRO',
    billingCycle: 'annual',
    status: 'active',
    currentPeriodStart: '2026-02-01T00:00:00Z',
    currentPeriodEnd: '2027-02-01T00:00:00Z',
    nextBillingDate: '2027-02-01T00:00:00Z',
    autoRenew: true,
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: 'sub_agadir_1',
    agencyId: 'agency_agadir',
    plan: 'STARTER',
    billingCycle: 'monthly',
    status: 'trialing',
    currentPeriodStart: '2026-06-10T00:00:00Z',
    currentPeriodEnd: '2026-07-10T00:00:00Z',
    trialEndDate: '2026-06-24T00:00:00Z',
    nextBillingDate: '2026-07-10T00:00:00Z',
    autoRenew: true,
    createdAt: '2024-03-10T10:00:00Z',
  },
]

// Mock invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv_mkh_001',
    agencyId: 'agency_marrakech',
    invoiceNumber: 'INV-2026-001',
    amount: 599,
    currency: 'MAD',
    status: 'paid',
    issuedAt: '2026-06-01T10:00:00Z',
    dueAt: '2026-06-15T10:00:00Z',
    paidAt: '2026-06-12T14:30:00Z',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'inv_casa_001',
    agencyId: 'agency_casablanca',
    invoiceNumber: 'INV-2026-001',
    amount: 5994,
    currency: 'MAD',
    status: 'paid',
    issuedAt: '2026-02-01T10:00:00Z',
    dueAt: '2026-02-15T10:00:00Z',
    paidAt: '2026-02-08T09:00:00Z',
    createdAt: '2026-02-01T10:00:00Z',
  },
]

// Mock teams
export const mockTeams: AgencyTeam[] = [
  {
    id: 'team_ops_mkh',
    agencyId: 'agency_marrakech',
    name: 'Opérations',
    description: 'Gestion flotte et réservations',
    memberIds: ['membership_ahmed_mkh', 'membership_salma_mkh', 'membership_youssef_mkh'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 'team_finance_mkh',
    agencyId: 'agency_marrakech',
    name: 'Finance',
    description: 'Comptabilité et facturation',
    memberIds: ['membership_salma_mkh', 'membership_ahmed_mkh'],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'team_accueil_mkh',
    agencyId: 'agency_marrakech',
    name: 'Accueil',
    description: 'Réception et relation client',
    memberIds: ['membership_karim_mkh', 'membership_nadia_mkh'],
    createdAt: '2024-05-01T09:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'team_ops_casa',
    agencyId: 'agency_casablanca',
    name: 'Opérations',
    description: 'Gestion flotte et réservations',
    memberIds: ['membership_fatima_casa', 'membership_ahmed_casa', 'membership_nadia_casa'],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 'team_admin_casa',
    agencyId: 'agency_casablanca',
    name: 'Administration',
    description: 'Direction et administration',
    memberIds: ['membership_fatima_casa', 'membership_meryem_casa'],
    createdAt: '2024-04-15T11:00:00Z',
    updatedAt: '2026-06-18T10:00:00Z',
  },
  {
    id: 'team_ops_agadir',
    agencyId: 'agency_agadir',
    name: 'Opérations',
    description: 'Gestion flotte et réservations',
    memberIds: ['membership_salma_agadir', 'membership_omar_agadir'],
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2026-06-12T10:00:00Z',
  },
]

// Mock invitations
export const mockInvitations: TeamInvitation[] = [
  {
    id: 'invite_1',
    agencyId: 'agency_marrakech',
    email: 'new_employee@lokarent.ma',
    role: 'EMPLOYEE',
    status: 'pending',
    invitedBy: 'user_ahmed_global',
    invitedAt: '2026-06-20T10:00:00Z',
    expiresAt: '2026-07-04T10:00:00Z',
    token: 'token_invite_1_abc123xyz',
  },
  {
    id: 'invite_2',
    agencyId: 'agency_casablanca',
    email: 'accountant@lokarent-casa.ma',
    role: 'MANAGER',
    status: 'pending',
    invitedBy: 'user_fatima_global',
    invitedAt: '2026-06-15T14:00:00Z',
    expiresAt: '2026-06-29T14:00:00Z',
    token: 'token_invite_2_def456uvw',
  },
]

// Mock audit logs (per-agency compliance)
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit_1',
    agencyId: 'agency_marrakech',
    userId: 'user_ahmed_global',
    action: 'create',
    resource: 'reservation',
    resourceId: 'res_001',
    details: 'Created reservation RES-2026-0045',
    createdAt: '2026-06-24T14:30:00Z',
  },
  {
    id: 'audit_2',
    agencyId: 'agency_marrakech',
    userId: 'user_salma_global',
    action: 'update',
    resource: 'contract',
    resourceId: 'contract_001',
    details: 'Signed contract CONT-2026-0012',
    createdAt: '2026-06-24T13:15:00Z',
  },
  {
    id: 'audit_3',
    agencyId: 'agency_casablanca',
    userId: 'user_fatima_global',
    action: 'export',
    resource: 'car',
    resourceId: 'fleet_export',
    details: 'Exported fleet data to CSV',
    createdAt: '2026-06-24T11:00:00Z',
  },
  {
    id: 'audit_4',
    agencyId: 'agency_marrakech',
    userId: 'user_salma_global',
    action: 'create',
    resource: 'client',
    resourceId: 'client_088',
    details: 'Ajout du client Youssef El Amrani',
    createdAt: '2026-06-24T09:42:00Z',
  },
  {
    id: 'audit_5',
    agencyId: 'agency_agadir',
    userId: 'user_salma_global',
    action: 'update',
    resource: 'car',
    resourceId: 'car_012',
    details: 'Mise à jour du kilométrage du véhicule Dacia Logan',
    createdAt: '2026-06-23T16:20:00Z',
  },
  {
    id: 'audit_6',
    agencyId: 'agency_casablanca',
    userId: 'user_ahmed_global',
    action: 'delete',
    resource: 'expense',
    resourceId: 'exp_045',
    details: 'Suppression d\'une dépense en double',
    createdAt: '2026-06-23T14:05:00Z',
  },
  {
    id: 'audit_7',
    agencyId: 'agency_marrakech',
    userId: 'user_ahmed_global',
    action: 'update',
    resource: 'settings',
    resourceId: 'pricing',
    details: 'Modification de la politique tarifaire weekend',
    createdAt: '2026-06-22T10:30:00Z',
  },
  {
    id: 'audit_8',
    agencyId: 'agency_marrakech',
    userId: 'user_salma_global',
    action: 'sign',
    resource: 'contract',
    resourceId: 'contract_034',
    details: 'Signature du contrat CONT-2026-0034',
    createdAt: '2026-06-22T08:15:00Z',
  },
  {
    id: 'audit_9',
    agencyId: 'agency_marrakech',
    userId: 'user_youssef_global',
    action: 'create',
    resource: 'reservation',
    resourceId: 'res_098',
    details: 'Création réservation RES-2026-0098 — Peugeot 208',
    createdAt: '2026-06-21T15:20:00Z',
  },
  {
    id: 'audit_10',
    agencyId: 'agency_casablanca',
    userId: 'user_nadia_global',
    action: 'update',
    resource: 'client',
    resourceId: 'client_045',
    details: 'Mise à jour du dossier client Sara Bennani',
    createdAt: '2026-06-21T11:40:00Z',
  },
  {
    id: 'audit_11',
    agencyId: 'agency_casablanca',
    userId: 'user_meryem_global',
    action: 'export',
    resource: 'reservation',
    resourceId: 'export_res_juin',
    details: 'Export réservations juin 2026 — 47 lignes',
    createdAt: '2026-06-20T14:55:00Z',
  },
  {
    id: 'audit_12',
    agencyId: 'agency_agadir',
    userId: 'user_omar_global',
    action: 'create',
    resource: 'client',
    resourceId: 'client_088',
    details: 'Nouveau client Hassan Oubella enregistré',
    createdAt: '2026-06-20T10:10:00Z',
  },
  {
    id: 'audit_13',
    agencyId: 'agency_marrakech',
    userId: 'user_karim_global',
    action: 'update',
    resource: 'reservation',
    resourceId: 'res_076',
    details: 'Prolongation réservation RES-2026-0076 de 2 jours',
    createdAt: '2026-06-19T16:30:00Z',
  },
  {
    id: 'audit_14',
    agencyId: 'agency_marrakech',
    userId: 'user_ahmed_global',
    action: 'delete',
    resource: 'expense',
    resourceId: 'exp_023',
    details: 'Suppression charge carburant en double',
    createdAt: '2026-06-19T09:00:00Z',
  },
  {
    id: 'audit_15',
    agencyId: 'agency_casablanca',
    userId: 'user_fatima_global',
    action: 'update',
    resource: 'settings',
    resourceId: 'pricing',
    details: 'Actualisation des tarifs été 2026',
    createdAt: '2026-06-18T11:20:00Z',
  },
]

// Permission matrix (per architecture audit section 5)
export const rolePermissions: Record<UserRole, RolePermission['resources']> = {
  OWNER: {
    dashboard: ['read'],
    cars: ['create', 'read', 'update', 'delete', 'export'],
    reservations: ['create', 'read', 'update', 'delete', 'export'],
    clients: ['create', 'read', 'update', 'delete', 'export'],
    contracts: ['create', 'read', 'update', 'delete'],
    finances: ['create', 'read', 'update', 'delete', 'export'],
    reports: ['read', 'export'],
    settings: ['create', 'read', 'update', 'delete'],
    workspace: ['create', 'read', 'update', 'delete'],
  },
  ADMIN: {
    dashboard: ['read'],
    cars: ['create', 'read', 'update', 'delete', 'export'],
    reservations: ['create', 'read', 'update', 'delete', 'export'],
    clients: ['create', 'read', 'update', 'delete', 'export'],
    contracts: ['create', 'read', 'update', 'delete'],
    finances: ['create', 'read', 'update', 'delete', 'export'],
    reports: ['read', 'export'],
    settings: ['read', 'update'],
    workspace: ['create', 'read', 'update'],
  },
  MANAGER: {
    dashboard: ['read'],
    cars: ['read', 'update'],
    reservations: ['create', 'read', 'update', 'export'],
    clients: ['create', 'read', 'update', 'export'],
    contracts: ['read', 'update'],
    finances: ['read', 'export'],
    reports: ['read'],
    settings: ['read'],
    workspace: ['read'],
  },
  TEAM_LEAD: {
    dashboard: ['read'],
    cars: ['read', 'update'],
    reservations: ['create', 'read', 'update'],
    clients: ['create', 'read', 'update'],
    contracts: ['read'],
    finances: ['read'],
    reports: ['read'],
    settings: [],
    workspace: [],
  },
  EMPLOYEE: {
    dashboard: ['read'],
    cars: ['read'],
    reservations: ['create', 'read', 'update'],
    clients: ['create', 'read', 'update'],
    contracts: ['read'],
    finances: [],
    reports: [],
    settings: [],
    workspace: [],
  },
  CLIENT: {
    dashboard: [],
    cars: [],
    reservations: ['read'],
    clients: ['read'],
    contracts: ['read'],
    finances: [],
    reports: [],
    settings: [],
    workspace: [],
  },
}

// Helper functions
export function getAgencyById(id: string): Agency | undefined {
  return mockAgencies.find((a) => a.id === id)
}

export function getGlobalUserById(id: string): GlobalUser | undefined {
  return mockGlobalUsers.find((u) => u.id === id)
}

export function getCurrentUserMemberships(): AgencyMembership[] {
  return mockMemberships.filter((m) => m.userId === CURRENT_USER_ID)
}

export function getUserAgencies(): Agency[] {
  const memberships = getCurrentUserMemberships()
  return memberships
    .map((m) => getAgencyById(m.agencyId))
    .filter((a): a is Agency => !!a)
}

export function getCurrentUserRoleInAgency(agencyId: string): UserRole {
  const membership = mockMemberships.find(
    (m) => m.userId === CURRENT_USER_ID && m.agencyId === agencyId
  )
  return membership?.role || 'EMPLOYEE'
}

export function getMembersByAgency(agencyId: string): AgencyMembership[] {
  return mockMemberships.filter((m) => m.agencyId === agencyId && m.status === 'active')
}

export function getTeamsByAgency(agencyId: string): AgencyTeam[] {
  return mockTeams.filter((t) => t.agencyId === agencyId)
}

export function getInvitationsByAgency(agencyId: string): TeamInvitation[] {
  return mockInvitations.filter((i) => i.agencyId === agencyId && i.status === 'pending')
}

export function getAuditLogsByAgency(agencyId: string, limit = 10): AuditLog[] {
  return mockAuditLogs
    .filter((log) => log.agencyId === agencyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function getSubscriptionByAgency(agencyId: string): Subscription | undefined {
  return mockSubscriptions.find((s) => s.agencyId === agencyId)
}

export function getInvoicesByAgency(agencyId: string): Invoice[] {
  return mockInvoices.filter((i) => i.agencyId === agencyId)
}

export function getMembershipsByUser(userId: string): AgencyMembership[] {
  return mockMemberships.filter((m) => m.userId === userId)
}

export function getMembershipsByUserActive(userId: string): AgencyMembership[] {
  return mockMemberships.filter((m) => m.userId === userId && m.status === 'active')
}

export function getTeamsByUser(userId: string): AgencyTeam[] {
  const membershipIds = mockMemberships.filter((m) => m.userId === userId).map((m) => m.id)
  return mockTeams.filter((t) => t.memberIds.some((id) => membershipIds.includes(id)))
}

export function getAuditLogsByUser(userId: string, limit = 8): AuditLog[] {
  return mockAuditLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function getUserName(userId: string): string {
  const user = getGlobalUserById(userId)
  return user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
}

// French display labels for roles (UI consistency)
export const roleLabels: Record<UserRole, string> = {
  OWNER: 'Propriétaire',
  ADMIN: 'Administrateur',
  MANAGER: 'Gérant',
  TEAM_LEAD: "Chef d'équipe",
  EMPLOYEE: 'Employé',
  CLIENT: 'Client',
}

// Role badge color classes (light theme)
export const roleBadgeStyles: Record<UserRole, string> = {
  OWNER: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  ADMIN: 'bg-violet-50 text-violet-700 ring-violet-100',
  MANAGER: 'bg-sky-50 text-sky-700 ring-sky-100',
  TEAM_LEAD: 'bg-amber-50 text-amber-700 ring-amber-100',
  EMPLOYEE: 'bg-slate-100 text-slate-700 ring-slate-200',
  CLIENT: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
}

// Plan display labels and prices (MAD / month)
export const planLabels: Record<SubscriptionPlan, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  BUSINESS: 'Business',
}

export const planPrices: Record<SubscriptionPlan, number> = {
  STARTER: 299,
  PRO: 599,
  BUSINESS: 1299,
}

// Application pages that can have permissions assigned
export const permissionPages = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'cars', label: 'Flotte' },
  { key: 'reservations', label: 'Réservations' },
  { key: 'clients', label: 'Clients' },
  { key: 'contracts', label: 'Contrats' },
  { key: 'finances', label: 'Finances' },
  { key: 'reports', label: 'Rapports' },
  { key: 'settings', label: 'Paramètres' },
  { key: 'workspace', label: 'Workspace' },
] as const

export type PermissionModule = typeof permissionPages[number]['key']
export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'export'

// Per-user permission overrides (deviations from the role baseline)
export interface UserPermissionOverride {
  id: string
  userId: string
  agencyId: string
  module: PermissionModule
  actions: PermissionAction[]
  grantedBy: string
  grantedAt: string
  note?: string
}

export const mockUserPermissionOverrides: UserPermissionOverride[] = [
  {
    id: 'override_1',
    userId: 'user_youssef_global',
    agencyId: 'agency_marrakech',
    module: 'finances',
    actions: ['read'],
    grantedBy: 'user_ahmed_global',
    grantedAt: '2024-06-01T10:00:00Z',
    note: 'Accès lecture finances accordé pour suivi budgétaire équipe',
  },
  {
    id: 'override_2',
    userId: 'user_nadia_global',
    agencyId: 'agency_casablanca',
    module: 'reports',
    actions: ['read', 'export'],
    grantedBy: 'user_fatima_global',
    grantedAt: '2024-07-15T10:00:00Z',
    note: 'Accès rapports pour suivi mensuel clients',
  },
]

// Permission action labels
export const permissionActions = [
  { key: 'read', label: 'Voir' },
  { key: 'create', label: 'Créer' },
  { key: 'update', label: 'Modifier' },
  { key: 'delete', label: 'Supprimer' },
  { key: 'export', label: 'Exporter' },
] as const

export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' MAD'
}
