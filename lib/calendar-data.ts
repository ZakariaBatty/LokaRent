export type CalendarVehicleStatus = "disponible" | "louee" | "maintenance"

export type CalendarVehicle = {
  id: string
  brand: string
  model: string
  plate: string
  category: "Citadine" | "Berline" | "SUV" | "Utilitaire"
  currentStatus: CalendarVehicleStatus
}

export type CalendarBlockType = "reservation" | "maintenance"
export type CalendarBlockStatus = "en_cours" | "confirmee" | "maintenance"

export type CalendarBlock = {
  id: string
  vehicleId: string
  startDate: string // ISO yyyy-mm-dd
  endDate: string // ISO yyyy-mm-dd (inclusive)
  type: CalendarBlockType
  status: CalendarBlockStatus
  clientName?: string
  clientInitials?: string
  total?: number
  reservationCode?: string
  overdue?: boolean
  maintenanceReason?: string
}

export const calendarVehicles: CalendarVehicle[] = [
  { id: "V-001", brand: "Dacia", model: "Logan", plate: "12345-A-1", category: "Citadine", currentStatus: "louee" },
  { id: "V-002", brand: "Dacia", model: "Duster", plate: "23456-B-1", category: "SUV", currentStatus: "louee" },
  { id: "V-003", brand: "Renault", model: "Clio", plate: "34567-A-2", category: "Citadine", currentStatus: "disponible" },
  { id: "V-004", brand: "Toyota", model: "RAV4", plate: "45678-C-1", category: "SUV", currentStatus: "louee" },
  { id: "V-005", brand: "Hyundai", model: "Tucson", plate: "56789-B-2", category: "SUV", currentStatus: "maintenance" },
  { id: "V-006", brand: "Peugeot", model: "208", plate: "67890-A-3", category: "Citadine", currentStatus: "disponible" },
  { id: "V-007", brand: "Kia", model: "Sportage", plate: "78901-D-1", category: "SUV", currentStatus: "louee" },
  { id: "V-008", brand: "Volkswagen", model: "Polo", plate: "89012-A-4", category: "Citadine", currentStatus: "louee" },
]

