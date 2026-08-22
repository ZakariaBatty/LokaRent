/**
 * agency-data.ts
 * Per-agency slices of all mocked data.
 * Every page reads from this file via AgencyContext — no backend needed.
 *
 * Structure: agencyDataMap[agencyId] = { cars, clients, reservations, contracts, finances }
 * The types are imported from their existing data files so every existing
 * component keeps working without changes.
 */

import type { Car } from "@/lib/cars-data"
import type { Client } from "@/lib/clients-data"
import { reservations as allReservations, type Reservation } from "@/lib/reservations-data"
import { contracts as allContracts, type Contract } from "@/lib/contracts-data"
import type { UpcomingCharge } from "@/lib/finances-data"
// Note: finances-data also imports from cars-data — no circular dependency here

// ---------------------------------------------------------------------------
// CASABLANCA AGENCY (agency_casablanca) — 6 cars, 5 clients, 6 reservations
// This is the existing default data the app was built with, slightly trimmed.
// ---------------------------------------------------------------------------

const casablancaCars: Car[] = [
  {
    id: "CAR-C01",
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
    insurance: { company: "Wafa Assurance", startDate: "2025-01-15", endDate: "2026-01-15", status: "expired", daysLeft: -10 },
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
      { type: "Assurance", date: "2026-01-15", amount: 4200 },
    ],
    reservations: [
      { id: "R-C01", clientName: "Ahmed Benali", clientInitials: "AB", startDate: "2026-05-10", endDate: "2026-05-15", days: 5, amount: 1250, status: "active" },
      { id: "R-C02", clientName: "Sara Idrissi", clientInitials: "SI", startDate: "2026-04-22", endDate: "2026-04-28", days: 6, amount: 1500, status: "completed" },
    ],
    monthlyRevenue: [3200, 3800, 4100, 4600, 4900, 5200, 5400, 5100, 4800, 5600, 6100, 6800],
  },
  {
    id: "CAR-C02",
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
    insurance: { company: "AXA Maroc", startDate: "2025-03-20", endDate: "2026-06-10", status: "warning", daysLeft: 15 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-10-05", nextDate: "2026-10-05", status: "ok", daysLeft: 145 },
    carteGriseUploaded: true,
    creditAuto: { bank: "BMCE Bank", monthlyPayment: 3200, endDate: "2028-03-20" },
    revenue: 62400,
    expenses: 14800,
    occupancyRate: 82,
    totalDays: 198,
    recentExpenses: [
      { type: "Réparation", date: "2026-04-20", amount: 2100, note: "Amortisseurs avant" },
    ],
    reservations: [
      { id: "R-C03", clientName: "Karim Ouali", clientInitials: "KO", startDate: "2026-05-18", endDate: "2026-05-25", days: 7, amount: 2660, status: "upcoming" as any },
    ],
    monthlyRevenue: [4500, 5100, 5800, 6200, 6800, 7100, 7400, 7200, 6900, 7600, 8100, 8800],
  },
  {
    id: "CAR-C03",
    brand: "Hyundai",
    model: "i10",
    year: 2021,
    color: "Rouge",
    plate: "11122-C-5",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 61800,
    status: "maintenance",
    priceDay: 180,
    priceWeek: 1080,
    priceMonth: 3900,
    insurance: { company: "Saham Assurance", startDate: "2025-06-01", endDate: "2026-06-01", status: "ok", daysLeft: 45 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-02-10", nextDate: "2026-02-10", status: "expired", daysLeft: -120 },
    carteGriseUploaded: false,
    creditAuto: null,
    revenue: 28600,
    expenses: 9400,
    occupancyRate: 61,
    totalDays: 148,
    recentExpenses: [
      { type: "Réparation", date: "2026-05-02", amount: 3200, note: "Moteur — en cours" },
    ],
    reservations: [],
    monthlyRevenue: [1800, 2100, 2400, 2600, 2800, 3000, 2900, 2700, 2500, 2800, 3100, 3400],
  },
  {
    id: "CAR-C04",
    brand: "Renault",
    model: "Clio",
    year: 2022,
    color: "Bleu",
    plate: "55443-D-2",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 39400,
    status: "disponible",
    priceDay: 200,
    priceWeek: 1200,
    priceMonth: 4400,
    insurance: { company: "Wafa Assurance", startDate: "2025-09-01", endDate: "2026-09-01", status: "ok", daysLeft: 105 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-11-20", nextDate: "2026-11-20", status: "ok", daysLeft: 200 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 33800,
    expenses: 7200,
    occupancyRate: 69,
    totalDays: 162,
    recentExpenses: [
      { type: "Maintenance", date: "2026-03-15", amount: 650, note: "Vidange" },
    ],
    reservations: [
      { id: "R-C04", clientName: "Fatima Zahra", clientInitials: "FZ", startDate: "2026-06-01", endDate: "2026-06-05", days: 4, amount: 800, status: "confirmed" as any },
    ],
    monthlyRevenue: [2400, 2700, 3000, 3200, 3400, 3600, 3500, 3300, 3100, 3400, 3700, 4000],
  },
]

const casablancaClients: Client[] = [
  {
    id: "CC-01",
    fullName: "Ahmed Benali",
    phone: "+212 661 234 567",
    email: "ahmed.benali@gmail.com",
    city: "Casablanca",
    nationality: "Marocain",
    status: "actif",
    tier: "vip",
    idType: "CIN",
    idNumber: "BK485912",
    idExpiry: "2028-04-15",
    idScanned: true,
    licenseNumber: "12/45891/CS",
    licenseExpiry: "2027-09-12",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 27,
    totalSpent: 184500,
    lastRentalDate: "2026-05-08",
    favoriteCar: "Dacia Duster",
    monthly: [12500, 18000, 22000, 15800, 28000, 24500],
    createdAt: "2023-02-14",
    reservations: [
      { id: "r1", carBrand: "Dacia", carModel: "Duster", plate: "67890-B-3", startDate: "2026-05-08", endDate: "2026-05-12", amount: 1520, status: "completed" },
      { id: "r2", carBrand: "Renault", carModel: "Clio", plate: "55443-D-2", startDate: "2026-04-10", endDate: "2026-04-14", amount: 800, status: "completed" },
    ],
    notes: [{ id: "n1", date: "2026-05-09", author: "Fatima", body: "Client fidèle, paiement comptant." }],
  },
  {
    id: "CC-02",
    fullName: "Sara Idrissi",
    phone: "+212 662 345 678",
    email: "sara.idrissi@outlook.com",
    city: "Casablanca",
    nationality: "Marocain",
    status: "actif",
    tier: "regular",
    idType: "CIN",
    idNumber: "CD109823",
    idExpiry: "2029-06-20",
    idScanned: true,
    licenseNumber: "88/34512/CS",
    licenseExpiry: "2028-03-05",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 8,
    totalSpent: 42600,
    lastRentalDate: "2026-04-28",
    monthly: [4200, 6800, 5100, 7200, 8400, 6900],
    createdAt: "2024-01-08",
    reservations: [
      { id: "r3", carBrand: "Dacia", carModel: "Logan", plate: "12345-A-1", startDate: "2026-04-22", endDate: "2026-04-28", amount: 1500, status: "completed" },
    ],
    notes: [],
  },
  {
    id: "CC-03",
    fullName: "Karim Ouali",
    phone: "+212 663 456 789",
    email: "karim.ouali@yahoo.fr",
    city: "Mohammedia",
    nationality: "Marocain",
    status: "actif",
    tier: "new",
    idType: "Passeport",
    idNumber: "AB123456",
    idExpiry: "2027-11-30",
    idScanned: false,
    licenseNumber: "45/78902/MH",
    licenseExpiry: "2026-08-15",
    licenseCategory: "B",
    licenseScanned: false,
    totalRentals: 2,
    totalSpent: 5860,
    lastRentalDate: "2026-04-09",
    monthly: [0, 0, 0, 1200, 2660, 0],
    createdAt: "2026-03-20",
    reservations: [
      { id: "r4", carBrand: "Dacia", carModel: "Duster", plate: "67890-B-3", startDate: "2026-05-18", endDate: "2026-05-25", amount: 2660, status: "upcoming" },
    ],
    notes: [{ id: "n2", date: "2026-03-20", author: "Ahmed", body: "Nouveau client, passeport non encore scanné." }],
  },
  {
    id: "CC-04",
    fullName: "Fatima Zahra Alami",
    phone: "+212 664 567 890",
    email: "fatima.alami@gmail.com",
    city: "Casablanca",
    nationality: "Marocain",
    status: "actif",
    tier: "regular",
    idType: "CIN",
    idNumber: "EF234567",
    idExpiry: "2030-01-10",
    idScanned: true,
    licenseNumber: "67/23456/CS",
    licenseExpiry: "2029-05-20",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 5,
    totalSpent: 18400,
    lastRentalDate: "2026-03-25",
    monthly: [2800, 3600, 4100, 3200, 0, 4700],
    createdAt: "2024-09-15",
    reservations: [
      { id: "r5", carBrand: "Renault", carModel: "Clio", plate: "55443-D-2", startDate: "2026-06-01", endDate: "2026-06-05", amount: 800, status: "upcoming" },
    ],
    notes: [],
  },
  {
    id: "CC-05",
    fullName: "Youssef El Mansouri",
    phone: "+212 665 678 901",
    email: "y.mansouri@proton.me",
    city: "Bouskoura",
    nationality: "Marocain",
    status: "blacklist",
    tier: "regular",
    idType: "CIN",
    idNumber: "GH345678",
    idExpiry: "2027-08-22",
    idScanned: true,
    licenseNumber: "33/12345/CS",
    licenseExpiry: "2025-12-01",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 3,
    totalSpent: 7200,
    lastRentalDate: "2025-11-30",
    monthly: [0, 0, 0, 0, 0, 0],
    createdAt: "2025-04-10",
    blacklistReason: "Véhicule rendu avec dommages non déclarés",
    reservations: [
      { id: "r6", carBrand: "Hyundai", carModel: "i10", plate: "11122-C-5", startDate: "2025-11-20", endDate: "2025-11-30", amount: 1800, status: "completed" },
    ],
    notes: [{ id: "n3", date: "2025-12-01", author: "Ahmed", body: "Véhicule retourné avec rayure profonde côté passager. Mis en liste noire." }],
  },
]

// ---------------------------------------------------------------------------
// MARRAKECH AGENCY (agency_marrakech) — 5 cars, 4 clients, 5 reservations
// Smaller fleet, tourism-oriented, higher daily rates.
// ---------------------------------------------------------------------------

const marrakechCars: Car[] = [
  {
    id: "CAR-M01",
    brand: "Toyota",
    model: "RAV4",
    year: 2023,
    color: "Noir",
    plate: "98001-A-9",
    category: "SUV",
    fuel: "Hybride",
    seats: 5,
    km: 22400,
    status: "louee",
    priceDay: 650,
    priceWeek: 3900,
    priceMonth: 14500,
    insurance: { company: "AXA Maroc", startDate: "2025-04-10", endDate: "2026-04-10", status: "ok", daysLeft: 60 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-12-15", nextDate: "2026-12-15", status: "ok", daysLeft: 270 },
    carteGriseUploaded: true,
    creditAuto: { bank: "CIH Bank", monthlyPayment: 4800, endDate: "2028-04-10" },
    revenue: 94200,
    expenses: 18600,
    occupancyRate: 88,
    totalDays: 211,
    recentExpenses: [
      { type: "Maintenance", date: "2026-05-01", amount: 1200, note: "Vidange hybride" },
    ],
    reservations: [
      { id: "R-M01", clientName: "Sophie Leclerc", clientInitials: "SL", startDate: "2026-05-14", endDate: "2026-05-21", days: 7, amount: 4550, status: "active" },
    ],
    monthlyRevenue: [6800, 7200, 8100, 9400, 10200, 11000, 9800, 9100, 8600, 9800, 11200, 12400],
  },
  {
    id: "CAR-M02",
    brand: "Dacia",
    model: "Sandero",
    year: 2022,
    color: "Blanc",
    plate: "87002-B-4",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 54600,
    status: "disponible",
    priceDay: 220,
    priceWeek: 1320,
    priceMonth: 4800,
    insurance: { company: "Wafa Assurance", startDate: "2025-07-01", endDate: "2026-07-01", status: "ok", daysLeft: 38 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-09-10", nextDate: "2026-09-10", status: "ok", daysLeft: 118 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 31400,
    expenses: 8200,
    occupancyRate: 65,
    totalDays: 156,
    recentExpenses: [
      { type: "Carburant", date: "2026-04-28", amount: 450 },
    ],
    reservations: [
      { id: "R-M02", clientName: "Hassan Benmoussa", clientInitials: "HB", startDate: "2026-05-20", endDate: "2026-05-23", days: 3, amount: 660, status: "confirmed" as any },
    ],
    monthlyRevenue: [2200, 2500, 2800, 3100, 3300, 3500, 3200, 3000, 2800, 3100, 3400, 3700],
  },
  {
    id: "CAR-M03",
    brand: "Ford",
    model: "Kuga",
    year: 2024,
    color: "Argent",
    plate: "76003-C-1",
    category: "SUV",
    fuel: "Hybride",
    seats: 5,
    km: 11200,
    status: "disponible",
    priceDay: 590,
    priceWeek: 3540,
    priceMonth: 13200,
    insurance: { company: "Saham Assurance", startDate: "2025-11-01", endDate: "2026-11-01", status: "ok", daysLeft: 160 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2026-01-20", nextDate: "2027-01-20", status: "ok", daysLeft: 365 },
    carteGriseUploaded: true,
    creditAuto: { bank: "Attijariwafa Bank", monthlyPayment: 5200, endDate: "2029-11-01" },
    revenue: 76800,
    expenses: 14200,
    occupancyRate: 79,
    totalDays: 190,
    recentExpenses: [
      { type: "Vignette", date: "2026-01-10", amount: 1800 },
    ],
    reservations: [],
    monthlyRevenue: [5200, 5800, 6400, 7100, 7800, 8400, 7900, 7400, 6800, 7600, 8600, 9400],
  },
  {
    id: "CAR-M04",
    brand: "Peugeot",
    model: "208",
    year: 2023,
    color: "Gris Perle",
    plate: "65004-D-7",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 28900,
    status: "hors_service",
    priceDay: 240,
    priceWeek: 1440,
    priceMonth: 5200,
    insurance: { company: "AXA Maroc", startDate: "2025-08-15", endDate: "2026-08-15", status: "ok", daysLeft: 82 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-05-05", nextDate: "2026-05-05", status: "warning", daysLeft: 12 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 18600,
    expenses: 11400,
    occupancyRate: 42,
    totalDays: 101,
    recentExpenses: [
      { type: "Réparation", date: "2026-05-10", amount: 4800, note: "Boîte automatique" },
    ],
    reservations: [],
    monthlyRevenue: [1800, 2000, 2100, 2300, 1200, 0, 1800, 2100, 2400, 2600, 2200, 1800],
  },
  {
    id: "CAR-M05",
    brand: "Mercedes",
    model: "Classe V",
    year: 2022,
    color: "Noir",
    plate: "54005-E-3",
    category: "Utilitaire",
    fuel: "Diesel",
    seats: 8,
    km: 76400,
    status: "louee",
    priceDay: 980,
    priceWeek: 5880,
    priceMonth: 22000,
    insurance: { company: "Wafa Assurance", startDate: "2025-02-01", endDate: "2026-02-01", status: "expired", daysLeft: -120 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-06-10", nextDate: "2026-06-10", status: "warning", daysLeft: 18 },
    carteGriseUploaded: true,
    creditAuto: { bank: "BMCE Bank", monthlyPayment: 8400, endDate: "2026-02-01" },
    revenue: 142000,
    expenses: 31800,
    occupancyRate: 91,
    totalDays: 218,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-25", amount: 2800, note: "Révision 75 000 km" },
    ],
    reservations: [
      { id: "R-M03", clientName: "Marco Rossi", clientInitials: "MR", startDate: "2026-05-10", endDate: "2026-05-17", days: 7, amount: 6860, status: "active" },
    ],
    monthlyRevenue: [10200, 11400, 12800, 13600, 14800, 15200, 14400, 13600, 12800, 14200, 15800, 16800],
  },
]

const marrakechClients: Client[] = [
  {
    id: "CM-01",
    fullName: "Sophie Leclerc",
    phone: "+33 6 12 34 56 78",
    email: "sophie.leclerc@gmail.com",
    city: "Paris",
    nationality: "Français",
    status: "actif",
    tier: "vip",
    idType: "Passeport",
    idNumber: "14AB98765",
    idExpiry: "2029-05-15",
    idScanned: true,
    licenseNumber: "FR-98-765432",
    licenseExpiry: "2028-11-20",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 14,
    totalSpent: 98600,
    lastRentalDate: "2026-05-14",
    favoriteCar: "Toyota RAV4",
    monthly: [6800, 8400, 7200, 9600, 11200, 14000],
    createdAt: "2024-03-10",
    reservations: [
      { id: "r7", carBrand: "Toyota", carModel: "RAV4", plate: "98001-A-9", startDate: "2026-05-14", endDate: "2026-05-21", amount: 4550, status: "active" },
    ],
    notes: [{ id: "n4", date: "2026-05-14", author: "Salma", body: "Touriste habituelle, préfère véhicules hybrides." }],
  },
  {
    id: "CM-02",
    fullName: "Hassan Benmoussa",
    phone: "+212 661 987 654",
    email: "h.benmoussa@menara.ma",
    city: "Marrakech",
    nationality: "Marocain",
    status: "actif",
    tier: "regular",
    idType: "CIN",
    idNumber: "HJ567890",
    idExpiry: "2028-09-30",
    idScanned: true,
    licenseNumber: "56/90123/MK",
    licenseExpiry: "2027-04-18",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 6,
    totalSpent: 24800,
    lastRentalDate: "2026-05-20",
    monthly: [2200, 3100, 2800, 4200, 3600, 2400],
    createdAt: "2024-11-20",
    reservations: [
      { id: "r8", carBrand: "Dacia", carModel: "Sandero", plate: "87002-B-4", startDate: "2026-05-20", endDate: "2026-05-23", amount: 660, status: "upcoming" },
    ],
    notes: [],
  },
  {
    id: "CM-03",
    fullName: "Marco Rossi",
    phone: "+39 333 456 789",
    email: "marco.rossi@libero.it",
    city: "Milan",
    nationality: "Espagnol",
    status: "actif",
    tier: "regular",
    idType: "Passeport",
    idNumber: "YA4129876",
    idExpiry: "2027-07-10",
    idScanned: true,
    licenseNumber: "IT-MI-234567",
    licenseExpiry: "2029-01-05",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 3,
    totalSpent: 18200,
    lastRentalDate: "2026-05-10",
    monthly: [0, 4200, 0, 7200, 0, 6860],
    createdAt: "2025-09-05",
    reservations: [
      { id: "r9", carBrand: "Mercedes", carModel: "Classe V", plate: "54005-E-3", startDate: "2026-05-10", endDate: "2026-05-17", amount: 6860, status: "active" },
    ],
    notes: [{ id: "n5", date: "2026-05-10", author: "Ahmed", body: "Groupe famille. Toujours Classe V." }],
  },
  {
    id: "CM-04",
    fullName: "Nadia El Fassi",
    phone: "+212 662 112 233",
    email: "nadia.elfassi@hotmail.com",
    city: "Marrakech",
    nationality: "Marocain",
    status: "inactif",
    tier: "new",
    idType: "CIN",
    idNumber: "KL678901",
    idExpiry: "2026-04-01",
    idScanned: true,
    licenseNumber: "78/01234/MK",
    licenseExpiry: "2026-03-30",
    licenseCategory: "B",
    licenseScanned: false,
    totalRentals: 1,
    totalSpent: 2200,
    lastRentalDate: "2026-01-15",
    monthly: [0, 0, 0, 0, 0, 2200],
    createdAt: "2026-01-10",
    reservations: [],
    notes: [{ id: "n6", date: "2026-01-15", author: "Salma", body: "CIN et permis expirés. Ne pas renouveler sans docs valides." }],
  },
]

// ---------------------------------------------------------------------------
// AGADIR AGENCY (agency_agadir) — 3 cars, 3 clients  (Starter plan, smaller)
// ---------------------------------------------------------------------------

const agadirCars: Car[] = [
  {
    id: "CAR-A01",
    brand: "Dacia",
    model: "Jogger",
    year: 2023,
    color: "Bleu Horizon",
    plate: "30101-A-6",
    category: "Berline",
    fuel: "Essence",
    seats: 7,
    km: 41200,
    status: "disponible",
    priceDay: 320,
    priceWeek: 1920,
    priceMonth: 7200,
    insurance: { company: "Saham Assurance", startDate: "2025-05-15", endDate: "2026-05-15", status: "warning", daysLeft: 8 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-11-01", nextDate: "2026-11-01", status: "ok", daysLeft: 162 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 44800,
    expenses: 10200,
    occupancyRate: 71,
    totalDays: 171,
    recentExpenses: [
      { type: "Maintenance", date: "2026-04-18", amount: 780, note: "Vidange + filtres" },
    ],
    reservations: [
      { id: "R-A01", clientName: "Rachid Amrani", clientInitials: "RA", startDate: "2026-05-25", endDate: "2026-05-28", days: 3, amount: 960, status: "confirmed" as any },
    ],
    monthlyRevenue: [3200, 3600, 4100, 4600, 5000, 5200, 4800, 4400, 4100, 4600, 5100, 5600],
  },
  {
    id: "CAR-A02",
    brand: "Kia",
    model: "Picanto",
    year: 2021,
    color: "Orange",
    plate: "30202-B-8",
    category: "Citadine",
    fuel: "Essence",
    seats: 5,
    km: 72100,
    status: "louee",
    priceDay: 160,
    priceWeek: 960,
    priceMonth: 3500,
    insurance: { company: "Wafa Assurance", startDate: "2025-10-01", endDate: "2026-10-01", status: "ok", daysLeft: 128 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2025-04-20", nextDate: "2026-04-20", status: "expired", daysLeft: -50 },
    carteGriseUploaded: true,
    creditAuto: null,
    revenue: 24600,
    expenses: 7800,
    occupancyRate: 58,
    totalDays: 140,
    recentExpenses: [
      { type: "Réparation", date: "2026-03-30", amount: 1800, note: "Embrayage" },
    ],
    reservations: [
      { id: "R-A02", clientName: "Clara Jensen", clientInitials: "CJ", startDate: "2026-05-12", endDate: "2026-05-18", days: 6, amount: 960, status: "active" },
    ],
    monthlyRevenue: [1800, 1900, 2100, 2300, 2500, 2600, 2400, 2200, 2100, 2400, 2600, 2800],
  },
  {
    id: "CAR-A03",
    brand: "Suzuki",
    model: "Jimny",
    year: 2022,
    color: "Vert",
    plate: "30303-C-2",
    category: "SUV",
    fuel: "Essence",
    seats: 4,
    km: 35800,
    status: "disponible",
    priceDay: 480,
    priceWeek: 2880,
    priceMonth: 10800,
    insurance: { company: "AXA Maroc", startDate: "2025-12-01", endDate: "2026-12-01", status: "ok", daysLeft: 192 },
    vignette: { year: 2026, endDate: "2026-12-31", status: "ok", daysLeft: 232 },
    visiteTechnique: { lastDate: "2026-02-15", nextDate: "2027-02-15", status: "ok", daysLeft: 360 },
    carteGriseUploaded: true,
    creditAuto: { bank: "CIH Bank", monthlyPayment: 3600, endDate: "2027-12-01" },
    revenue: 58400,
    expenses: 12000,
    occupancyRate: 74,
    totalDays: 177,
    recentExpenses: [
      { type: "Vignette", date: "2026-01-05", amount: 1400 },
    ],
    reservations: [],
    monthlyRevenue: [4200, 4600, 5100, 5800, 6200, 6600, 6100, 5800, 5400, 6000, 6600, 7100],
  },
]

const agadirClients: Client[] = [
  {
    id: "CA-01",
    fullName: "Rachid Amrani",
    phone: "+212 661 901 234",
    email: "rachid.amrani@gmail.com",
    city: "Agadir",
    nationality: "Marocain",
    status: "actif",
    tier: "regular",
    idType: "CIN",
    idNumber: "MN890123",
    idExpiry: "2028-03-14",
    idScanned: true,
    licenseNumber: "12/34567/AG",
    licenseExpiry: "2027-08-10",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 9,
    totalSpent: 38600,
    lastRentalDate: "2026-05-25",
    monthly: [3800, 4200, 5100, 4600, 5800, 4400],
    createdAt: "2024-06-15",
    reservations: [
      { id: "r10", carBrand: "Dacia", carModel: "Jogger", plate: "30101-A-6", startDate: "2026-05-25", endDate: "2026-05-28", amount: 960, status: "upcoming" },
    ],
    notes: [],
  },
  {
    id: "CA-02",
    fullName: "Clara Jensen",
    phone: "+45 20 12 34 56",
    email: "clara.jensen@gmail.com",
    city: "Copenhagen",
    nationality: "Allemand",
    status: "actif",
    tier: "new",
    idType: "Passeport",
    idNumber: "DK12345678",
    idExpiry: "2030-02-28",
    idScanned: true,
    licenseNumber: "DK-CPH-9876",
    licenseExpiry: "2031-02-28",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 1,
    totalSpent: 960,
    lastRentalDate: "2026-05-12",
    monthly: [0, 0, 0, 0, 0, 960],
    createdAt: "2026-05-12",
    reservations: [
      { id: "r11", carBrand: "Kia", carModel: "Picanto", plate: "30202-B-8", startDate: "2026-05-12", endDate: "2026-05-18", amount: 960, status: "active" },
    ],
    notes: [],
  },
  {
    id: "CA-03",
    fullName: "Abdelmajid Tijani",
    phone: "+212 663 012 345",
    email: "a.tijani@menara.ma",
    city: "Agadir",
    nationality: "Marocain",
    status: "actif",
    tier: "vip",
    idType: "CIN",
    idNumber: "OP901234",
    idExpiry: "2029-11-08",
    idScanned: true,
    licenseNumber: "34/56789/AG",
    licenseExpiry: "2028-05-15",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 18,
    totalSpent: 94200,
    lastRentalDate: "2026-04-30",
    favoriteCar: "Suzuki Jimny",
    monthly: [7200, 8400, 9100, 8600, 10200, 9800],
    createdAt: "2023-08-20",
    reservations: [
      { id: "r12", carBrand: "Suzuki", carModel: "Jimny", plate: "30303-C-2", startDate: "2026-04-20", endDate: "2026-04-30", amount: 4800, status: "completed" },
    ],
    notes: [{ id: "n7", date: "2026-04-30", author: "Salma", body: "Client fidèle, toujours le Jimny. Prévoir la disponibilité à l'avance." }],
  },
]

// ---------------------------------------------------------------------------
// RESERVATION stubs (lightweight — pages use reservations-data.ts for the
// full Kanban/list but the header KPIs read counts from agency slices)
// ---------------------------------------------------------------------------

export type AgencyReservationSummary = {
  agencyId: string
  active: number
  confirmed: number
  pending: number
  overdue: number
}

export const agencyReservationSummaries: AgencyReservationSummary[] = [
  { agencyId: "agency_casablanca", active: 2, confirmed: 3, pending: 4, overdue: 1 },
  { agencyId: "agency_marrakech",  active: 4, confirmed: 2, pending: 3, overdue: 0 },
  { agencyId: "agency_agadir",     active: 1, confirmed: 1, pending: 2, overdue: 0 },
]

// ---------------------------------------------------------------------------
// FINANCE SUMMARY per agency (for Dashboard KPIs)
// ---------------------------------------------------------------------------

export type AgencyFinanceSummary = {
  agencyId: string
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitabilityRate: number
  revenueDelta: number
  expensesDelta: number
  profitDelta: number
  profitabilityDelta: number
  revenueVsExpenses: { month: string; revenue: number; expenses: number }[]
}

export const agencyFinanceSummaries: AgencyFinanceSummary[] = [
  {
    agencyId: "agency_casablanca",
    totalRevenue: 45200,
    totalExpenses: 18750,
    netProfit: 26450,
    profitabilityRate: 58.5,
    revenueDelta: 12.4,
    expensesDelta: -3.8,
    profitDelta: 18.2,
    profitabilityDelta: 4.6,
    revenueVsExpenses: [
      { month: "Nov", revenue: 32100, expenses: 14200 },
      { month: "Déc", revenue: 35400, expenses: 15100 },
      { month: "Jan", revenue: 38200, expenses: 16300 },
      { month: "Fév", revenue: 36800, expenses: 15800 },
      { month: "Mar", revenue: 41500, expenses: 17400 },
      { month: "Avr", revenue: 45200, expenses: 18750 },
    ],
  },
  {
    agencyId: "agency_marrakech",
    totalRevenue: 68400,
    totalExpenses: 24200,
    netProfit: 44200,
    profitabilityRate: 64.6,
    revenueDelta: 18.2,
    expensesDelta: 2.1,
    profitDelta: 24.8,
    profitabilityDelta: 6.2,
    revenueVsExpenses: [
      { month: "Nov", revenue: 48200, expenses: 18100 },
      { month: "Déc", revenue: 52400, expenses: 19800 },
      { month: "Jan", revenue: 56100, expenses: 21200 },
      { month: "Fév", revenue: 58600, expenses: 20800 },
      { month: "Mar", revenue: 63800, expenses: 22600 },
      { month: "Avr", revenue: 68400, expenses: 24200 },
    ],
  },
  {
    agencyId: "agency_agadir",
    totalRevenue: 21400,
    totalExpenses: 9800,
    netProfit: 11600,
    profitabilityRate: 54.2,
    revenueDelta: 8.6,
    expensesDelta: -1.2,
    profitDelta: 14.1,
    profitabilityDelta: 2.8,
    revenueVsExpenses: [
      { month: "Nov", revenue: 14200, expenses: 7100 },
      { month: "Déc", revenue: 15600, expenses: 7800 },
      { month: "Jan", revenue: 17200, expenses: 8400 },
      { month: "Fév", revenue: 16800, expenses: 8200 },
      { month: "Mar", revenue: 19600, expenses: 9200 },
      { month: "Avr", revenue: 21400, expenses: 9800 },
    ],
  },
]

// ---------------------------------------------------------------------------
// DASHBOARD KPI per agency
// ---------------------------------------------------------------------------

export type AgencyDashboardKpis = {
  agencyId: string
  activeRentals: number
  availableCars: number
  maintenanceCars: number
  outOfServiceCars: number
  totalCars: number
  overdueReturns: number
  expiringDocuments: number
  monthlyRevenue: number
  revenueDelta: number
}

export const agencyDashboardKpis: AgencyDashboardKpis[] = [
  {
    agencyId: "agency_casablanca",
    activeRentals: 2,
    availableCars: 2,
    maintenanceCars: 1,
    outOfServiceCars: 0,
    totalCars: 4,
    overdueReturns: 1,
    expiringDocuments: 2,
    monthlyRevenue: 45200,
    revenueDelta: 12.4,
  },
  {
    agencyId: "agency_marrakech",
    activeRentals: 3,
    availableCars: 2,
    maintenanceCars: 0,
    outOfServiceCars: 1,
    totalCars: 5,
    overdueReturns: 0,
    expiringDocuments: 3,
    monthlyRevenue: 68400,
    revenueDelta: 18.2,
  },
  {
    agencyId: "agency_agadir",
    activeRentals: 1,
    availableCars: 2,
    maintenanceCars: 0,
    outOfServiceCars: 0,
    totalCars: 3,
    overdueReturns: 0,
    expiringDocuments: 2,
    monthlyRevenue: 21400,
    revenueDelta: 8.6,
  },
]

// ---------------------------------------------------------------------------
// The master map — every page reads from this
// ---------------------------------------------------------------------------

export type AgencyDataSlice = {
  cars: Car[]
  clients: Client[]
  reservations: Reservation[]
  contracts: Contract[]
  upcomingCharges: UpcomingCharge[]
  financeSummary: AgencyFinanceSummary
  dashboardKpis: AgencyDashboardKpis
  reservationSummary: AgencyReservationSummary
}

// Derive upcomingCharges from car insurance/vignette/visiteTechnique
function buildUpcomingCharges(cars: Car[], prefix: string): UpcomingCharge[] {
  const charges: UpcomingCharge[] = []
  const today = new Date()
  cars.forEach((c) => {
    const carLabel = `${c.brand} ${c.model}`
    if (c.insurance.daysLeft <= 30) {
      charges.push({
        id: `UC-${prefix}-${c.id}-ins`,
        type: "insurance",
        carLabel,
        plate: c.plate,
        dueDate: c.insurance.endDate,
        daysUntil: c.insurance.daysLeft,
        amount: 4800,
        urgency: c.insurance.daysLeft <= 7 ? "high" : c.insurance.daysLeft <= 14 ? "medium" : "low",
      })
    }
    if (c.vignette.daysLeft <= 30) {
      charges.push({
        id: `UC-${prefix}-${c.id}-vig`,
        type: "vignette",
        carLabel,
        plate: c.plate,
        dueDate: c.vignette.endDate,
        daysUntil: c.vignette.daysLeft,
        amount: 700,
        urgency: c.vignette.daysLeft <= 7 ? "high" : c.vignette.daysLeft <= 14 ? "medium" : "low",
      })
    }
    if (c.visiteTechnique.daysLeft <= 30) {
      charges.push({
        id: `UC-${prefix}-${c.id}-vt`,
        type: "inspection",
        carLabel,
        plate: c.plate,
        dueDate: c.visiteTechnique.nextDate,
        daysUntil: c.visiteTechnique.daysLeft,
        amount: 350,
        urgency: c.visiteTechnique.daysLeft <= 7 ? "high" : c.visiteTechnique.daysLeft <= 14 ? "medium" : "low",
      })
    }
    if (c.creditAuto) {
      charges.push({
        id: `UC-${prefix}-${c.id}-cred`,
        type: "maintenance",
        carLabel,
        plate: c.plate,
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString().split("T")[0],
        daysUntil: 7,
        amount: c.creditAuto.monthlyPayment,
        urgency: "high",
      })
    }
  })
  // Sort by urgency then daysUntil
  const order = { high: 0, medium: 1, low: 2 }
  return charges.sort((a, b) => order[a.urgency] - order[b.urgency] || a.daysUntil - b.daysUntil).slice(0, 7)
}

export const agencyDataMap: Record<string, AgencyDataSlice> = {
  agency_casablanca: {
    cars: casablancaCars,
    clients: casablancaClients,
    reservations: allReservations,
    contracts: allContracts,
    upcomingCharges: buildUpcomingCharges(casablancaCars, "C"),
    financeSummary: agencyFinanceSummaries[0],
    dashboardKpis: agencyDashboardKpis[0],
    reservationSummary: agencyReservationSummaries[0],
  },
  agency_marrakech: {
    cars: marrakechCars,
    clients: marrakechClients,
    reservations: allReservations.slice(0, 5).map((r, i) => ({
      ...r,
      id: `M-${r.id}`,
      code: r.code.replace("RES", "MRK"),
    })),
    contracts: allContracts.slice(0, 4).map((c, i) => ({
      ...c,
      id: `M-${c.id}`,
      code: c.code.replace("LR", "MK"),
    })),
    upcomingCharges: buildUpcomingCharges(marrakechCars, "M"),
    financeSummary: agencyFinanceSummaries[1],
    dashboardKpis: agencyDashboardKpis[1],
    reservationSummary: agencyReservationSummaries[1],
  },
  agency_agadir: {
    cars: agadirCars,
    clients: agadirClients,
    reservations: allReservations.slice(0, 3).map((r, i) => ({
      ...r,
      id: `A-${r.id}`,
      code: r.code.replace("RES", "AGD"),
    })),
    contracts: allContracts.slice(0, 2).map((c, i) => ({
      ...c,
      id: `A-${c.id}`,
      code: c.code.replace("LR", "AG"),
    })),
    upcomingCharges: buildUpcomingCharges(agadirCars, "A"),
    financeSummary: agencyFinanceSummaries[2],
    dashboardKpis: agencyDashboardKpis[2],
    reservationSummary: agencyReservationSummaries[2],
  },
}

export function getAgencyData(agencyId: string): AgencyDataSlice {
  return agencyDataMap[agencyId] ?? agencyDataMap["agency_casablanca"]
}
