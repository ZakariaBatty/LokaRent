"use client"

import { motion } from "motion/react"
import {
  Baby,
  CalendarRange,
  Car as CarIcon,
  Check,
  ClipboardCheck,
  Fuel,
  Gauge,
  MapPin,
  Navigation,
  PenLine,
  Shield,
  User,
  UserPlus,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { cars, formatMAD } from "@/lib/cars-data"
import { clients } from "@/lib/clients-data"
import { useWizard } from "./wizard-context"
import { StepHeader } from "./step-header"

const CHECKLIST_ITEMS = [
  { id: "carrosserieAvant" as const, label: "Carrosserie avant" },
  { id: "carrosserieArriere" as const, label: "Carrosserie arrière" },
  { id: "carrosserieCotes" as const, label: "Carrosserie côtés" },
  { id: "interieur" as const, label: "Intérieur" },
  { id: "equipements" as const, label: "Équipements" },
]

function formatDateTime(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`)
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function StepSummary() {
  const { state, setState, setEtat, totals } = useWizard()

  const car = cars.find((c) => c.id === state.selectedCarId)
  const client =
    state.clientMode === "existing"
      ? clients.find((c) => c.id === state.selectedClient?.id)
      : null
  const clientName =
    state.clientMode === "existing"
      ? state.selectedClient?.name ?? "—"
      : `${state.newClient.firstName} ${state.newClient.lastName}`.trim()
  const clientPhone =
    state.clientMode === "existing"
      ? state.selectedClient?.phone ?? "—"
      : state.newClient.phone

  const activeOptions = [
    state.options.extraDriver && { icon: UserPlus, label: "Conducteur supp.", price: 50 },
    state.options.gps && { icon: Navigation, label: "GPS", price: 30 },
    state.options.babySeat && { icon: Baby, label: "Siège bébé", price: 20 },
    state.options.extraInsurance && {
      icon: Shield,
      label: "Assurance complémentaire",
      price: 80,
    },
  ].filter(Boolean) as { icon: typeof Shield; label: string; price: number }[]

  return (
    <div>
      <StepHeader
        icon={ClipboardCheck}
        eyebrow="Étape 5 sur 5"
        title="Récapitulatif & confirmation"
        description="Vérifiez toutes les informations, effectuez l'état des lieux et faites signer le contrat."
      />

      <div className="space-y-5">
        {/* Top: client + car + dates */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SummaryCard icon={User} title="Client" accent="blue">
            <div className="font-semibold text-slate-900">{clientName}</div>
            <div className="mt-0.5 text-xs text-slate-500">{clientPhone}</div>
            {client && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <Check className="h-3 w-3" /> CRM existant
              </div>
            )}
            {state.clientMode === "new" && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Nouveau
              </div>
            )}
          </SummaryCard>

          <SummaryCard icon={CarIcon} title="Véhicule" accent="indigo">
            {car ? (
              <>
                <div className="font-semibold text-slate-900">
                  {car.brand} {car.model}
                </div>
                <div className="mt-0.5 font-mono text-xs text-slate-500">
                  {car.plate}
                </div>
                <span className="mt-2 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  {car.category}
                </span>
              </>
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </SummaryCard>

          <SummaryCard icon={CalendarRange} title="Période" accent="emerald">
            <div className="text-xs font-medium text-emerald-700">
              {formatDateTime(state.startDate, state.startTime)}
            </div>
            <div className="my-1 text-xs text-slate-400">↓</div>
            <div className="text-xs font-medium text-rose-700">
              {formatDateTime(state.endDate, state.endTime)}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {totals.days} jour{totals.days > 1 ? "s" : ""}
            </div>
          </SummaryCard>
        </div>

        {/* Locations + options + pricing breakdown */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              <MapPin className="h-3.5 w-3.5" />
              Prise en charge
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {state.pickupLocation}
            </div>
            {state.pickupAddress && (
              <div className="mt-1 text-xs text-slate-500">{state.pickupAddress}</div>
            )}
            <div className="my-4 h-px bg-slate-100" />
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-600">
              <MapPin className="h-3.5 w-3.5" />
              Retour
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {state.returnLocation}
            </div>
            {state.returnAddress && (
              <div className="mt-1 text-xs text-slate-500">{state.returnAddress}</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-violet-600">
              Options
            </div>
            {activeOptions.length === 0 ? (
              <div className="text-sm text-slate-400">Aucune option</div>
            ) : (
              <ul className="space-y-2">
                {activeOptions.map((o) => (
                  <li
                    key={o.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <o.icon className="h-3.5 w-3.5 text-slate-400" />
                      {o.label}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-600">
                      +{o.price} DH/j
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-[0_10px_30px_rgba(59,130,246,0.18)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">
              Total final
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-serif text-3xl font-bold tabular-nums">
                {formatMAD(totals.grandTotal).replace(" DH", "")}
              </span>
              <span className="text-sm text-blue-100">DH</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-blue-100">
              <Line k="Sous-total" v={formatMAD(totals.subtotal)} />
              {state.discountPct > 0 && (
                <Line k={`Remise ${state.discountPct}%`} v={`− ${formatMAD(totals.discountAmount)}`} />
              )}
              <Line k="Options" v={`+ ${formatMAD(totals.optionsTotal)}`} />
              <Line k="Avance" v={`− ${formatMAD(state.avanceAmount)}`} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/15 pt-3 text-sm font-bold">
              <span>Reste à payer</span>
              <span className="tabular-nums">{formatMAD(totals.reste)}</span>
            </div>
          </div>
        </div>

        {/* État des lieux */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
            État des lieux — Départ
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Contrôle visuel à effectuer avant remise des clés. Cochez chaque
            zone conforme.
          </p>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => {
              const ok = state.etatDesLieux[item.id]
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors",
                    ok
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-rose-200 bg-rose-50/40",
                  )}
                >
                  <span className="text-sm font-medium text-slate-800">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEtat({ [item.id]: true })}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg border transition-all",
                        ok
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-200 bg-white text-slate-400 hover:text-emerald-600",
                      )}
                      aria-label="Conforme"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEtat({ [item.id]: false })}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg border transition-all",
                        !ok
                          ? "border-rose-500 bg-rose-500 text-white"
                          : "border-slate-200 bg-white text-slate-400 hover:text-rose-600",
                      )}
                      aria-label="Non conforme"
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Fuel gauge */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Fuel className="h-3.5 w-3.5 text-amber-600" />
                  Niveau carburant
                </div>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {state.etatDesLieux.fuelLevel}/8
                </span>
              </div>
              <div className="mb-2 grid grid-cols-8 gap-1">
                {Array.from({ length: 8 }).map((_, i) => {
                  const filled = i < state.etatDesLieux.fuelLevel
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEtat({ fuelLevel: i + 1 })}
                      className={cn(
                        "h-6 rounded transition-all",
                        filled
                          ? "bg-gradient-to-t from-amber-500 to-amber-400"
                          : "bg-slate-200 hover:bg-slate-300",
                      )}
                      aria-label={`Niveau ${i + 1}/8`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
                <span>E</span>
                <span>1/2</span>
                <span>F</span>
              </div>
            </div>

            {/* KM start */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Gauge className="h-3.5 w-3.5 text-blue-600" />
                Kilométrage départ
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={state.etatDesLieux.kmDepart}
                  onChange={(e) => setEtat({ kmDepart: e.target.value })}
                  placeholder="0"
                  className="field-input pr-12 font-mono text-base font-semibold"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PenLine className="h-4 w-4 text-blue-600" />
            Remarques additionnelles
          </div>
          <textarea
            rows={3}
            value={state.remarks}
            onChange={(e) => setState({ remarks: e.target.value })}
            placeholder="Notes opérationnelles, dégâts existants, accord particulier..."
            className="field-input resize-none"
          />
        </div>

        {/* Signature */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <PenLine className="h-4 w-4 text-blue-600" />
            Signature & approbation
          </div>

          <label className="mb-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              onClick={() =>
                setState({ signatureAccepted: !state.signatureAccepted })
              }
              className={cn(
                "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition-all",
                state.signatureAccepted
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-slate-300 bg-white",
              )}
              aria-label="Approuver le contrat"
            >
              {state.signatureAccepted && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16 }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.span>
              )}
            </button>
            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Lu et approuvé</div>
              <p className="mt-0.5 text-xs text-slate-500">
                Je reconnais avoir pris connaissance du contrat et de l&apos;état
                des lieux ci-dessus, et j&apos;en accepte les termes.
              </p>
            </div>
          </label>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Signature (saisir le nom complet)
            </label>
            <input
              value={state.signatureName}
              onChange={(e) => setState({ signatureName: e.target.value })}
              placeholder="Tapez votre nom comme signature..."
              className="field-input font-serif text-lg italic placeholder:not-italic placeholder:font-sans placeholder:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof User
  title: string
  accent: "blue" | "indigo" | "emerald"
  children: React.ReactNode
}) {
  const tints = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className={cn("mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider", tints[accent])}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  )
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-blue-100/80">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  )
}
