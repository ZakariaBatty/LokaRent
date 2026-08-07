"use client"

import { motion } from "motion/react"
import { Check } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

const STEPS = [
  { id: 1, labelKey: "onboarding.progress.company" },
  { id: 2, labelKey: "onboarding.progress.agency" },
  { id: 3, labelKey: "onboarding.progress.preferences" },
  { id: 4, labelKey: "onboarding.progress.optional" },
]

export function ProgressHeader({ currentStep }: { currentStep: number }) {
  const { t } = useI18n()
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="w-full">
      <div className="relative">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-6 h-px bg-white/10" aria-hidden="true" />

        {/* Animated progress line */}
        <motion.div
          className="absolute left-0 top-6 h-px bg-gradient-to-r from-primary via-accent to-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            boxShadow: "0 0 12px rgba(99, 124, 255, 0.6)",
          }}
          aria-hidden="true"
        />

        <ol className="relative flex items-start justify-between">
          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep
            const isActive = step.id === currentStep

            return (
              <li key={step.id} className="flex flex-col items-center gap-3">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="step-glow"
                      className="absolute inset-0 rounded-full bg-primary/40 blur-xl"
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-300 ${
                      isCompleted
                        ? "border-primary/50 bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary/60 bg-card text-foreground shadow-[0_0_0_4px_rgba(99,124,255,0.15)]"
                          : "border-white/10 bg-card/60 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      >
                        <Check className="h-5 w-5" strokeWidth={3} />
                      </motion.div>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                </motion.div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={`text-xs font-medium tracking-wide transition-colors ${
                      isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t("onboarding.progress.step")} {step.id}
                  </span>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t(step.labelKey)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
