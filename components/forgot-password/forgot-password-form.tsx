"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import {
  Mail,
  ArrowRight,
  Loader2,
  Check,
  ArrowLeft,
  ShieldCheck,
  Lock,
  MailCheck,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sentTo, setSentTo] = useState("")

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const showError = touched && email.length > 0 && !isValidEmail

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail) {
      setTouched(true)
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setSentTo(email)
    setSubmitted(true)
    setIsLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[480px]"
    >
      {/* Floating accents around the card */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-6 -left-6 h-12 w-12 rounded-full bg-primary/30 blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-4 h-16 w-16 rounded-full bg-accent/30 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-10 h-2 w-2 rounded-full bg-primary"
        animate={{ y: [-10, 10, -10], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/4 -left-8 h-1.5 w-1.5 rounded-full bg-accent"
        animate={{ y: [10, -10, 10], opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Top inner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <AnimatePresence mode="wait" initial={false}>
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Logo + brand */}
              <div className="flex flex-col items-center gap-3 text-center">
                <Link href="/" className="group inline-flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-60 blur-md transition group-hover:opacity-90" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                      <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                    </div>
                  </div>
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    Loka<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Rent</span>
                  </span>
                </Link>

                <Badge
                  variant="outline"
                  className="mt-2 gap-1.5 border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Récupération sécurisée
                </Badge>

                <div className="mt-3 space-y-2">
                  <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground text-balance">
                    Mot de passe oublié ?
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                    Entrez votre adresse email professionnelle pour recevoir un lien de réinitialisation.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                    Adresse email
                  </label>
                  <div className="group relative">
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 blur-md transition group-focus-within:opacity-100 ${
                        showError ? "from-destructive/30 via-destructive/30 to-destructive/30 opacity-100" : ""
                      }`}
                    />
                    <div
                      className={`relative flex items-center gap-3 rounded-lg border bg-input/50 px-3.5 py-3 backdrop-blur-sm transition-all ${
                        showError
                          ? "border-destructive/60"
                          : "border-border/70 focus-within:border-primary/60 focus-within:bg-input/70"
                      }`}
                    >
                      <Mail
                        className={`h-4 w-4 flex-shrink-0 transition-colors ${
                          showError ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                        }`}
                      />
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="vous@agence.ma"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched(true)}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                        required
                      />
                      <AnimatePresence>
                        {isValidEmail && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15"
                          >
                            <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <AnimatePresence>
                    {showError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-destructive"
                      >
                        Adresse email invalide.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading || !isValidEmail}
                  className="group relative h-11 w-full overflow-hidden bg-gradient-to-r from-primary to-accent font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le lien de réinitialisation
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                </Button>
              </form>

              {/* Divider + back link */}
              <div className="mt-7 flex flex-col items-center gap-4">
                <div className="flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">ou</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Retour à la connexion
                </Link>
              </div>

              {/* Trust line */}
              <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80">
                <Lock className="h-3 w-3" />
                <span>Connexion sécurisée</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span>Données protégées</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Success icon */}
              <div className="relative mb-6">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 ring-1 ring-emerald-400/40"
                >
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.35 }}
                    className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40"
                  >
                    <Check className="h-6 w-6 text-white" strokeWidth={3.5} />
                  </motion.div>
                </motion.div>

                {/* Animated ripple rings */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-emerald-400/40"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                />
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-emerald-400/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut", delay: 0.5 }}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.4 }}
                className="space-y-3"
              >
                <Badge
                  variant="outline"
                  className="gap-1.5 border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400"
                >
                  <MailCheck className="h-3.5 w-3.5" />
                  Email envoyé
                </Badge>
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground text-balance">
                  Vérifiez votre boîte mail
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  Un lien de réinitialisation a été envoyé à&nbsp;:
                </p>
                <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3.5 py-2 backdrop-blur">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium text-foreground">{sentTo}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vérifiez votre boîte mail ainsi que vos spams.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-7 flex w-full flex-col items-center gap-4"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setEmail("")
                    setTouched(false)
                  }}
                  className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Renvoyer avec une autre adresse
                </button>
                <div className="flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Retour à la connexion
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
