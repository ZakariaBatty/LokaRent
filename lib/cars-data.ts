export type CarStatus = "disponible" | "louee" | "maintenance" | "hors_service"
export type CarCategory = "Citadine" | "Berline" | "SUV" | "Utilitaire"
export type FuelType = "Essence" | "Diesel" | "Hybride"

export type DocumentStatus = "ok" | "warning" | "expired"

export type CarDocument = {
  status: DocumentStatus
  daysLeft: number
}

export type Insurance = {
  company: string
  policyNumber?: string
  startDate: string
  endDate: string
  premiumAmount?: number
  currency?: string
  documentUrl?: string
  status: DocumentStatus
  daysLeft: number
}

export type Registration = {
  number: string
  issuedAt: string
  expiresAt: string
  issuingAuthority?: string
  documentUrl?: string
  status: DocumentStatus
  daysLeft: number
} | null

export type Vignette = {
  year: number
  paidAt?: string
  endDate: string
  amount?: number
  currency?: string
  documentUrl?: string
  status: DocumentStatus
  daysLeft: number
}

export type VisiteTechnique = {
  lastDate: string
  nextDate: string
  result?: string
  center?: string
  cost?: number
  currency?: string
  documentUrl?: string
  status: DocumentStatus
  daysLeft: number
}

export type CreditAuto = {
  bank: string
  monthlyPayment: number
  endDate: string
} | null

export type VehiclePhoto = {
  url: string
  publicId?: string
  mimeType?: string
  sizeBytes?: number
}

export type Expense = {
  type: "Maintenance" | "Réparation" | "Assurance" | "Vignette" | "Carburant"
  date: string
  amount: number
  note?: string
}

export type ReservationHistory = {
  id: string
  clientName: string
  clientInitials: string
  startDate: string
  endDate: string
  days: number
  amount: number
  status: "completed" | "confirmed" | "cancelled" | "active"
}

export type Car = {
  id: string
  brand: string
  model: string
  year: number
  color: string
  plate: string
  category: CarCategory
  fuel: FuelType
  seats: number
  km: number
  status: CarStatus
  priceDay: number
  priceWeek: number
  priceMonth: number
  depositAmount?: number
  mileageLimit?: number
  extraMileageRate?: number
  photos?: VehiclePhoto[]
  insurance: Insurance
  registration?: Registration
  vignette: Vignette
  visiteTechnique: VisiteTechnique
  carteGriseUploaded: boolean
  creditAuto: CreditAuto
  revenue: number
  expenses: number
  occupancyRate: number
  totalDays: number
  recentExpenses: Expense[]
  reservations: ReservationHistory[]
  monthlyRevenue: number[]
}

