"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, Settings2, Store, Users } from "lucide-react"
import { completeOnboardingAction } from "@/modules/onboarding/actions/complete-onboarding.action"
import { useI18n } from "@/contexts/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  OnboardingProvider,
  useOnboarding,
  type OnboardingState,
  type VehicleCategory,
} from "./onboarding-context"
import { ProgressHeader } from "./progress-header"

const TOTAL_STEPS = 4
const StepFleet = dynamic(() => import("./step-fleet").then((module) => module.StepFleet), {
  ssr: false,
})

type InitialData = Partial<Pick<OnboardingState, "company" | "agency">>

function WizardInner() {
  const router = useRouter()
  const { t } = useI18n()
  const { state } = useOnboarding()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [messageKey, setMessageKey] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  const next = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1)
      setStep((current) => current + 1)
      setMessageKey(null)
    }
  }

  const back = () => {
    if (step > 1) {
      setDirection(-1)
      setStep((current) => current - 1)
      setMessageKey(null)
    }
  }

  const finish = () => {
    setMessageKey(null)
    startTransition(async () => {
      const result = await completeOnboardingAction({
        company: state.company,
        agency: state.agency,
        preferences: state.preferences,
        optionalData: {
          vehicles: state.vehicles.map((vehicle) => ({
            brand: vehicle.marque,
            model: vehicle.modele,
            year: vehicle.annee,
            plate: vehicle.immatriculation,
            category: vehicle.categorie,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            dailyPrice: vehicle.prixJour,
          })),
          customer: state.customer,
        },
      })

      if (!result.success) {
        setMessageKey(result.messageKey)
        return
      }

      setSuccess(true)
      router.push(result.redirectTo)
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <header className="relative border-b border-white/5">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
              <Check className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-base font-medium tracking-tight text-foreground">
                LokaRent
              </span>
              <span className="text-[11px] text-muted-foreground">
                {t("onboarding.header.subtitle")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-card/60 px-3 py-1.5 backdrop-blur">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">
              {t("onboarding.header.step")}{" "}
              <span className="font-medium text-foreground">{step}</span> / {TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1100px] px-6 pb-32 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <ProgressHeader currentStep={step} />
        </div>

        <div className="relative mt-10 sm:mt-14">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/40 shadow-[0_30px_120px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="relative px-6 py-8 sm:px-10 sm:py-10">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 1 && <CompanyProfileStep />}
                  {step === 2 && <AgencyProfileStep />}
                  {step === 3 && <BusinessPreferencesStep />}
                  {step === 4 && <OptionalDataStep />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {messageKey && (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t(messageKey)}
          </p>
        )}

        <div className="sticky bottom-4 mt-8 sm:static sm:mt-10">
          <div className="flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl border border-white/10 bg-background/80 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:border-transparent sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              disabled={step === 1 || pending}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("onboarding.actions.back")}
            </Button>

            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={next} disabled={pending} className="gap-2">
                {t("onboarding.actions.continue")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={finish} disabled={pending || success} className="gap-2">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {pending
                  ? t("onboarding.actions.finishing")
                  : t("onboarding.actions.finish")}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
    </div>
  )
}

function CompanyProfileStep() {
  const { t } = useI18n()
  const { state, setCompany } = useOnboarding()
  const company = state.company

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<Building2 className="h-5 w-5" />}
        title={t("onboarding.company.title")}
        description={t("onboarding.company.description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("onboarding.company.legalName")}>
          <Input value={company.legalName} onChange={(event) => setCompany({ ...company, legalName: event.target.value })} />
        </Field>
        <Field label={t("onboarding.company.phone")}>
          <Input value={company.phone} onChange={(event) => setCompany({ ...company, phone: event.target.value })} />
        </Field>
        <Field label={t("onboarding.company.country")}>
          <Select value={company.countryCode} onValueChange={(value) => setCompany({ ...company, countryCode: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MA">{t("onboarding.company.morocco")}</SelectItem>
              <SelectItem value="FR">{t("onboarding.company.france")}</SelectItem>
              <SelectItem value="ES">{t("onboarding.company.spain")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("onboarding.company.timezone")}>
          <Select value={company.timezone} onValueChange={(value) => setCompany({ ...company, timezone: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Casablanca">Africa/Casablanca</SelectItem>
              <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
              <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("onboarding.company.currency")}>
          <Select value={company.currency} onValueChange={(value) => setCompany({ ...company, currency: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MAD">MAD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("onboarding.company.logoUrl")}>
          <Input value={company.logoUrl} onChange={(event) => setCompany({ ...company, logoUrl: event.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("onboarding.company.address")}>
            <Input value={company.address} onChange={(event) => setCompany({ ...company, address: event.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  )
}

function AgencyProfileStep() {
  const { t } = useI18n()
  const { state, setAgency } = useOnboarding()
  const agency = state.agency

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<Store className="h-5 w-5" />}
        title={t("onboarding.agency.title")}
        description={t("onboarding.agency.description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("onboarding.agency.name")}>
          <Input value={agency.name} onChange={(event) => setAgency({ ...agency, name: event.target.value })} />
        </Field>
        <Field label={t("onboarding.agency.code")}>
          <Input value={agency.code} onChange={(event) => setAgency({ ...agency, code: event.target.value.toUpperCase() })} />
        </Field>
        <Field label={t("onboarding.agency.phone")}>
          <Input value={agency.phone} onChange={(event) => setAgency({ ...agency, phone: event.target.value })} />
        </Field>
        <Field label={t("onboarding.agency.email")}>
          <Input value={agency.email} onChange={(event) => setAgency({ ...agency, email: event.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("onboarding.agency.address")}>
            <Input value={agency.address} onChange={(event) => setAgency({ ...agency, address: event.target.value })} />
          </Field>
        </div>
      </div>
      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-background/50 p-4">
        <span className="text-sm font-medium text-foreground">
          {t("onboarding.agency.primary")}
        </span>
        <Switch
          checked={agency.isPrimaryConfirmed}
          onCheckedChange={(value) => setAgency({ ...agency, isPrimaryConfirmed: value })}
        />
      </label>
    </div>
  )
}

function BusinessPreferencesStep() {
  const { t } = useI18n()
  const { state, setPreferences } = useOnboarding()
  const preferences = state.preferences

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={<Settings2 className="h-5 w-5" />}
        title={t("onboarding.preferences.title")}
        description={t("onboarding.preferences.description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("onboarding.preferences.invoicePrefix")}>
          <Input value={preferences.invoicePrefix} onChange={(event) => setPreferences({ ...preferences, invoicePrefix: event.target.value })} />
        </Field>
        <Field label={t("onboarding.preferences.reservationPrefix")}>
          <Input value={preferences.reservationPrefix} onChange={(event) => setPreferences({ ...preferences, reservationPrefix: event.target.value })} />
        </Field>
        <Field label={t("onboarding.preferences.contractPrefix")}>
          <Input value={preferences.contractPrefix} onChange={(event) => setPreferences({ ...preferences, contractPrefix: event.target.value })} />
        </Field>
        <Field label={t("onboarding.preferences.taxRate")}>
          <Input type="number" value={preferences.taxRate} onChange={(event) => setPreferences({ ...preferences, taxRate: event.target.value })} />
        </Field>
        <Field label={t("onboarding.preferences.language")}>
          <Select value={preferences.defaultLanguage} onValueChange={(value: "fr" | "en") => setPreferences({ ...preferences, defaultLanguage: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">{t("common.french")}</SelectItem>
              <SelectItem value="en">{t("common.english")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleRow
          label={t("onboarding.preferences.emailNotifications")}
          checked={preferences.emailNotifications}
          onCheckedChange={(value) => setPreferences({ ...preferences, emailNotifications: value })}
        />
        <ToggleRow
          label={t("onboarding.preferences.whatsappNotifications")}
          checked={preferences.whatsappNotifications}
          onCheckedChange={(value) => setPreferences({ ...preferences, whatsappNotifications: value })}
        />
      </div>
    </div>
  )
}

function OptionalDataStep() {
  const { t } = useI18n()
  const { state, setCustomer } = useOnboarding()
  const customer = state.customer

  return (
    <div className="space-y-8">
      <SectionTitle
        icon={<Users className="h-5 w-5" />}
        title={t("onboarding.optional.title")}
        description={t("onboarding.optional.description")}
      />
      <StepFleet />
      <div className="rounded-2xl border border-white/10 bg-card/40 p-5">
        <h3 className="text-base font-medium text-foreground">{t("onboarding.optional.customerTitle")}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label={t("onboarding.optional.customerType")}>
            <Select value={customer.type} onValueChange={(value: "individual" | "company") => setCustomer({ ...customer, type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">{t("onboarding.customerType.individual")}</SelectItem>
                <SelectItem value="company">{t("onboarding.customerType.company")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("onboarding.optional.customerName")}>
            <Input value={customer.fullName} onChange={(event) => setCustomer({ ...customer, fullName: event.target.value })} />
          </Field>
          <Field label={t("onboarding.optional.customerPhone")}>
            <Input value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
          </Field>
          <Field label={t("onboarding.optional.customerEmail")}>
            <Input value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-background/50 p-4">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  )
}

export function OnboardingWizard({ initialData }: { initialData?: InitialData }) {
  return (
    <OnboardingProvider initialData={initialData}>
      <WizardInner />
    </OnboardingProvider>
  )
}
