export type CategoryRow = {
  id: string
  name: string
  perDay: number
  perWeek: number
  perMonth: number
  caution: number
  popular?: boolean
  recommendedPerDay?: number
  occupancy?: number
}

export const defaultCategories: CategoryRow[] = [
  {
    id: "citadine",
    name: "Citadine",
    perDay: 250,
    perWeek: 1500,
    perMonth: 6250,
    caution: 4000,
    popular: true,
    recommendedPerDay: 280,
    occupancy: 87,
  },
  {
    id: "berline",
    name: "Berline",
    perDay: 350,
    perWeek: 2100,
    perMonth: 8750,
    caution: 5000,
    recommendedPerDay: 380,
    occupancy: 72,
  },
  {
    id: "suv",
    name: "SUV",
    perDay: 550,
    perWeek: 3300,
    perMonth: 13750,
    caution: 7000,
    recommendedPerDay: 600,
    occupancy: 81,
  },
  {
    id: "4x4",
    name: "4x4",
    perDay: 700,
    perWeek: 4200,
    perMonth: 17500,
    caution: 8500,
    recommendedPerDay: 720,
    occupancy: 64,
  },
  {
    id: "utilitaire",
    name: "Utilitaire",
    perDay: 400,
    perWeek: 2400,
    perMonth: 10000,
    caution: 5500,
    recommendedPerDay: 420,
    occupancy: 58,
  },
  {
    id: "luxe",
    name: "Luxe",
    perDay: 1500,
    perWeek: 9000,
    perMonth: 37500,
    caution: 15000,
    recommendedPerDay: 1650,
    occupancy: 45,
  },
]

export type SeasonScope = "all" | "selected"
export type SeasonAccent = "amber" | "rose" | "indigo" | "emerald" | "violet"

export type Season = {
  id: string
  name: string
  startDate: string
  endDate: string
  surcharge: number
  scope: SeasonScope
  categoryIds: string[]
  active: boolean
  accent: SeasonAccent
}

export const defaultSeasons: Season[] = [
  {
    id: "ete-2026",
    name: "Été 2026",
    startDate: "2026-07-01",
    endDate: "2026-08-31",
    surcharge: 25,
    scope: "all",
    categoryIds: [],
    active: true,
    accent: "amber",
  },
  {
    id: "ramadan",
    name: "Ramadan",
    startDate: "2026-02-18",
    endDate: "2026-03-19",
    surcharge: -10,
    scope: "all",
    categoryIds: [],
    active: true,
    accent: "violet",
  },
  {
    id: "can-2025",
    name: "CAN 2025",
    startDate: "2026-12-21",
    endDate: "2027-01-18",
    surcharge: 35,
    scope: "selected",
    categoryIds: ["suv", "4x4", "luxe"],
    active: true,
    accent: "rose",
  },
  {
    id: "fin-annee",
    name: "Fin d'année",
    startDate: "2026-12-15",
    endDate: "2027-01-05",
    surcharge: 20,
    scope: "all",
    categoryIds: [],
    active: false,
    accent: "indigo",
  },
]

export type PricingOption = {
  id: string
  name: string
  icon: "user-plus" | "navigation" | "baby" | "shield-check" | "truck"
  perDay: number
  included: boolean
  description?: string
}

export const defaultOptions: PricingOption[] = [
  {
    id: "driver",
    name: "Conducteur supplémentaire",
    icon: "user-plus",
    perDay: 50,
    included: false,
    description: "Permis valide requis",
  },
  { id: "gps", name: "GPS", icon: "navigation", perDay: 30, included: false },
  { id: "babyseat", name: "Siège bébé", icon: "baby", perDay: 25, included: false },
  {
    id: "insurance",
    name: "Assurance complémentaire",
    icon: "shield-check",
    perDay: 80,
    included: false,
    description: "Franchise réduite à 0 DH",
  },
  {
    id: "delivery",
    name: "Livraison véhicule",
    icon: "truck",
    perDay: 150,
    included: false,
    description: "Forfait par livraison",
  },
]

export type LatePolicy = {
  toleranceMinutes: number
  feePerHour: number
  cappedAtDay: boolean
}

export const defaultLatePolicy: LatePolicy = {
  toleranceMinutes: 60,
  feePerHour: 80,
  cappedAtDay: true,
}

export function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " DH"
}

export function suggestedWeek(perDay: number) {
  return Math.round(perDay * 6)
}

export function suggestedMonth(perDay: number) {
  return Math.round(perDay * 25)
}

export function activeSeasonOn(date: Date, seasons: Season[], categoryId?: string) {
  return seasons.find((s) => {
    if (!s.active) return false
    if (categoryId && s.scope === "selected" && !s.categoryIds.includes(categoryId)) return false
    const t = date.getTime()
    return t >= new Date(s.startDate).getTime() && t <= new Date(s.endDate).getTime()
  })
}

export function daysUntil(iso: string) {
  const target = new Date(iso).getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export const accentClasses: Record<
  SeasonAccent,
  { bg: string; text: string; ring: string; soft: string; bar: string; chip: string }
> = {
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    soft: "bg-amber-100/60",
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    soft: "bg-rose-100/60",
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
    soft: "bg-indigo-100/60",
    bar: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    soft: "bg-emerald-100/60",
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-200",
    soft: "bg-violet-100/60",
    bar: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  },
}
