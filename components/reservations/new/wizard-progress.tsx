"use client"

import { motion } from "motion/react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { STEP_LABELS, STEP_ORDER, useWizard } from "./wizard-context"

export function WizardProgress() {
  const { step, stepIndex, goTo } = useWizard()

  const progressPct = (stepIndex / (STEP_ORDER.length - 1)) * 100

  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-4xl">
        {/* Track */}
        <div className="absolute left-5 right-5 top-5 h-[2px] -translate-y-1/2 rounded-full bg-slate-200" />
        {/* Fill */}
        <motion.div
          className="absolute left-5 top-5 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
          style={{ width: `calc(${progressPct}% - 0px)` }}
          initial={false}
          animate={{ width: `calc(${progressPct}% * (100% - 40px) / 100% + 0px)` }}
          transition={{ type: "spring", stiffness: 200, damping: 28 }}
        />

        <ol className="relative flex items-start justify-between">
          {STEP_ORDER.map((id, i) => {
            const isDone = i < stepIndex
            const isActive = i === stepIndex
            const canJump = i <= stepIndex
            return (
              <li key={id} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && goTo(id)}
                  className={cn(
                    "relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 bg-white text-sm font-semibold transition-all",
                    isDone &&
                      "border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]",
                    isActive &&
                      "border-blue-500 text-blue-600 shadow-[0_4px_14px_rgba(59,130,246,0.25)]",
                    !isDone &&
                      !isActive &&
                      "border-slate-200 text-slate-400",
                    canJump && !isActive && "cursor-pointer hover:scale-105",
                    !canJump && "cursor-not-allowed",
                  )}
                >
                  {isDone ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 16 }}
                    >
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <span>{i + 1}</span>
                  )}

                  {isActive && (
                    <motion.span
                      layoutId="wizard-pulse"
                      className="absolute inset-[-4px] rounded-full border-2 border-blue-300/60"
                      transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    />
                  )}
                </button>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider transition-colors",
                      (isDone || isActive) ? "text-slate-900" : "text-slate-400",
                    )}
                  >
                    Étape {i + 1}
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-blue-600"
                        : isDone
                          ? "text-slate-700"
                          : "text-slate-400",
                    )}
                  >
                    {STEP_LABELS[id]}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
