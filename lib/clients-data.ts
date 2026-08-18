export type Nationality = "Marocain" | "Français" | "Espagnol" | "Anglais" | "Allemand"
export type ClientStatus = "actif" | "blacklist" | "inactif"
export type ClientTier = "vip" | "regular" | "new"
export type ClientType = "individual" | "company"

export type Reservation = {
  id: string
  carBrand: string
  carModel: string
  plate: string
  startDate: string // ISO
  endDate: string // ISO
  amount: number
  status: "completed" | "active" | "cancelled" | "upcoming"
}

export type ClientNote = {
  id: string
  date: string // ISO
  author: string
  body: string
}

export type ClientFinance = {
  currency: string
  invoiced: number
  paid: number
  outstanding: number
  depositsHeld: number
}

export type Client = {
  id: string
  type: ClientType
  // Individual or Company name
  fullName: string
  phone: string
  email: string
  city: string
  nationality: Nationality
  status: ClientStatus
  tier: ClientTier
  // Individual fields
  idType?: "CIN" | "Passeport"
  idNumber?: string
  idExpiry?: string // ISO
  idScanned?: boolean
  // License
  licenseNumber?: string
  licenseExpiry?: string // ISO
  licenseCategory?: string
  licenseScanned?: boolean
  // Company fields
  companyName?: string
  registrationNumber?: string // ICE
  taxId?: string
  companyEmail?: string
  companyPhone?: string
  contactPersonName?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
  // Activity
  totalRentals: number
  totalSpent: number
  lastRentalDate: string // ISO
  favoriteCar?: string
  monthly: number[] // last 6 months spend
  finance?: ClientFinance
  // Lifecycle
  createdAt: string // ISO
  blacklistReason?: string
  // History
  reservations: Reservation[]
  notes: ClientNote[]
}

const ID_MASK = (s: string) =>
  s.length <= 5 ? s : `${s.slice(0, 2)}${"*".repeat(s.length - 5)}${s.slice(-3)}`

export const maskId = ID_MASK

export const nationalityFlag: Record<Nationality, string> = {
  Marocain: "MA",
  Français: "FR",
  Espagnol: "ES",
  Anglais: "GB",
  Allemand: "DE",
}

export const statusConfig: Record<
  ClientStatus,
  { label: string; dotClass: string; pillClass: string; textClass: string }
> = {
  actif: {
    label: "Actif",
    dotClass: "bg-emerald-500",
    pillClass: "border-emerald-200 bg-emerald-50",
    textClass: "text-emerald-700",
  },
  inactif: {
    label: "Inactif",
    dotClass: "bg-slate-400",
    pillClass: "border-slate-200 bg-slate-50",
    textClass: "text-slate-600",
  },
  blacklist: {
    label: "Blacklisté",
    dotClass: "bg-rose-500",
    pillClass: "border-rose-200 bg-rose-50",
    textClass: "text-rose-700",
  },
}

export const tierConfig: Record<
  ClientTier,
  { label: string; pillClass: string; textClass: string }
> = {
  vip: {
    label: "VIP",
    pillClass: "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50",
    textClass: "text-amber-700",
  },
  regular: {
    label: "Régulier",
    pillClass: "border-indigo-200 bg-indigo-50",
    textClass: "text-indigo-700",
  },
  new: {
    label: "Nouveau",
    pillClass: "border-sky-200 bg-sky-50",
    textClass: "text-sky-700",
  },
}

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

export const avatarGradient = (id: string) => {
  const gradients = [
    "from-indigo-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-sky-600",
  ]
  const idx = id.charCodeAt(0) % gradients.length
  return gradients[idx]
}

export const formatMAD = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " DH"

