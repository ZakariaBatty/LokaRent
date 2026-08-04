'use client'

import { motion } from 'motion/react'
import { ShieldCheck, Cloud, Headphones, Sparkles } from 'lucide-react'

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'Sécurisé' },
  { icon: Cloud, label: 'SaaS Cloud' },
  { icon: Headphones, label: 'Support rapide' },
]

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-32">
      {/* Animated glowing orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute top-[-20%] left-[15%] h-[480px] w-[480px] rounded-full bg-primary/30 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute top-[10%] right-[10%] h-[420px] w-[420px] rounded-full bg-accent/25 blur-[140px]"
        />
        <div
          aria-hidden
          className="absolute top-[-10%] left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-chart-3/15 blur-[160px]"
        />
        {/* subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage:
              'radial-gradient(ellipse 60% 50% at 50% 30%, black 40%, transparent 80%)',
          }}
        />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="glass mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <Sparkles className="size-3.5 text-accent" />
          <span>Tarifs simples, transparents, sans engagement</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.05 }}
          className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Une solution moderne pour
          <br />
          <span className="text-gradient-brand">gérer votre flotte automobile</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          LokaRent réunit la gestion de vos véhicules, réservations, clients et finances
          dans une plateforme conçue pour les agences de location au Maroc. Choisissez la
          formule adaptée à votre activité.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass inline-flex items-center gap-2 rounded-full border border-border/50 px-3.5 py-1.5 text-xs font-medium text-foreground/80"
            >
              <Icon className="size-3.5 text-accent" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
