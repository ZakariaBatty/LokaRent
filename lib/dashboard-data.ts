export type NavItem = {
  label: string
  href: string
  icon: string
  badge?: string | number
}

export const navItems: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Flotte", href: "/fleet", icon: "Car" },
  { label: "Réservations", href: "/reservations", icon: "CalendarCheck", badge: 5 },
  { label: "Calendrier", href: "/calendar", icon: "CalendarDays" },
  { label: "Clients", href: "/clients", icon: "Users" },
  { label: "Chauffeurs", href: "/drivers", icon: "CarFront" },
  { label: "Contrats", href: "/contracts", icon: "FileText" },
  { label: "Finances", href: "/finances", icon: "Wallet" },
  { label: "Factures", href: "/invoices", icon: "Receipt" },
  { label: "Communication", href: "/communication", icon: "MessageCircle" },
  { label: "Alertes", href: "/alerts", icon: "Bell", badge: 4 },
  { label: "Rapports", href: "/reports", icon: "BarChart3" },
]

export const secondaryNav: NavItem[] = [
  { label: "Workspace", href: "/workspace", icon: "Building2" },
  { label: "Paramètres", href: "/settings", icon: "Settings" },
  { label: "Aide & support", href: "/help", icon: "LifeBuoy" },
]

export const kpis = [
  {
    id: "available",
    label: "Voitures disponibles",
    value: 8,
    suffix: " / 14",
    delta: "+2",
    deltaLabel: "vs hier",
    trend: "up" as const,
    icon: "Car",
    accent: "blue" as const,
    spark: [10, 9, 11, 8, 10, 7, 8],
  },
  {
    id: "active",
    label: "Locations actives",
    value: 5,
    delta: "+1",
    deltaLabel: "vs hier",
    trend: "up" as const,
    icon: "KeyRound",
    accent: "violet" as const,
    spark: [3, 4, 4, 5, 4, 5, 5],
  },
  {
    id: "revenue",
    label: "CA du mois",
    value: 24500,
    suffix: " DH",
    delta: "+12.4%",
    deltaLabel: "vs mois dernier",
    trend: "up" as const,
    icon: "TrendingUp",
    accent: "emerald" as const,
    spark: [12, 14, 13, 18, 17, 21, 24],
  },
  {
    id: "returns",
    label: "Retours aujourd'hui",
    value: 2,
    delta: "À surveiller",
    deltaLabel: "",
    trend: "neutral" as const,
    icon: "RotateCcw",
    accent: "amber" as const,
    spark: [1, 0, 2, 1, 3, 2, 2],
  },
]

export const revenueData = [
  { month: "Jan", value: 18200 },
  { month: "Fév", value: 19800 },
  { month: "Mar", value: 17500 },
  { month: "Avr", value: 21300 },
  { month: "Mai", value: 22800 },
  { month: "Juin", value: 24500 },
]

export const fleetStatus = [
  { name: "Disponible", value: 8, color: "#10b981" },
  { name: "Louée", value: 5, color: "#3b82f6" },
  { name: "Maintenance", value: 1, color: "#f59e0b" },
]

export const activeRentals = [
  {
    id: "L-1042",
    client: "Ahmed Benali",
    avatar: "AB",
    vehicle: "Dacia Logan",
    plate: "12345-A-1",
    start: "12 Mai",
    end: "18 Mai",
    amount: "1 200 DH",
    status: "En cours",
  },
  {
    id: "L-1041",
    client: "Sara El Mansouri",
    avatar: "SM",
    vehicle: "Renault Clio",
    plate: "87654-B-3",
    start: "10 Mai",
    end: "15 Mai",
    amount: "950 DH",
    status: "En cours",
  },
  {
    id: "L-1040",
    client: "Karim Ouazzani",
    avatar: "KO",
    vehicle: "Hyundai i10",
    plate: "23456-C-2",
    start: "09 Mai",
    end: "20 Mai",
    amount: "1 650 DH",
    status: "En cours",
  },
  {
    id: "L-1039",
    client: "Leila Cherkaoui",
    avatar: "LC",
    vehicle: "Peugeot 208",
    plate: "34567-D-5",
    start: "08 Mai",
    end: "14 Mai",
    amount: "1 080 DH",
    status: "En cours",
  },
  {
    id: "L-1038",
    client: "Youssef Tazi",
    avatar: "YT",
    vehicle: "Range Rover Evoque",
    plate: "45678-E-1",
    start: "07 Mai",
    end: "17 Mai",
    amount: "8 500 DH",
    status: "En cours",
  },
]

export const upcomingReturns = [
  {
    id: "R-203",
    vehicle: "Dacia Logan",
    plate: "12345-A-1",
    client: "Ahmed Benali",
    time: "Aujourd'hui · 17:30",
    soon: true,
  },
  {
    id: "R-204",
    vehicle: "Renault Clio",
    plate: "87654-B-3",
    client: "Sara El Mansouri",
    time: "Aujourd'hui · 19:00",
    soon: true,
  },
  {
    id: "R-205",
    vehicle: "Peugeot 208",
    plate: "34567-D-5",
    client: "Leila Cherkaoui",
    time: "Demain · 10:00",
    soon: false,
  },
  {
    id: "R-206",
    vehicle: "Hyundai i10",
    plate: "23456-C-2",
    client: "Karim Ouazzani",
    time: "Demain · 16:30",
    soon: false,
  },
]

export const topCars = [
  {
    name: "Dacia Logan",
    plate: "12345-A-1",
    revenue: "8 400 DH",
    occupancy: 92,
    trend: "+8%",
  },
  {
    name: "Renault Clio",
    plate: "87654-B-3",
    revenue: "7 250 DH",
    occupancy: 84,
    trend: "+5%",
  },
  {
    name: "Hyundai i10",
    plate: "23456-C-2",
    revenue: "5 980 DH",
    occupancy: 76,
    trend: "+3%",
  },
]

export const topClients = [
  {
    name: "Ahmed Benali",
    initials: "AB",
    rentals: 12,
    spent: "18 400 DH",
    loyalty: "Gold",
  },
  {
    name: "Sara El Mansouri",
    initials: "SM",
    rentals: 9,
    spent: "12 850 DH",
    loyalty: "Silver",
  },
  {
    name: "Youssef Tazi",
    initials: "YT",
    rentals: 7,
    spent: "11 200 DH",
    loyalty: "Silver",
  },
]
