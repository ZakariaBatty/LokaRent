import { cars } from "@/lib/cars-data"
import { formatMAD } from "@/lib/cars-data"

export type ExpenseType =
  | "Carburant"
  | "Entretien"
  | "Assurance"
  | "Accident"
  | "Crédit"
  | "Taxes"
  | "Divers"

export const expenseTypes: ExpenseType[] = [
  "Carburant",
  "Entretien",
  "Assurance",
  "Accident",
  "Crédit",
  "Taxes",
  "Divers",
]

export type ExpenseTypeStyle = {
  label: string
  chip: string
  dot: string
  iconBg: string
  iconColor: string
  donut: string
}

/** Color-coded badges per type, aligned with the global palette */
export const expenseTypeStyles: Record<ExpenseType, ExpenseTypeStyle> = {
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

export type AttachmentKind = "image" | "pdf" | null

export type ExpenseRecord = {
  id: string
  date: string
  carId: string | null // null => Général / Agence
  type: ExpenseType
  description: string
  amount: number
  attachment: { name: string; kind: AttachmentKind } | null
  internalNote?: string
}

function carIdByPlate(plate: string): string {
  const c = cars.find((c) => c.plate === plate)
  return c?.id ?? cars[0].id
}

/** 22 Moroccan-context fake expenses spread across types and cars */
export const expenses: ExpenseRecord[] = [
  {
    id: "EXP-001",
    date: "2026-05-12",
    carId: carIdByPlate("12345-A-1"),
    type: "Entretien",
    description: "Révision 10 000 km — Dacia Logan",
    amount: 850,
    attachment: { name: "facture-revision-logan.pdf", kind: "pdf" },
  },
  {
    id: "EXP-002",
    date: "2026-05-11",
    carId: carIdByPlate("45678-D-7"),
    type: "Carburant",
    description: "Plein carburant — station Afriquia Maârif",
    amount: 420,
    attachment: { name: "ticket-afriquia.jpg", kind: "image" },
  },
  {
    id: "EXP-003",
    date: "2026-05-10",
    carId: carIdByPlate("34567-C-5"),
    type: "Assurance",
    description: "Renouvellement annuel — Wafa Assurance",
    amount: 4800,
    attachment: { name: "police-wafa-2026.pdf", kind: "pdf" },
    internalNote: "Couverture tous risques avec franchise réduite",
  },
  {
    id: "EXP-004",
    date: "2026-05-09",
    carId: carIdByPlate("67890-B-3"),
    type: "Accident",
    description: "Réparation aile avant droite — sinistre client",
    amount: 2300,
    attachment: { name: "devis-carrosserie.pdf", kind: "pdf" },
    internalNote: "Pris en charge par assurance à 70%",
  },
  {
    id: "EXP-005",
    date: "2026-05-08",
    carId: carIdByPlate("23456-F-9"),
    type: "Crédit",
    description: "Mensualité crédit auto — Attijariwafa Bank",
    amount: 2400,
    attachment: { name: "echeance-mai.pdf", kind: "pdf" },
  },
  {
    id: "EXP-006",
    date: "2026-05-07",
    carId: carIdByPlate("78901-G-2"),
    type: "Taxes",
    description: "Vignette automobile 2026",
    amount: 700,
    attachment: { name: "vignette-2026.pdf", kind: "pdf" },
  },
  {
    id: "EXP-007",
    date: "2026-05-06",
    carId: null,
    type: "Divers",
    description: "Fournitures bureau — agence Casablanca",
    amount: 180,
    attachment: null,
  },
  {
    id: "EXP-008",
    date: "2026-05-05",
    carId: carIdByPlate("12345-A-1"),
    type: "Carburant",
    description: "Plein gasoil — station Shell Anfa",
    amount: 380,
    attachment: { name: "ticket-shell.jpg", kind: "image" },
  },
  {
    id: "EXP-009",
    date: "2026-05-04",
    carId: carIdByPlate("89012-H-4"),
    type: "Entretien",
    description: "Vidange + filtres — garage Auto Hall",
    amount: 620,
    attachment: { name: "facture-autohall.pdf", kind: "pdf" },
  },
  {
    id: "EXP-010",
    date: "2026-05-03",
    carId: carIdByPlate("45678-D-7"),
    type: "Assurance",
    description: "Assurance tous risques — Saham Assurance",
    amount: 3900,
    attachment: { name: "police-saham.pdf", kind: "pdf" },
  },
  {
    id: "EXP-011",
    date: "2026-05-02",
    carId: carIdByPlate("23456-F-9"),
    type: "Carburant",
    description: "Plein essence — Total Mohammed V",
    amount: 510,
    attachment: { name: "ticket-total.jpg", kind: "image" },
  },
  {
    id: "EXP-012",
    date: "2026-05-01",
    carId: carIdByPlate("34567-C-5"),
    type: "Entretien",
    description: "Changement plaquettes de frein avant",
    amount: 980,
    attachment: { name: "facture-freins.pdf", kind: "pdf" },
  },
  {
    id: "EXP-013",
    date: "2026-04-29",
    carId: carIdByPlate("67890-B-3"),
    type: "Crédit",
    description: "Mensualité crédit auto — BMCE Bank",
    amount: 2800,
    attachment: { name: "echeance-bmce.pdf", kind: "pdf" },
  },
  {
    id: "EXP-014",
    date: "2026-04-28",
    carId: carIdByPlate("78901-G-2"),
    type: "Accident",
    description: "Remplacement pare-brise — Carglass",
    amount: 1450,
    attachment: { name: "devis-carglass.pdf", kind: "pdf" },
  },
  {
    id: "EXP-015",
    date: "2026-04-27",
    carId: null,
    type: "Divers",
    description: "Carte de visite & flyers — imprimerie",
    amount: 350,
    attachment: { name: "facture-imprimerie.jpg", kind: "image" },
  },
  {
    id: "EXP-016",
    date: "2026-04-26",
    carId: carIdByPlate("89012-H-4"),
    type: "Taxes",
    description: "Visite technique — centre Mitsui",
    amount: 350,
    attachment: { name: "rapport-vt.pdf", kind: "pdf" },
  },
  {
    id: "EXP-017",
    date: "2026-04-25",
    carId: carIdByPlate("12345-A-1"),
    type: "Carburant",
    description: "Plein carburant — Petrom Sidi Maârouf",
    amount: 395,
    attachment: { name: "ticket-petrom.jpg", kind: "image" },
  },
  {
    id: "EXP-018",
    date: "2026-04-24",
    carId: carIdByPlate("45678-D-7"),
    type: "Entretien",
    description: "Lavage premium + intérieur cuir",
    amount: 150,
    attachment: null,
  },
  {
    id: "EXP-019",
    date: "2026-04-23",
    carId: carIdByPlate("23456-F-9"),
    type: "Assurance",
    description: "Extension assurance — conducteurs additionnels",
    amount: 600,
    attachment: { name: "avenant-assurance.pdf", kind: "pdf" },
  },
  {
    id: "EXP-020",
    date: "2026-04-22",
    carId: carIdByPlate("34567-C-5"),
    type: "Crédit",
    description: "Mensualité crédit auto — CIH Bank",
    amount: 3100,
    attachment: { name: "echeance-cih.pdf", kind: "pdf" },
  },
  {
    id: "EXP-021",
    date: "2026-04-21",
    carId: carIdByPlate("67890-B-3"),
    type: "Carburant",
    description: "Plein gasoil — Winxo Bourgogne",
    amount: 460,
    attachment: { name: "ticket-winxo.jpg", kind: "image" },
  },
  {
    id: "EXP-022",
    date: "2026-04-20",
    carId: carIdByPlate("78901-G-2"),
    type: "Entretien",
    description: "Géométrie + équilibrage des roues",
    amount: 420,
    attachment: { name: "facture-pneus.pdf", kind: "pdf" },
  },
]

export function getCarLabel(carId: string | null): { brand: string; model: string; plate: string } | null {
  if (!carId) return null
  const c = cars.find((c) => c.id === carId)
  if (!c) return null
  return { brand: c.brand, model: c.model, plate: c.plate }
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
    color: expenseTypeStyles[t].donut,
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

export { formatMAD }
