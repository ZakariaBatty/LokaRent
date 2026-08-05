"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Building2,
  MapPin,
  Car,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { registerAction } from "@/modules/auth/actions"

const CITIES = [
  "Casablanca",
  "Marrakech",
  "Agadir",
  "Tanger",
  "Fès",
  "Rabat",
  "Meknès",
  "Oujda",
  "Autre",
]

type FormData = {
  agencyName: string
  city: string
  vehicleCount: string
  managerName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

type FieldProps = {
  id: keyof FormData
  label: string
  icon: React.ElementType
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  touched?: boolean
  placeholder?: string
  rightSlot?: React.ReactNode
  prefix?: React.ReactNode
  autoComplete?: string
}

function PremiumField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  error,
  touched,
  placeholder,
  rightSlot,
  prefix,
  autoComplete,
}: FieldProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0
  const showError = touched && error
  const isValid = touched && !error && hasValue

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border bg-background/40 px-3.5 transition-all duration-200",
          "border-border/60 backdrop-blur-sm",
          focused && "border-primary/60 bg-background/60 ring-4 ring-primary/10",
          showError && "border-destructive/60 ring-4 ring-destructive/10",
          isValid && !focused && "border-primary/30",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            focused ? "text-primary" : "text-muted-foreground",
            showError && "text-destructive",
          )}
        />
        {prefix}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        {rightSlot}
        {isValid && !rightSlot && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15"
          >
            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {showError && (
          <motion.span
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="flex items-center gap-1 text-xs text-destructive"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

function passwordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const map = [
    { label: "Trop faible", color: "bg-destructive" },
    { label: "Faible", color: "bg-destructive/70" },
    { label: "Moyen", color: "bg-amber-500" },
    { label: "Fort", color: "bg-primary" },
    { label: "Excellent", color: "bg-primary" },
  ]
  return { score, ...map[score] }
}

export function RegisterForm({ plan }: { plan: string }) {
  const router = useRouter()
  const [data, setData] = useState<FormData>({
    agencyName: "",
    city: "",
    vehicleCount: "",
    managerName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!data.agencyName.trim()) e.agencyName = "Le nom de l'agence est requis"
    if (!data.city) e.city = "Veuillez choisir une ville"
    if (!data.vehicleCount || Number(data.vehicleCount) < 1)
      e.vehicleCount = "Indiquez un nombre valide"
    if (!data.managerName.trim()) e.managerName = "Le nom du gérant est requis"
    if (!/^[5-7]\d{8}$/.test(data.phone.replace(/\s/g, "")))
      e.phone = "Numéro marocain invalide (ex. 612 345 678)"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      e.email = "Adresse email invalide"
    if (data.password.length < 8)
      e.password = "Au moins 8 caractères"
    if (data.confirmPassword && data.confirmPassword !== data.password)
      e.confirmPassword = "Les mots de passe ne correspondent pas"
    return e
  }, [data])

  const strength = passwordStrength(data.password)
  const isValid =
    Object.keys(errors).length === 0 && data.acceptTerms

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }
  function touch(key: keyof FormData) {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Mark all touched
    const allTouched = Object.keys(data).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<string, boolean>,
    )
    setTouched(allTouched)
    if (!isValid) return

    setSubmitting(true)
    setSubmitError(null)
    const result = await registerAction({
      ...data,
      vehicleCount: data.vehicleCount,
      planName: plan,
    })
    setSubmitting(false)
    if (!result.success) {
      setSubmitError(result.message ?? "Impossible de créer ce compte.")
      return
    }
    router.push(result.redirectTo ?? `/onboarding?plan=${plan}`)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      onBlur={(e) => {
        const target = e.target as HTMLElement
        const name = target.getAttribute("name")
        if (name) touch(name as keyof FormData)
      }}
      className="flex flex-col gap-5"
    >
      <PremiumField
        id="agencyName"
        label="Nom de l'agence"
        icon={Building2}
        value={data.agencyName}
        onChange={(v) => update("agencyName", v)}
        error={errors.agencyName}
        touched={touched.agencyName}
        placeholder="Atlas Car Rental"
        autoComplete="organization"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* City Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Ville
          </label>
          <Select
            value={data.city}
            onValueChange={(v) => {
              update("city", v)
              touch("city")
            }}
          >
            <SelectTrigger
              className={cn(
                "h-[46px] rounded-xl border bg-background/40 px-3.5 backdrop-blur-sm transition-all",
                "border-border/60 hover:border-primary/40",
                "data-[state=open]:border-primary/60 data-[state=open]:ring-4 data-[state=open]:ring-primary/10",
                touched.city && errors.city && "border-destructive/60",
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin
                  className={cn(
                    "h-4 w-4",
                    data.city ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <SelectValue placeholder="Sélectionner une ville" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-border/60 bg-card/95 backdrop-blur-xl">
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AnimatePresence>
            {touched.city && errors.city && (
              <motion.span
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3 w-3" />
                {errors.city}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <PremiumField
          id="vehicleCount"
          label="Nombre de véhicules"
          icon={Car}
          type="number"
          value={data.vehicleCount}
          onChange={(v) => update("vehicleCount", v)}
          error={errors.vehicleCount}
          touched={touched.vehicleCount}
          placeholder="15"
        />
      </div>

      <PremiumField
        id="managerName"
        label="Nom du gérant"
        icon={User}
        value={data.managerName}
        onChange={(v) => update("managerName", v)}
        error={errors.managerName}
        touched={touched.managerName}
        placeholder="Ahmed Benali"
        autoComplete="name"
      />

      <PremiumField
        id="phone"
        label="Téléphone"
        icon={Phone}
        type="tel"
        value={data.phone}
        onChange={(v) => update("phone", v)}
        error={errors.phone}
        touched={touched.phone}
        placeholder="612 345 678"
        autoComplete="tel"
        prefix={
          <span className="flex items-center gap-1.5 border-r border-border/60 pr-2.5 text-sm font-medium text-muted-foreground">
            <span className="text-base leading-none">🇲🇦</span>
            +212
          </span>
        }
      />

      <PremiumField
        id="email"
        label="Email professionnel"
        icon={Mail}
        type="email"
        value={data.email}
        onChange={(v) => update("email", v)}
        error={errors.email}
        touched={touched.email}
        placeholder="contact@votre-agence.ma"
        autoComplete="email"
      />

      <div className="flex flex-col gap-2">
        <PremiumField
          id="password"
          label="Mot de passe"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          value={data.password}
          onChange={(v) => update("password", v)}
          error={errors.password}
          touched={touched.password}
          placeholder="••••••••"
          autoComplete="new-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        {data.password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-1"
          >
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i < strength.score ? strength.color : "bg-border/60",
                  )}
                />
              ))}
            </div>
            <span className="w-20 text-right text-[11px] font-medium text-muted-foreground">
              {strength.label}
            </span>
          </motion.div>
        )}
      </div>

      <PremiumField
        id="confirmPassword"
        label="Confirmer le mot de passe"
        icon={Lock}
        type={showConfirm ? "text" : "password"}
        value={data.confirmPassword}
        onChange={(v) => update("confirmPassword", v)}
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        placeholder="••••••••"
        autoComplete="new-password"
        rightSlot={
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/40 bg-background/30 p-3.5 transition-colors hover:border-primary/30 hover:bg-background/50">
        <Checkbox
          id="acceptTerms"
          checked={data.acceptTerms}
          onCheckedChange={(v) => update("acceptTerms", Boolean(v))}
          className="mt-0.5 border-border/80 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          J&apos;accepte les{" "}
          <a href="#" className="font-medium text-foreground underline-offset-4 hover:underline">
            conditions d&apos;utilisation
          </a>{" "}
          et la{" "}
          <a href="#" className="font-medium text-foreground underline-offset-4 hover:underline">
            politique de confidentialité
          </a>{" "}
          de LakaRent.
        </span>
      </label>

      {submitError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      <motion.div whileTap={{ scale: isValid && !submitting ? 0.985 : 1 }}>
        <Button
          type="submit"
          disabled={!isValid || submitting}
          className={cn(
            "group relative h-12 w-full overflow-hidden rounded-xl text-sm font-semibold",
            "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground",
            "shadow-[0_10px_40px_-10px_rgba(56,140,255,0.6)] transition-all duration-300",
            "hover:shadow-[0_20px_60px_-10px_rgba(56,140,255,0.8)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {/* Shimmer */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <span className="relative flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création du compte...
              </>
            ) : (
              <>
                Créer mon compte et continuer
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
        </Button>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        Déjà inscrit ?{" "}
        <a href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Se connecter
        </a>
      </p>
    </form>
  )
}
