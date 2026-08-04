export type BillingCycle = 'monthly' | 'six-months' | 'annual'

export type PlanFeature = {
  text: string
  included: boolean
}

export type Plan = {
  id: 'starter' | 'pro' | 'business'
  name: string
  tagline: string
  monthlyPrice: number
  badge?: string
  popular?: boolean
  features: PlanFeature[]
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Idéal pour démarrer votre activité de location',
    monthlyPrice: 299,
    badge: 'Essentiel',
    features: [
      { text: "Jusqu'à 10 véhicules", included: true },
      { text: '1 utilisateur', included: true },
      { text: 'Gestion des réservations', included: true },
      { text: 'Fichier clients & contrats', included: true },
      { text: 'Alertes documents (assurance, visite)', included: true },
      { text: 'Notifications WhatsApp', included: false },
      { text: 'Rapports financiers avancés', included: false },
      { text: 'Accès API & base isolée', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: "La solution la plus choisie par les agences en croissance",
    monthlyPrice: 599,
    badge: 'Populaire',
    popular: true,
    features: [
      { text: "Jusqu'à 50 véhicules", included: true },
      { text: "Jusqu'à 5 utilisateurs", included: true },
      { text: 'Gestion complète des réservations', included: true },
      { text: 'Fichier clients & contrats', included: true },
      { text: 'Notifications WhatsApp automatiques', included: true },
      { text: 'Rapports financiers par véhicule', included: true },
      { text: 'Tableau de bord des alertes', included: true },
      { text: 'Accès API & base isolée', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Pour les flottes professionnelles et multi-agences',
    monthlyPrice: 999,
    badge: 'Entreprise',
    features: [
      { text: 'Véhicules illimités', included: true },
      { text: 'Utilisateurs illimités', included: true },
      { text: 'Toutes les fonctionnalités Pro', included: true },
      { text: 'Base de données isolée dédiée', included: true },
      { text: 'Accès API complet', included: true },
      { text: 'Support prioritaire 24/7', included: true },
      { text: 'Onboarding personnalisé', included: true },
      { text: 'SLA garanti 99.9 %', included: true },
    ],
  },
]

export const BILLING_OPTIONS: {
  id: BillingCycle
  label: string
  discount: number
  badge?: string
}[] = [
  { id: 'monthly', label: 'Mensuel', discount: 0 },
  { id: 'six-months', label: '6 Mois', discount: 0.15, badge: '-15%' },
  { id: 'annual', label: 'Annuel', discount: 0.35, badge: 'Meilleure offre' },
]

export function getDiscountedMonthlyPrice(base: number, cycle: BillingCycle) {
  const opt = BILLING_OPTIONS.find((o) => o.id === cycle)!
  return Math.round(base * (1 - opt.discount))
}

export function getCycleSavings(base: number, cycle: BillingCycle) {
  const opt = BILLING_OPTIONS.find((o) => o.id === cycle)!
  if (cycle === 'monthly') return 0
  const months = cycle === 'six-months' ? 6 : 12
  return Math.round(base * opt.discount * months)
}