export const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export const formatRelative = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return "Aujourd’hui"
  if (diff === 1) return "Hier"
  if (diff < 7) return `Il y a ${diff} jours`
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`
  if (diff < 365) return `Il y a ${Math.floor(diff / 30)} mois`
  return `Il y a ${Math.floor(diff / 365)} an${diff > 730 ? "s" : ""}`
}

// 15 realistic mock clients
export const clients: Client[] = [
  {
    id: "c1",
    type: "individual",
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
    favoriteCar: "Range Rover Evoque",
    monthly: [12500, 18000, 22000, 15800, 28000, 24500],
    createdAt: "2023-02-14",
    reservations: [
      {
        id: "r1",
        carBrand: "Range Rover",
        carModel: "Evoque",
        plate: "12345-A-1",
        startDate: "2026-05-08",
        endDate: "2026-05-12",
        amount: 7600,
        status: "completed",
      },
      {
        id: "r2",
        carBrand: "BMW",
        carModel: "Série 3",
        plate: "44521-B-6",
        startDate: "2026-04-22",
        endDate: "2026-04-28",
        amount: 8400,
        status: "completed",
      },
      {
        id: "r3",
        carBrand: "Mercedes",
        carModel: "Classe C",
        plate: "98712-A-7",
        startDate: "2026-03-15",
        endDate: "2026-03-19",
        amount: 6800,
        status: "completed",
      },
      {
        id: "r4",
        carBrand: "Range Rover",
        carModel: "Evoque",
        plate: "12345-A-1",
        startDate: "2026-02-10",
        endDate: "2026-02-17",
        amount: 12200,
        status: "completed",
      },
    ],
    notes: [
      {
        id: "n1",
        date: "2026-05-09",
        author: "Karim",
        body: "Client fidèle. Toujours rendu propre, paiement comptant. Très flexible sur les horaires.",
      },
      {
        id: "n2",
        date: "2026-04-20",
        author: "Sara",
        body: "Préfère les SUV haut de gamme. Prévoir Evoque ou X3 en priorité.",
      },
    ],
  },
  {
    id: "c2",
    type: "individual",
    fullName: "Fatima Zahra El Idrissi",
    phone: "+212 678 912 345",
    email: "fz.elidrissi@outlook.com",
    city: "Rabat",
    nationality: "Marocain",
    status: "actif",
    tier: "regular",
    idType: "CIN",
    idNumber: "AB728193",
    idExpiry: "2026-11-22",
    idScanned: true,
    licenseNumber: "07/82193/RB",
    licenseExpiry: "2025-12-01",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 12,
    totalSpent: 38400,
    lastRentalDate: "2026-04-29",
    favoriteCar: "Dacia Logan",
    monthly: [3200, 4500, 5800, 0, 6200, 4800],
    createdAt: "2024-01-08",
    reservations: [
      {
        id: "r5",
        carBrand: "Dacia",
        carModel: "Logan",
        plate: "67821-D-4",
        startDate: "2026-04-29",
        endDate: "2026-05-03",
        amount: 1400,
        status: "completed",
      },
      {
        id: "r6",
        carBrand: "Renault",
        carModel: "Clio",
        plate: "33214-C-2",
        startDate: "2026-03-12",
        endDate: "2026-03-15",
        amount: 1050,
        status: "completed",
      },
    ],
    notes: [],
  },
  {
    id: "c3",
    type: "individual",
    fullName: "Jean-Pierre Moreau",
    phone: "+33 6 12 34 56 78",
    email: "jp.moreau@gmail.com",
    city: "Marrakech",
    nationality: "Français",
    status: "actif",
    tier: "vip",
    idType: "Passeport",
    idNumber: "20FH48291",
    idExpiry: "2030-03-18",
    idScanned: true,
    licenseNumber: "F-2018-489271",
    licenseExpiry: "2028-06-30",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 18,
    totalSpent: 142000,
    lastRentalDate: "2026-05-02",
    favoriteCar: "Mercedes Classe E",
    monthly: [0, 15000, 22000, 18000, 32000, 28000],
    createdAt: "2023-06-21",
    reservations: [
      {
        id: "r7",
        carBrand: "Mercedes",
        carModel: "Classe E",
        plate: "55103-A-9",
        startDate: "2026-05-02",
        endDate: "2026-05-15",
        amount: 26000,
        status: "completed",
      },
      {
        id: "r8",
        carBrand: "Audi",
        carModel: "A4",
        plate: "77284-B-3",
        startDate: "2025-12-18",
        endDate: "2026-01-04",
        amount: 32000,
        status: "completed",
      },
    ],
    notes: [
      {
        id: "n3",
        date: "2026-05-03",
        author: "Karim",
        body: "Touriste régulier. Vient 3-4 fois par an. Demande chauffeur disponible.",
      },
    ],
  },
  {
    id: "c4",
    type: "individual",
    fullName: "Youssef Tazi",
    phone: "+212 612 887 421",
    email: "y.tazi@hotmail.com",
    city: "Tanger",
    nationality: "Marocain",
    status: "blacklist",
    tier: "regular",
    idType: "CIN",
    idNumber: "TG992174",
    idExpiry: "2027-02-08",
    idScanned: true,
    licenseNumber: "11/92174/TG",
    licenseExpiry: "2026-07-15",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 7,
    totalSpent: 18900,
    lastRentalDate: "2025-11-12",
    favoriteCar: "Hyundai Tucson",
    monthly: [0, 0, 0, 0, 0, 0],
    createdAt: "2024-05-30",
    blacklistReason:
      "Retour véhicule avec dégâts non déclarés. Caution conservée. Refuse de répondre aux relances.",
    reservations: [
      {
        id: "r9",
        carBrand: "Hyundai",
        carModel: "Tucson",
        plate: "88420-D-1",
        startDate: "2025-11-08",
        endDate: "2025-11-12",
        amount: 3200,
        status: "completed",
      },
    ],
    notes: [
      {
        id: "n4",
        date: "2025-11-14",
        author: "Karim",
        body: "Véhicule rendu avec rayures importantes côté gauche. Photos conservées au dossier.",
      },
    ],
  },
  {
    id: "c5",
    type: "individual",
    fullName: "Carlos García Fernández",
    phone: "+34 612 345 678",
    email: "carlos.garcia@gmail.com",
    city: "Casablanca",
    nationality: "Espagnol",
    status: "actif",
    tier: "regular",
    idType: "Passeport",
    idNumber: "ES7421589",
    idExpiry: "2029-08-22",
    idScanned: true,
    licenseNumber: "ES-B-748921",
    licenseExpiry: "2027-04-10",
    licenseCategory: "B",
    licenseScanned: false,
    totalRentals: 9,
    totalSpent: 54600,
    lastRentalDate: "2026-04-15",
    favoriteCar: "Volkswagen Tiguan",
    monthly: [8000, 0, 9500, 12000, 14000, 11100],
    createdAt: "2024-08-12",
    reservations: [
      {
        id: "r10",
        carBrand: "Volkswagen",
        carModel: "Tiguan",
        plate: "23981-B-5",
        startDate: "2026-04-15",
        endDate: "2026-04-22",
        amount: 5600,
        status: "completed",
      },
    ],
    notes: [],
  },
  {
    id: "c6",
    type: "individual",
    fullName: "Khadija Amrani",
    phone: "+212 698 451 230",
    email: "k.amrani@yahoo.fr",
    city: "Agadir",
    nationality: "Marocain",
    status: "actif",
    tier: "vip",
    idType: "CIN",
    idNumber: "AG557891",
    idExpiry: "2028-09-30",
    idScanned: true,
    licenseNumber: "15/57891/AG",
    licenseExpiry: "2029-01-22",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 21,
    totalSpent: 127800,
    lastRentalDate: "2026-05-10",
    favoriteCar: "Audi Q5",
    monthly: [18000, 22000, 15000, 19000, 26000, 21000],
    createdAt: "2023-04-18",
    reservations: [
      {
        id: "r11",
        carBrand: "Audi",
        carModel: "Q5",
        plate: "44210-A-8",
        startDate: "2026-05-10",
        endDate: "2026-05-14",
        amount: 8400,
        status: "active",
      },
    ],
    notes: [
      {
        id: "n5",
        date: "2026-05-11",
        author: "Sara",
        body: "Femme d'affaires. Très exigeante sur la propreté et le délai. Toujours impeccable.",
      },
    ],
  },
  {
    id: "c7",
    type: "individual",
    fullName: "Mohammed Bennani",
    phone: "+212 663 778 102",
    email: "m.bennani@gmail.com",
    city: "Fès",
    nationality: "Marocain",
    status: "inactif",
    tier: "regular",
    idType: "CIN",
    idNumber: "FS774102",
    idExpiry: "2026-05-20",
    idScanned: true,
    licenseNumber: "13/74102/FS",
    licenseExpiry: "2025-08-10",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 4,
    totalSpent: 8600,
    lastRentalDate: "2025-08-22",
    favoriteCar: "Renault Clio",
    monthly: [0, 0, 0, 0, 0, 0],
    createdAt: "2024-03-11",
    reservations: [
      {
        id: "r12",
        carBrand: "Renault",
        carModel: "Clio",
        plate: "33214-C-2",
        startDate: "2025-08-18",
        endDate: "2025-08-22",
        amount: 1400,
        status: "completed",
      },
    ],
    notes: [],
  },
  {
    id: "c8",
    type: "individual",
    fullName: "Sophie Dubois",
    phone: "+33 7 89 12 34 56",
    email: "sophie.dubois@orange.fr",
    city: "Essaouira",
    nationality: "Français",
    status: "actif",
    tier: "new",
    idType: "Passeport",
    idNumber: "21FK74829",
    idExpiry: "2031-02-14",
    idScanned: true,
    licenseNumber: "F-2020-748293",
    licenseExpiry: "2030-09-05",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 2,
    totalSpent: 6800,
    lastRentalDate: "2026-05-05",
    favoriteCar: "Peugeot 208",
    monthly: [0, 0, 0, 0, 2800, 4000],
    createdAt: "2026-04-02",
    reservations: [
      {
        id: "r13",
        carBrand: "Peugeot",
        carModel: "208",
        plate: "67214-D-1",
        startDate: "2026-05-05",
        endDate: "2026-05-09",
        amount: 1800,
        status: "completed",
      },
    ],
    notes: [
      {
        id: "n6",
        date: "2026-05-06",
        author: "Karim",
        body: "Nouveau client, première location réussie. Très souriante, paiement par carte.",
      },
    ],
  },
  {
    id: "c9",
    type: "individual",
    fullName: "Rachid El Fassi",
    phone: "+212 671 224 998",
    email: "r.elfassi@gmail.com",
    city: "Marrakech",
    nationality: "Marocain",
    status: "actif",
    tier: "vip",
    idType: "CIN",
    idNumber: "MR889102",
    idExpiry: "2029-11-12",
    idScanned: true,
    licenseNumber: "06/89102/MR",
    licenseExpiry: "2028-03-18",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 33,
    totalSpent: 246800,
    lastRentalDate: "2026-05-11",
    favoriteCar: "BMW X5",
    monthly: [22000, 28000, 35000, 30000, 38000, 41000],
    createdAt: "2022-09-04",
    reservations: [
      {
        id: "r14",
        carBrand: "BMW",
        carModel: "X5",
        plate: "55102-A-3",
        startDate: "2026-05-11",
        endDate: "2026-05-18",
        amount: 18900,
        status: "active",
      },
    ],
    notes: [
      {
        id: "n7",
        date: "2026-05-11",
        author: "Sara",
        body: "Plus gros client. Toujours premium, jamais de problème. Anniversaire en juin — penser carte.",
      },
    ],
  },
  {
    id: "c10",
    type: "individual",
    fullName: "Hans Schmidt",
    phone: "+49 151 234 56789",
    email: "hans.schmidt@gmail.com",
    city: "Marrakech",
    nationality: "Allemand",
    status: "actif",
    tier: "regular",
    idType: "Passeport",
    idNumber: "DE9920184",
    idExpiry: "2028-07-19",
    idScanned: true,
    licenseNumber: "DE-748921-B",
    licenseExpiry: "2029-11-30",
    licenseCategory: "B",
    licenseScanned: false,
    totalRentals: 6,
    totalSpent: 42300,
    lastRentalDate: "2026-03-28",
    favoriteCar: "Volkswagen Touareg",
    monthly: [0, 12000, 0, 0, 18000, 12300],
    createdAt: "2024-11-22",
    reservations: [
      {
        id: "r15",
        carBrand: "Volkswagen",
        carModel: "Touareg",
        plate: "77882-D-2",
        startDate: "2026-03-22",
        endDate: "2026-03-28",
        amount: 7200,
        status: "completed",
      },
    ],
    notes: [],
  },
  {
    id: "c11",
    type: "individual",
    fullName: "Salma Benkirane",
    phone: "+212 655 991 472",
    email: "s.benkirane@gmail.com",
    city: "Casablanca",
    nationality: "Marocain",
    status: "actif",
    tier: "new",
    idType: "CIN",
    idNumber: "CS101472",
    idExpiry: "2027-06-15",
    idScanned: true,
    licenseNumber: "01/01472/CS",
    licenseExpiry: "2026-12-20",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 1,
    totalSpent: 1800,
    lastRentalDate: "2026-05-12",
    favoriteCar: "Dacia Sandero",
    monthly: [0, 0, 0, 0, 0, 1800],
    createdAt: "2026-05-10",
    reservations: [
      {
        id: "r16",
        carBrand: "Dacia",
        carModel: "Sandero",
        plate: "33781-D-5",
        startDate: "2026-05-12",
        endDate: "2026-05-15",
        amount: 1800,
        status: "upcoming",
      },
    ],
    notes: [],
  },
  {
    id: "c12",
    type: "individual",
    fullName: "James Wilson",
    phone: "+44 7700 900123",
    email: "j.wilson@gmail.com",
    city: "Marrakech",
    nationality: "Anglais",
    status: "actif",
    tier: "regular",
    idType: "Passeport",
    idNumber: "GB7741289",
    idExpiry: "2030-05-08",
    idScanned: true,
    licenseNumber: "WILSO748921",
    licenseExpiry: "2031-02-14",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 8,
    totalSpent: 62400,
    lastRentalDate: "2026-04-20",
    favoriteCar: "Range Rover Velar",
    monthly: [10000, 0, 12000, 14000, 16000, 10400],
    createdAt: "2024-02-17",
    reservations: [
      {
        id: "r17",
        carBrand: "Range Rover",
        carModel: "Velar",
        plate: "12891-A-2",
        startDate: "2026-04-14",
        endDate: "2026-04-20",
        amount: 14400,
        status: "completed",
      },
    ],
    notes: [],
  },
  {
    id: "c13",
    type: "individual",
    fullName: "Hicham Naciri",
    phone: "+212 622 117 894",
    email: "h.naciri@hotmail.com",
    city: "Rabat",
    nationality: "Marocain",
    status: "blacklist",
    tier: "regular",
    idType: "CIN",
    idNumber: "RB117894",
    idExpiry: "2027-08-25",
    idScanned: true,
    licenseNumber: "08/17894/RB",
    licenseExpiry: "2026-04-30",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 3,
    totalSpent: 9800,
    lastRentalDate: "2025-07-08",
    favoriteCar: "Renault Clio",
    monthly: [0, 0, 0, 0, 0, 0],
    createdAt: "2024-09-19",
    blacklistReason: "Plusieurs retards de retour non justifiés. Solde impayé de 2 400 DH.",
    reservations: [
      {
        id: "r18",
        carBrand: "Renault",
        carModel: "Clio",
        plate: "33214-C-2",
        startDate: "2025-07-02",
        endDate: "2025-07-05",
        amount: 1050,
        status: "completed",
      },
    ],
    notes: [
      {
        id: "n8",
        date: "2025-07-10",
        author: "Karim",
        body: "Retard de 3 jours sans prévenir. Refus de payer les frais supplémentaires.",
      },
    ],
  },
  {
    id: "c14",
    type: "individual",
    fullName: "Lina Berrada",
    phone: "+212 699 482 113",
    email: "l.berrada@gmail.com",
    city: "Casablanca",
    nationality: "Marocain",
    status: "actif",
    tier: "regular",
    idType: "CIN",
    idNumber: "CS228113",
    idExpiry: "2028-02-08",
    idScanned: true,
    licenseNumber: "02/28113/CS",
    licenseExpiry: "2027-11-15",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 11,
    totalSpent: 41200,
    lastRentalDate: "2026-04-25",
    favoriteCar: "Hyundai i20",
    monthly: [4500, 0, 6800, 5200, 8000, 0],
    createdAt: "2024-06-04",
    reservations: [
      {
        id: "r19",
        carBrand: "Hyundai",
        carModel: "i20",
        plate: "66482-D-3",
        startDate: "2026-04-20",
        endDate: "2026-04-25",
        amount: 2750,
        status: "completed",
      },
    ],
    notes: [],
  },
  {
    id: "c15",
    type: "individual",
    fullName: "Marie Lefèvre",
    phone: "+33 6 78 91 23 45",
    email: "marie.lefevre@gmail.com",
    city: "Agadir",
    nationality: "Français",
    status: "inactif",
    tier: "regular",
    idType: "Passeport",
    idNumber: "FR8821094",
    idExpiry: "2029-10-12",
    idScanned: true,
    licenseNumber: "F-2017-882109",
    licenseExpiry: "2027-05-18",
    licenseCategory: "B",
    licenseScanned: true,
    totalRentals: 5,
    totalSpent: 22400,
    lastRentalDate: "2025-09-14",
    favoriteCar: "Peugeot 3008",
    monthly: [0, 0, 0, 0, 0, 0],
    createdAt: "2024-04-28",
    reservations: [
      {
        id: "r20",
        carBrand: "Peugeot",
        carModel: "3008",
        plate: "44109-B-7",
        startDate: "2025-09-08",
        endDate: "2025-09-14",
        amount: 4800,
        status: "completed",
      },
    ],
    notes: [],
  },
]
