"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

export type VehicleCategory = "Citadine" | "Berline" | "SUV" | "4x4" | "Utilitaire"
export type OnboardingFuelType = "petrol" | "diesel" | "electric" | "hybrid" | "lpg"
export type OnboardingTransmission = "manual" | "automatic"
export type OnboardingCustomerType = "individual" | "company"

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
  fuelType: OnboardingFuelType | ""
  transmission: OnboardingTransmission | ""
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
  type: OnboardingCustomerType
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
  fuelType: "",
  transmission: "",
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
      type: "individual",
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
  const setCompany = useCallback((company: CompanyProfile) => {
    setState((current) => ({ ...current, company }))
  }, [])
  const setAgency = useCallback((agency: AgencyProfile) => {
    setState((current) => ({ ...current, agency }))
  }, [])
  const setPreferences = useCallback((preferences: BusinessPreferences) => {
    setState((current) => ({ ...current, preferences }))
  }, [])
  const setVehicles = useCallback((vehicles: OnboardingVehicle[]) => {
    setState((current) => ({ ...current, vehicles }))
  }, [])
  const setCustomer = useCallback((customer: OnboardingCustomer) => {
    setState((current) => ({ ...current, customer }))
  }, [])
  const setPricing = useCallback((pricing: CategoryPricing[]) => {
    setState((current) => ({ ...current, pricing }))
  }, [])
  const setSettings = useCallback((settings: OnboardingSettings) => {
    setState((current) => ({ ...current, settings }))
  }, [])
  const value = useMemo(
    () => ({
      state,
      setCompany,
      setAgency,
      setPreferences,
      setVehicles,
      setCustomer,
      setPricing,
      setSettings,
    }),
    [
      state,
      setCompany,
      setAgency,
      setPreferences,
      setVehicles,
      setCustomer,
      setPricing,
      setSettings,
    ],
  )

  return (
    <OnboardingContext.Provider value={value}>
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
