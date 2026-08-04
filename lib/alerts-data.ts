export type AlertType = "assurance" | "vignette" | "visite_technique" | "retard" | "paiement" | "maintenance"
export type AlertPriority = "urgent" | "proche" | "info"
export type AlertStatus = "unread" | "read" | "resolved"

export interface Alert {
  id: string
  type: AlertType
  priority: AlertPriority
  status: AlertStatus
  title: string
  carId: string
  carBrand: string
  carModel: string
  plate: string
  daysRemaining?: number
  dueDate?: string
  clientName?: string
  reservationId?: string
  createdAt: string
  updatedAt: string
  description?: string
}

export const alertTypeConfig: Record<AlertType, { label: string; icon: string; color: string }> = {
  assurance: { label: "Assurance", icon: "Shield", color: "text-violet-700 bg-violet-50" },
  vignette: { label: "Vignette", icon: "Sticker", color: "text-blue-700 bg-blue-50" },
  visite_technique: { label: "Visite technique", icon: "FileCheck", color: "text-green-700 bg-green-50" },
  retard: { label: "Retard", icon: "AlertCircle", color: "text-rose-700 bg-rose-50" },
  paiement: { label: "Paiement", icon: "CreditCard", color: "text-amber-700 bg-amber-50" },
  maintenance: { label: "Maintenance", icon: "Wrench", color: "text-orange-700 bg-orange-50" },
}

export const priorityConfig: Record<AlertPriority, { label: string; badgeColor: string; textColor: string; dotColor: string }> = {
  urgent: { label: "Urgent", badgeColor: "bg-rose-100 text-rose-700", textColor: "text-rose-700", dotColor: "bg-rose-500" },
  proche: { label: "Proche", badgeColor: "bg-amber-100 text-amber-700", textColor: "text-amber-700", dotColor: "bg-amber-500" },
  info: { label: "Info", badgeColor: "bg-blue-100 text-blue-700", textColor: "text-blue-700", dotColor: "bg-blue-500" },
}

export const statusConfig: Record<AlertStatus, { label: string; color: string }> = {
  unread: { label: "Non lu", color: "text-slate-600" },
  read: { label: "Lu", color: "text-slate-500" },
  resolved: { label: "Résolu", color: "text-slate-400 line-through" },
}