export const cars: Car[] = [
  {
    id: "CAR-001",
    brand: "Dacia",
    model: "Logan",
    year: 2022,
    color: "Blanc",
    plate: "12345-A-1",
    category: "Berline",
    fuel: "Diesel",
    seats: 5,
    km: 48230,
    status: "louee",
    priceDay: 250,
    priceWeek: 1500,
    priceMonth: 5500,
    insurance: {
      company: "Wafa Assurance",
      startDate: "2025-01-15",
      endDate: "2026-01-15",
      status: "ok",
      daysLeft: 247,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-08-12", nextDate: "2026-08-12", status: "ok", daysLeft: 91 },
    carteGriseUploaded: true,
    creditAuto: { bank: "Attijariwafa Bank", monthlyPayment: 2400, endDate: "2027-06-30" },
    revenue: 48500,
    expenses: 12300,
    occupancyRate: 78,
    totalDays: 184,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-12", amount: 850, note: "Vidange + filtres" },
      { type: "Réparation", date: "2026-03-08", amount: 1200, note: "Plaquettes de frein" },
      { type: "Assurance", date: "2026-01-15", amount: 4200 },
    ],
    reservations: [
      {
        id: "R-2841",
        clientName: "Ahmed Benali",
        clientInitials: "AB",
        startDate: "2026-05-10",
        endDate: "2026-05-15",
        days: 5,
        amount: 1250,
        status: "active",
      },
      {
        id: "R-2783",
        clientName: "Sara Idrissi",
        clientInitials: "SI",
        startDate: "2026-04-22",
        endDate: "2026-04-28",
        days: 6,
        amount: 1500,
        status: "completed",
      },
      {
        id: "R-2741",
        clientName: "Karim Ouali",
        clientInitials: "KO",
        startDate: "2026-04-05",
        endDate: "2026-04-09",
        days: 4,
        amount: 1000,
        status: "completed",
      },
      {
        id: "R-2698",
        clientName: "Fatima Zahra",
        clientInitials: "FZ",
        startDate: "2026-03-20",
        endDate: "2026-03-25",
        days: 5,
        amount: 1250,
        status: "completed",
      },
      {
        id: "R-2654",
        clientName: "Youssef Amrani",
        clientInitials: "YA",
        startDate: "2026-03-02",
        endDate: "2026-03-04",
        days: 2,
        amount: 500,
        status: "cancelled",
      },
    ],
    monthlyRevenue: [3200, 3800, 4100, 4600, 4900, 5200, 5400, 5100, 4800, 5600, 6100, 6800],
  },
  {
    id: "CAR-002",
    brand: "Dacia",
    model: "Duster",
    year: 2023,
    color: "Gris",
    plate: "67890-B-3",
    category: "SUV",
    fuel: "Diesel",
    seats: 5,
    km: 32100,
    status: "disponible",
    priceDay: 380,
    priceWeek: 2280,
    priceMonth: 8500,
    insurance: {
      company: "AXA Assurance Maroc",
      startDate: "2025-03-20",
      endDate: "2026-06-10",
      status: "warning",
      daysLeft: 28,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-10-05", nextDate: "2026-10-05", status: "ok", daysLeft: 145 },
    carteGriseUploaded: true,
    creditAuto: { bank: "BMCE Bank", monthlyPayment: 3200, endDate: "2028-03-20" },
    revenue: 62400,
    expenses: 14800,
    occupancyRate: 82,
    totalDays: 198,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-28", amount: 1100, note: "Révision 30 000 km" },
      { type: "Réparation", date: "2026-02-15", amount: 2400, note: "Climatisation" },
      { type: "Assurance", date: "2025-03-20", amount: 5800 },
    ],
    reservations: [
      {
        id: "R-2812",
        clientName: "Mohammed El Fassi",
        clientInitials: "ME",
        startDate: "2026-04-30",
        endDate: "2026-05-07",
        days: 7,
        amount: 2660,
        status: "completed",
      },
      {
        id: "R-2756",
        clientName: "Leila Bennani",
        clientInitials: "LB",
        startDate: "2026-04-12",
        endDate: "2026-04-18",
        days: 6,
        amount: 2280,
        status: "completed",
      },
      {
        id: "R-2720",
        clientName: "Rachid Berrada",
        clientInitials: "RB",
        startDate: "2026-03-28",
        endDate: "2026-04-02",
        days: 5,
        amount: 1900,
        status: "completed",
      },
      {
        id: "R-2681",
        clientName: "Nadia Chraibi",
        clientInitials: "NC",
        startDate: "2026-03-10",
        endDate: "2026-03-15",
        days: 5,
        amount: 1900,
        status: "completed",
      },
      {
        id: "R-2632",
        clientName: "Omar Tazi",
        clientInitials: "OT",
        startDate: "2026-02-22",
        endDate: "2026-02-26",
        days: 4,
        amount: 1520,
        status: "completed",
      },
    ],
    monthlyRevenue: [4200, 4800, 5100, 5600, 5900, 6200, 6800, 6500, 6100, 6800, 7300, 7600],
  },
  {
    id: "CAR-003",
    brand: "Renault",
    model: "Clio",
    year: 2021,
    color: "Rouge",
    plate: "23456-C-7",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 67800,
    status: "louee",
    priceDay: 220,
    priceWeek: 1320,
    priceMonth: 4800,
    insurance: {
      company: "Saham Assurance",
      startDate: "2024-11-08",
      endDate: "2026-05-25",
      status: "warning",
      daysLeft: 12,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-05-20", nextDate: "2026-05-20", status: "warning", daysLeft: 7 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 38900,
    expenses: 11200,
    occupancyRate: 71,
    totalDays: 167,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-02", amount: 720, note: "Vidange" },
      { type: "Réparation", date: "2026-03-18", amount: 1850, note: "Embrayage" },
      { type: "Carburant", date: "2026-03-05", amount: 350 },
    ],
    reservations: [
      {
        id: "R-2835",
        clientName: "Hassan Alaoui",
        clientInitials: "HA",
        startDate: "2026-05-08",
        endDate: "2026-05-14",
        days: 6,
        amount: 1320,
        status: "active",
      },
      {
        id: "R-2789",
        clientName: "Imane Sebti",
        clientInitials: "IS",
        startDate: "2026-04-20",
        endDate: "2026-04-24",
        days: 4,
        amount: 880,
        status: "completed",
      },
      {
        id: "R-2748",
        clientName: "Khalid Mansouri",
        clientInitials: "KM",
        startDate: "2026-04-08",
        endDate: "2026-04-12",
        days: 4,
        amount: 880,
        status: "completed",
      },
      {
        id: "R-2702",
        clientName: "Salma Bouaziz",
        clientInitials: "SB",
        startDate: "2026-03-22",
        endDate: "2026-03-28",
        days: 6,
        amount: 1320,
        status: "completed",
      },
      {
        id: "R-2665",
        clientName: "Anas Lahlou",
        clientInitials: "AL",
        startDate: "2026-03-08",
        endDate: "2026-03-10",
        days: 2,
        amount: 440,
        status: "completed",
      },
    ],
    monthlyRevenue: [2800, 3100, 3400, 3600, 3800, 4000, 4200, 4100, 3900, 4300, 4500, 4800],
  },
  {
    id: "CAR-004",
    brand: "Hyundai",
    model: "Tucson",
    year: 2024,
    color: "Noir",
    plate: "34567-D-2",
    category: "SUV",
    fuel: "Diesel",
    seats: 5,
    km: 18450,
    status: "disponible",
    priceDay: 520,
    priceWeek: 3120,
    priceMonth: 11500,
    insurance: {
      company: "RMA Watanya",
      startDate: "2025-08-12",
      endDate: "2026-08-12",
      status: "ok",
      daysLeft: 91,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-08-20", nextDate: "2027-08-20", status: "ok", daysLeft: 464 },
    carteGriseUploaded: true,
    creditAuto: { bank: "BCP", monthlyPayment: 5800, endDate: "2030-08-12" },
    revenue: 78200,
    expenses: 16400,
    occupancyRate: 88,
    totalDays: 214,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-25", amount: 1450, note: "Révision constructeur" },
      { type: "Carburant", date: "2026-04-10", amount: 680 },
      { type: "Assurance", date: "2025-08-12", amount: 7200 },
    ],
    reservations: [
      {
        id: "R-2820",
        clientName: "Tarik El Idrissi",
        clientInitials: "TE",
        startDate: "2026-05-01",
        endDate: "2026-05-08",
        days: 7,
        amount: 3640,
        status: "completed",
      },
      {
        id: "R-2768",
        clientName: "Amina Bouhlal",
        clientInitials: "AB",
        startDate: "2026-04-15",
        endDate: "2026-04-22",
        days: 7,
        amount: 3640,
        status: "completed",
      },
      {
        id: "R-2725",
        clientName: "Younes Cherradi",
        clientInitials: "YC",
        startDate: "2026-04-01",
        endDate: "2026-04-06",
        days: 5,
        amount: 2600,
        status: "completed",
      },
      {
        id: "R-2688",
        clientName: "Houda Mernissi",
        clientInitials: "HM",
        startDate: "2026-03-15",
        endDate: "2026-03-20",
        days: 5,
        amount: 2600,
        status: "completed",
      },
      {
        id: "R-2645",
        clientName: "Mehdi Saadi",
        clientInitials: "MS",
        startDate: "2026-02-28",
        endDate: "2026-03-04",
        days: 4,
        amount: 2080,
        status: "completed",
      },
    ],
    monthlyRevenue: [5800, 6200, 6500, 6900, 7200, 7600, 8100, 7800, 7400, 8200, 8800, 9200],
  },
  {
    id: "CAR-005",
    brand: "Toyota",
    model: "RAV4",
    year: 2023,
    color: "Bleu",
    plate: "45678-E-5",
    category: "SUV",
    fuel: "Hybride",
    seats: 5,
    km: 24600,
    status: "maintenance",
    priceDay: 580,
    priceWeek: 3480,
    priceMonth: 13000,
    insurance: {
      company: "Allianz Maroc",
      startDate: "2025-06-01",
      endDate: "2026-06-01",
      status: "warning",
      daysLeft: 19,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-06-15", nextDate: "2026-06-15", status: "warning", daysLeft: 33 },
    carteGriseUploaded: true,
    creditAuto: { bank: "Crédit du Maroc", monthlyPayment: 6200, endDate: "2029-06-01" },
    revenue: 71800,
    expenses: 18200,
    occupancyRate: 85,
    totalDays: 196,
    recentExpenses: [
      { type: "Réparation", date: "2026-05-10", amount: 3400, note: "Système hybride - capteurs" },
      { type: "Maintenance", date: "2026-04-18", amount: 1800, note: "Révision 25 000 km" },
      { type: "Assurance", date: "2025-06-01", amount: 8400 },
    ],
    reservations: [
      {
        id: "R-2808",
        clientName: "Saïd Belhaj",
        clientInitials: "SB",
        startDate: "2026-04-25",
        endDate: "2026-05-02",
        days: 7,
        amount: 4060,
        status: "completed",
      },
      {
        id: "R-2762",
        clientName: "Naima Cherkaoui",
        clientInitials: "NC",
        startDate: "2026-04-10",
        endDate: "2026-04-17",
        days: 7,
        amount: 4060,
        status: "completed",
      },
      {
        id: "R-2718",
        clientName: "Ilyas Benkirane",
        clientInitials: "IB",
        startDate: "2026-03-25",
        endDate: "2026-03-31",
        days: 6,
        amount: 3480,
        status: "completed",
      },
      {
        id: "R-2675",
        clientName: "Wafa Lahlimi",
        clientInitials: "WL",
        startDate: "2026-03-08",
        endDate: "2026-03-13",
        days: 5,
        amount: 2900,
        status: "completed",
      },
      {
        id: "R-2628",
        clientName: "Adam Filali",
        clientInitials: "AF",
        startDate: "2026-02-20",
        endDate: "2026-02-22",
        days: 2,
        amount: 1160,
        status: "cancelled",
      },
    ],
    monthlyRevenue: [5200, 5600, 5900, 6300, 6700, 7100, 7400, 7100, 6800, 7500, 8000, 8400],
  },
  {
    id: "CAR-006",
    brand: "Peugeot",
    model: "208",
    year: 2022,
    color: "Blanc",
    plate: "56789-F-4",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 54200,
    status: "louee",
    priceDay: 240,
    priceWeek: 1440,
    priceMonth: 5200,
    insurance: {
      company: "Wafa Assurance",
      startDate: "2025-09-15",
      endDate: "2026-09-15",
      status: "ok",
      daysLeft: 125,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-09-22", nextDate: "2026-09-22", status: "ok", daysLeft: 132 },
    carteGriseUploaded: false,
    creditAuto: null,
    revenue: 42100,
    expenses: 9800,
    occupancyRate: 74,
    totalDays: 172,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-08", amount: 680, note: "Vidange + plaquettes" },
      { type: "Réparation", date: "2026-02-28", amount: 950, note: "Batterie" },
      { type: "Carburant", date: "2026-04-15", amount: 420 },
    ],
    reservations: [
      {
        id: "R-2843",
        clientName: "Reda El Mansouri",
        clientInitials: "RE",
        startDate: "2026-05-09",
        endDate: "2026-05-16",
        days: 7,
        amount: 1680,
        status: "active",
      },
      {
        id: "R-2792",
        clientName: "Yasmine Tahiri",
        clientInitials: "YT",
        startDate: "2026-04-24",
        endDate: "2026-04-30",
        days: 6,
        amount: 1440,
        status: "completed",
      },
      {
        id: "R-2752",
        clientName: "Bilal Hajji",
        clientInitials: "BH",
        startDate: "2026-04-10",
        endDate: "2026-04-14",
        days: 4,
        amount: 960,
        status: "completed",
      },
      {
        id: "R-2710",
        clientName: "Soukaina Riad",
        clientInitials: "SR",
        startDate: "2026-03-26",
        endDate: "2026-03-30",
        days: 4,
        amount: 960,
        status: "completed",
      },
      {
        id: "R-2668",
        clientName: "Hamza Bouzidi",
        clientInitials: "HB",
        startDate: "2026-03-12",
        endDate: "2026-03-16",
        days: 4,
        amount: 960,
        status: "completed",
      },
    ],
    monthlyRevenue: [3000, 3300, 3500, 3700, 3900, 4100, 4300, 4200, 4000, 4400, 4700, 4900],
  },
  {
    id: "CAR-007",
    brand: "Kia",
    model: "Sportage",
    year: 2024,
    color: "Gris",
    plate: "78901-G-8",
    category: "SUV",
    fuel: "Diesel",
    seats: 5,
    km: 12300,
    status: "disponible",
    priceDay: 490,
    priceWeek: 2940,
    priceMonth: 11000,
    insurance: {
      company: "AXA Assurance Maroc",
      startDate: "2025-12-01",
      endDate: "2026-12-01",
      status: "ok",
      daysLeft: 202,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-12-10", nextDate: "2027-12-10", status: "ok", daysLeft: 576 },
    carteGriseUploaded: true,
    creditAuto: { bank: "Attijariwafa Bank", monthlyPayment: 5400, endDate: "2030-12-01" },
    revenue: 54600,
    expenses: 11800,
    occupancyRate: 83,
    totalDays: 142,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-30", amount: 1250, note: "Première révision" },
      { type: "Carburant", date: "2026-04-18", amount: 580 },
      { type: "Assurance", date: "2025-12-01", amount: 6800 },
    ],
    reservations: [
      {
        id: "R-2815",
        clientName: "Khadija Benjelloun",
        clientInitials: "KB",
        startDate: "2026-04-27",
        endDate: "2026-05-04",
        days: 7,
        amount: 3430,
        status: "completed",
      },
      {
        id: "R-2770",
        clientName: "Marouane El Khalfi",
        clientInitials: "ME",
        startDate: "2026-04-13",
        endDate: "2026-04-19",
        days: 6,
        amount: 2940,
        status: "completed",
      },
      {
        id: "R-2728",
        clientName: "Lamia Sefrioui",
        clientInitials: "LS",
        startDate: "2026-03-30",
        endDate: "2026-04-05",
        days: 6,
        amount: 2940,
        status: "completed",
      },
      {
        id: "R-2685",
        clientName: "Othmane Ziadi",
        clientInitials: "OZ",
        startDate: "2026-03-15",
        endDate: "2026-03-20",
        days: 5,
        amount: 2450,
        status: "completed",
      },
      {
        id: "R-2640",
        clientName: "Sofia Lamrani",
        clientInitials: "SL",
        startDate: "2026-02-25",
        endDate: "2026-03-01",
        days: 4,
        amount: 1960,
        status: "completed",
      },
    ],
    monthlyRevenue: [4000, 4400, 4700, 5000, 5300, 5600, 5900, 5700, 5400, 5900, 6300, 6600],
  },
  {
    id: "CAR-008",
    brand: "Volkswagen",
    model: "Polo",
    year: 2021,
    color: "Argent",
    plate: "89012-H-6",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 72400,
    status: "hors_service",
    priceDay: 230,
    priceWeek: 1380,
    priceMonth: 5000,
    insurance: {
      company: "Saham Assurance",
      startDate: "2024-05-10",
      endDate: "2026-04-10",
      status: "expired",
      daysLeft: -33,
    },
    vignette: { year: 2025, endDate: "2025-12-31", status: "expired", daysLeft: -133 },
    visiteTechnique: { lastDate: "2024-04-15", nextDate: "2026-04-15", status: "expired", daysLeft: -28 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 28400,
    expenses: 18900,
    occupancyRate: 42,
    totalDays: 98,
    recentExpenses: [
      { type: "Réparation", date: "2026-04-20", amount: 6800, note: "Moteur - immobilisation" },
      { type: "Réparation", date: "2026-03-12", amount: 2400, note: "Boîte de vitesse" },
      { type: "Maintenance", date: "2026-01-18", amount: 720 },
    ],
    reservations: [
      {
        id: "R-2701",
        clientName: "Driss Benabdellah",
        clientInitials: "DB",
        startDate: "2026-03-18",
        endDate: "2026-03-22",
        days: 4,
        amount: 920,
        status: "completed",
      },
      {
        id: "R-2658",
        clientName: "Meryem Kabbaj",
        clientInitials: "MK",
        startDate: "2026-03-02",
        endDate: "2026-03-05",
        days: 3,
        amount: 690,
        status: "completed",
      },
      {
        id: "R-2615",
        clientName: "Zakaria Berrada",
        clientInitials: "ZB",
        startDate: "2026-02-18",
        endDate: "2026-02-21",
        days: 3,
        amount: 690,
        status: "completed",
      },
      {
        id: "R-2578",
        clientName: "Aya Naciri",
        clientInitials: "AN",
        startDate: "2026-02-04",
        endDate: "2026-02-08",
        days: 4,
        amount: 920,
        status: "completed",
      },
      {
        id: "R-2542",
        clientName: "Walid Senhaji",
        clientInitials: "WS",
        startDate: "2026-01-20",
        endDate: "2026-01-22",
        days: 2,
        amount: 460,
        status: "cancelled",
      },
    ],
    monthlyRevenue: [3200, 3400, 2800, 2400, 2900, 3100, 3300, 2200, 1800, 2400, 1600, 800],
  },
  {
    id: "CAR-009",
    brand: "Renault",
    model: "Kangoo",
    year: 2022,
    color: "Blanc",
    plate: "11223-I-9",
    category: "Utilitaire",
    fuel: "Diesel",
    seats: 2,
    km: 89500,
    status: "disponible",
    priceDay: 320,
    priceWeek: 1920,
    priceMonth: 7200,
    insurance: {
      company: "RMA Watanya",
      startDate: "2025-07-05",
      endDate: "2026-07-05",
      status: "ok",
      daysLeft: 53,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-07-18", nextDate: "2026-07-18", status: "ok", daysLeft: 66 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 45200,
    expenses: 13400,
    occupancyRate: 76,
    totalDays: 178,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-22", amount: 1100, note: "Vidange + courroie" },
      { type: "Réparation", date: "2026-03-14", amount: 1650, note: "Suspension arrière" },
      { type: "Carburant", date: "2026-04-12", amount: 520 },
    ],
    reservations: [
      {
        id: "R-2825",
        clientName: "Société TransExpress",
        clientInitials: "TE",
        startDate: "2026-04-28",
        endDate: "2026-05-05",
        days: 7,
        amount: 2240,
        status: "completed",
      },
      {
        id: "R-2775",
        clientName: "Anass Lazrak",
        clientInitials: "AL",
        startDate: "2026-04-14",
        endDate: "2026-04-21",
        days: 7,
        amount: 2240,
        status: "completed",
      },
      {
        id: "R-2732",
        clientName: "Société Maroc Livraison",
        clientInitials: "ML",
        startDate: "2026-04-02",
        endDate: "2026-04-08",
        days: 6,
        amount: 1920,
        status: "completed",
      },
      {
        id: "R-2690",
        clientName: "Hicham Bennani",
        clientInitials: "HB",
        startDate: "2026-03-18",
        endDate: "2026-03-23",
        days: 5,
        amount: 1600,
        status: "completed",
      },
      {
        id: "R-2650",
        clientName: "Ayoub Karimi",
        clientInitials: "AK",
        startDate: "2026-03-04",
        endDate: "2026-03-08",
        days: 4,
        amount: 1280,
        status: "completed",
      },
    ],
    monthlyRevenue: [3400, 3700, 3900, 4100, 4300, 4500, 4700, 4500, 4300, 4600, 4900, 5100],
  },
  {
    id: "CAR-010",
    brand: "Hyundai",
    model: "i10",
    year: 2023,
    color: "Bleu",
    plate: "22334-J-2",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 28900,
    status: "louee",
    priceDay: 200,
    priceWeek: 1200,
    priceMonth: 4500,
    insurance: {
      company: "Wafa Assurance",
      startDate: "2025-10-20",
      endDate: "2026-10-20",
      status: "ok",
      daysLeft: 160,
    },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-10-25", nextDate: "2027-10-25", status: "ok", daysLeft: 530 },
    carteGriseUploaded: true,
    creditAuto: { bank: "BMCE Bank", monthlyPayment: 2100, endDate: "2028-10-20" },
    revenue: 36800,
    expenses: 7200,
    occupancyRate: 80,
    totalDays: 158,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-15", amount: 580, note: "Vidange" },
      { type: "Carburant", date: "2026-04-08", amount: 320 },
      { type: "Assurance", date: "2025-10-20", amount: 3800 },
    ],
    reservations: [
      {
        id: "R-2840",
        clientName: "Nora El Amrani",
        clientInitials: "NE",
        startDate: "2026-05-09",
        endDate: "2026-05-13",
        days: 4,
        amount: 800,
        status: "active",
      },
      {
        id: "R-2790",
        clientName: "Jad Kettani",
        clientInitials: "JK",
        startDate: "2026-04-23",
        endDate: "2026-04-29",
        days: 6,
        amount: 1200,
        status: "completed",
      },
      {
        id: "R-2745",
        clientName: "Inès Bouhdid",
        clientInitials: "IB",
        startDate: "2026-04-09",
        endDate: "2026-04-13",
        days: 4,
        amount: 800,
        status: "completed",
      },
      {
        id: "R-2705",
        clientName: "Anas Filali",
        clientInitials: "AF",
        startDate: "2026-03-25",
        endDate: "2026-03-30",
        days: 5,
        amount: 1000,
        status: "completed",
      },
      {
        id: "R-2660",
        clientName: "Lina Senhaji",
        clientInitials: "LS",
        startDate: "2026-03-10",
        endDate: "2026-03-14",
        days: 4,
        amount: 800,
        status: "completed",
      },
    ],
    monthlyRevenue: [2600, 2800, 3000, 3200, 3400, 3500, 3700, 3600, 3500, 3800, 4000, 4200],
  },
]

export const statusConfig: Record<
  CarStatus,
  { label: string; dotClass: string; pillClass: string; badgeClass: string }
> = {
  disponible: {
    label: "Disponible",
    dotClass: "bg-emerald-500",
    pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeClass: "bg-emerald-500",
  },
  louee: {
    label: "Louée",
    dotClass: "bg-blue-500",
    pillClass: "bg-blue-50 text-blue-700 border-blue-200",
    badgeClass: "bg-blue-500",
  },
  maintenance: {
    label: "Maintenance",
    dotClass: "bg-amber-500",
    pillClass: "bg-amber-50 text-amber-700 border-amber-200",
    badgeClass: "bg-amber-500",
  },
  hors_service: {
    label: "Hors service",
    dotClass: "bg-rose-500",
    pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    badgeClass: "bg-rose-500",
  },
}

export const categoryGradients: Record<CarCategory, string> = {
  Citadine: "from-sky-50 via-white to-blue-50",
  Berline: "from-indigo-50 via-white to-violet-50",
  SUV: "from-emerald-50 via-white to-teal-50",
  Utilitaire: "from-amber-50 via-white to-orange-50",
}

export const categoryAccent: Record<CarCategory, string> = {
  Citadine: "text-sky-700 bg-sky-100",
  Berline: "text-indigo-700 bg-indigo-100",
  SUV: "text-emerald-700 bg-emerald-100",
  Utilitaire: "text-amber-700 bg-amber-100",
}

export function formatMAD(value: number): string {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value) + " DH"
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}
