export type Period = "thisMonth" | "lastMonth" | "3months" | "6months" | "year" | "custom"

export const periodLabels: Record<Period, string> = {
  thisMonth: "Ce mois",
  lastMonth: "Mois dernier",
  "3months": "3 mois",
  "6months": "6 mois",
  year: "Cette année",
  custom: "Personnalisé",
}

export const reportsKpi = {
  revenue: 87400,
  revenueDelta: 12.4,
  rentals: 47,
  rentalsDelta: 8.2,
  avgDuration: 4.2,
  avgDurationDelta: -3.1,
  fleetOccupancy: 68,
  fleetOccupancyDelta: 5.6,
  avgTicket: 1859,
  avgTicketDelta: 4.0,
  netProfit: 52100,
  netProfitDelta: 14.7,
}

/** CA par mois — 12 mois glissants */
export const monthlyRevenue = [
  { month: "Juin 25", revenue: 58200, expenses: 22100 },
  { month: "Juil 25", revenue: 71400, expenses: 26800 },
  { month: "Aoû 25", revenue: 84300, expenses: 28900 },
  { month: "Sep 25", revenue: 69800, expenses: 24600 },
  { month: "Oct 25", revenue: 64200, expenses: 23800 },
  { month: "Nov 25", revenue: 71900, expenses: 26100 },
  { month: "Déc 25", revenue: 89600, expenses: 31200 },
  { month: "Jan 26", revenue: 76800, expenses: 27500 },
  { month: "Fév 26", revenue: 68400, expenses: 25400 },
  { month: "Mar 26", revenue: 79200, expenses: 28100 },
  { month: "Avr 26", revenue: 82600, expenses: 29400 },
  { month: "Mai 26", revenue: 87400, expenses: 30700 },
]

/** CA par semaine du mois en cours */
export const weeklyRevenue = [
  { week: "S1", revenue: 18200 },
  { week: "S2", revenue: 22400 },
  { week: "S3", revenue: 24800 },
  { week: "S4", revenue: 22000 },
]

export type CarReport = {
  id: string
  brand: string
  model: string
  plate: string
  category: "économique" | "compacte" | "berline" | "SUV" | "premium" | "utilitaire"
  rentals: number
  daysRented: number
  daysAvailable: number
  revenue: number
  expenses: number
  profit: number
  roi: number
  occupancy: number
  avgRevenuePerDay: number
  km: number
  trend: "up" | "down" | "flat"
}

const baseCars: Omit<
  CarReport,
  "expenses" | "profit" | "roi" | "occupancy" | "avgRevenuePerDay" | "daysAvailable"
>[] = [
  {
    id: "c1",
    brand: "Dacia",
    model: "Logan",
    plate: "12345-A-1",
    category: "économique",
    rentals: 11,
    daysRented: 24,
    revenue: 8400,
    km: 4200,
    trend: "up",
  },
  {
    id: "c2",
    brand: "Renault",
    model: "Clio",
    plate: "98765-A-2",
    category: "compacte",
    rentals: 9,
    daysRented: 22,
    revenue: 7700,
    km: 3800,
    trend: "up",
  },
  {
    id: "c3",
    brand: "Hyundai",
    model: "Tucson",
    plate: "44521-B-3",
    category: "SUV",
    rentals: 7,
    daysRented: 21,
    revenue: 12600,
    km: 4900,
    trend: "flat",
  },
  {
    id: "c4",
    brand: "Kia",
    model: "Picanto",
    plate: "55780-A-4",
    category: "économique",
    rentals: 8,
    daysRented: 19,
    revenue: 5700,
    km: 2900,
    trend: "down",
  },
  {
    id: "c5",
    brand: "Peugeot",
    model: "208",
    plate: "33214-B-5",
    category: "compacte",
    rentals: 8,
    daysRented: 18,
    revenue: 6480,
    km: 3100,
    trend: "up",
  },
  {
    id: "c6",
    brand: "Toyota",
    model: "RAV4",
    plate: "11200-A-6",
    category: "SUV",
    rentals: 6,
    daysRented: 17,
    revenue: 13600,
    km: 5400,
    trend: "up",
  },
  {
    id: "c7",
    brand: "Mercedes",
    model: "Classe C",
    plate: "77123-A-7",
    category: "premium",
    rentals: 4,
    daysRented: 14,
    revenue: 16800,
    km: 4100,
    trend: "flat",
  },
  {
    id: "c8",
    brand: "Volkswagen",
    model: "Polo",
    plate: "88321-B-8",
    category: "compacte",
    rentals: 7,
    daysRented: 16,
    revenue: 5760,
    km: 2600,
    trend: "down",
  },
  {
    id: "c9",
    brand: "Dacia",
    model: "Sandero",
    plate: "65432-A-9",
    category: "économique",
    rentals: 6,
    daysRented: 13,
    revenue: 4290,
    km: 2200,
    trend: "down",
  },
  {
    id: "c10",
    brand: "Renault",
    model: "Captur",
    plate: "22987-B-10",
    category: "SUV",
    rentals: 5,
    daysRented: 15,
    revenue: 9000,
    km: 3700,
    trend: "up",
  },
  {
    id: "c11",
    brand: "Fiat",
    model: "Tipo",
    plate: "33450-A-11",
    category: "berline",
    rentals: 5,
    daysRented: 12,
    revenue: 4080,
    km: 2050,
    trend: "flat",
  },
  {
    id: "c12",
    brand: "BMW",
    model: "Série 3",
    plate: "99012-A-12",
    category: "premium",
    rentals: 3,
    daysRented: 11,
    revenue: 14300,
    km: 3400,
    trend: "up",
  },
]

