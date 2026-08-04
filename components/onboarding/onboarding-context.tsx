"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type VehicleCategory = "Citadine" | "Berline" | "SUV" | "4x4" | "Utilitaire"

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

export interface OnboardingState {
  vehicles: OnboardingVehicle[]
  pricing: CategoryPricing[]
  settings: OnboardingSettings
}

interface OnboardingContextValue {
  state: OnboardingState
  setVehicles: (v: OnboardingVehicle[]) => void
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

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    vehicles: [createEmptyVehicle()],
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
        setVehicles: (vehicles) => setState((s) => ({ ...s, vehicles })),
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
