export type ReservationStatus = "demande" | "confirmee" | "en_cours" | "terminee" | "annulee"

export type PaymentStatus = "paid" | "partial" | "unpaid"

export type ReservationExtras = {
  gps: boolean
  babySeat: boolean
  insuranceUpgrade: boolean
  additionalDriver: string | null
}

export type ReservationExtraItem = {
  id: string
  definitionId: string | null
  key?: string | null
  label: string
  unitPrice: number
  quantity: number
  totalPrice: number
  currency: string
}

export type ReservationAuthorizedDriver = {
  id: string
  fullName: string
  licenseNumber: string
  licenseIssuedAt?: string | null
  licenseExpiresAt?: string | null
  documentUrl?: string | null
}

export type ContractChecklistItem = {
  label: string
  ok: boolean
}

export type DamageReport = {
  zone: string
  description: string
  severity: "leger" | "moyen" | "grave"
}

export type TimelineEvent = {
  id: string
  type: "created" | "status" | "payment" | "pickup" | "return" | "note"
  label: string
  description?: string
  timestamp: string // ISO
  author: string
}

export type Reservation = {
  id: string
  code: string // e.g. RES-2024-0012
  sourceId?: string
  status: ReservationStatus
  urgency: "low" | "medium" | "high" // for overdue, expiring etc.

  client: {
    id: string
    name: string
    phone: string
    initials: string
  }
  car: {
    id: string
    brand: string
    model: string
    plate: string
    category: string
  }

  startDate: string // ISO
  endDate: string // ISO
  days: number
  pickupLocation: string
  returnLocation: string

  extras: ReservationExtras
  extraItems?: ReservationExtraItem[]
  authorizedDrivers?: ReservationAuthorizedDriver[]

  startKm: number | null
  returnKm: number | null

  pricePerDay: number
  discountAmount?: number
  discountReason?: string | null
  total: number
  currentPricingSnapshotId?: string | null
  caution: number
  advance: number
  remaining: number
  paymentMethod: "Espèces" | "Carte bancaire" | "Virement" | "Chèque"
  paymentStatus: PaymentStatus

  contract: {
    departureChecklist: ContractChecklistItem[]
    returnChecklist: ContractChecklistItem[]
    damages: DamageReport[]
    signed: boolean
    photos: number
  }

  timeline: TimelineEvent[]
  createdAt: string // ISO
  overdue?: boolean
  driver?: {
    id: string
    name: string
    phone: string
  } | null
}

export const statusConfig: Record<
  ReservationStatus,
  { label: string; dot: string; pillBg: string; pillText: string; border: string; column: string }
> = {
  demande: {
    label: "Demande",
    dot: "bg-amber-500",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    border: "border-amber-200",
    column: "from-amber-50/60 to-amber-50/10",
  },
  confirmee: {
    label: "Confirmée",
    dot: "bg-sky-500",
    pillBg: "bg-sky-50",
    pillText: "text-sky-700",
    border: "border-sky-200",
    column: "from-sky-50/60 to-sky-50/10",
  },
  en_cours: {
    label: "En cours",
    dot: "bg-blue-600",
    pillBg: "bg-blue-50",
    pillText: "text-blue-700",
    border: "border-blue-200",
    column: "from-blue-50/60 to-blue-50/10",
  },
  terminee: {
    label: "Terminée",
    dot: "bg-emerald-500",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    border: "border-emerald-200",
    column: "from-emerald-50/60 to-emerald-50/10",
  },
  annulee: {
    label: "Annulée",
    dot: "bg-slate-400",
    pillBg: "bg-slate-100",
    pillText: "text-slate-600",
    border: "border-slate-200",
    column: "from-slate-100/60 to-slate-50/10",
  },
}

export const paymentStatusConfig: Record<PaymentStatus, { label: string; pillBg: string; pillText: string }> = {
  paid: { label: "Payé", pillBg: "bg-emerald-50", pillText: "text-emerald-700" },
  partial: { label: "Partiel", pillBg: "bg-amber-50", pillText: "text-amber-700" },
  unpaid: { label: "Impayé", pillBg: "bg-rose-50", pillText: "text-rose-700" },
}

export function formatMAD(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value) + " DH"
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function daysBetween(a: string, b: string): number {
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)))
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

