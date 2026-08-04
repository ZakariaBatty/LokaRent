import { cars, type Car, formatMAD } from "@/lib/cars-data"

export type DateRange = "this_month" | "last_month" | "quarter" | "year" | "custom"

export const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "this_month", label: "Ce mois" },
  { value: "last_month", label: "Mois dernier" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
  { value: "custom", label: "Personnalisé" },
]

/** Aggregated totals across the whole fleet (current month snapshot) */
export const financeSummary = {
  totalRevenue: 45200,
  totalExpenses: 18750,
  netProfit: 26450,
  profitabilityRate: 58.5,
  // deltas vs previous period
  revenueDelta: 12.4,
  expensesDelta: -3.8,
  profitDelta: 18.2,
  profitabilityDelta: 4.6,
}

/** 6 months of revenue vs expenses for the line chart */
export const revenueVsExpensesData = [
  { month: "Nov", revenue: 32100, expenses: 14200 },
  { month: "Déc", revenue: 35400, expenses: 15100 },
  { month: "Jan", revenue: 38200, expenses: 16300 },
  { month: "Fév", revenue: 36800, expenses: 15800 },
  { month: "Mar", revenue: 41500, expenses: 17400 },
  { month: "Avr", revenue: 45200, expenses: 18750 },
]

export type CarFinance = {
  id: string
  brand: string
  model: string
  plate: string
  category: Car["category"]
  revenue: number
  expenses: number
  profit: number
  occupancyRate: number
  roi: number
  monthlyRevenue: number[]
  recentExpenses: Car["recentExpenses"]
}

/** Compute per-car finance rows from the raw cars data */
export function getCarFinances(): CarFinance[] {
  return cars.map((c) => {
    const profit = c.revenue - c.expenses
    // ROI = profit / expenses * 100 (avoids div by 0)
    const roi = c.expenses > 0 ? Math.round((profit / c.expenses) * 100) : 0
    return {
      id: c.id,
      brand: c.brand,
      model: c.model,
      plate: c.plate,
      category: c.category,
      revenue: c.revenue,
      expenses: c.expenses,
      profit,
      occupancyRate: c.occupancyRate,
      roi,
      monthlyRevenue: c.monthlyRevenue,
      recentExpenses: c.recentExpenses,
    }
  })
}

/** Top 8 cars by revenue (for the bar chart) */
export function getTopCarsByRevenue(limit = 8): CarFinance[] {
  return getCarFinances()
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export type UpcomingCharge = {
  id: string
  type: "Assurance" | "Vignette" | "Visite technique" | "Crédit auto" | "Entretien"
  carLabel: string
  plate: string
  dueDate: string
  daysUntil: number
  amount: number
  urgency: "high" | "medium" | "low"
}

/** Upcoming charges in the next 30 days */
export const upcomingCharges: UpcomingCharge[] = [
  {
    id: "UC-1",
    type: "Assurance",
    carLabel: "Renault Clio",
    plate: "45678-D-7",
    dueDate: "2026-05-22",
    daysUntil: 4,
    amount: 4800,
    urgency: "high",
  },
  {
    id: "UC-2",
    type: "Crédit auto",
    carLabel: "Dacia Logan",
    plate: "12345-A-1",
    dueDate: "2026-05-25",
    daysUntil: 7,
    amount: 2400,
    urgency: "high",
  },
  {
    id: "UC-3",
    type: "Visite technique",
    carLabel: "Hyundai Tucson",
    plate: "23456-F-9",
    dueDate: "2026-05-30",
    daysUntil: 12,
    amount: 350,
    urgency: "medium",
  },
  {
    id: "UC-4",
    type: "Vignette",
    carLabel: "Peugeot 208",
    plate: "78901-G-2",
    dueDate: "2026-06-01",
    daysUntil: 14,
    amount: 700,
    urgency: "medium",
  },
  {
    id: "UC-5",
    type: "Entretien",
    carLabel: "Toyota RAV4",
    plate: "34567-C-5",
    dueDate: "2026-06-05",
    daysUntil: 18,
    amount: 1200,
    urgency: "medium",
  },
  {
    id: "UC-6",
    type: "Crédit auto",
    carLabel: "Dacia Duster",
    plate: "67890-B-3",
    dueDate: "2026-06-10",
    daysUntil: 23,
    amount: 2800,
    urgency: "low",
  },
  {
    id: "UC-7",
    type: "Assurance",
    carLabel: "Kia Sportage",
    plate: "89012-H-4",
    dueDate: "2026-06-14",
    daysUntil: 27,
    amount: 5200,
    urgency: "low",
  },
]

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

export { formatMAD }
