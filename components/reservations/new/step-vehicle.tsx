"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  CalendarRange,
  Car as CarIcon,
  Check,
  Clock,
  Filter,
  MapPin,
  Plane,
  Truck,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { cars, formatMAD } from "@/lib/cars-data"
import { useWizard, type Location } from "./wizard-context"
import { CarIllustration } from "@/components/cars/car-illustration"
import { StepHeader } from "./step-header"

const LOCATIONS: { id: Location; label: string; icon: typeof Plane }[] = [
  { id: "Agence", label: "Agence", icon: Building2 },
  { id: "Aéroport CMN", label: "Aéroport CMN", icon: Plane },
  { id: "Aéroport RAK", label: "Aéroport RAK", icon: Plane },
  { id: "Livraison adresse", label: "Livraison adresse", icon: Truck },
]

export function StepVehicle() {
  const { state, setState, totals } = useWizard()
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Available cars (mock: filter out hors_service and maintenance)
  const availableCars = useMemo(() => {
    let list = cars.filter((c) => c.status === "disponible" || c.status === "louee")
    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category === categoryFilter)
    }
    return list
  }, [categoryFilter])

  const categories = ["all", "Citadine", "Berline", "SUV", "Utilitaire"]

  return (
    <div>
      <StepHeader
        icon={CalendarRange}
        eyebrow="Étape 2 sur 5"
        title="Véhicule & dates"
        description="Définissez la période de location, puis sélectionnez un véhicule disponible. Le moteur calcule automatiquement la durée."
      />

      {/* Date range */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CalendarRange className="h-4 w-4 text-blue-600" />
            Période de location
          </div>
          <motion.div
            key={totals.days}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100"
          >
            <Clock className="h-3.5 w-3.5" />
            {totals.days} jour{totals.days > 1 ? "s" : ""}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Départ
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={state.startDate}
                onChange={(e) => setState({ startDate: e.target.value })}
                className="field-input"
              />
              <input
                type="time"
                value={state.startTime}
                onChange={(e) => setState({ startTime: e.target.value })}
                className="field-input"
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Retour prévu
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={state.endDate}
                onChange={(e) => setState({ endDate: e.target.value })}
                className="field-input"
              />
              <input
                type="time"
                value={state.endTime}
                onChange={(e) => setState({ endTime: e.target.value })}
                className="field-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle selection */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <CarIcon className="h-4 w-4 text-blue-600" />
            Véhicules disponibles
            <span className="text-xs font-medium text-slate-500">
              ({availableCars.length} sur cette période)
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <Filter className="ml-2 h-3.5 w-3.5 text-slate-400" />
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  categoryFilter === c
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {c === "all" ? "Toutes" : c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableCars.map((car, i) => {
            const isSelected = state.selectedCarId === car.id
            return (
              <motion.button
                key={car.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}
                onClick={() => setState({ selectedCarId: car.id })}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5",
                  isSelected
                    ? "border-blue-500 shadow-[0_10px_30px_rgba(59,130,246,0.18)] ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
                )}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 16 }}
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-white shadow-md"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </motion.div>
                )}
                <div className="mb-3 grid h-24 place-items-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/60">
                  <CarIllustration category={car.category} size="lg" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {car.brand} {car.model}
                      </div>
                      <div className="text-xs text-slate-500">{car.year}</div>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {car.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {car.plate}
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {formatMAD(car.priceDay)}
                      <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                        /j
                      </span>
                    </span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LocationCard
          label="Lieu de prise en charge"
          accent="emerald"
          value={state.pickupLocation}
          onChange={(v) => setState({ pickupLocation: v })}
          address={state.pickupAddress}
          onAddressChange={(v) => setState({ pickupAddress: v })}
        />
        <LocationCard
          label="Lieu de retour"
          accent="rose"
          value={state.returnLocation}
          onChange={(v) => setState({ returnLocation: v })}
          address={state.returnAddress}
          onAddressChange={(v) => setState({ returnAddress: v })}
        />
      </div>
    </div>
  )
}

function LocationCard({
  label,
  accent,
  value,
  onChange,
  address,
  onAddressChange,
}: {
  label: string
  accent: "emerald" | "rose"
  value: Location
  onChange: (v: Location) => void
  address: string
  onAddressChange: (v: string) => void
}) {
  const accentClasses =
    accent === "emerald"
      ? "text-emerald-600"
      : "text-rose-600"
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={cn("mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider", accentClasses)}>
        <MapPin className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {LOCATIONS.map((l) => {
          const active = value === l.id
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onChange(l.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                active
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <l.icon className="h-3.5 w-3.5" />
              {l.label}
            </button>
          )
        })}
      </div>
      {value === "Livraison adresse" && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-3 overflow-hidden"
        >
          <input
            placeholder="Adresse complète..."
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="field-input"
          />
        </motion.div>
      )}
    </div>
  )
}
