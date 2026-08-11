// ---------------------------------------------------------------------------
// LokaRent — Invoices mock data + helpers
// ---------------------------------------------------------------------------

export type InvoiceStatus = "draft" | "issued" | "partial" | "paid" | "overdue" | "cancelled"
export type InvoiceType = "rental" | "manual"
export type CustomerType = "individual" | "company"

export type InvoiceLineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number // percentage, e.g. 20
  subtotal: number // quantity * unitPrice before tax
  total: number   // subtotal + tax
  source?: "system" | "manual"
}

export type InvoicePayment = {
  id: string
  date: string
  method: "cash" | "bank_transfer" | "card" | "cheque" | "other"
  amount: number
  reference?: string
  note?: string
}

export type InvoiceTimelineEvent = {
  id: string
  type: "created" | "issued" | "payment" | "cancelled" | "edited" | "reminder"
  label: string
  description?: string
  timestamp: string
  author: string
}

export type Invoice = {
  id: string
  number: string         // e.g. FAC-2026-0042
  status: InvoiceStatus
  type: InvoiceType

  // Customer
  customerId: string
  customerName: string
  customerType: CustomerType
  customerPhone: string
  customerEmail?: string
  customerAddress?: string
  customerCompany?: string

  // Linked reservation (type === "rental")
  reservationId?: string
  reservationCode?: string
  carLabel?: string

  // Dates
  issueDate: string  // ISO
  dueDate: string    // ISO

  // Financials
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxTotal: number
  total: number
  paid: number
  remaining: number

  // Payments recorded
  payments: InvoicePayment[]

  // Meta
  notes?: string
  createdAt: string
  timeline: InvoiceTimelineEvent[]
}

// ---------------------------------------------------------------------------
// Status config (mirrors reservations statusConfig pattern)
// ---------------------------------------------------------------------------
export const invoiceStatuses: InvoiceStatus[] = [
  "draft", "issued", "partial", "paid", "overdue", "cancelled",
]

export const statusConfig: Record<
  InvoiceStatus,
  { label: string; pillBg: string; pillText: string; dot: string }
> = {
  draft:     { label: "Brouillon",  pillBg: "bg-slate-100",   pillText: "text-slate-600",  dot: "bg-slate-400" },
  issued:    { label: "Émise",      pillBg: "bg-blue-50",     pillText: "text-blue-700",   dot: "bg-blue-500" },
  partial:   { label: "Partielle",  pillBg: "bg-amber-50",    pillText: "text-amber-700",  dot: "bg-amber-400" },
  paid:      { label: "Payée",      pillBg: "bg-emerald-50",  pillText: "text-emerald-700",dot: "bg-emerald-500" },
  overdue:   { label: "En retard",  pillBg: "bg-rose-50",     pillText: "text-rose-700",   dot: "bg-rose-500" },
  cancelled: { label: "Annulée",    pillBg: "bg-slate-100",   pillText: "text-slate-500",  dot: "bg-slate-300" },
}

export const invoiceTypeConfig: Record<
  InvoiceType,
  { label: string; pillBg: string; pillText: string }
