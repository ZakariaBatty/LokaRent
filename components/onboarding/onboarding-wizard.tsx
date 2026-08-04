"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Loader2, SkipForward, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OnboardingProvider } from "./onboarding-context"
import { ProgressHeader } from "./progress-header"
import { StepFleet } from "./step-fleet"
import { StepPricing } from "./step-pricing"
import { StepSettings } from "./step-settings"

const TOTAL_STEPS = 3

function WizardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "pro"
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const next = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep((s) => s + 1)
    }
  }
  const back = () => {
    if (step > 1) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const finish = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1400))
    setSubmitting(false)
    setSuccess(true)
    await new Promise((r) => setTimeout(r, 900))
    router.push("/dashboard")
  }

  // Architecture rule: the user must ALWAYS be able to skip onboarding and enter
  // the dashboard immediately. Sensible defaults are applied later on the backend;
  // the "onboarding=skipped" marker lets the dashboard surface a resume prompt and
  // show onboarding progress as incomplete.
  const skip = () => {
    router.push("/dashboard?onboarding=skipped")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute -right-24 top-1/2 h-[460px] w-[460px] rounded-full bg-primary/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-base font-medium tracking-tight text-foreground">
                LokaRent
              </span>
              <span className="text-[11px] text-muted-foreground">Configuration initiale</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-card/60 px-3 py-1.5 backdrop-blur">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,124,255,0.8)]" />
            <span className="text-xs text-muted-foreground">
              Étape <span className="font-medium text-foreground">{step}</span> sur {TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-[1100px] px-6 pb-32 pt-10 sm:px-8 sm:pt-14">
        {/* Progress */}
        <div className="mx-auto max-w-3xl">
          <ProgressHeader currentStep={step} />
        </div>

        {/* Step card */}
        <div className="relative mt-10 sm:mt-14">
          <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-50 blur-2xl" aria-hidden="true" />

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="relative px-6 py-8 sm:px-10 sm:py-10">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 && <StepFleet />}
                  {step === 2 && <StepPricing />}
                  {step === 3 && <StepSettings plan={plan} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="sticky bottom-4 mt-8 sm:static sm:mt-10">
          <div className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl border border-white/10 bg-background/80 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:border-transparent sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 1 || submitting}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={skip}
                disabled={submitting || success}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
                Passer pour l&apos;instant
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={next}
                  className="group relative h-11 gap-2 overflow-hidden bg-gradient-to-r from-primary to-accent px-6 text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-primary/50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={finish}
                  disabled={submitting || success}
                  className="group relative h-11 gap-2 overflow-hidden bg-gradient-to-r from-primary to-accent px-6 text-primary-foreground shadow-lg shadow-primary/30 transition-shadow hover:shadow-primary/50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Configuration en cours...
                    </>
                  ) : success ? (
                    <>
                      <Check className="h-4 w-4" />
                      Terminé
                    </>
                  ) : (
                    <>
                      Terminer et accéder à mon tableau de bord
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="flex flex-col items-center gap-5 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[0_0_60px_rgba(99,124,255,0.45)]"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 18 }}
                >
                  <Check className="h-9 w-9 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              </motion.div>
              <div>
                <p className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  Configuration terminée
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bienvenue sur LokaRent. Redirection en cours...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function OnboardingWizard() {
  return (
    <OnboardingProvider>
      <WizardInner />
    </OnboardingProvider>
  )
}
