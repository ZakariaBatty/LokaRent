"use client"

import { motion } from "motion/react"
import { Check } from "lucide-react"

const STEPS = [
  { label: "Compte" },
  { label: "Agence" },
  { label: "Démarrage" },
]

export function StepIndicator({ current = 1 }: { current?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Étape {current} sur {STEPS.length}
        </span>
        <span className="text-xs text-muted-foreground">
          {STEPS[current - 1]?.label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {STEPS.map((_, i) => {
          const isDone = i < current - 1
          const isActive = i === current - 1
          return (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border/60">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: isDone || isActive ? "100%" : "0%" }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent"
                />
              </div>
              {isDone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
