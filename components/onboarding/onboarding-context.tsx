"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type VehicleCategory = "Citadine" | "Berline" | "SUV" | "4x4" | "Utilitaire"

export interface CompanyProfile {
  legalName: string
  logoUrl: string
  phone: string
  address: string
  countryCode: string
  timezone: string
  currency: string
}

export interface AgencyProfile {
  name: string
  code: string
  phone: string
  email: string
  address: string
  isPrimaryConfirmed: boolean
}

export interface BusinessPreferences {
  invoicePrefix: string
  reservationPrefix: string
  contractPrefix: string
  taxRate: string
  defaultLanguage: "fr" | "en"
  emailNotifications: boolean
  whatsappNotifications: boolean
}

export interface OnboardingVehicle {
  id: string
  marque: string
  modele: string
  annee: string
  immatriculation: string
  categorie: VehicleCategory | ""
  prixJour: string
}

export interface CategoryPricing {
  categorie: VehicleCategory
  prixJour: string
  prixSemaine: string
  prixMois: string
  semaineEdited: boolean
  moisEdited: boolean
}

export interface OnboardingSettings {
  caution: string
  dureeMin: string
  whatsapp: boolean
  logo: string | null
}

export interface OnboardingCustomer {
  fullName: string
  phone: string
  email: string
}

export interface OnboardingState {
  company: CompanyProfile
  agency: AgencyProfile
  preferences: BusinessPreferences
  vehicles: OnboardingVehicle[]
  customer: OnboardingCustomer
  pricing: CategoryPricing[]
  settings: OnboardingSettings
}

interface OnboardingContextValue {
  state: OnboardingState
  setCompany: (company: CompanyProfile) => void
  setAgency: (agency: AgencyProfile) => void
  setPreferences: (preferences: BusinessPreferences) => void
  setVehicles: (v: OnboardingVehicle[]) => void
  setCustomer: (customer: OnboardingCustomer) => void
  setPricing: (p: CategoryPricing[]) => void
  setSettings: (s: OnboardingSettings) => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

const createEmptyVehicle = (): OnboardingVehicle => ({
  id: crypto.randomUUID(),
  marque: "",
  modele: "",
  annee: new Date().getFullYear().toString(),
  immatriculation: "",
  categorie: "",
  prixJour: "",
})

export function OnboardingProvider({
  children,
  initialData,
}: {
  children: ReactNode
  initialData?: Partial<Pick<OnboardingState, "company" | "agency">>
}) {
  const [state, setState] = useState<OnboardingState>({
    company: {
      legalName: initialData?.company?.legalName ?? "",
      logoUrl: initialData?.company?.logoUrl ?? "",
      phone: initialData?.company?.phone ?? "",
      address: initialData?.company?.address ?? "",
      countryCode: initialData?.company?.countryCode ?? "MA",
      timezone: initialData?.company?.timezone ?? "Africa/Casablanca",
      currency: initialData?.company?.currency ?? "MAD",
    },
    agency: {
      name: initialData?.agency?.name ?? "",
      code: initialData?.agency?.code ?? "MAIN",
      phone: initialData?.agency?.phone ?? "",
      email: initialData?.agency?.email ?? "",
      address: initialData?.agency?.address ?? "",
      isPrimaryConfirmed: initialData?.agency?.isPrimaryConfirmed ?? true,
    },
    preferences: {
      invoicePrefix: "INV-",
      reservationPrefix: "RES-",
      contractPrefix: "CTR-",
      taxRate: "0",
      defaultLanguage: "fr",
      emailNotifications: true,
      whatsappNotifications: false,
    },
    vehicles: [createEmptyVehicle()],
    customer: {
      fullName: "",
      phone: "",
      email: "",
    },
    pricing: [],
    settings: {
      caution: "3000",
      dureeMin: "1",
      whatsapp: false,
      logo: null,
    },
  })

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setCompany: (company) => setState((s) => ({ ...s, company })),
        setAgency: (agency) => setState((s) => ({ ...s, agency })),
        setPreferences: (preferences) => setState((s) => ({ ...s, preferences })),
        setVehicles: (vehicles) => setState((s) => ({ ...s, vehicles })),
        setCustomer: (customer) => setState((s) => ({ ...s, customer })),
        setPricing: (pricing) => setState((s) => ({ ...s, pricing })),
        setSettings: (settings) => setState((s) => ({ ...s, settings })),
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider")
  return ctx
}

export { createEmptyVehicle }
