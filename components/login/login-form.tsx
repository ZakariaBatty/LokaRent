"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, Cloud, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<"email" | "password" | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      {/* Logo + Badge */}
      <div className="mb-10 flex flex-col items-start gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-60 blur-md transition group-hover:opacity-90" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary-foreground">
                <path
                  d="M3 13l2-5a3 3 0 013-2h8a3 3 0 013 2l2 5M5 13h14M5 13v4a1 1 0 001 1h1a1 1 0 001-1v-1m11 1v-4M16 18h1a1 1 0 001-1v-1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            Loka<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Rent</span>
          </span>
        </Link>

        <Badge
          variant="outline"
          className="border-border/60 bg-card/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Plateforme SaaS pour agences de location
        </Badge>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Connexion à votre espace
        </h1>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          Gérez votre flotte, réservations et clients depuis une seule plateforme.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground/90">
            Email
          </label>
          <div className="relative group">
            <div
              className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-primary/40 to-accent/40 opacity-0 blur transition ${focused === "email" ? "opacity-60" : ""}`}
            />
            <div className="relative flex items-center rounded-xl border border-border/60 bg-card/60 backdrop-blur transition focus-within:border-primary/50 focus-within:bg-card/80">
              <Mail className="ml-3.5 h-4 w-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="vous@agence.ma"
                className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground/90">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground transition hover:text-primary"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative group">
            <div
              className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-primary/40 to-accent/40 opacity-0 blur transition ${focused === "password" ? "opacity-60" : ""}`}
            />
            <div className="relative flex items-center rounded-xl border border-border/60 bg-card/60 backdrop-blur transition focus-within:border-primary/50 focus-within:bg-card/80">
              <Lock className="ml-3.5 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                className="w-full bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
            className="border-border/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          />
          <label htmlFor="remember" className="cursor-pointer text-sm text-muted-foreground">
            Se souvenir de moi
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="group relative mt-2 h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary to-accent text-base font-medium shadow-[0_10px_40px_-10px_rgba(79,109,255,0.6)] transition hover:shadow-[0_15px_50px_-10px_rgba(79,109,255,0.8)]"
        >
          {/* Shimmer */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                Se connecter
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
        </Button>
      </form>

      {/* Divider + CTA */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs text-muted-foreground">Pas encore de compte ?</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <Link href="/pricing" className="block">
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl border-border/60 bg-card/40 text-sm font-medium backdrop-blur transition hover:border-primary/40 hover:bg-card/70 hover:text-foreground"
        >
          Commencer gratuitement
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </Link>

      {/* Trust indicators */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground/80">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Données sécurisées
        </span>
        <span className="flex items-center gap-1.5">
          <Cloud className="h-3.5 w-3.5 text-sky-400" />
          Hébergement cloud
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          Support rapide
        </span>
      </div>
    </motion.div>
  )
}
