"use client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriverStatus = "active" | "inactive" | "suspended"

export type PaymentType = "monthly" | "mission"

export type DriverPaymentRate = {
  id: string
  type: PaymentType
  // Monthly
  monthlySalary?: number
  startDate?: string // ISO
  endDate?: string | null // ISO – null = current
  // Mission / hourly
  pricePerHour?: number
  pricePerMission?: number
  // Meta
  createdAt: string // ISO
  note?: string
}

export type DriverPaymentEntry = {
  id: string
  date: string // ISO
  amount: number
  type: "salary" | "mission" | "bonus" | "advance"
  reference?: string
  note?: string
}

export type DriverAssignment = {
  id: string
  reservationCode: string
  clientName: string
  carLabel: string
  startDate: string // ISO
  endDate: string // ISO
  missionFee?: number
  status: "completed" | "ongoing" | "cancelled"
}

export type DriverDocument = {
  id: string
  label: string
  type: "license" | "cin" | "contract" | "other"
  scanned: boolean
  expiry?: string // ISO
}

export type Driver = {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  city: string
  // Identity
  cinNumber: string
  cinExpiry: string // ISO
  // License
  licenseNumber: string
  licenseExpiry: string // ISO
  licenseCategory: string
  // Payment
  paymentType: PaymentType
  currentRate: DriverPaymentRate
  rateHistory: DriverPaymentRate[]
  paymentHistory: DriverPaymentEntry[]
  // Work
  assignments: DriverAssignment[]
  documents: DriverDocument[]
  // Meta
  status: DriverStatus
  hireDate: string // ISO
  totalAssignments: number
  totalEarned: number
  // Avatar seed
  avatarSeed?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const statusConfig: Record<DriverStatus, { label: string; pillClass: string; dotClass: string; textClass: string }> = {
  active: {
    label: "Actif",
    pillClass: "border-emerald-200 bg-emerald-50",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  inactive: {
    label: "Inactif",
    pillClass: "border-slate-200 bg-slate-50",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
  },
  suspended: {
    label: "Suspendu",
    pillClass: "border-rose-200 bg-rose-50",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700",
  },
}

export const paymentTypeConfig: Record<PaymentType, { label: string; color: string }> = {
  monthly: { label: "Salaire mensuel", color: "text-blue-700 bg-blue-50 border-blue-200" },
  mission: { label: "Mission / Heure", color: "text-violet-700 bg-violet-50 border-violet-200" },
}

export function formatMAD(n: number) {
  return new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" })
}

export function daysUntil(iso: string) {
  return Math.floor((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function driverFullName(d: Driver) {
  return `${d.firstName} ${d.lastName}`
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const drivers: Driver[] = [
  {
    id: "d1",
    firstName: "Youssef",
    lastName: "Moukrim",
    phone: "+212 6 61 23 45 67",
    email: "youssef.moukrim@gmail.com",
    address: "12 Rue Ibn Batouta, Maarif",
    city: "Casablanca",
    cinNumber: "BE482910",
    cinExpiry: "2028-05-15",
    licenseNumber: "14/85291/CS",
    licenseExpiry: "2026-11-20",
    licenseCategory: "B",
    paymentType: "monthly",
    status: "active",
    hireDate: "2022-03-01",
    totalAssignments: 47,
    totalEarned: 84600,
    currentRate: {
      id: "r1",
      type: "monthly",
      monthlySalary: 4500,
      startDate: "2024-01-01",
      endDate: null,
      createdAt: "2024-01-01",
    },
    rateHistory: [
      {
        id: "r1-old",
        type: "monthly",
        monthlySalary: 3800,
        startDate: "2022-03-01",
        endDate: "2023-12-31",
        createdAt: "2022-03-01",
        note: "Tarif initial à l'embauche",
      },
    ],
    paymentHistory: [
      { id: "p1", date: "2026-06-30", amount: 4500, type: "salary", reference: "SALAIRE-JUN-2026" },
      { id: "p2", date: "2026-05-31", amount: 4500, type: "salary", reference: "SALAIRE-MAI-2026" },
      { id: "p3", date: "2026-04-30", amount: 4500, type: "salary", reference: "SALAIRE-AVR-2026" },
      { id: "p4", date: "2026-03-15", amount: 800, type: "bonus", note: "Prime de performance Q1" },
    ],
    assignments: [
      {
        id: "a1",
        reservationCode: "RSV-2026-0041",
        clientName: "Hicham Bouzid",
        carLabel: "Dacia Duster 2024",
        startDate: "2026-06-12",
        endDate: "2026-06-15",
        status: "completed",
      },
      {
        id: "a2",
        reservationCode: "RSV-2026-0038",
        clientName: "Soufiane Arabi",
        carLabel: "Renault Clio 2023",
        startDate: "2026-06-01",
        endDate: "2026-06-05",
        status: "completed",
      },
    ],
    documents: [
      { id: "doc1", label: "Permis de conduire", type: "license", scanned: true, expiry: "2026-11-20" },
      { id: "doc2", label: "Carte Nationale", type: "cin", scanned: true, expiry: "2028-05-15" },
      { id: "doc3", label: "Contrat de travail", type: "contract", scanned: true },
    ],
  },
  {
    id: "d2",
    firstName: "Rachid",
    lastName: "Ennaji",
    phone: "+212 6 72 34 56 78",
    email: "rachid.ennaji@outlook.com",
    address: "45 Bd Zerktouni, Guéliz",
    city: "Marrakech",
    cinNumber: "HH291047",
    cinExpiry: "2027-08-10",
    licenseNumber: "09/24710/MK",
    licenseExpiry: "2025-08-10",
    licenseCategory: "B+C",
    paymentType: "mission",
    status: "active",
    hireDate: "2023-07-15",
    totalAssignments: 31,
    totalEarned: 46500,
    currentRate: {
      id: "r2",
      type: "mission",
      pricePerHour: 60,
      pricePerMission: 350,
      startDate: "2023-07-15",
      endDate: null,
      createdAt: "2023-07-15",
    },
    rateHistory: [],
    paymentHistory: [
      { id: "p5", date: "2026-06-28", amount: 2100, type: "mission", reference: "MISS-JUN-2026", note: "6 missions" },
      { id: "p6", date: "2026-05-30", amount: 1750, type: "mission", reference: "MISS-MAI-2026", note: "5 missions" },
    ],
    assignments: [
      {
        id: "a3",
        reservationCode: "RSV-2026-0045",
        clientName: "Ahmed Benali",
        carLabel: "Toyota RAV4 2024",
        startDate: "2026-07-01",
        endDate: "2026-07-04",
        missionFee: 350,
        status: "ongoing",
      },
    ],
    documents: [
      { id: "doc4", label: "Permis de conduire", type: "license", scanned: true, expiry: "2025-08-10" },
      { id: "doc5", label: "Carte Nationale", type: "cin", scanned: false, expiry: "2027-08-10" },
    ],
  },
  {
    id: "d3",
    firstName: "Khalid",
    lastName: "Ziani",
    phone: "+212 6 83 45 67 89",
    email: "k.ziani@gmail.com",
    address: "8 Rue Sebou, Agdal",
    city: "Rabat",
    cinNumber: "AA129304",
    cinExpiry: "2029-02-20",
    licenseNumber: "18/50394/RB",
    licenseExpiry: "2027-03-15",
    licenseCategory: "B",
    paymentType: "monthly",
    status: "inactive",
    hireDate: "2021-11-01",
    totalAssignments: 58,
    totalEarned: 112400,
    currentRate: {
      id: "r3",
      type: "monthly",
      monthlySalary: 5200,
      startDate: "2025-01-01",
      endDate: null,
      createdAt: "2025-01-01",
    },
    rateHistory: [
      { id: "r3-old", type: "monthly", monthlySalary: 4200, startDate: "2021-11-01", endDate: "2024-12-31", createdAt: "2021-11-01" },
    ],
    paymentHistory: [
      { id: "p7", date: "2026-03-31", amount: 5200, type: "salary", reference: "SALAIRE-MAR-2026" },
      { id: "p8", date: "2026-02-28", amount: 5200, type: "salary", reference: "SALAIRE-FEV-2026" },
    ],
    assignments: [],
    documents: [
      { id: "doc6", label: "Permis de conduire", type: "license", scanned: true, expiry: "2027-03-15" },
      { id: "doc7", label: "Carte Nationale", type: "cin", scanned: true, expiry: "2029-02-20" },
    ],
  },
  {
    id: "d4",
    firstName: "Omar",
    lastName: "Tahiri",
    phone: "+212 6 94 56 78 90",
    email: "omar.tahiri@hotmail.com",
    address: "22 Rue El Houria, Centre-ville",
    city: "Fès",
    cinNumber: "CD758201",
    cinExpiry: "2026-09-05",
    licenseNumber: "11/38102/FZ",
    licenseExpiry: "2028-01-08",
    licenseCategory: "B+D",
    paymentType: "mission",
    status: "suspended",
    hireDate: "2024-02-20",
    totalAssignments: 12,
    totalEarned: 14800,
    currentRate: {
      id: "r4",
      type: "mission",
      pricePerHour: 55,
      pricePerMission: 300,
      startDate: "2024-02-20",
      endDate: null,
      createdAt: "2024-02-20",
    },
    rateHistory: [],
    paymentHistory: [
      { id: "p9", date: "2026-01-15", amount: 1500, type: "mission", reference: "MISS-JAN-2026" },
    ],
    assignments: [],
    documents: [
      { id: "doc8", label: "Permis de conduire", type: "license", scanned: false, expiry: "2028-01-08" },
      { id: "doc9", label: "Carte Nationale", type: "cin", scanned: true, expiry: "2026-09-05" },
    ],
  },
  {
    id: "d5",
    firstName: "Mustapha",
    lastName: "Benkirane",
    phone: "+212 6 55 67 89 01",
    email: "m.benkirane@gmail.com",
    address: "3 Impasse des Orangers, Gauthier",
    city: "Casablanca",
    cinNumber: "BK201938",
    cinExpiry: "2030-11-30",
    licenseNumber: "16/71203/CS",
    licenseExpiry: "2029-06-22",
    licenseCategory: "B",
    paymentType: "monthly",
    status: "active",
    hireDate: "2023-01-10",
    totalAssignments: 29,
    totalEarned: 67300,
    currentRate: {
      id: "r5",
      type: "monthly",
      monthlySalary: 4200,
      startDate: "2023-01-10",
      endDate: null,
      createdAt: "2023-01-10",
    },
    rateHistory: [],
    paymentHistory: [
      { id: "p10", date: "2026-06-30", amount: 4200, type: "salary", reference: "SALAIRE-JUN-2026" },
      { id: "p11", date: "2026-05-31", amount: 4200, type: "salary", reference: "SALAIRE-MAI-2026" },
      { id: "p12", date: "2026-04-30", amount: 4200, type: "salary", reference: "SALAIRE-AVR-2026" },
    ],
    assignments: [
      {
        id: "a4",
        reservationCode: "RSV-2026-0044",
        clientName: "Jean-Pierre Moreau",
        carLabel: "Mercedes Classe E 2024",
        startDate: "2026-06-25",
        endDate: "2026-06-30",
        status: "completed",
      },
    ],
    documents: [
      { id: "doc10", label: "Permis de conduire", type: "license", scanned: true, expiry: "2029-06-22" },
      { id: "doc11", label: "Carte Nationale", type: "cin", scanned: true, expiry: "2030-11-30" },
      { id: "doc12", label: "Contrat de travail", type: "contract", scanned: false },
    ],
  },
]
