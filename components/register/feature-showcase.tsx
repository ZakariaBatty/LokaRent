"use client"

import { motion } from "motion/react"
import {
  Check,
  Sparkles,
  TrendingUp,
  Car,
  Users,
  Shield,
  Star,
} from "lucide-react"
import type { Plan } from "@/lib/pricing-data"

export function FeatureShowcase({ plan }: { plan: Plan }) {
  const included = plan.features.filter((f) => f.included).slice(0, 6)

  return (
    <div className="relative flex h-full flex-col overflow-hidden p-8 lg:p-12">
      {/* Background blobs */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
        aria-hidden
      />
      <motion.div
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-accent/25 blur-3xl"
        aria-hidden
      />
      {/* Grid mask */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col justify-between gap-10">
        {/* Top: plan badge + tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-5"
        >
          {plan.badge && (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {plan.popular ? "Plan Populaire" : plan.badge}
              </span>
            </div>
          )}
          <h2 className="text-3xl font-bold leading-tight text-foreground text-balance lg:text-4xl">
            Bienvenue dans{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              LakaRent {plan.name}
            </span>
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground lg:text-base text-pretty">
            {plan.tagline}. Gérez votre flotte, vos clients et vos contrats depuis une seule plateforme pensée pour les agences marocaines.
          </p>
        </motion.div>

        {/* Pricing preview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-transparent opacity-60 blur-md" aria-hidden />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Plan {plan.name}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-foreground tabular-nums">
                    {plan.monthlyPrice}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    DH / mois
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

            <ul className="flex flex-col gap-2.5">
              {included.map((f, i) => (
                <motion.li
                  key={f.text}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                  className="flex items-start gap-2.5 text-sm text-foreground/90"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                  </span>
                  <span className="leading-snug">{f.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Car, value: "12 000+", label: "Véhicules gérés" },
            { icon: Users, value: "850+", label: "Agences actives" },
            { icon: Shield, value: "99.9%", label: "Disponibilité" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className="rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur-md"
            >
              <stat.icon className="mb-2 h-3.5 w-3.5 text-primary" />
              <div className="text-base font-bold text-foreground tabular-nums">
                {stat.value}
              </div>
              <div className="text-[10px] leading-tight text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial */}
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md"
        >
          <div className="mb-2 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
            ))}
          </div>
          <blockquote className="text-sm leading-relaxed text-foreground/90 text-pretty">
            « Depuis qu&apos;on utilise LakaRent, on gère nos 32 voitures sans
            stress. Les alertes assurance et les contrats automatiques nous font
            gagner 5h par semaine. »
          </blockquote>
          <figcaption className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
              YA
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                Youssef Amrani
              </span>
              <span className="text-[11px] text-muted-foreground">
                Directeur, Atlas Car — Marrakech
              </span>
            </div>
          </figcaption>
        </motion.figure>
      </div>
    </div>
  )
}
