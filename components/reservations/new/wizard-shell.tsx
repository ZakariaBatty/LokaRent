"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Loader2, Save, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import { cn } from "@/lib/utils"
import { createClientAction } from "@/modules/clients/actions/create-client.action"
import {
  confirmReservationAction,
  createReservationAction,
  repriceReservationAction,
  updateReservationAction,
} from "@/modules/reservations/actions/create-reservation.action"
import { generateContractAction } from "@/modules/contracts/actions/create-contract.action"
import { useWizard, STEP_ORDER } from "./wizard-context"
import { WizardProgress } from "./wizard-progress"
import { StepClient } from "./step-client"
import { StepVehicle } from "./step-vehicle"
import { StepPricing } from "./step-pricing"
import { StepOptions } from "./step-options"
import { StepSummary } from "./step-summary"

const pickupInspectionZones = [
  { id: "carrosserieAvant", labelKey: "reservations.inspection.frontBody" },
  { id: "carrosserieArriere", labelKey: "reservations.inspection.rearBody" },
  { id: "carrosserieCotes", labelKey: "reservations.inspection.sideBody" },
  { id: "interieur", labelKey: "reservations.inspection.interior" },
  { id: "equipements", labelKey: "reservations.inspection.equipment" },
] as const

export function WizardShell() {
  const router = useRouter()
  const { t } = useI18n()
  const { step, stepIndex, prev, next, canProceed, state, totals, mode, reservationId, cars, sources } = useWizard()
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [success, setSuccess] = useState(false)

  const isLast = step === "summary"
  const isFirst = step === "client"

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    setSavingDraft(false)
    toast.error(t("reservations.form.draftNotPersisted"))
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    const selectedCar = cars.find((car) => car.id === state.selectedCarId)
    const sourceId = mode === "edit" && state.sourceId ? state.sourceId : sources[0]?.id
    let customerId = state.selectedClient?.id

    if (state.clientMode === "new") {
      const createdClient = await createClientAction({
        type: "individual",
        fullName: `${state.newClient.firstName} ${state.newClient.lastName}`.trim(),
        phone: state.newClient.phone,
        email: state.newClient.email,
        status: "active",
        idType: state.newClient.idType,
        idNumber: state.newClient.idNumber,
        licenseNumber: state.newClient.licenseNumber,
        licenseExpiresAt: state.newClient.licenseExpiry || undefined,
      })
      if (!createdClient.success || !createdClient.customerId) {
        setSubmitting(false)
        toast.error(t("reservations.form.clientCreateFailed"))
        return
      }
      customerId = createdClient.customerId
    }

    if (!customerId || !state.selectedCarId || !sourceId || !selectedCar) {
      setSubmitting(false)
      toast.error(t("reservations.errors.validation"))
      return
    }

    const startsAt = new Date(`${state.startDate}T${state.startTime}:00`)
    const endsAt = new Date(`${state.endDate}T${state.endTime}:00`)
    const authorizedDrivers = state.options.extraDriver
      ? [{ fullName: state.options.extraDriverName, licenseNumber: state.options.extraDriverPermit }]
      : []
    const payload = {
      customerId,
      vehicleId: state.selectedCarId,
      sourceId,
      startsAt,
      endsAt,
      pickupLocation: state.pickupLocation === "Livraison adresse" ? state.pickupAddress : state.pickupLocation,
      returnLocation: state.returnLocation === "Livraison adresse" ? state.returnAddress : state.returnLocation,
      pricePerDay: totals.pricePerDay,
      extrasTotal: totals.optionsTotal,
      discountAmount: totals.discountAmount,
      discountReason: state.discountReason,
      currency: selectedCar.currency,
      depositAmount: state.cautionAmount,
      advanceAmount: state.avanceAmount,
      internalNotes: state.remarks,
      selectedExtras: state.selectedExtraDefinitionIds.map((definitionId) => ({ definitionId, quantity: totals.days })),
      authorizedDrivers,
    }

    let result =
      mode === "edit" && reservationId
        ? await updateReservationAction({ reservationId, ...payload })
        : await createReservationAction(payload)

    if (!result.success && mode === "edit" && reservationId && result.messageKey === "reservations.errors.repricingRequired") {
      result = await repriceReservationAction({ reservationId, ...payload })
    }

    if (!result.success || !result.reservationId) {
      setSubmitting(false)
      toast.error(t("reservations.form.saveFailed"))
      return
    }

    if (mode === "create") {
      const confirmed = await confirmReservationAction({ reservationId: result.reservationId })
      if (!confirmed.success) {
        setSubmitting(false)
        toast.error(t("reservations.form.confirmAfterCreateFailed"))
        router.push(`/reservations/${result.reservationId}/edit`)
        return
      }
      const pickupMileage = Number(state.etatDesLieux.kmDepart)
      if (Number.isInteger(pickupMileage) && pickupMileage >= 0) {
        const contractResult = await generateContractAction({
          reservationId: result.reservationId,
          pickupMileage,
          pickupFuelLevel: state.etatDesLieux.fuelLevel,
          notes: state.remarks,
          inspectionItems: pickupInspectionZones.map((item) => ({
            event: "pickup",
            zone: t(item.labelKey),
            condition: state.etatDesLieux[item.id] ? "ok" : "scratched",
            notes: state.etatDesLieux[item.id] ? undefined : state.remarks,
          })),
        })
        if (!contractResult.success) {
          toast.error(t(contractResult.messageKey))
        }
      }
    }

    setSubmitting(false)
    setSuccess(true)
    await new Promise((r) => setTimeout(r, 900))
    toast.success(mode === "edit" ? t("reservations.form.updated") : t("reservations.actions.confirmed"))
    router.push("/reservations")
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      {/* Soft background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(700px 400px at 10% -10%, rgba(59,130,246,0.06), transparent 60%), radial-gradient(700px 400px at 110% 0%, rgba(99,102,241,0.05), transparent 60%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-20 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/reservations"
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              aria-label="Retour aux réservations"
            >
              <X className="h-4 w-4" />
            </Link>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
                Nouveau contrat
              </div>
              <h1 className="font-serif text-lg font-semibold tracking-tight text-slate-900">
                Création d&apos;une réservation
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {savingDraft ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Enregistrer brouillon</span>
            <span className="sm:hidden">Brouillon</span>
          </button>
        </div>

        <div className="border-t border-slate-200/60 bg-white/60 px-4 py-4 sm:px-6">
          <WizardProgress />
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mx-auto max-w-6xl"
          >
            {step === "client" && <StepClient />}
            {step === "vehicle" && <StepVehicle />}
            {step === "pricing" && <StepPricing />}
            {step === "options" && <StepOptions />}
            {step === "summary" && <StepSummary />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer */}
      <footer className="relative z-20 shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </button>

          <div className="hidden text-xs text-slate-500 sm:block">
            Étape{" "}
            <span className="font-bold text-slate-900">{stepIndex + 1}</span>{" "}
            sur {STEP_ORDER.length}
            {!canProceed && step !== "summary" && (
              <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Champs requis manquants
              </span>
            )}
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={next}
              disabled={!canProceed}
              className={cn(
                "group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.30)] transition-all",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                "hover:shadow-[0_14px_30px_rgba(59,130,246,0.40)]",
              )}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Suivant</span>
              <ArrowRight className="relative h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canProceed || submitting}
              className={cn(
                "group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition-all",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                "hover:shadow-[0_14px_36px_rgba(16,185,129,0.50)]",
              )}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {submitting ? (
                <Loader2 className="relative h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="relative h-4 w-4" />
              )}
              <span className="relative">
                {submitting ? "Génération..." : "Confirmer et générer contrat"}
              </span>
              {!submitting && <ArrowRight className="relative h-4 w-4" />}
            </button>
          )}
        </div>
      </footer>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-white px-10 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.25)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 16 }}
                className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.40)]"
              >
                <Check className="h-8 w-8" strokeWidth={3} />
              </motion.div>
              <div className="text-center">
                <div className="font-serif text-xl font-semibold text-slate-900">
                  Contrat généré
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Redirection vers la liste des réservations...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
