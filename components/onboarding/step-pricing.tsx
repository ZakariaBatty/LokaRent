"use client"

import { useEffect, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Calendar, CalendarDays, CalendarRange, Info, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useOnboarding,
  type CategoryPricing,
  type VehicleCategory,
} from "./onboarding-context"

const CATEGORY_META: Record<
  VehicleCategory,
  { icon: string; gradient: string; description: string }
> = {
  Citadine: {
    icon: "C",
    gradient: "from-sky-500/20 to-blue-500/10",
    description: "Petits véhicules urbains",
  },
  Berline: {
    icon: "B",
    gradient: "from-indigo-500/20 to-violet-500/10",
    description: "Véhicules confort",
  },
  SUV: {
    icon: "S",
    gradient: "from-emerald-500/20 to-teal-500/10",
    description: "Véhicules tout-terrain léger",
  },
  "4x4": {
    icon: "4",
    gradient: "from-amber-500/20 to-orange-500/10",
    description: "Véhicules tout-terrain",
  },
  Utilitaire: {
    icon: "U",
    gradient: "from-rose-500/20 to-red-500/10",
    description: "Véhicules de transport",
  },
}

export function StepPricing() {
  const { state, setPricing } = useOnboarding()

  const detectedCategories = useMemo(() => {
    const fromVehicles = state.vehicles
      .map((v) => ({ categorie: v.categorie, prix: Number.parseFloat(v.prixJour) || 0 }))
      .filter((v) => v.categorie !== "")

    if (fromVehicles.length === 0) {
      return [{ categorie: "Berline" as VehicleCategory, prix: 300 }]
    }

    // Aggregate by category — keep highest entered price as base
    const map = new Map<VehicleCategory, number>()
    for (const v of fromVehicles) {
      const cat = v.categorie as VehicleCategory
      map.set(cat, Math.max(map.get(cat) ?? 0, v.prix))
    }
    return Array.from(map.entries()).map(([categorie, prix]) => ({ categorie, prix }))
  }, [state.vehicles])

  // Sync pricing state with detected categories
  useEffect(() => {
    const next: CategoryPricing[] = detectedCategories.map((d) => {
      const existing = state.pricing.find((p) => p.categorie === d.categorie)
      const base = d.prix > 0 ? d.prix : Number.parseFloat(existing?.prixJour ?? "0") || 250
      return {
        categorie: d.categorie,
        prixJour: existing?.prixJour ?? base.toString(),
        prixSemaine: existing?.semaineEdited
          ? (existing?.prixSemaine ?? "")
          : (base * 6).toString(),
        prixMois: existing?.moisEdited
          ? (existing?.prixMois ?? "")
          : (base * 25).toString(),
        semaineEdited: existing?.semaineEdited ?? false,
        moisEdited: existing?.moisEdited ?? false,
      }
    })
    if (JSON.stringify(next) !== JSON.stringify(state.pricing)) {
      setPricing(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedCategories])

  const updatePricing = (
    categorie: VehicleCategory,
    patch: Partial<CategoryPricing>,
  ) => {
    setPricing(
      state.pricing.map((p) => {
        if (p.categorie !== categorie) return p
        const merged = { ...p, ...patch }
        const base = Number.parseFloat(merged.prixJour) || 0
        if (patch.prixJour !== undefined) {
          if (!merged.semaineEdited) merged.prixSemaine = (base * 6).toString()
          if (!merged.moisEdited) merged.prixMois = (base * 25).toString()
        }
        return merged
      }),
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Grille tarifaire
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Définissez vos tarifs de base pour chaque catégorie de véhicule.
        </p>
      </div>

      <div className="grid gap-4">
        <AnimatePresence initial={false}>
          {state.pricing.map((p, index) => {
            const meta = CATEGORY_META[p.categorie]
            const base = Number.parseFloat(p.prixJour) || 0
            const semaineSuggestion = base * 6
            const moisSuggestion = base * 25
            const semaineCurrent = Number.parseFloat(p.prixSemaine) || 0
            const moisCurrent = Number.parseFloat(p.prixMois) || 0
            const semaineSavings =
              base > 0 && semaineCurrent > 0
                ? Math.round(((base * 7 - semaineCurrent) / (base * 7)) * 100)
                : 0
            const moisSavings =
              base > 0 && moisCurrent > 0
                ? Math.round(((base * 30 - moisCurrent) / (base * 30)) * 100)
                : 0

            return (
              <motion.div
                key={p.categorie}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 p-5 backdrop-blur sm:p-6"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-40`}
                  aria-hidden="true"
                />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-background/60 font-serif text-lg font-medium text-foreground">
                        {meta.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-foreground">{p.categorie}</h3>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                    </div>

                    <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-background/60 px-3 py-1.5 sm:flex">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">
                        Estimation hebdo:{" "}
                        <span className="font-medium text-foreground">
                          {semaineCurrent.toLocaleString("fr-FR")} DH
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <PricingField
                      icon={<Calendar className="h-4 w-4" />}
                      label="Prix par jour"
                      value={p.prixJour}
                      onChange={(v) => updatePricing(p.categorie, { prixJour: v })}
                      helper="Tarif journalier de base"
                    />
                    <PricingField
                      icon={<CalendarRange className="h-4 w-4" />}
                      label="Prix par semaine"
                      value={p.prixSemaine}
                      onChange={(v) =>
                        updatePricing(p.categorie, { prixSemaine: v, semaineEdited: true })
                      }
                      helper={
                        p.semaineEdited
                          ? `Tarif personnalisé · économie de ${semaineSavings > 0 ? semaineSavings : 0}%`
                          : `Suggestion : ${semaineSuggestion.toLocaleString("fr-FR")} DH (jour × 6)`
                      }
                      animatedValue
                    />
                    <PricingField
                      icon={<CalendarDays className="h-4 w-4" />}
                      label="Prix par mois"
                      value={p.prixMois}
                      onChange={(v) =>
                        updatePricing(p.categorie, { prixMois: v, moisEdited: true })
                      }
                      helper={
                        p.moisEdited
                          ? `Tarif personnalisé · économie de ${moisSavings > 0 ? moisSavings : 0}%`
                          : `Suggestion : ${moisSuggestion.toLocaleString("fr-FR")} DH (jour × 25)`
                      }
                      animatedValue
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-background/40 p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Les suggestions hebdomadaires et mensuelles sont calculées automatiquement à partir de votre tarif journalier. Vous gardez toujours la main sur les montants finaux.
        </p>
      </div>
    </div>
  )
}

function PricingField({
  icon,
  label,
  value,
  onChange,
  helper,
  animatedValue,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  helper: string
  animatedValue?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      <div className="relative">
        <motion.div
          key={animatedValue ? value : undefined}
          initial={animatedValue ? { opacity: 0.5, y: -2 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 border-white/10 bg-background/60 pr-12 text-base font-medium"
          />
        </motion.div>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
          DH
        </span>
      </div>
      <p className="text-[11px] leading-tight text-muted-foreground/80">{helper}</p>
    </div>
  )
}
