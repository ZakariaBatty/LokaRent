"use client"

import { motion } from "motion/react"
import {
  Baby,
  Check,
  Navigation,
  Shield,
  Sparkles,
  UserPlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWizard } from "./wizard-context"
import { StepHeader } from "./step-header"
import { AnimatedNumber } from "./animated-number"
import { formatMAD } from "@/lib/cars-data"

const ADDONS = [
  {
    id: "extraDriver" as const,
    icon: UserPlus,
    label: "Conducteur supplémentaire",
    description: "Permis d'un second conducteur autorisé sur le contrat.",
    price: 50,
    tint: "from-blue-50 to-blue-100/40 text-blue-600 ring-blue-100",
  },
  {
    id: "gps" as const,
    icon: Navigation,
    label: "GPS",
    description: "Système de navigation embarqué (TomTom / Garmin).",
    price: 30,
    tint: "from-emerald-50 to-emerald-100/40 text-emerald-600 ring-emerald-100",
  },
  {
    id: "babySeat" as const,
    icon: Baby,
    label: "Siège bébé",
    description: "Siège auto homologué pour enfant 0-12 mois.",
    price: 20,
    tint: "from-amber-50 to-amber-100/40 text-amber-600 ring-amber-100",
  },
  {
    id: "extraInsurance" as const,
    icon: Shield,
    label: "Assurance complémentaire",
    description: "Couverture étendue tous risques zéro franchise.",
    price: 80,
    tint: "from-violet-50 to-violet-100/40 text-violet-600 ring-violet-100",
  },
]

export function StepOptions() {
  const { state, setOptions, totals } = useWizard()

  return (
    <div>
      <StepHeader
        icon={Sparkles}
        eyebrow="Étape 4 sur 5"
        title="Options & extras"
        description="Activez les services additionnels. Le total se met à jour en temps réel."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ADDONS.map((a, i) => {
          const enabled = state.options[a.id]
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                type="button"
                onClick={() => setOptions({ [a.id]: !enabled })}
                className={cn(
                  "group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5",
                  enabled
                    ? "border-blue-300 shadow-[0_10px_30px_rgba(59,130,246,0.12)] ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300",
                )}
              >
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1",
                    a.tint,
                  )}
                >
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {a.label}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {a.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        +{a.price}
                        <span className="text-xs font-medium text-slate-400">
                          {" "}
                          DH/j
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full border-2 transition-all",
                    enabled
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-200 bg-white",
                  )}
                >
                  {enabled && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 16 }}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
              </button>

              {a.id === "extraDriver" && enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/40 p-4"
                >
                  <div className="mb-2 text-xs font-semibold text-blue-900">
                    Informations du second conducteur
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      value={state.options.extraDriverName}
                      onChange={(e) =>
                        setOptions({ extraDriverName: e.target.value })
                      }
                      placeholder="Nom complet"
                      className="field-input"
                    />
                    <input
                      value={state.options.extraDriverPermit}
                      onChange={(e) =>
                        setOptions({ extraDriverPermit: e.target.value })
                      }
                      placeholder="N° de permis"
                      className="field-input font-mono"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Live total update */}
      <motion.div
        layout
        className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Total mis à jour
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-3xl font-bold tabular-nums">
                <AnimatedNumber value={totals.grandTotal} />
              </span>
              <span className="text-sm text-slate-400">DH</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Options activées</div>
            <div className="font-mono text-lg font-bold tabular-nums text-emerald-400">
              + {formatMAD(totals.optionsTotal)}
            </div>
            <div className="text-[11px] text-slate-500">
              ({formatMAD(totals.optionsPerDay)}/j × {totals.days}j)
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