type Seed = {
  code: string
  status: ReservationStatus
  client: { id: string; name: string; phone: string }
  car: { id: string; brand: string; model: string; plate: string; category: string }
  startDate: string
  endDate: string
  pricePerDay: number
  paymentStatus: PaymentStatus
  paymentMethod: Reservation["paymentMethod"]
  caution: number
  advance: number
  pickupLocation: string
  returnLocation: string
  extras: ReservationExtras
  startKm: number | null
  returnKm: number | null
  signed: boolean
  damages: DamageReport[]
  photos: number
  overdue?: boolean
  urgency?: "low" | "medium" | "high"
  createdAt: string
}

const seeds: Seed[] = [
  // Demande
  {
    code: "RES-2025-0034",
    status: "demande",
    client: { id: "c1", name: "Ahmed Benali", phone: "+212 661 234 567" },
    car: { id: "v1", brand: "Dacia", model: "Logan", plate: "12345-A-1", category: "Citadine" },
    startDate: "2025-12-22T10:00:00Z",
    endDate: "2025-12-28T18:00:00Z",
    pricePerDay: 250,
    paymentStatus: "unpaid",
    paymentMethod: "Espèces",
    caution: 2000,
    advance: 0,
    pickupLocation: "Agence Casablanca",
    returnLocation: "Agence Casablanca",
    extras: { gps: false, babySeat: true, insuranceUpgrade: false, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: false,
    damages: [],
    photos: 0,
    urgency: "medium",
    createdAt: "2025-12-15T09:14:00Z",
  },
  {
    code: "RES-2025-0035",
    status: "demande",
    client: { id: "c2", name: "Fatima Zahra El Idrissi", phone: "+212 662 345 678" },
    car: { id: "v3", brand: "Renault", model: "Clio", plate: "23456-C-7", category: "Citadine" },
    startDate: "2025-12-23T08:00:00Z",
    endDate: "2025-12-30T20:00:00Z",
    pricePerDay: 280,
    paymentStatus: "unpaid",
    paymentMethod: "Carte bancaire",
    caution: 2500,
    advance: 0,
    pickupLocation: "Aéroport Mohammed V",
    returnLocation: "Aéroport Mohammed V",
    extras: { gps: true, babySeat: false, insuranceUpgrade: true, additionalDriver: "Karim El Idrissi" },
    startKm: null,
    returnKm: null,
    signed: false,
    damages: [],
    photos: 0,
    urgency: "high",
    createdAt: "2025-12-16T14:42:00Z",
  },
  {
    code: "RES-2025-0036",
    status: "demande",
    client: { id: "c3", name: "Youssef Amrani", phone: "+212 663 456 789" },
    car: { id: "v4", brand: "Hyundai", model: "Tucson", plate: "34567-D-2", category: "SUV" },
    startDate: "2026-01-05T09:00:00Z",
    endDate: "2026-01-12T19:00:00Z",
    pricePerDay: 550,
    paymentStatus: "unpaid",
    paymentMethod: "Virement",
    caution: 5000,
    advance: 0,
    pickupLocation: "Agence Marrakech",
    returnLocation: "Agence Marrakech",
    extras: { gps: true, babySeat: false, insuranceUpgrade: true, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: false,
    damages: [],
    photos: 0,
    urgency: "low",
    createdAt: "2025-12-17T11:28:00Z",
  },

  // Confirmée
  {
    code: "RES-2025-0028",
    status: "confirmee",
    client: { id: "c4", name: "Mehdi Tazi", phone: "+212 664 567 890" },
    car: { id: "v2", brand: "Dacia", model: "Duster", plate: "67890-B-3", category: "SUV" },
    startDate: "2025-12-20T10:00:00Z",
    endDate: "2025-12-27T18:00:00Z",
    pricePerDay: 380,
    paymentStatus: "partial",
    paymentMethod: "Espèces",
    caution: 3500,
    advance: 1500,
    pickupLocation: "Agence Casablanca",
    returnLocation: "Aéroport Mohammed V",
    extras: { gps: false, babySeat: false, insuranceUpgrade: true, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 4,
    urgency: "medium",
    createdAt: "2025-12-12T10:08:00Z",
  },
  {
    code: "RES-2025-0029",
    status: "confirmee",
    client: { id: "c5", name: "Sara Bennani", phone: "+212 665 678 901" },
    car: { id: "v6", brand: "Peugeot", model: "208", plate: "56789-F-4", category: "Citadine" },
    startDate: "2025-12-21T14:00:00Z",
    endDate: "2025-12-24T14:00:00Z",
    pricePerDay: 240,
    paymentStatus: "paid",
    paymentMethod: "Carte bancaire",
    caution: 2000,
    advance: 720,
    pickupLocation: "Agence Rabat",
    returnLocation: "Agence Rabat",
    extras: { gps: true, babySeat: true, insuranceUpgrade: false, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 6,
    urgency: "low",
    createdAt: "2025-12-13T16:32:00Z",
  },
  {
    code: "RES-2025-0030",
    status: "confirmee",
    client: { id: "c6", name: "Karim Alaoui", phone: "+212 666 789 012" },
    car: { id: "v5", brand: "Toyota", model: "RAV4", plate: "45678-E-5", category: "SUV" },
    startDate: "2025-12-22T10:00:00Z",
    endDate: "2026-01-02T10:00:00Z",
    pricePerDay: 620,
    paymentStatus: "partial",
    paymentMethod: "Virement",
    caution: 6000,
    advance: 3000,
    pickupLocation: "Aéroport Marrakech",
    returnLocation: "Aéroport Marrakech",
    extras: { gps: true, babySeat: false, insuranceUpgrade: true, additionalDriver: "Hicham Alaoui" },
    startKm: null,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 5,
    urgency: "high",
    createdAt: "2025-12-14T09:21:00Z",
  },

  // En cours
  {
    code: "RES-2025-0024",
    status: "en_cours",
    client: { id: "c7", name: "Imane Cherkaoui", phone: "+212 667 890 123" },
    car: { id: "v7", brand: "Kia", model: "Sportage", plate: "78901-G-8", category: "SUV" },
    startDate: "2025-12-14T09:00:00Z",
    endDate: "2025-12-19T18:00:00Z",
    pricePerDay: 450,
    paymentStatus: "paid",
    paymentMethod: "Carte bancaire",
    caution: 4000,
    advance: 2250,
    pickupLocation: "Agence Tanger",
    returnLocation: "Agence Tanger",
    extras: { gps: true, babySeat: false, insuranceUpgrade: false, additionalDriver: null },
    startKm: 42100,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 8,
    urgency: "low",
    createdAt: "2025-12-10T13:11:00Z",
  },
  {
    code: "RES-2025-0025",
    status: "en_cours",
    client: { id: "c8", name: "Hicham Benjelloun", phone: "+212 668 901 234" },
    car: { id: "v8", brand: "Volkswagen", model: "Polo", plate: "89012-H-6", category: "Citadine" },
    startDate: "2025-12-15T11:00:00Z",
    endDate: "2025-12-18T17:00:00Z",
    pricePerDay: 290,
    paymentStatus: "paid",
    paymentMethod: "Espèces",
    caution: 2500,
    advance: 870,
    pickupLocation: "Agence Casablanca",
    returnLocation: "Agence Casablanca",
    extras: { gps: false, babySeat: false, insuranceUpgrade: false, additionalDriver: null },
    startKm: 56340,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 5,
    urgency: "low",
    createdAt: "2025-12-11T08:44:00Z",
  },
  {
    code: "RES-2025-0026",
    status: "en_cours",
    client: { id: "c9", name: "Nadia El Hamzaoui", phone: "+212 669 012 345" },
    car: { id: "v9", brand: "Renault", model: "Kangoo", plate: "11223-I-9", category: "Utilitaire" },
    startDate: "2025-12-12T08:00:00Z",
    endDate: "2025-12-17T18:00:00Z",
    pricePerDay: 320,
    paymentStatus: "partial",
    paymentMethod: "Espèces",
    caution: 3000,
    advance: 960,
    pickupLocation: "Agence Agadir",
    returnLocation: "Agence Agadir",
    extras: { gps: true, babySeat: false, insuranceUpgrade: true, additionalDriver: null },
    startKm: 78200,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 6,
    urgency: "high",
    overdue: true,
    createdAt: "2025-12-08T15:22:00Z",
  },
  {
    code: "RES-2025-0027",
    status: "en_cours",
    client: { id: "c10", name: "Omar Lahlou", phone: "+212 670 123 456" },
    car: { id: "v10", brand: "Hyundai", model: "i10", plate: "22334-J-2", category: "Citadine" },
    startDate: "2025-12-13T10:00:00Z",
    endDate: "2025-12-20T18:00:00Z",
    pricePerDay: 220,
    paymentStatus: "paid",
    paymentMethod: "Carte bancaire",
    caution: 1800,
    advance: 1540,
    pickupLocation: "Aéroport Mohammed V",
    returnLocation: "Aéroport Mohammed V",
    extras: { gps: false, babySeat: true, insuranceUpgrade: false, additionalDriver: null },
    startKm: 34100,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 4,
    urgency: "medium",
    createdAt: "2025-12-09T12:09:00Z",
  },

  // Terminée
  {
    code: "RES-2025-0018",
    status: "terminee",
    client: { id: "c11", name: "Salma El Fassi", phone: "+212 671 234 567" },
    car: { id: "v1", brand: "Dacia", model: "Logan", plate: "12345-A-1", category: "Citadine" },
    startDate: "2025-11-25T09:00:00Z",
    endDate: "2025-12-02T18:00:00Z",
    pricePerDay: 250,
    paymentStatus: "paid",
    paymentMethod: "Carte bancaire",
    caution: 2000,
    advance: 1750,
    pickupLocation: "Agence Casablanca",
    returnLocation: "Agence Casablanca",
    extras: { gps: true, babySeat: false, insuranceUpgrade: false, additionalDriver: null },
    startKm: 42100,
    returnKm: 43450,
    signed: true,
    damages: [],
    photos: 12,
    urgency: "low",
    createdAt: "2025-11-20T10:11:00Z",
  },
  {
    code: "RES-2025-0019",
    status: "terminee",
    client: { id: "c12", name: "Reda Bouhmidi", phone: "+212 672 345 678" },
    car: { id: "v3", brand: "Renault", model: "Clio", plate: "23456-C-7", category: "Citadine" },
    startDate: "2025-11-28T10:00:00Z",
    endDate: "2025-12-05T18:00:00Z",
    pricePerDay: 280,
    paymentStatus: "paid",
    paymentMethod: "Espèces",
    caution: 2500,
    advance: 1960,
    pickupLocation: "Agence Rabat",
    returnLocation: "Aéroport Mohammed V",
    extras: { gps: false, babySeat: true, insuranceUpgrade: true, additionalDriver: null },
    startKm: 38400,
    returnKm: 39870,
    signed: true,
    damages: [
      { zone: "Pare-choc arrière", description: "Légère rayure côté droit", severity: "leger" },
    ],
    photos: 14,
    urgency: "low",
    createdAt: "2025-11-22T08:34:00Z",
  },
  {
    code: "RES-2025-0020",
    status: "terminee",
    client: { id: "c13", name: "Latifa Saidi", phone: "+212 673 456 789" },
    car: { id: "v6", brand: "Peugeot", model: "208", plate: "56789-F-4", category: "Citadine" },
    startDate: "2025-12-01T09:00:00Z",
    endDate: "2025-12-08T18:00:00Z",
    pricePerDay: 240,
    paymentStatus: "paid",
    paymentMethod: "Espèces",
    caution: 2000,
    advance: 1680,
    pickupLocation: "Agence Marrakech",
    returnLocation: "Agence Marrakech",
    extras: { gps: true, babySeat: false, insuranceUpgrade: false, additionalDriver: null },
    startKm: 25800,
    returnKm: 26900,
    signed: true,
    damages: [],
    photos: 10,
    urgency: "low",
    createdAt: "2025-11-26T16:44:00Z",
  },
  {
    code: "RES-2025-0021",
    status: "terminee",
    client: { id: "c14", name: "Adam Naciri", phone: "+212 674 567 890" },
    car: { id: "v4", brand: "Hyundai", model: "Tucson", plate: "34567-D-2", category: "SUV" },
    startDate: "2025-12-03T11:00:00Z",
    endDate: "2025-12-10T18:00:00Z",
    pricePerDay: 550,
    paymentStatus: "paid",
    paymentMethod: "Virement",
    caution: 5000,
    advance: 3850,
    pickupLocation: "Aéroport Marrakech",
    returnLocation: "Aéroport Marrakech",
    extras: { gps: true, babySeat: false, insuranceUpgrade: true, additionalDriver: "Yassine Naciri" },
    startKm: 18200,
    returnKm: 19980,
    signed: true,
    damages: [],
    photos: 16,
    urgency: "low",
    createdAt: "2025-11-28T09:11:00Z",
  },

  // Annulée
  {
    code: "RES-2025-0031",
    status: "annulee",
    client: { id: "c15", name: "Hamza El Khattabi", phone: "+212 675 678 901" },
    car: { id: "v5", brand: "Toyota", model: "RAV4", plate: "45678-E-5", category: "SUV" },
    startDate: "2025-12-19T10:00:00Z",
    endDate: "2025-12-25T18:00:00Z",
    pricePerDay: 620,
    paymentStatus: "unpaid",
    paymentMethod: "Espèces",
    caution: 6000,
    advance: 0,
    pickupLocation: "Agence Casablanca",
    returnLocation: "Agence Casablanca",
    extras: { gps: false, babySeat: false, insuranceUpgrade: false, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: false,
    damages: [],
    photos: 0,
    urgency: "low",
    createdAt: "2025-12-14T20:14:00Z",
  },
  {
    code: "RES-2025-0032",
    status: "annulee",
    client: { id: "c1", name: "Ahmed Benali", phone: "+212 661 234 567" },
    car: { id: "v2", brand: "Dacia", model: "Duster", plate: "67890-B-3", category: "SUV" },
    startDate: "2025-12-18T09:00:00Z",
    endDate: "2025-12-21T18:00:00Z",
    pricePerDay: 380,
    paymentStatus: "unpaid",
    paymentMethod: "Carte bancaire",
    caution: 3500,
    advance: 0,
    pickupLocation: "Agence Casablanca",
    returnLocation: "Agence Casablanca",
    extras: { gps: false, babySeat: true, insuranceUpgrade: false, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: false,
    damages: [],
    photos: 0,
    urgency: "low",
    createdAt: "2025-12-13T07:51:00Z",
  },

  // Bonus high-value & cas spéciaux
  {
    code: "RES-2025-0037",
    status: "confirmee",
    client: { id: "c16", name: "Younes Tahiri", phone: "+212 676 789 012" },
    car: { id: "v7", brand: "Kia", model: "Sportage", plate: "78901-G-8", category: "SUV" },
    startDate: "2025-12-24T08:00:00Z",
    endDate: "2026-01-08T20:00:00Z",
    pricePerDay: 450,
    paymentStatus: "partial",
    paymentMethod: "Virement",
    caution: 5000,
    advance: 3000,
    pickupLocation: "Aéroport Mohammed V",
    returnLocation: "Aéroport Mohammed V",
    extras: { gps: true, babySeat: false, insuranceUpgrade: true, additionalDriver: null },
    startKm: null,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 4,
    urgency: "medium",
    createdAt: "2025-12-16T11:08:00Z",
  },
  {
    code: "RES-2025-0023",
    status: "en_cours",
    client: { id: "c17", name: "Layla Berrada", phone: "+212 677 890 123" },
    car: { id: "v4", brand: "Hyundai", model: "Tucson", plate: "34567-D-2", category: "SUV" },
    startDate: "2025-12-10T09:00:00Z",
    endDate: "2025-12-16T18:00:00Z",
    pricePerDay: 550,
    paymentStatus: "paid",
    paymentMethod: "Carte bancaire",
    caution: 5000,
    advance: 3850,
    pickupLocation: "Agence Marrakech",
    returnLocation: "Agence Marrakech",
    extras: { gps: true, babySeat: true, insuranceUpgrade: true, additionalDriver: "Mouna Berrada" },
    startKm: 19980,
    returnKm: null,
    signed: true,
    damages: [],
    photos: 7,
    urgency: "high",
    overdue: true,
    createdAt: "2025-12-05T10:21:00Z",
  },
]

function buildReservation(seed: Seed, idx: number): Reservation {
  const days = daysBetween(seed.startDate, seed.endDate)
  const total = days * seed.pricePerDay
  const remaining = Math.max(0, total - seed.advance)

  const baseDeparture: ContractChecklistItem[] = [
    { label: "Carte grise présente", ok: seed.signed },
    { label: "Roue de secours", ok: seed.signed },
    { label: "Triangle & gilet", ok: seed.signed },
    { label: "Niveau carburant relevé", ok: seed.signed },
    { label: "Photos extérieures (4 angles)", ok: seed.signed && seed.photos >= 4 },
    { label: "Photos intérieures", ok: seed.signed && seed.photos >= 6 },
    { label: "Signature client", ok: seed.signed },
  ]

  const baseReturn: ContractChecklistItem[] =
    seed.status === "terminee"
      ? [
          { label: "Inspection extérieure", ok: true },
          { label: "Inspection intérieure", ok: true },
          { label: "Niveau carburant retour", ok: true },
          { label: "Kilométrage relevé", ok: seed.returnKm !== null },
          { label: "Caution restituée", ok: true },
          { label: "Signature retour", ok: true },
        ]
      : [
          { label: "Inspection extérieure", ok: false },
          { label: "Inspection intérieure", ok: false },
          { label: "Niveau carburant retour", ok: false },
          { label: "Kilométrage relevé", ok: false },
          { label: "Caution restituée", ok: false },
          { label: "Signature retour", ok: false },
        ]

  const timeline: TimelineEvent[] = [
    {
      id: `t${idx}-1`,
      type: "created",
      label: "Réservation créée",
      description: `Demande initiée par ${seed.client.name}`,
      timestamp: seed.createdAt,
      author: "Système",
    },
  ]

  if (seed.status !== "demande") {
    const confirmAt = new Date(new Date(seed.createdAt).getTime() + 1000 * 60 * 60 * 6).toISOString()
    timeline.push({
      id: `t${idx}-2`,
      type: "status",
      label: "Réservation confirmée",
      description: "Statut mis à jour : Confirmée",
      timestamp: confirmAt,
      author: "Karim Alaoui",
    })
  }

  if (seed.advance > 0) {
    const payAt = new Date(new Date(seed.createdAt).getTime() + 1000 * 60 * 60 * 24).toISOString()
    timeline.push({
      id: `t${idx}-pay`,
      type: "payment",
      label: "Acompte encaissé",
      description: `${formatMAD(seed.advance)} via ${seed.paymentMethod.toLowerCase()}`,
      timestamp: payAt,
      author: "Sara Bennani",
    })
  }

  if (seed.status === "en_cours" || seed.status === "terminee") {
    timeline.push({
      id: `t${idx}-3`,
      type: "pickup",
      label: "Véhicule remis au client",
      description: `Kilométrage départ : ${seed.startKm?.toLocaleString("fr-FR") ?? "—"} km`,
      timestamp: seed.startDate,
      author: "Karim Alaoui",
    })
  }

  if (seed.status === "terminee") {
    timeline.push({
      id: `t${idx}-4`,
      type: "return",
      label: "Véhicule retourné",
      description: `Kilométrage retour : ${seed.returnKm?.toLocaleString("fr-FR") ?? "—"} km`,
      timestamp: seed.endDate,
      author: "Imane Cherkaoui",
    })
    timeline.push({
      id: `t${idx}-5`,
      type: "status",
      label: "Réservation clôturée",
      description: "Contrat signé et caution restituée",
      timestamp: new Date(new Date(seed.endDate).getTime() + 1000 * 60 * 30).toISOString(),
      author: "Imane Cherkaoui",
    })
  }

  if (seed.status === "annulee") {
    timeline.push({
      id: `t${idx}-cancel`,
      type: "status",
      label: "Réservation annulée",
      description: "Annulation demandée par le client",
      timestamp: new Date(new Date(seed.createdAt).getTime() + 1000 * 60 * 60 * 12).toISOString(),
      author: "Karim Alaoui",
    })
  }

  return {
    id: `r${idx + 1}`,
    code: seed.code,
    status: seed.status,
    urgency: seed.urgency ?? "low",
    client: { ...seed.client, initials: initials(seed.client.name) },
    car: seed.car,
    startDate: seed.startDate,
    endDate: seed.endDate,
    days,
    pickupLocation: seed.pickupLocation,
    returnLocation: seed.returnLocation,
    extras: seed.extras,
    startKm: seed.startKm,
    returnKm: seed.returnKm,
    pricePerDay: seed.pricePerDay,
    total,
    caution: seed.caution,
    advance: seed.advance,
    remaining,
    paymentMethod: seed.paymentMethod,
    paymentStatus: seed.paymentStatus,
    contract: {
      departureChecklist: baseDeparture,
      returnChecklist: baseReturn,
      damages: seed.damages,
      signed: seed.signed,
      photos: seed.photos,
    },
    timeline: timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    createdAt: seed.createdAt,
    overdue: seed.overdue,
  }
}

export const reservations: Reservation[] = seeds.map((s, i) => buildReservation(s, i))

export const reservationStatuses: ReservationStatus[] = [
  "demande",
  "confirmee",
  "en_cours",
  "terminee",
  "annulee",
]
