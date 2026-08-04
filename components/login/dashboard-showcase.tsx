"use client"

import { motion } from "motion/react"
import {
  Car,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Sparkles,
  Activity,
} from "lucide-react"

const fleetCars = [
  { name: "Dacia Logan", plate: "12345-A-1", status: "Loué", color: "from-emerald-500/20 to-emerald-500/5" },
  { name: "Renault Clio", plate: "45678-B-6", status: "Disponible", color: "from-sky-500/20 to-sky-500/5" },
  { name: "Range Rover Evoque", plate: "98765-C-12", status: "Loué", color: "from-violet-500/20 to-violet-500/5" },
]

const stats = [
  { label: "Véhicules actifs", value: "42", icon: Car, trend: "+3", tint: "text-sky-400" },
  { label: "Réservations", value: "18", icon: CalendarCheck, trend: "+12%", tint: "text-emerald-400" },
  { label: "Revenus", value: "124,500 DH", icon: TrendingUp, trend: "+8.2%", tint: "text-amber-400" },
]

export function DashboardShowcase() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Animated gradient blobs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-accent/25 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute right-1/3 top-1/2 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative flex h-full w-full items-center justify-center p-10 lg:p-14">
        <div className="relative w-full max-w-xl">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 flex items-center gap-2"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Dashboard en temps réel
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
              Toute votre agence,{" "}
              <span className="bg-gradient-to-r from-primary via-sky-400 to-accent bg-clip-text text-transparent">
                au bout des doigts
              </span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pilotez votre flotte, anticipez les retours et boostez vos revenus.
            </p>
          </motion.div>

          {/* Main dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1200 }}
            className="relative"
          >
            {/* Glow behind */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-transparent opacity-60 blur-2xl" />

            <div className="relative rounded-2xl border border-border/60 bg-card/80 p-5 shadow-2xl backdrop-blur-xl">
              {/* Window chrome */}
              <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  app.lokarent.ma
                </div>
                <div className="w-12" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                    className="rounded-xl border border-border/40 bg-background/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <s.icon className={`h-4 w-4 ${s.tint}`} />
                      <span className="text-[10px] font-semibold text-emerald-400">{s.trend}</span>
                    </div>
                    <div className="mt-2 text-lg font-semibold text-foreground">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Mini revenue chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="mt-4 rounded-xl border border-border/40 bg-background/40 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Revenus mensuels</span>
                  <span className="text-[10px] text-muted-foreground">7 derniers jours</span>
                </div>
                <svg viewBox="0 0 300 60" className="h-14 w-full">
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(79 109 255)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="rgb(79 109 255)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.2, duration: 1.4, ease: "easeOut" }}
                    d="M 0 45 L 40 38 L 80 42 L 120 28 L 160 32 L 200 18 L 240 22 L 300 10"
                    fill="none"
                    stroke="rgb(79 109 255)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 0.6 }}
                    d="M 0 45 L 40 38 L 80 42 L 120 28 L 160 32 L 200 18 L 240 22 L 300 10 L 300 60 L 0 60 Z"
                    fill="url(#chartFill)"
                  />
                </svg>
              </motion.div>

              {/* Fleet list */}
              <div className="mt-3 flex flex-col gap-1.5">
                {fleetCars.map((car, i) => (
                  <motion.div
                    key={car.plate}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
                    className={`flex items-center justify-between rounded-lg border border-border/40 bg-gradient-to-r ${car.color} p-2.5`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background/60">
                        <Car className="h-3.5 w-3.5 text-foreground" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-foreground">{car.name}</div>
                        <div className="text-[10px] text-muted-foreground">{car.plate}</div>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        car.status === "Loué"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-sky-500/15 text-sky-300"
                      }`}
                    >
                      {car.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Floating alert card - top right */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -right-4 top-20 hidden w-60 rounded-xl border border-amber-500/30 bg-card/90 p-3 shadow-xl backdrop-blur-xl xl:block"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">Assurance expire bientôt</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Dacia Logan • 12345-A-1</div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400">
                  <Clock className="h-3 w-3" />
                  Dans 4 jours
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating return card - bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -left-6 bottom-20 hidden w-60 rounded-xl border border-sky-500/30 bg-card/90 p-3 shadow-xl backdrop-blur-xl xl:block"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
                <CalendarCheck className="h-4 w-4 text-sky-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">Retour prévu aujourd&apos;hui</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Ahmed Benali • 17h30</div>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-sky-400">
                  <ArrowUpRight className="h-3 w-3" />
                  Agadir Aéroport
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