const TOTAL_DAYS = 31

export const carReports: CarReport[] = baseCars.map((c) => {
  // Realistic expense ratio per category
  const ratioMap: Record<CarReport["category"], number> = {
    économique: 0.32,
    compacte: 0.34,
    berline: 0.38,
    SUV: 0.4,
    premium: 0.45,
    utilitaire: 0.36,
  }
  const expenses = Math.round(c.revenue * ratioMap[c.category])
  const profit = c.revenue - expenses
  const roi = Math.round((profit / Math.max(expenses, 1)) * 100)
  const occupancy = Math.round((c.daysRented / TOTAL_DAYS) * 100)
  const avgRevenuePerDay = Math.round(c.revenue / Math.max(c.daysRented, 1))
  return {
    ...c,
    expenses,
    profit,
    roi,
    occupancy,
    avgRevenuePerDay,
    daysAvailable: TOTAL_DAYS - c.daysRented,
  }
})

export const bestCar = carReports.slice().sort((a, b) => b.occupancy - a.occupancy)[0]
export const worstCar = carReports.slice().sort((a, b) => a.occupancy - b.occupancy)[0]

/** Clients */
export type ClientReport = {
  id: string
  name: string
  initials: string
  nationality: "MA" | "FR" | "ES" | "DE" | "UK" | "BE" | "NL" | "IT"
  isMoroccan: boolean
  rentals: number
  totalSpent: number
  lastVisit: string
  loyalty: "VIP" | "Régulier" | "Nouveau" | "Inactif"
}

export const clientReports: ClientReport[] = [
  {
    id: "cl1",
    name: "Mehdi Benali",
    initials: "MB",
    nationality: "MA",
    isMoroccan: true,
    rentals: 14,
    totalSpent: 28400,
    lastVisit: "2026-05-12",
    loyalty: "VIP",
  },
  {
    id: "cl2",
    name: "Pierre Dubois",
    initials: "PD",
    nationality: "FR",
    isMoroccan: false,
    rentals: 9,
    totalSpent: 22100,
    lastVisit: "2026-05-08",
    loyalty: "VIP",
  },
  {
    id: "cl3",
    name: "Sara El Idrissi",
    initials: "SE",
    nationality: "MA",
    isMoroccan: true,
    rentals: 11,
    totalSpent: 18950,
    lastVisit: "2026-05-15",
    loyalty: "VIP",
  },
  {
    id: "cl4",
    name: "Klaus Müller",
    initials: "KM",
    nationality: "DE",
    isMoroccan: false,
    rentals: 6,
    totalSpent: 16400,
    lastVisit: "2026-04-30",
    loyalty: "Régulier",
  },
  {
    id: "cl5",
    name: "Amine Chraibi",
    initials: "AC",
    nationality: "MA",
    isMoroccan: true,
    rentals: 8,
    totalSpent: 14200,
    lastVisit: "2026-05-11",
    loyalty: "Régulier",
  },
  {
    id: "cl6",
    name: "Sophie Martin",
    initials: "SM",
    nationality: "FR",
    isMoroccan: false,
    rentals: 5,
    totalSpent: 12300,
    lastVisit: "2026-05-02",
    loyalty: "Régulier",
  },
  {
    id: "cl7",
    name: "Carlos Ruiz",
    initials: "CR",
    nationality: "ES",
    isMoroccan: false,
    rentals: 4,
    totalSpent: 9800,
    lastVisit: "2026-05-04",
    loyalty: "Régulier",
  },
  {
    id: "cl8",
    name: "Yasmine Tazi",
    initials: "YT",
    nationality: "MA",
    isMoroccan: true,
    rentals: 3,
    totalSpent: 7600,
    lastVisit: "2026-05-13",
    loyalty: "Nouveau",
  },
  {
    id: "cl9",
    name: "James Wilson",
    initials: "JW",
    nationality: "UK",
    isMoroccan: false,
    rentals: 2,
    totalSpent: 6400,
    lastVisit: "2026-04-22",
    loyalty: "Nouveau",
  },
  {
    id: "cl10",
    name: "Hassan Berrada",
    initials: "HB",
    nationality: "MA",
    isMoroccan: true,
    rentals: 1,
    totalSpent: 2400,
    lastVisit: "2026-02-05",
    loyalty: "Inactif",
  },
]

