"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Check, Pencil, Gauge, Fuel, Users, Calendar, Palette, Tag } from "lucide-react"
import { type Car, type CarStatus, statusConfig } from "@/lib/cars-data"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

const allStatuses: CarStatus[] = ["disponible", "louee", "maintenance", "hors_service"]

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function EditableField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value.toString())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(value.toString())
  }, [value])

  const commit = () => {
    const n = Number.parseInt(draft, 10)
    if (!Number.isNaN(n) && n !== value) {
      onChange(n)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
    setEditing(false)
  }

  return (
    <div className="group relative rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <button
          onClick={() => setEditing(true)}
          className="text-slate-300 opacity-0 transition hover:text-slate-600 group-hover:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit()
              if (e.key === "Escape") {
                setDraft(value.toString())
                setEditing(false)
              }
            }}
            className="w-24 rounded-md border border-indigo-200 bg-indigo-50/50 px-1.5 py-0.5 text-2xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white tabular-nums"
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className="cursor-text text-2xl font-bold text-slate-900 tabular-nums"
          >
            {value.toLocaleString("fr-FR")}
          </span>
        )}
        <span className="text-xs font-medium text-slate-500">{suffix}</span>
      </div>
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
          >
            <Check className="h-2.5 w-2.5" />
            Enregistré
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function InfosTab({ car }: { car: Car }) {
  const [status, setStatus] = useState<CarStatus>(car.status)
  const [km, setKm] = useState(car.km)
  const [statusSaved, setStatusSaved] = useState(false)

  useEffect(() => {
    setStatus(car.status)
    setKm(car.km)
  }, [car.id, car.status, car.km])

  const handleStatusChange = (s: CarStatus) => {
    setStatus(s)
    setStatusSaved(true)
    setTimeout(() => setStatusSaved(false), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Status selector */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Statut opérationnel</h3>
            <p className="text-[11px] text-slate-500">Changement immédiat appliqué à toutes les vues.</p>
          </div>
          <AnimatePresence>
            {statusSaved && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                <Check className="h-2.5 w-2.5" />
                Sauvegardé
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {allStatuses.map((s) => {
            const cfg = statusConfig[s]
            const active = status === s
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={cn(
                  "relative overflow-hidden rounded-xl border bg-white p-3 text-left transition",
                  active
                    ? "border-slate-300 shadow-sm"
                    : "border-slate-200/80 hover:border-slate-300",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="status-bg"
                    className={cn(
                      "absolute inset-0",
                      s === "disponible" && "bg-emerald-50",
                      s === "louee" && "bg-blue-50",
                      s === "maintenance" && "bg-amber-50",
                      s === "hors_service" && "bg-rose-50",
                    )}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
                  <span className="text-xs font-semibold text-slate-900">{cfg.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Specifications */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Spécifications</h3>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          <SpecRow icon={Tag} label="Marque" value={car.brand} />
          <SpecRow icon={Tag} label="Modèle" value={car.model} />
          <SpecRow icon={Calendar} label="Année" value={car.year} />
          <SpecRow icon={Palette} label="Couleur" value={car.color} />
          <SpecRow icon={Tag} label="Catégorie" value={car.category} />
          <SpecRow icon={Fuel} label="Carburant" value={car.fuel} />
          <SpecRow icon={Users} label="Places" value={car.seats} />
          <SpecRow icon={Tag} label="Immatriculation" value={car.plate} />
          <SpecRow icon={Gauge} label="Réf. interne" value={car.id} />
        </div>
      </section>

      {/* Kilometrage editable */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Kilométrage actuel</h3>
        <EditableField label="Kilomètres parcourus" value={km} suffix="km" onChange={setKm} />
      </section>

      {/* Pricing */}
      <section>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-800">{fr.fleet.pricing.unsupportedTitle}</p>
          <p className="mt-0.5 text-[11px] text-amber-700">{fr.fleet.pricing.unsupportedDescription}</p>
        </div>
      </section>
    </div>
  )
}
