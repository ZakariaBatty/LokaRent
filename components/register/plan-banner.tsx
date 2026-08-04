"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Sparkles, ArrowLeft } from "lucide-react"
import type { Plan } from "@/lib/pricing-data"

export function PlanBanner({ plan }: { plan: Plan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl"
    >
      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent" />
      {/* Soft glow */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />

      <div className="relative flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10"
          >
            <span className="absolute inset-0 rounded-xl bg-primary/20 blur-md" aria-hidden />
            <Sparkles className="relative h-4 w-4 text-primary" />
          </motion.span>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Plan sélectionné</span>
            <span className="text-sm font-semibold text-foreground sm:text-base text-balance">
              Vous avez choisi le plan{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {plan.name.toUpperCase()}
              </span>{" "}
              — {plan.monthlyPrice} DH/mois
            </span>
          </div>
        </div>

        <Link
          href="/pricing"
          className="group inline-flex items-center gap-1.5 self-start rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Changer
        </Link>
      </div>
    </motion.div>
  )
}