export const nationalitySplit = [
  { name: "Marocains", value: clientReports.filter((c) => c.isMoroccan).length, color: "#3b82f6" },
  {
    name: "Étrangers",
    value: clientReports.filter((c) => !c.isMoroccan).length,
    color: "#f59e0b",
  },
]

/** Dépenses */
export type ExpenseCategory = {
  id: string
  label: string
  amount: number
  prevAmount: number
  color: string
}

export const expensesByCategory: ExpenseCategory[] = [
  { id: "carburant", label: "Carburant", amount: 9800, prevAmount: 8400, color: "#3b82f6" },
  { id: "assurance", label: "Assurance", amount: 6400, prevAmount: 6400, color: "#8b5cf6" },
  { id: "entretien", label: "Entretien", amount: 5200, prevAmount: 6100, color: "#f97316" },
  { id: "credit", label: "Crédit auto", amount: 4800, prevAmount: 4800, color: "#475569" },
  { id: "taxes", label: "Taxes", amount: 2900, prevAmount: 2300, color: "#eab308" },
  { id: "administratif", label: "Administratif", amount: 1600, prevAmount: 1900, color: "#6366f1" },
]

/** Réservations funnel */
export const reservationFunnel = [
  { stage: "Demandes", value: 72, color: "#94a3b8" },
  { stage: "Confirmées", value: 58, color: "#3b82f6" },
  { stage: "Terminées", value: 47, color: "#10b981" },
  { stage: "Annulées", value: 11, color: "#f43f5e" },
]

export const cancellationReasons = [
  { reason: "Changement de plan", count: 4 },
  { reason: "Voyage annulé", count: 3 },
  { reason: "Prix trop élevé", count: 2 },
  { reason: "Autre", count: 2 },
]

export const weekdayLoad = [
  { day: "Lun", count: 8 },
  { day: "Mar", count: 9 },
  { day: "Mer", count: 7 },
  { day: "Jeu", count: 11 },
  { day: "Ven", count: 16 },
  { day: "Sam", count: 14 },
  { day: "Dim", count: 7 },
]

/** Compliance */
export type ComplianceItem = {
  id: string
  type: "Assurance" | "Visite technique" | "Vignette" | "Carte grise" | "Permis"
  car: string
  plate: string
  expiresAt: string
  daysLeft: number
  estimatedCost: number
  urgency: "expired" | "urgent" | "soon"
}

export const complianceItems: ComplianceItem[] = [
  {
    id: "co1",
    type: "Assurance",
    car: "Mercedes Classe C",
    plate: "77123-A-7",
    expiresAt: "2026-05-10",
    daysLeft: -7,
    estimatedCost: 4200,
    urgency: "expired",
  },
  {
    id: "co2",
    type: "Visite technique",
    car: "Dacia Logan",
    plate: "12345-A-1",
    expiresAt: "2026-05-22",
    daysLeft: 5,
    estimatedCost: 350,
    urgency: "urgent",
  },
  {
    id: "co3",
    type: "Assurance",
    car: "Hyundai Tucson",
    plate: "44521-B-3",
    expiresAt: "2026-05-30",
    daysLeft: 13,
    estimatedCost: 3800,
    urgency: "urgent",
  },
  {
    id: "co4",
    type: "Vignette",
    car: "Renault Clio",
    plate: "98765-A-2",
    expiresAt: "2026-06-08",
    daysLeft: 22,
    estimatedCost: 800,
    urgency: "soon",
  },
  {
    id: "co5",
    type: "Visite technique",
    car: "Peugeot 208",
    plate: "33214-B-5",
    expiresAt: "2026-06-15",
    daysLeft: 29,
    estimatedCost: 350,
    urgency: "soon",
  },
  {
    id: "co6",
    type: "Carte grise",
    car: "BMW Série 3",
    plate: "99012-A-12",
    expiresAt: "2026-07-04",
    daysLeft: 48,
    estimatedCost: 600,
    urgency: "soon",
  },
  {
    id: "co7",
    type: "Assurance",
    car: "Toyota RAV4",
    plate: "11200-A-6",
    expiresAt: "2026-07-12",
    daysLeft: 56,
    estimatedCost: 4500,
    urgency: "soon",
  },
]

export const complianceTotalCost = complianceItems
  .filter((c) => c.daysLeft <= 90)
  .reduce((sum, c) => sum + c.estimatedCost, 0)

export function formatMAD(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} DH`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