> = {
  rental: { label: "Location",  pillBg: "bg-indigo-50",  pillText: "text-indigo-700" },
  manual: { label: "Manuelle",  pillBg: "bg-purple-50",  pillText: "text-purple-700" },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " DH"
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function makeLineItem(
  id: string,
  description: string,
  quantity: number,
  unitPrice: number,
  taxRate = 20,
): InvoiceLineItem {
  const subtotal = quantity * unitPrice
  const total = subtotal * (1 + taxRate / 100)
  return { id, description, quantity, unitPrice, taxRate, subtotal, total }
}

// ---------------------------------------------------------------------------
// Mock data — 18 invoices, varied statuses and types
// ---------------------------------------------------------------------------
export const invoices: Invoice[] = [
  // ─── 1 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-001",
    number: "FAC-2026-0042",
    status: "paid",
    type: "rental",
    customerId: "client-1",
    customerName: "Youssef Benali",
    customerType: "individual",
    customerPhone: "+212 661 234 567",
    customerEmail: "y.benali@gmail.com",
    customerAddress: "12 Rue Hassan II, Casablanca",
    reservationId: "res-001",
    reservationCode: "RES-2026-0012",
    carLabel: "Dacia Logan · 12345-A-1",
    issueDate: "2026-04-01",
    dueDate: "2026-04-08",
    lineItems: [
      makeLineItem("li-1-1", "Location Dacia Logan — 5 jours", 5, 280),
      makeLineItem("li-1-2", "Assurance complémentaire", 1, 150),
      makeLineItem("li-1-3", "GPS", 5, 20),
    ],
    subtotal: 1700,
    taxTotal: 340,
    total: 2040,
    paid: 2040,
    remaining: 0,
    payments: [
      {
        id: "pay-1-1",
        date: "2026-04-08",
        method: "bank_transfer",
        amount: 2040,
        reference: "VIR-20260408-1",
        note: "Virement reçu",
      },
    ],
    notes: "Client fidèle — remise de 5% accordée à la prochaine location.",
    createdAt: "2026-04-01T09:12:00Z",
    timeline: [
      { id: "t1-1", type: "created",  label: "Facture créée",            timestamp: "2026-04-01T09:12:00Z", author: "Admin" },
      { id: "t1-2", type: "issued",   label: "Facture émise au client",  timestamp: "2026-04-01T09:30:00Z", author: "Admin" },
      { id: "t1-3", type: "payment",  label: "Paiement reçu — 2 040 DH", timestamp: "2026-04-08T14:20:00Z", author: "Admin" },
    ],
  },

  // ─── 2 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-002",
    number: "FAC-2026-0043",
    status: "overdue",
    type: "rental",
    customerId: "client-2",
    customerName: "Samira El Fassi",
    customerType: "individual",
    customerPhone: "+212 655 987 321",
    customerEmail: "s.elfassi@hotmail.com",
    customerAddress: "8 Avenue Mohammed V, Rabat",
    reservationId: "res-002",
    reservationCode: "RES-2026-0013",
    carLabel: "Renault Clio · 45678-D-7",
    issueDate: "2026-04-05",
    dueDate: "2026-04-12",
    lineItems: [
      makeLineItem("li-2-1", "Location Renault Clio — 7 jours", 7, 220),
      makeLineItem("li-2-2", "Siège bébé", 7, 15),
    ],
    subtotal: 1645,
    taxTotal: 329,
    total: 1974,
    paid: 0,
    remaining: 1974,
    payments: [],
    notes: "Relance envoyée le 14/04.",
    createdAt: "2026-04-05T10:00:00Z",
    timeline: [
      { id: "t2-1", type: "created",  label: "Facture créée",            timestamp: "2026-04-05T10:00:00Z", author: "Admin" },
      { id: "t2-2", type: "issued",   label: "Facture émise",            timestamp: "2026-04-05T10:15:00Z", author: "Admin" },
      { id: "t2-3", type: "reminder", label: "Relance envoyée",          timestamp: "2026-04-14T09:00:00Z", author: "Système" },
    ],
  },

  // ─── 3 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-003",
    number: "FAC-2026-0044",
    status: "partial",
    type: "rental",
    customerId: "client-3",
    customerName: "Transporteurs Atlas SARL",
    customerType: "company",
    customerPhone: "+212 522 334 455",
    customerEmail: "facturation@atlas-transport.ma",
    customerAddress: "Zone Industrielle Ain Sebaâ, Casablanca",
    customerCompany: "Transporteurs Atlas SARL",
    reservationId: "res-003",
    reservationCode: "RES-2026-0014",
    carLabel: "Toyota RAV4 · 34567-C-5",
    issueDate: "2026-04-10",
    dueDate: "2026-04-24",
    lineItems: [
      makeLineItem("li-3-1", "Location Toyota RAV4 — 10 jours", 10, 450),
      makeLineItem("li-3-2", "Conducteur supplémentaire", 10, 50),
      makeLineItem("li-3-3", "Assurance tout risque", 1, 600),
    ],
    subtotal: 5600,
    taxTotal: 1120,
    total: 6720,
    paid: 3000,
    remaining: 3720,
    payments: [
      {
        id: "pay-3-1",
        date: "2026-04-10",
        method: "cheque",
        amount: 3000,
        reference: "CHQ-20260410",
        note: "Acompte 50%",
      },
    ],
    createdAt: "2026-04-10T11:30:00Z",
    timeline: [
      { id: "t3-1", type: "created",  label: "Facture créée",            timestamp: "2026-04-10T11:30:00Z", author: "Admin" },
      { id: "t3-2", type: "issued",   label: "Facture émise",            timestamp: "2026-04-10T11:45:00Z", author: "Admin" },
      { id: "t3-3", type: "payment",  label: "Paiement reçu — 3 000 DH", timestamp: "2026-04-10T14:00:00Z", author: "Admin" },
    ],
  },

  // ─── 4 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-004",
    number: "FAC-2026-0045",
    status: "issued",
    type: "rental",
    customerId: "client-4",
    customerName: "Karim Ouahabi",
    customerType: "individual",
    customerPhone: "+212 670 112 233",
    customerEmail: "k.ouahabi@gmail.com",
    reservationId: "res-004",
    reservationCode: "RES-2026-0015",
    carLabel: "Hyundai Tucson · 23456-F-9",
    issueDate: "2026-04-15",
    dueDate: "2026-04-22",
    lineItems: [
      makeLineItem("li-4-1", "Location Hyundai Tucson — 6 jours", 6, 380),
    ],
    subtotal: 2280,
    taxTotal: 456,
    total: 2736,
    paid: 0,
    remaining: 2736,
    payments: [],
    createdAt: "2026-04-15T08:00:00Z",
    timeline: [
      { id: "t4-1", type: "created", label: "Facture créée",   timestamp: "2026-04-15T08:00:00Z", author: "Admin" },
      { id: "t4-2", type: "issued",  label: "Facture émise",   timestamp: "2026-04-15T08:10:00Z", author: "Admin" },
    ],
  },

  // ─── 5 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-005",
    number: "FAC-2026-0046",
    status: "draft",
    type: "manual",
    customerId: "client-5",
    customerName: "Immo Prestige Maroc SAS",
    customerType: "company",
    customerPhone: "+212 537 445 566",
    customerEmail: "comptabilite@immo-prestige.ma",
    customerAddress: "Tour Hassan, Rabat",
    customerCompany: "Immo Prestige Maroc SAS",
    issueDate: "2026-04-20",
    dueDate: "2026-05-04",
    lineItems: [
      makeLineItem("li-5-1", "Mise à disposition véhicule VIP — 2 jours", 2, 1200, 20),
      makeLineItem("li-5-2", "Carburant pris en charge", 1, 300, 20),
      makeLineItem("li-5-3", "Frais de livraison aéroport", 2, 200, 20),
    ],
    subtotal: 3100,
    taxTotal: 620,
    total: 3720,
    paid: 0,
    remaining: 3720,
    payments: [],
    notes: "En attente de validation comptable avant émission.",
    createdAt: "2026-04-20T16:00:00Z",
    timeline: [
      { id: "t5-1", type: "created", label: "Brouillon créé", timestamp: "2026-04-20T16:00:00Z", author: "Admin" },
    ],
  },

  // ─── 6 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-006",
    number: "FAC-2026-0047",
    status: "paid",
    type: "manual",
    customerId: "client-6",
    customerName: "Nadia Zouine",
    customerType: "individual",
    customerPhone: "+212 661 778 899",
    customerEmail: "n.zouine@gmail.com",
    issueDate: "2026-04-03",
    dueDate: "2026-04-10",
    lineItems: [
      makeLineItem("li-6-1", "Franchise accident — réparation pare-choc", 1, 1800, 20),
    ],
    subtotal: 1800,
    taxTotal: 360,
    total: 2160,
    paid: 2160,
    remaining: 0,
    payments: [
      {
        id: "pay-6-1",
        date: "2026-04-10",
        method: "cash",
        amount: 2160,
        note: "Payé en espèces à l'agence",
      },
    ],
    createdAt: "2026-04-03T14:30:00Z",
    timeline: [
      { id: "t6-1", type: "created",  label: "Facture créée",            timestamp: "2026-04-03T14:30:00Z", author: "Admin" },
      { id: "t6-2", type: "issued",   label: "Facture émise",            timestamp: "2026-04-03T15:00:00Z", author: "Admin" },
      { id: "t6-3", type: "payment",  label: "Paiement reçu — 2 160 DH", timestamp: "2026-04-10T11:00:00Z", author: "Admin" },
    ],
  },

  // ─── 7 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-007",
    number: "FAC-2026-0048",
    status: "cancelled",
    type: "rental",
    customerId: "client-7",
    customerName: "Anas Lahrichi",
    customerType: "individual",
    customerPhone: "+212 644 321 654",
    reservationId: "res-007",
    reservationCode: "RES-2026-0019",
    carLabel: "Peugeot 208 · 78901-G-2",
    issueDate: "2026-04-08",
    dueDate: "2026-04-15",
    lineItems: [
      makeLineItem("li-7-1", "Location Peugeot 208 — 4 jours", 4, 200),
    ],
    subtotal: 800,
    taxTotal: 160,
    total: 960,
    paid: 0,
    remaining: 960,
    payments: [],
    notes: "Réservation annulée — facture void.",
    createdAt: "2026-04-08T09:00:00Z",
    timeline: [
      { id: "t7-1", type: "created",   label: "Facture créée",      timestamp: "2026-04-08T09:00:00Z", author: "Admin" },
      { id: "t7-2", type: "issued",    label: "Facture émise",      timestamp: "2026-04-08T09:20:00Z", author: "Admin" },
      { id: "t7-3", type: "cancelled", label: "Facture annulée",    timestamp: "2026-04-09T10:00:00Z", author: "Admin" },
    ],
  },

  // ─── 8 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-008",
    number: "FAC-2026-0049",
    status: "issued",
    type: "manual",
    customerId: "client-8",
    customerName: "Société Event Pro SARL",
    customerType: "company",
    customerPhone: "+212 522 998 877",
    customerEmail: "admin@eventpro.ma",
    customerCompany: "Société Event Pro SARL",
    issueDate: "2026-04-22",
    dueDate: "2026-05-06",
    lineItems: [
      makeLineItem("li-8-1", "Location flotte 3 véhicules — 2 jours", 6, 400, 20),
      makeLineItem("li-8-2", "Chauffeur désigné × 2 jours", 2, 600, 20),
      makeLineItem("li-8-3", "Nettoyage et préparation", 3, 80, 20),
    ],
    subtotal: 3840,
    taxTotal: 768,
    total: 4608,
    paid: 0,
    remaining: 4608,
    payments: [],
    createdAt: "2026-04-22T10:00:00Z",
    timeline: [
      { id: "t8-1", type: "created", label: "Facture créée",  timestamp: "2026-04-22T10:00:00Z", author: "Admin" },
      { id: "t8-2", type: "issued",  label: "Facture émise",  timestamp: "2026-04-22T10:30:00Z", author: "Admin" },
    ],
  },

  // ─── 9 ──────────────────────────────────────────────────────────────────
  {
    id: "inv-009",
    number: "FAC-2026-0050",
    status: "paid",
    type: "rental",
    customerId: "client-9",
    customerName: "Hamid Tahiri",
    customerType: "individual",
    customerPhone: "+212 666 543 210",
    reservationId: "res-009",
    reservationCode: "RES-2026-0020",
    carLabel: "Dacia Duster · 67890-B-3",
    issueDate: "2026-03-28",
    dueDate: "2026-04-04",
    lineItems: [
      makeLineItem("li-9-1", "Location Dacia Duster — 8 jours", 8, 320),
      makeLineItem("li-9-2", "GPS", 8, 20),
    ],
    subtotal: 2720,
    taxTotal: 544,
    total: 3264,
    paid: 3264,
    remaining: 0,
    payments: [
      { id: "pay-9-1", date: "2026-04-04", method: "card", amount: 3264, note: "Paiement TPE" },
    ],
    createdAt: "2026-03-28T08:30:00Z",
    timeline: [
      { id: "t9-1", type: "created",  label: "Facture créée",            timestamp: "2026-03-28T08:30:00Z", author: "Admin" },
      { id: "t9-2", type: "issued",   label: "Facture émise",            timestamp: "2026-03-28T08:45:00Z", author: "Admin" },
      { id: "t9-3", type: "payment",  label: "Paiement reçu — 3 264 DH", timestamp: "2026-04-04T16:00:00Z", author: "Admin" },
    ],
  },

  // ─── 10 ─────────────────────────────────────────────────────────────────
  {
    id: "inv-010",
    number: "FAC-2026-0051",
    status: "partial",
    type: "manual",
    customerId: "client-10",
    customerName: "Cabinet Juridique Amine & Assoc.",
    customerType: "company",
    customerPhone: "+212 537 221 443",
    customerEmail: "contact@cabinet-amine.ma",
    customerCompany: "Cabinet Juridique Amine & Assoc.",
    issueDate: "2026-04-18",
    dueDate: "2026-05-02",
    lineItems: [
      makeLineItem("li-10-1", "Location Mercedes Classe E — 3 jours", 3, 1500, 20),
      makeLineItem("li-10-2", "Carburant", 1, 400, 20),
    ],
    subtotal: 4900,
    taxTotal: 980,
    total: 5880,
    paid: 2000,
    remaining: 3880,
    payments: [
      { id: "pay-10-1", date: "2026-04-18", method: "bank_transfer", amount: 2000, reference: "VIR-18042026", note: "Avance 34%" },
    ],
    createdAt: "2026-04-18T14:00:00Z",
    timeline: [
      { id: "t10-1", type: "created",  label: "Facture créée",            timestamp: "2026-04-18T14:00:00Z", author: "Admin" },
      { id: "t10-2", type: "issued",   label: "Facture émise",            timestamp: "2026-04-18T14:15:00Z", author: "Admin" },
      { id: "t10-3", type: "payment",  label: "Paiement reçu — 2 000 DH", timestamp: "2026-04-18T16:30:00Z", author: "Admin" },
    ],
  },

  // ─── 11 ─────────────────────────────────────────────────────────────────
  {
    id: "inv-011",
    number: "FAC-2026-0052",
    status: "overdue",
    type: "manual",
    customerId: "client-11",
    customerName: "Rachida Moussaoui",
    customerType: "individual",
    customerPhone: "+212 671 009 887",
    issueDate: "2026-03-15",
    dueDate: "2026-03-29",
    lineItems: [
      makeLineItem("li-11-1", "Dommages carrosserie arrière", 1, 3200, 20),
    ],
    subtotal: 3200,
    taxTotal: 640,
    total: 3840,
    paid: 0,
    remaining: 3840,
    payments: [],
    notes: "2e relance envoyée. Dossier transmis au service juridique.",
    createdAt: "2026-03-15T11:00:00Z",
    timeline: [
      { id: "t11-1", type: "created",  label: "Facture créée",     timestamp: "2026-03-15T11:00:00Z", author: "Admin" },
      { id: "t11-2", type: "issued",   label: "Facture émise",     timestamp: "2026-03-15T11:15:00Z", author: "Admin" },
      { id: "t11-3", type: "reminder", label: "1re relance",       timestamp: "2026-03-30T09:00:00Z", author: "Système" },
      { id: "t11-4", type: "reminder", label: "2e relance",        timestamp: "2026-04-07T09:00:00Z", author: "Système" },
    ],
  },

  // ─── 12 ─────────────────────────────────────────────────────────────────
  {
    id: "inv-012",
    number: "FAC-2026-0053",
    status: "paid",
    type: "rental",
    customerId: "client-12",
    customerName: "Omar Benmoussa",
    customerType: "individual",
    customerPhone: "+212 662 334 556",
    reservationId: "res-012",
    reservationCode: "RES-2026-0021",
    carLabel: "Kia Sportage · 89012-H-4",
    issueDate: "2026-04-02",
    dueDate: "2026-04-09",
    lineItems: [
      makeLineItem("li-12-1", "Location Kia Sportage — 3 jours", 3, 360),
    ],
    subtotal: 1080,
    taxTotal: 216,
    total: 1296,
    paid: 1296,
    remaining: 0,
    payments: [
      { id: "pay-12-1", date: "2026-04-02", method: "cash", amount: 1296, note: "Payé à la prise en charge" },
    ],
    createdAt: "2026-04-02T09:00:00Z",
    timeline: [
      { id: "t12-1", type: "created",  label: "Facture créée",            timestamp: "2026-04-02T09:00:00Z", author: "Admin" },
      { id: "t12-2", type: "issued",   label: "Facture émise",            timestamp: "2026-04-02T09:05:00Z", author: "Admin" },
      { id: "t12-3", type: "payment",  label: "Paiement reçu — 1 296 DH", timestamp: "2026-04-02T09:30:00Z", author: "Admin" },
    ],
  },

  // ─── 13–18 (shorter entries) ────────────────────────────────────────────
  ...([
    { id: "inv-013", number: "FAC-2026-0054", status: "issued" as const,    type: "rental" as const,  name: "Fatima Chraibi",          phone: "+212 655 112 233", cType: "individual" as const, car: "Renault Clio · 45678-D-7", resCode: "RES-2026-0022", days: 2, pDay: 220, tax: 20 },
    { id: "inv-014", number: "FAC-2026-0055", status: "draft" as const,     type: "manual" as const,  name: "LogiSud Transport SARL",  phone: "+212 522 667 788", cType: "company" as const,   car: undefined, resCode: undefined, days: 5, pDay: 800, tax: 20 },
    { id: "inv-015", number: "FAC-2026-0056", status: "paid" as const,      type: "rental" as const,  name: "Mehdi Laraich",           phone: "+212 661 554 332", cType: "individual" as const, car: "Toyota RAV4 · 34567-C-5",  resCode: "RES-2026-0023", days: 4, pDay: 450, tax: 20 },
    { id: "inv-016", number: "FAC-2026-0057", status: "overdue" as const,   type: "rental" as const,  name: "Khadija Bensouda",        phone: "+212 654 009 112", cType: "individual" as const, car: "Dacia Logan · 12345-A-1",  resCode: "RES-2026-0024", days: 6, pDay: 280, tax: 20 },
    { id: "inv-017", number: "FAC-2026-0058", status: "partial" as const,   type: "manual" as const,  name: "Agri Invest Maroc SA",    phone: "+212 524 776 543", cType: "company" as const,   car: undefined, resCode: undefined, days: 3, pDay: 950, tax: 20 },
    { id: "inv-018", number: "FAC-2026-0059", status: "cancelled" as const, type: "manual" as const,  name: "Soufiane Arabi",          phone: "+212 672 881 100", cType: "individual" as const, car: undefined, resCode: undefined, days: 1, pDay: 500, tax: 20 },
  ] as const).map((d, i) => {
    const idx = 13 + i
    const sub = d.days * d.pDay
    const tax = Math.round(sub * d.tax / 100)
    const tot = sub + tax
    const paid = d.status === "paid" ? tot : d.status === "partial" ? Math.round(tot * 0.4) : 0
    return {
      id: d.id,
      number: d.number,
      status: d.status,
      type: d.type,
      customerId: `client-${idx}`,
      customerName: d.name,
      customerType: d.cType,
      customerPhone: d.phone,
      ...(d.cType === "company" ? { customerCompany: d.name } : {}),
      ...(d.car ? { carLabel: d.car, reservationId: `res-0${String(idx).padStart(2, "0")}`, reservationCode: d.resCode } : {}),
      issueDate: `2026-04-${String(idx).padStart(2, "0")}`,
      dueDate: `2026-04-${String(Math.min(idx + 7, 30)).padStart(2, "0")}`,
      lineItems: [makeLineItem(`li-${idx}-1`, d.type === "rental" ? `Location ${d.car?.split(" · ")[0] ?? "véhicule"} — ${d.days} jour${d.days > 1 ? "s" : ""}` : `Prestation forfait — ${d.days} unité${d.days > 1 ? "s" : ""}`, d.days, d.pDay, d.tax)],
      subtotal: sub,
      taxTotal: tax,
      total: tot,
      paid,
      remaining: tot - paid,
      payments: paid > 0 ? [{ id: `pay-${idx}-1`, date: `2026-04-${String(idx).padStart(2, "0")}`, method: "cash" as const, amount: paid }] : [],
      createdAt: `2026-04-${String(idx).padStart(2, "0")}T10:00:00Z`,
      timeline: [
        { id: `t${idx}-1`, type: "created" as const, label: "Facture créée", timestamp: `2026-04-${String(idx).padStart(2, "0")}T10:00:00Z`, author: "Admin" },
        ...(d.status !== "draft" ? [{ id: `t${idx}-2`, type: "issued" as const, label: "Facture émise", timestamp: `2026-04-${String(idx).padStart(2, "0")}T10:15:00Z`, author: "Admin" }] : []),
      ],
    } satisfies Invoice
  }),
]

// ---------------------------------------------------------------------------
// Aggregated KPIs
// ---------------------------------------------------------------------------
export function getInvoiceKpis(list: Invoice[]) {
  const total = list.length
  const totalRevenue = list.filter((i) => i.status !== "cancelled").reduce((s, i) => s + i.total, 0)
  const totalPaid = list.reduce((s, i) => s + i.paid, 0)
  const totalRemaining = list.filter((i) => !["cancelled", "paid"].includes(i.status)).reduce((s, i) => s + i.remaining, 0)
  const overdueCount = list.filter((i) => i.status === "overdue").length
  const paidCount = list.filter((i) => i.status === "paid").length
  return { total, totalRevenue, totalPaid, totalRemaining, overdueCount, paidCount }
}
