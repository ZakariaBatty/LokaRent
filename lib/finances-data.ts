export type DateRange = "this_month" | "last_month" | "quarter" | "year" | "custom"

export const dateRangeOptions: { value: DateRange; labelKey: string }[] = [
  { value: "this_month", labelKey: "finances.range.thisMonth" },
  { value: "last_month", labelKey: "finances.range.lastMonth" },
  { value: "quarter", labelKey: "finances.range.quarter" },
  { value: "year", labelKey: "finances.range.year" },
  { value: "custom", labelKey: "finances.range.custom" },
]

export type CarFinance = {
  id: string
  brand: string
  model: string
  plate: string
  category: string
  revenue: number
  expenses: number
  profit: number
  occupancyRate: number
  roi: number | null
  monthlyRevenue: number[]
  recentExpenses: Array<{
    type: string
    date: string
    amount: number
    note?: string
  }>
}

export type UpcomingCharge = {
  id: string
  type: "insurance" | "vignette" | "inspection" | "maintenance"
  carLabel: string
  plate: string
  dueDate: string
  daysUntil: number
  amount: number
  urgency: "high" | "medium" | "low"
}

/** Expense breakdown by category for the donut on a single car's detail */
export function getExpenseBreakdown(car: CarFinance) {
  const byType: Record<string, number> = {}
  for (const exp of car.recentExpenses) {
    byType[exp.type] = (byType[exp.type] || 0) + exp.amount
  }
  const colorMap: Record<string, string> = {
    Maintenance: "#6366f1",
    Réparation: "#f59e0b",
    Assurance: "#10b981",
    Vignette: "#0ea5e9",
    Carburant: "#ef4444",
    Autre: "#94a3b8",
  }
  return Object.entries(byType).map(([type, amount]) => ({
    type,
    amount,
    color: colorMap[type] ?? "#94a3b8",
  }))
}
