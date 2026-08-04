"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight, Check, Crown, Sparkles } from "lucide-react"

export function SubscriptionCard({
  plan = "PRO",
  renewDate = "01/06/2026",
  amount = 599,
}: {
  plan?: "STARTER" | "PRO" | "BUSINESS"
  renewDate?: string
  amount?: number
}) {
  const features = [
    "Flotte illimitée",
    "Multi-utilisateurs (jusqu'à 10)",
    "Contrats électroniques",
    "Support prioritaire 24/7",
  ]
  const upsell = [
    "Multi-agences & succursales",
    "API & intégrations avancées",
    "Account manager dédié",
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 gap-5 lg:grid-cols-2"
    >
      {/* Current plan card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Abonnement actuel
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-bold text-white shadow-[0_6px_18px_-6px_rgba(79,70,229,0.6)]">
                <Crown className="h-3 w-3" />
                {plan}
              </span>
              <span className="text-xs font-medium text-slate-500">Plan annuel</span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {amount.toLocaleString("fr-FR")}{" "}
              <span className="text-base font-semibold text-slate-500">DH / mois</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Date de renouvellement ·{" "}
              <span className="font-semibold text-slate-700">{renewDate}</span>
            </p>
          </div>
        </div>

        <ul className="relative mt-5 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                <Check className="h-3 w-3" />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="relative mt-6 flex items-center gap-3">
          <Link
            href="/settings/billing"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Gérer mon abonnement
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Upsell card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/40 to-rose-300/40 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-amber-600 shadow-sm ring-1 ring-inset ring-amber-200">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Recommandation
            </p>
            <p className="text-base font-bold text-slate-900">Passer au plan BUSINESS</p>
          </div>
        </div>

        <p className="relative mt-3 text-sm leading-relaxed text-slate-700">
          Idéal pour les agences en croissance qui souhaitent gérer plusieurs sites et
          accéder à des outils opérationnels avancés.
        </p>

        <ul className="relative mt-4 space-y-2">
          {upsell.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-800">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-amber-600 ring-1 ring-inset ring-amber-200">
                <Check className="h-3 w-3" />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="relative mt-5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">1 199</span>
          <span className="text-sm font-semibold text-slate-600">DH / mois</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            -20% offre lancement
          </span>
        </div>

        <button
          type="button"
          className="relative mt-4 inline-flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(251,113,133,0.6)] transition hover:from-amber-600 hover:via-orange-600 hover:to-rose-600"
        >
          <Sparkles className="h-4 w-4" />
          Découvrir BUSINESS
        </button>
      </div>
    </motion.section>
  )
}
