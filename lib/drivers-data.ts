// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriverStatus = "active" | "inactive" | "suspended"

export type PaymentType = "monthly" | "hourly" | "mission"

export type DriverPaymentRate = {
  id: string
  type: PaymentType
  // Monthly
  monthlySalary?: number
  startDate?: string // ISO
  endDate?: string | null // ISO – null = current
  // Mission / hourly
  pricePerHour?: number
  pricePerMission?: number
  currency: string
  // Meta
  createdAt: string // ISO
  note?: string
}

export type DriverPaymentEntry = {
  id: string
  date: string // ISO
  amount: number
  type: "salary" | "mission" | "bonus" | "advance"
  reference?: string
  note?: string
}

export type DriverAssignment = {
  id: string
  reservationId: string
  reservationCode: string
  clientName: string
  carLabel: string
  startDate: string // ISO
  endDate: string // ISO
  missionFee?: number
  status: "completed" | "ongoing" | "cancelled"
}

export type DriverDocument = {
  id: string
  labelKey: string
  type: "driving_license" | "national_id" | "contract" | "other"
  scanned: boolean
  documentNumber?: string
  issuedAt?: string
  expiry?: string // ISO
  documentUrl?: string
}

export type Driver = {
  id: string
  reference?: string
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
  homeAgencyName: string
  // Identity
  cinNumber: string
  cinExpiry: string // ISO
  // License
  licenseNumber: string
  licenseExpiry: string // ISO
  // Payment
  paymentType: PaymentType
  currentRate: DriverPaymentRate
  rateHistory: DriverPaymentRate[]
  paymentHistory: DriverPaymentEntry[]
  // Work
  assignments: DriverAssignment[]
  documents: DriverDocument[]
  // Meta
  status: DriverStatus
  createdAt: string // ISO
  totalAssignments: number
  totalEarned: number
  // Avatar seed
  avatarSeed?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const statusConfig: Record<DriverStatus, { label: string; pillClass: string; dotClass: string; textClass: string }> = {
  active: {
    label: "drivers.status.active",
    pillClass: "border-emerald-200 bg-emerald-50",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  inactive: {
    label: "drivers.status.inactive",
    pillClass: "border-slate-200 bg-slate-50",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
  suspended: {
    label: "drivers.status.suspended",
    pillClass: "border-rose-200 bg-rose-50",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
  },
}

export const paymentTypeConfig: Record<PaymentType, { label: string; color: string }> = {
  monthly: { label: "drivers.pricing.monthly", color: "text-blue-700 bg-blue-50 border-blue-200" },
  hourly: { label: "drivers.pricing.hourly", color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  mission: { label: "drivers.pricing.mission", color: "text-violet-700 bg-violet-50 border-violet-200" },
}

export function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n)
}

export function formatDate(iso: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" })
}

export function daysUntil(iso: string) {
  if (!iso) return 0
  return Math.floor((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function driverFullName(d: Driver) {
  return `${d.firstName} ${d.lastName}`
}

export const drivers: Driver[] = []
