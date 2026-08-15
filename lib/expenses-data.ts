import { formatMAD } from "@/lib/cars-data"

export type ExpenseType = string

export type ExpenseTypeStyle = {
  label: string
  chip: string
  dot: string
  iconBg: string
  iconColor: string
  donut: string
}

/** Color-coded badges per type, aligned with the global palette */
export const expenseTypeStyles: Record<string, ExpenseTypeStyle> = {
  Carburant: {
    label: "Carburant",
    chip: "bg-blue-50 text-blue-700 ring-blue-100",
    dot: "bg-blue-500",
    iconBg: "bg-blue-50 ring-blue-100",
    iconColor: "text-blue-600",
    donut: "#3b82f6",
  },
  Entretien: {
    label: "Entretien / Révision",
    chip: "bg-orange-50 text-orange-700 ring-orange-100",
    dot: "bg-orange-500",
    iconBg: "bg-orange-50 ring-orange-100",
    iconColor: "text-orange-600",
    donut: "#f97316",
  },
  Assurance: {
    label: "Assurance",
    chip: "bg-violet-50 text-violet-700 ring-violet-100",
    dot: "bg-violet-500",
    iconBg: "bg-violet-50 ring-violet-100",
    iconColor: "text-violet-600",
    donut: "#8b5cf6",
  },
  Accident: {
    label: "Accident / Sinistre",
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    dot: "bg-rose-500",
    iconBg: "bg-rose-50 ring-rose-100",
    iconColor: "text-rose-600",
    donut: "#f43f5e",
  },
  Crédit: {
    label: "Crédit auto",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-500",
    iconBg: "bg-slate-100 ring-slate-200",
    iconColor: "text-slate-600",
    donut: "#64748b",
  },
  Taxes: {
    label: "Taxes & Vignette",
    chip: "bg-yellow-50 text-yellow-800 ring-yellow-100",
    dot: "bg-yellow-500",
    iconBg: "bg-yellow-50 ring-yellow-100",
    iconColor: "text-yellow-600",
    donut: "#eab308",
  },
  Divers: {
    label: "Divers",
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    dot: "bg-indigo-500",
    iconBg: "bg-indigo-50 ring-indigo-100",
    iconColor: "text-indigo-600",
    donut: "#6366f1",
  },
}

const fallbackExpenseTypeStyle: ExpenseTypeStyle = {
  label: "Divers",
  chip: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  dot: "bg-indigo-500",
  iconBg: "bg-indigo-50 ring-indigo-100",
  iconColor: "text-indigo-600",
  donut: "#6366f1",
}

export function getExpenseTypeStyle(type: ExpenseType): ExpenseTypeStyle {
  return expenseTypeStyles[type] ?? { ...fallbackExpenseTypeStyle, label: type || fallbackExpenseTypeStyle.label }
}

export type AttachmentKind = "image" | "pdf" | null

export type ExpenseRecord = {
  id: string
  date: string
  carId: string | null // null => Général / Agence
  carLabel?: { brand: string; model: string; plate: string; category?: string } | null
  categoryId: string
  type: ExpenseType
  description: string
  amount: number
  currency: string
  method?: string | null
  reference?: string | null
  provider?: string | null
  reservationId?: string | null
  reservationCode?: string | null
  documentUrl?: string | null
  recordedBy?: string | null
  attachment: { name: string; kind: AttachmentKind } | null
  internalNote?: string
}

/** 22 Moroccan-context fake expenses spread across types and cars */
export const expenses: ExpenseRecord[] = []

export function getCarLabel(recordOrCarId: ExpenseRecord | string | null): { brand: string; model: string; plate: string } | null {
  if (!recordOrCarId || typeof recordOrCarId === "string") return null
  return recordOrCarId.carLabel ?? null
}

/** Group totals by type for the donut chart */
export function expensesByType(records: ExpenseRecord[]) {
  const map: Record<string, number> = {}
  for (const e of records) {
    map[e.type] = (map[e.type] ?? 0) + e.amount
  }
  return (Object.keys(map) as ExpenseType[]).map((t) => ({
    type: t,
    amount: map[t],
    color: getExpenseTypeStyle(t).donut,
  }))
}

/** Aggregate by ISO week-of-month for the bar chart (4-5 weeks) */
export function expensesByWeek(records: ExpenseRecord[]) {
  const buckets: Record<string, number> = {
    "S1": 0,
    "S2": 0,
    "S3": 0,
    "S4": 0,
    "S5": 0,
  }
  for (const e of records) {
    const d = new Date(e.date)
    const week = Math.min(5, Math.ceil(d.getDate() / 7))
    buckets[`S${week}`] += e.amount
  }
  return (Object.keys(buckets) as Array<keyof typeof buckets>)
    .filter((k) => buckets[k] > 0)
    .map((k) => ({ week: k, amount: buckets[k] }))
}

export function formatMoney(amount: number, currency: string) {
  const code = currency.trim().toUpperCase();
  return code ? `${amount.toLocaleString("fr-MA")} ${code}` : formatMAD(amount);
}

export { formatMAD }