// Helper: format Date -> yyyy-mm-dd
function fmt(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

// Generate dates relative to "today" so the calendar looks alive on any day
function dayOffset(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return fmt(d)
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

type Seed = {
  vehicleId: string
  startOffset: number
  endOffset: number
  type: CalendarBlockType
  status: CalendarBlockStatus
  clientName?: string
  total?: number
  reservationCode?: string
  overdue?: boolean
  maintenanceReason?: string
}

const seeds: Seed[] = [
  // V-001 Dacia Logan
  { vehicleId: "V-001", startOffset: -6, endOffset: 1, type: "reservation", status: "en_cours", clientName: "Ahmed Benali", total: 2400, reservationCode: "RES-2026-0124", overdue: true },
  { vehicleId: "V-001", startOffset: 4, endOffset: 9, type: "reservation", status: "confirmee", clientName: "Fatima Zahra", total: 1800, reservationCode: "RES-2026-0131" },
  { vehicleId: "V-001", startOffset: 14, endOffset: 20, type: "reservation", status: "confirmee", clientName: "Karim Idrissi", total: 2100, reservationCode: "RES-2026-0142" },

  // V-002 Dacia Duster
  { vehicleId: "V-002", startOffset: -3, endOffset: 5, type: "reservation", status: "en_cours", clientName: "Youssef El Amrani", total: 3600, reservationCode: "RES-2026-0119" },
  { vehicleId: "V-002", startOffset: 8, endOffset: 11, type: "reservation", status: "confirmee", clientName: "Sara Bennani", total: 1600, reservationCode: "RES-2026-0137" },
  { vehicleId: "V-002", startOffset: 16, endOffset: 25, type: "reservation", status: "confirmee", clientName: "Hamza El Fassi", total: 4500, reservationCode: "RES-2026-0146" },

  // V-003 Renault Clio - mostly free
  { vehicleId: "V-003", startOffset: 2, endOffset: 6, type: "reservation", status: "confirmee", clientName: "Nadia Tazi", total: 1400, reservationCode: "RES-2026-0128" },
  { vehicleId: "V-003", startOffset: 19, endOffset: 22, type: "reservation", status: "confirmee", clientName: "Rachid Lahlou", total: 1200, reservationCode: "RES-2026-0149" },

  // V-004 Toyota RAV4
  { vehicleId: "V-004", startOffset: -5, endOffset: 3, type: "reservation", status: "en_cours", clientName: "Mehdi Chaoui", total: 4800, reservationCode: "RES-2026-0118" },
  { vehicleId: "V-004", startOffset: 6, endOffset: 14, type: "reservation", status: "confirmee", clientName: "Imane Berrada", total: 4500, reservationCode: "RES-2026-0135" },
  { vehicleId: "V-004", startOffset: 17, endOffset: 23, type: "reservation", status: "confirmee", clientName: "Omar Sebti", total: 3800, reservationCode: "RES-2026-0147" },

  // V-005 Hyundai Tucson - in maintenance
  { vehicleId: "V-005", startOffset: -2, endOffset: 5, type: "maintenance", status: "maintenance", maintenanceReason: "Révision 80 000 km" },
  { vehicleId: "V-005", startOffset: 10, endOffset: 17, type: "reservation", status: "confirmee", clientName: "Aïcha Mansouri", total: 4200, reservationCode: "RES-2026-0140" },

  // V-006 Peugeot 208 - mostly free
  { vehicleId: "V-006", startOffset: 1, endOffset: 4, type: "reservation", status: "confirmee", clientName: "Tarik El Idrissi", total: 1100, reservationCode: "RES-2026-0126" },
  { vehicleId: "V-006", startOffset: 13, endOffset: 14, type: "maintenance", status: "maintenance", maintenanceReason: "Vidange + filtres" },
  { vehicleId: "V-006", startOffset: 21, endOffset: 27, type: "reservation", status: "confirmee", clientName: "Salma Ouazzani", total: 1900, reservationCode: "RES-2026-0152" },

  // V-007 Kia Sportage
  { vehicleId: "V-007", startOffset: -4, endOffset: 2, type: "reservation", status: "en_cours", clientName: "Anas Ben Jelloun", total: 3300, reservationCode: "RES-2026-0121" },
  { vehicleId: "V-007", startOffset: 5, endOffset: 12, type: "reservation", status: "confirmee", clientName: "Leila Cherkaoui", total: 3500, reservationCode: "RES-2026-0133" },
  { vehicleId: "V-007", startOffset: 15, endOffset: 18, type: "reservation", status: "confirmee", clientName: "Driss Alaoui", total: 1800, reservationCode: "RES-2026-0144" },

  // V-008 VW Polo
  { vehicleId: "V-008", startOffset: -1, endOffset: 4, type: "reservation", status: "en_cours", clientName: "Khadija Rami", total: 2000, reservationCode: "RES-2026-0123" },
  { vehicleId: "V-008", startOffset: 7, endOffset: 8, type: "maintenance", status: "maintenance", maintenanceReason: "Visite technique" },
  { vehicleId: "V-008", startOffset: 11, endOffset: 16, type: "reservation", status: "confirmee", clientName: "Soufiane Hajji", total: 2200, reservationCode: "RES-2026-0138" },
  { vehicleId: "V-008", startOffset: 22, endOffset: 28, type: "reservation", status: "confirmee", clientName: "Meryem Filali", total: 2400, reservationCode: "RES-2026-0150" },
]

export const calendarBlocks: CalendarBlock[] = seeds.map((s, i) => ({
  id: `B-${String(i + 1).padStart(3, "0")}`,
  vehicleId: s.vehicleId,
  startDate: dayOffset(s.startOffset),
  endDate: dayOffset(s.endOffset),
  type: s.type,
  status: s.status,
  clientName: s.clientName,
  clientInitials: s.clientName ? initialsOf(s.clientName) : undefined,
  total: s.total,
  reservationCode: s.reservationCode,
  overdue: s.overdue,
  maintenanceReason: s.maintenanceReason,
}))

// Block style config (light theme only)
export const blockStyle: Record<
  CalendarBlockStatus,
  {
    label: string
    bg: string // gradient background
    bar: string // left accent bar
    text: string
    border: string
    dot: string
    legendDot: string
  }
> = {
  en_cours: {
    label: "En cours",
    bg: "bg-gradient-to-r from-blue-50 to-blue-100/70",
    bar: "bg-blue-600",
    text: "text-blue-900",
    border: "border-blue-200",
    dot: "bg-blue-600",
    legendDot: "bg-blue-500",
  },
  confirmee: {
    label: "Confirmée",
    bg: "bg-gradient-to-r from-emerald-50 to-emerald-100/70",
    bar: "bg-emerald-500",
    text: "text-emerald-900",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    legendDot: "bg-emerald-500",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-gradient-to-r from-slate-100 to-slate-200/70",
    bar: "bg-slate-400",
    text: "text-slate-800",
    border: "border-slate-300",
    dot: "bg-slate-400",
    legendDot: "bg-slate-400",
  },
}

export const vehicleStatusDot: Record<CalendarVehicleStatus, { dot: string; label: string }> = {
  disponible: { dot: "bg-emerald-500", label: "Disponible" },
  louee: { dot: "bg-blue-500", label: "Louée" },
  maintenance: { dot: "bg-amber-500", label: "Maintenance" },
}

export const categoryBadge: Record<CalendarVehicle["category"], string> = {
  Citadine: "bg-sky-50 text-sky-700 border-sky-200",
  Berline: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SUV: "bg-amber-50 text-amber-700 border-amber-200",
  Utilitaire: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

// Date helpers
export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isWeekend(d: Date) {
  const day = d.getDay()
  return day === 0 || day === 6
}

export function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function startOfDay(d: Date) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function startOfWeekMonday(d: Date) {
  const r = startOfDay(d)
  const day = r.getDay()
  // shift back to Monday (1). Sunday(0) -> -6
  const diff = day === 0 ? -6 : 1 - day
  r.setDate(r.getDate() + diff)
  return r
}

export const monthNamesFr = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export const dayShortFr = ["L", "M", "M", "J", "V", "S", "D"]

export function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n) + " DH"
}

export function formatDateFr(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}
