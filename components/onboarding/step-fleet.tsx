"use client"

import { AnimatePresence, motion } from "motion/react"
import { Car, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createEmptyVehicle,
  useOnboarding,
  type OnboardingVehicle,
  type OnboardingFuelType,
  type OnboardingTransmission,
  type VehicleCategory,
} from "./onboarding-context"
import { useEffect, useRef } from "react"
import { useI18n } from "@/contexts/i18n-context"

const MARQUES = ["Dacia", "Renault", "Hyundai", "Kia", "Toyota", "Peugeot", "Citroën", "Autre"]
const CATEGORIES: VehicleCategory[] = ["Citadine", "Berline", "SUV", "4x4", "Utilitaire"]
const FUEL_TYPES: Array<{ value: OnboardingFuelType; label: string }> = [
  { value: "petrol", label: "Essence" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Électrique" },
  { value: "hybrid", label: "Hybride" },
  { value: "lpg", label: "GPL" },
]
const TRANSMISSIONS: Array<{ value: OnboardingTransmission; label: string }> = [
  { value: "manual", label: "Manuelle" },
  { value: "automatic", label: "Automatique" },
]

export function StepFleet() {
  const { t } = useI18n()
  const { state, setVehicles } = useOnboarding()
  const lastAddedRef = useRef<string | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const updateVehicle = (id: string, patch: Partial<OnboardingVehicle>) => {
    setVehicles(state.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }

  const addVehicle = () => {
    if (state.vehicles.length >= 3) return
    const next = createEmptyVehicle()
    lastAddedRef.current = next.id
    setVehicles([...state.vehicles, next])
  }

  const removeVehicle = (id: string) => {
    setVehicles(state.vehicles.filter((v) => v.id !== id))
  }

  useEffect(() => {
    if (lastAddedRef.current) {
      const el = cardRefs.current[lastAddedRef.current]
      el?.querySelector<HTMLInputElement>("input[data-autofocus='true']")?.focus()
      lastAddedRef.current = null
    }
  }, [state.vehicles.length])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Votre flotte
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Ajoutez quelques véhicules pour commencer rapidement. Vous pourrez en ajouter d&apos;autres plus tard.
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {state.vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              ref={(el) => {
                cardRefs.current[vehicle.id] = el
              }}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 p-5 backdrop-blur transition-colors hover:border-white/20 sm:p-6"
            >
              <div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(600px circle at var(--x, 50%) var(--y, 0%), rgba(99,124,255,0.08), transparent 40%)",
                }}
                aria-hidden="true"
              />

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-primary/20 to-accent/10 text-primary">
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Véhicule {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {vehicle.marque && vehicle.modele
                        ? `${vehicle.marque} ${vehicle.modele}`
                        : "Renseignez les informations"}
                    </span>
                  </div>
                </div>

                {state.vehicles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVehicle(vehicle.id)}
                    className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Retirer
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Marque</Label>
                  <Select
                    value={vehicle.marque}
                    onValueChange={(v) => updateVehicle(vehicle.id, { marque: v })}
                  >
                    <SelectTrigger className="h-10 border-white/10 bg-background/60">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARQUES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Modèle</Label>
                  <Input
                    data-autofocus="true"
                    placeholder="Logan, Clio..."
                    value={vehicle.modele}
                    onChange={(e) => updateVehicle(vehicle.id, { modele: e.target.value })}
                    className="h-10 border-white/10 bg-background/60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Année</Label>
                  <Input
                    type="number"
                    min={2000}
                    max={2030}
                    placeholder="2024"
                    value={vehicle.annee}
                    onChange={(e) => updateVehicle(vehicle.id, { annee: e.target.value })}
                    className="h-10 border-white/10 bg-background/60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Immatriculation
                  </Label>
                  <Input
                    placeholder="12345-A-1"
                    value={vehicle.immatriculation}
                    onChange={(e) =>
                      updateVehicle(vehicle.id, { immatriculation: e.target.value })
                    }
                    className="h-10 border-white/10 bg-background/60 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Catégorie</Label>
                  <Select
                    value={vehicle.categorie}
                    onValueChange={(v) =>
                      updateVehicle(vehicle.id, { categorie: v as VehicleCategory })
                    }
                  >
                    <SelectTrigger className="h-10 border-white/10 bg-background/60">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("onboarding.optional.vehicleFuelType")}
                  </Label>
                  <Select
                    value={vehicle.fuelType}
                    onValueChange={(v) =>
                      updateVehicle(vehicle.id, { fuelType: v as OnboardingFuelType })
                    }
                  >
                    <SelectTrigger className="h-10 border-white/10 bg-background/60">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((fuel) => (
                        <SelectItem key={fuel.value} value={fuel.value}>
                          {t(`onboarding.vehicleFuel.${fuel.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t("onboarding.optional.vehicleTransmission")}
                  </Label>
                  <Select
                    value={vehicle.transmission}
                    onValueChange={(v) =>
                      updateVehicle(vehicle.id, { transmission: v as OnboardingTransmission })
                    }
                  >
                    <SelectTrigger className="h-10 border-white/10 bg-background/60">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSMISSIONS.map((transmission) => (
                        <SelectItem key={transmission.value} value={transmission.value}>
                          {t(`onboarding.vehicleTransmission.${transmission.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Prix / jour (DH)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="250"
                      value={vehicle.prixJour}
                      onChange={(e) => updateVehicle(vehicle.id, { prixJour: e.target.value })}
                      className="h-10 border-white/10 bg-background/60 pr-12"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      DH
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={addVehicle}
          disabled={state.vehicles.length >= 3}
          className="gap-2 border-dashed border-white/20 bg-transparent hover:border-primary/40 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Ajouter une autre voiture
          <span className="ml-1 text-xs text-muted-foreground">
            {state.vehicles.length}/3
          </span>
        </Button>
      </div>
    </div>
  )
}
