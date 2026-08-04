"use client"

import { motion } from "motion/react"
import { Crown, Sparkles } from "lucide-react"

export function PlanLimitBanner({
  plan,
  used,
  max,
}: {
  plan: "STARTER" | "PRO" | "BUSINESS"
  used: number
  max: number
}) {
  const isStarter = plan === "STARTER"
  const pct = Math.min(100, Math.round((used / max) * 100))
  const remaining = Math.max(0, max - used)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        isStarter
          ? "border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-rose-50"
          : "border-indigo-200/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
      }`}
    >
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-sm ring-1 ring-inset ${
              isStarter
                ? "bg-gradient-to-br from-amber-400 to-rose-500 text-white ring-amber-300/50"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-indigo-300/50"
            }`}
          >
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {isStarter ? "Plan Starter" : `Plan ${plan}`}
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                  isStarter
                    ? "bg-amber-100 text-amber-700 ring-amber-200"
                    : "bg-indigo-100 text-indigo-700 ring-indigo-200"
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {isStarter ? "Limité" : "Premium"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {isStarter
                ? "Le plan Starter est limité à 1 utilisateur. Passez au plan PRO pour ajouter votre équipe."
                : `${max} utilisateurs maximum`}{" "}
              <span className="font-semibold text-slate-900">
                ({used}/{max} utilisés)
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:gap-4">
          <div className="flex w-full min-w-[220px] flex-col gap-1.5 sm:w-64">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-500">Utilisation</span>
              <span className={isStarter ? "text-amber-600" : "text-indigo-600"}>
                {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-slate-200/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className={`h-full rounded-full ${
                  isStarter
                    ? "bg-gradient-to-r from-amber-400 to-rose-500"
                    : "bg-gradient-to-r from-indigo-500 to-violet-600"
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {remaining > 0
                ? `${remaining} place${remaining > 1 ? "s" : ""} restante${
                    remaining > 1 ? "s" : ""
                  }`
                : "Limite atteinte"}
            </p>
          </div>

          <button
            type="button"
            className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md ${
              isStarter
                ? "bg-gradient-to-r from-amber-500 to-rose-500"
                : "bg-gradient-to-r from-indigo-600 to-violet-600"
            }`}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Sparkles className="relative h-4 w-4" />
            <span className="relative">
              {isStarter ? "Passer au plan PRO" : "Augmenter la limite"}
            </span>
          </button>
        </div>
      </div>
    </motion.section>
  )
}