export const alerts: Alert[] = [
  {
    id: "a1",
    type: "assurance",
    priority: "urgent",
    status: "unread",
    title: "Assurance expire le 15/06/2026",
    carId: "car1",
    carBrand: "Dacia",
    carModel: "Logan",
    plate: "12345-A-1",
    daysRemaining: 6,
    dueDate: "2026-06-15",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "Renouvellement d'assurance automobile requise immédiatement.",
  },
  {
    id: "a2",
    type: "vignette",
    priority: "urgent",
    status: "unread",
    title: "Vignette autoroutière expire",
    carId: "car2",
    carBrand: "Renault",
    carModel: "Clio",
    plate: "54321-B-2",
    daysRemaining: 3,
    dueDate: "2026-06-12",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "La vignette pour accès autoroute expire dans 3 jours.",
  },
  {
    id: "a3",
    type: "visite_technique",
    priority: "proche",
    status: "read",
    title: "Visite technique programmée",
    carId: "car3",
    carBrand: "Peugeot",
    carModel: "208",
    plate: "98765-C-3",
    daysRemaining: 12,
    dueDate: "2026-06-21",
    createdAt: "2026-06-07",
    updatedAt: "2026-06-08",
    description: "Visite technique annuelle à effectuer avant le 21 juin.",
  },
  {
    id: "a4",
    type: "retard",
    priority: "urgent",
    status: "unread",
    title: "Voiture non rendue — Ahmed Benali",
    carId: "car4",
    carBrand: "Toyota",
    carModel: "RAV4",
    plate: "11111-D-4",
    daysRemaining: -1,
    dueDate: "2026-06-08",
    clientName: "Ahmed Benali",
    reservationId: "res123",
    createdAt: "2026-06-08",
    updatedAt: "2026-06-09",
    description: "Retard de retour de 24 heures. Contacter immédiatement le client.",
  },
  {
    id: "a5",
    type: "paiement",
    priority: "proche",
    status: "unread",
    title: "Paiement en attente — Fatima Mansouri",
    carId: "car5",
    carBrand: "Hyundai",
    carModel: "Tucson",
    plate: "22222-E-5",
    daysRemaining: 5,
    dueDate: "2026-06-14",
    clientName: "Fatima Mansouri",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "Paiement de 2,400 DH pour location du 08-09 juin.",
  },
  {
    id: "a6",
    type: "maintenance",
    priority: "proche",
    status: "read",
    title: "Entretien programmé",
    carId: "car1",
    carBrand: "Dacia",
    carModel: "Logan",
    plate: "12345-A-1",
    daysRemaining: 18,
    dueDate: "2026-06-27",
    createdAt: "2026-06-08",
    updatedAt: "2026-06-08",
    description: "Révision d'huile et filtres à effectuer d'ici le 27 juin.",
  },
  {
    id: "a7",
    type: "assurance",
    priority: "proche",
    status: "unread",
    title: "Assurance Dacia Duster expire",
    carId: "car6",
    carBrand: "Dacia",
    carModel: "Duster",
    plate: "33333-F-6",
    daysRemaining: 22,
    dueDate: "2026-07-01",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "Renouvellement d'assurance prévu pour le 01 juillet.",
  },
  {
    id: "a8",
    type: "vignette",
    priority: "info",
    status: "read",
    title: "Renouvellement vignette confirmé",
    carId: "car7",
    carBrand: "Mercedes",
    carModel: "Classe E",
    plate: "44444-G-7",
    daysRemaining: 45,
    dueDate: "2026-07-24",
    createdAt: "2026-06-04",
    updatedAt: "2026-06-06",
    description: "Vignette 2026 renouvelée avec succès.",
  },
  {
    id: "a9",
    type: "retard",
    priority: "proche",
    status: "unread",
    title: "Retour programmé bientôt",
    carId: "car8",
    carBrand: "Kia",
    carModel: "Sportage",
    plate: "55555-H-8",
    daysRemaining: 1,
    dueDate: "2026-06-10",
    clientName: "Mohammed Hassan",
    reservationId: "res124",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "Voiture devrait être rendue demain à 18h00.",
  },
  {
    id: "a10",
    type: "maintenance",
    priority: "info",
    status: "resolved",
    title: "Service complété",
    carId: "car9",
    carBrand: "Volkswagen",
    carModel: "Polo",
    plate: "66666-I-9",
    daysRemaining: 0,
    dueDate: "2026-06-08",
    createdAt: "2026-06-08",
    updatedAt: "2026-06-09",
    description: "Service d'entretien complété avec succès.",
  },
  {
    id: "a11",
    type: "paiement",
    priority: "urgent",
    status: "unread",
    title: "Paiement dépassé",
    carId: "car10",
    carBrand: "Nissan",
    carModel: "Qashqai",
    plate: "77777-J-10",
    daysRemaining: -5,
    dueDate: "2026-06-04",
    clientName: "Leila Aziz",
    createdAt: "2026-06-04",
    updatedAt: "2026-06-09",
    description: "Paiement de 1,800 DH en retard depuis 5 jours.",
  },
  {
    id: "a12",
    type: "visite_technique",
    priority: "info",
    status: "read",
    title: "Visite confirmée",
    carId: "car11",
    carBrand: "Citroën",
    carModel: "C3",
    plate: "88888-K-11",
    daysRemaining: 20,
    dueDate: "2026-06-29",
    createdAt: "2026-06-05",
    updatedAt: "2026-06-06",
    description: "Visite technique programmée pour le 29 juin à 09h00.",
  },
  {
    id: "a13",
    type: "assurance",
    priority: "info",
    status: "unread",
    title: "Assurance en cours",
    carId: "car12",
    carBrand: "Fiat",
    carModel: "500",
    plate: "99999-L-12",
    daysRemaining: 60,
    dueDate: "2026-08-08",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "Assurance valide jusqu'au 08 août 2026.",
  },
  {
    id: "a14",
    type: "retard",
    priority: "info",
    status: "read",
    title: "Retour validé",
    carId: "car13",
    carBrand: "BMW",
    carModel: "X3",
    plate: "00000-M-13",
    daysRemaining: 0,
    dueDate: "2026-06-07",
    clientName: "Karim Bouali",
    reservationId: "res125",
    createdAt: "2026-06-07",
    updatedAt: "2026-06-07",
    description: "Voiture retournée à l'heure le 07 juin.",
  },
  {
    id: "a15",
    type: "maintenance",
    priority: "urgent",
    status: "unread",
    title: "Remplacement pneu urgent",
    carId: "car14",
    carBrand: "Audi",
    carModel: "A4",
    plate: "11111-N-14",
    daysRemaining: 0,
    dueDate: "2026-06-09",
    createdAt: "2026-06-09",
    updatedAt: "2026-06-09",
    description: "Pneu endommagé détecté. Remplacement à effectuer immédiatement.",
  },
]

export function getAlertsByPriority(alerts: Alert[]): Record<AlertPriority, Alert[]> {
  return {
    urgent: alerts.filter((a) => a.priority === "urgent"),
    proche: alerts.filter((a) => a.priority === "proche"),
    info: alerts.filter((a) => a.priority === "info"),
  }
}

export function getAlertsByType(alerts: Alert[]): Record<AlertType, Alert[]> {
  const result: Record<AlertType, Alert[]> = {
    assurance: [],
    vignette: [],
    visite_technique: [],
    retard: [],
    paiement: [],
    maintenance: [],
  }
  alerts.forEach((a) => {
    result[a.type].push(a)
  })
  return result
}

export function countAlertsByPriority(alerts: Alert[]): Record<AlertPriority, number> {
  return {
    urgent: alerts.filter((a) => a.priority === "urgent").length,
    proche: alerts.filter((a) => a.priority === "proche").length,
    info: alerts.filter((a) => a.priority === "info").length,
  }
}

export function getUnreadCount(alerts: Alert[]): number {
  return alerts.filter((a) => a.status === "unread").length
}
