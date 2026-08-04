"use client"

import { useMemo, useState, useEffect } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  Banknote,
  Building2,
  ChevronDown,
  Clock,
  Facebook,
  Fuel,
  Globe,
  Infinity as InfinityIcon,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Settings2,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react"
import {
  Field,
  FieldGrid,
  FieldLabel,
  SettingsCard,
} from "@/components/settings/settings-card"
import { LogoUploader } from "@/components/settings/agency/logo-uploader"
import { SubscriptionCard } from "@/components/settings/agency/subscription-card"
import {
  SaveStatusPill,
  StickySaveBar,
} from "@/components/settings/sticky-save-bar"
import { useAgency } from "@/contexts/agency-context"

type FormState = {
  logo: string | null
  name: string
  rc: string
  ice: string
  patente: string
  city: string
  address: string
  postalCode: string
  phone: string
  whatsapp: string
  email: string
  website: string
  facebook: string
  instagram: string
  defaultCaution: string
  minDuration: string
  pickupTime: string
  returnTime: string
  fuelPolicy: "plein-plein" | "meme-niveau" | "plein-libre"
  unlimitedKm: boolean
  kmOverageFee: string
  bank: string
  rib: string
  accountHolder: string
}

const initial: FormState = {
  logo: null,
  name: "LokaRent Casablanca",
  rc: "245876",
  ice: "001523849000056",
  patente: "31204589",
  city: "Casablanca",
  address: "23 Boulevard Zerktouni, Quartier Maârif",
  postalCode: "20100",
  phone: "+212 522 45 67 89",
  whatsapp: "+212 661 23 45 67",
  email: "contact@lokarent.ma",
  website: "https://www.lokarent.ma",
  facebook: "https://facebook.com/lokarent",
  instagram: "@lokarent.ma",
  defaultCaution: "5000",
  minDuration: "1",
  pickupTime: "10:00",
  returnTime: "10:00",
  fuelPolicy: "plein-plein",
  unlimitedKm: true,
  kmOverageFee: "2.5",
  bank: "Attijariwafa",
  rib: "007 780 0001234567890123 45",
  accountHolder: "LokaRent SARL",
}

const cities = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Agadir",
  "Fès",
  "Meknès",
  "Oujda",
  "Tétouan",
  "El Jadida",
]

const banks = [
  "Attijariwafa",
  "CIH",
  "BMCE",
  "Banque Populaire",
  "BMCI",
  "Société Générale",
  "CFG",
  "Autre",
]

export default function AgencySettingsPage() {
  const { activeAgency } = useAgency()

  // Build initial form state from active agency data
  const getInitialForm = (): FormState => ({
    ...initial,
    name: activeAgency?.name ?? initial.name,
    city: activeAgency?.city ?? initial.city,
    address: activeAgency?.address ?? initial.address,
    phone: activeAgency?.phone ?? initial.phone,
    email: activeAgency?.email ?? initial.email,
    website: activeAgency?.website ? `https://${activeAgency.website}` : initial.website,
  })

  const [form, setForm] = useState<FormState>(getInitialForm)

  // Reset when agency switches
  useEffect(() => {
    setForm(getInitialForm())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAgency?.id])
  const [saved, setSaved] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(saved),
    [form, saved],
  )

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 900))
    setSaved(form)
    setLastSavedAt(new Date())
    setSaving(false)
    toast.success("Paramètres enregistrés", {
      description: "Les informations de votre agence ont été mises à jour.",
    })
  }

  function handleReset() {
    setForm(saved)
    toast("Modifications annulées", { description: "Aucune donnée n'a été enregistrée." })
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Page header */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Paramètres de l&apos;agence
              </h1>
              <SaveStatusPill
                dirty={dirty}
                saving={saving}
                lastSavedAt={lastSavedAt}
              />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Configurez les informations et préférences principales de votre agence.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </motion.header>

      {/* General info */}
      <SettingsCard
        title="Informations générales"
        description="Identité juridique et localisation de votre agence."
        icon={<Building2 className="h-4 w-4" />}
      >
        <div className="space-y-6">
          <LogoUploader
            initial={form.logo}
            agencyName={form.name}
            onChange={(v) => update("logo", v)}
          />

          <div className="h-px bg-slate-100" />

          <FieldGrid>
            <Field>
              <FieldLabel label="Nom de l'agence" required />
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="LokaRent Casablanca"
              />
            </Field>
            <Field>
              <FieldLabel label="Ville" required />
              <SelectField
                value={form.city}
                onChange={(v) => update("city", v)}
                options={cities}
                icon={<MapPin className="h-3.5 w-3.5" />}
              />
            </Field>
            <Field>
              <FieldLabel label="Numéro RC" required hint="Registre du commerce" />
              <input
                className="field-input font-mono"
                value={form.rc}
                onChange={(e) => update("rc", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel
                label="ICE"
                required
                hint="Identifiant Commun de l'Entreprise"
              />
              <input
                className="field-input font-mono"
                value={form.ice}
                onChange={(e) => update("ice", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel label="Numéro de patente" required />
              <input
                className="field-input font-mono"
                value={form.patente}
                onChange={(e) => update("patente", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel label="Code postal" />
              <input
                className="field-input font-mono"
                value={form.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
              />
            </Field>
          </FieldGrid>

          <Field>
            <FieldLabel label="Adresse complète" required />
            <textarea
              className="field-input min-h-[88px] resize-none"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Boulevard, quartier, ville..."
            />
          </Field>
        </div>
      </SettingsCard>

      {/* Contact */}
      <SettingsCard
        title="Contact"
        description="Coordonnées affichées sur les contrats et communications client."
        icon={<Phone className="h-4 w-4" />}
      >
        <FieldGrid>
          <Field>
            <FieldLabel label="Téléphone principal" required />
            <IconInput
              icon={<Phone className="h-3.5 w-3.5" />}
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="+212 522 ..."
            />
          </Field>
          <Field>
            <FieldLabel label="Téléphone WhatsApp" />
            <IconInput
              icon={
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] font-black text-white">
                  W
                </span>
              }
              value={form.whatsapp}
              onChange={(v) => update("whatsapp", v)}
              placeholder="+212 661 ..."
            />
          </Field>
          <Field>
            <FieldLabel label="Email professionnel" required />
            <IconInput
              icon={<Mail className="h-3.5 w-3.5" />}
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="contact@..."
              type="email"
            />
          </Field>
          <Field>
            <FieldLabel label="Site web" optional />
            <IconInput
              icon={<Globe className="h-3.5 w-3.5" />}
              value={form.website}
              onChange={(v) => update("website", v)}
              placeholder="https://..."
              suffix={
                form.website && (
                  <a
                    href={form.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Aperçu
                  </a>
                )
              }
            />
          </Field>
        </FieldGrid>
      </SettingsCard>

      {/* Social */}
      <SettingsCard
        title="Réseaux sociaux"
        description="Liens optionnels affichés sur vos documents et page publique."
        icon={<Sparkles className="h-4 w-4" />}
      >
        <FieldGrid>
          <Field>
            <FieldLabel label="Facebook" optional />
            <IconInput
              icon={<Facebook className="h-3.5 w-3.5 text-[#1877F2]" />}
              value={form.facebook}
              onChange={(v) => update("facebook", v)}
              placeholder="facebook.com/votre-agence"
            />
          </Field>
          <Field>
            <FieldLabel label="Instagram" optional />
            <IconInput
              icon={<Instagram className="h-3.5 w-3.5 text-[#E1306C]" />}
              value={form.instagram}
              onChange={(v) => update("instagram", v)}
              placeholder="@votre-agence"
            />
          </Field>
        </FieldGrid>
      </SettingsCard>

      {/* Rental settings */}
      <SettingsCard
        title="Paramètres de location"
        description="Règles opérationnelles appliquées par défaut aux nouveaux contrats."
        icon={<Settings2 className="h-4 w-4" />}
      >
        <div className="space-y-6">
          <FieldGrid>
            <Field>
              <FieldLabel label="Caution par défaut (DH)" required />
              <div className="relative">
                <input
                  type="number"
                  className="field-input pr-12"
                  value={form.defaultCaution}
                  onChange={(e) => update("defaultCaution", e.target.value)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  DH
                </span>
              </div>
            </Field>
            <Field>
              <FieldLabel label="Durée minimum (jours)" required />
              <div className="relative">
                <input
                  type="number"
                  className="field-input pr-14"
                  value={form.minDuration}
                  onChange={(e) => update("minDuration", e.target.value)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  jours
                </span>
              </div>
            </Field>
            <Field>
              <FieldLabel label="Heure de prise en charge par défaut" />
              <IconInput
                icon={<Clock className="h-3.5 w-3.5" />}
                value={form.pickupTime}
                onChange={(v) => update("pickupTime", v)}
                type="time"
              />
            </Field>
            <Field>
              <FieldLabel label="Heure de restitution par défaut" />
              <IconInput
                icon={<Clock className="h-3.5 w-3.5" />}
                value={form.returnTime}
                onChange={(v) => update("returnTime", v)}
                type="time"
              />
            </Field>
          </FieldGrid>

          <div>
            <FieldLabel label="Politique carburant" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: "plein-plein", label: "Plein / Plein", hint: "Standard" },
                { id: "meme-niveau", label: "Même niveau", hint: "Flexible" },
                { id: "plein-libre", label: "Plein, retour libre", hint: "Premium" },
              ].map((opt) => {
                const active = form.fuelPolicy === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update("fuelPolicy", opt.id as FormState["fuelPolicy"])}
                    className={`relative flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2 transition ${
                        active ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <Fuel className="h-3.5 w-3.5 text-slate-500" />
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <FieldLabel label="Kilométrage" />
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-700 ring-1 ring-inset ring-slate-200">
                <InfinityIcon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Kilométrage illimité</p>
                <p className="text-xs text-slate-500">
                  Activez pour proposer des locations sans limite kilométrique.
                </p>
              </div>
              <Toggle
                value={form.unlimitedKm}
                onChange={(v) => update("unlimitedKm", v)}
              />
            </div>
            {!form.unlimitedKm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <Field>
                  <FieldLabel
                    label="Frais de dépassement km"
                    hint="Appliqué au-delà du forfait inclus"
                  />
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      step="0.5"
                      className="field-input pr-16"
                      value={form.kmOverageFee}
                      onChange={(e) => update("kmOverageFee", e.target.value)}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      DH/km
                    </span>
                  </div>
                </Field>
              </motion.div>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* Banking */}
      <SettingsCard
        title="Informations bancaires"
        description="Informations utilisées dans les contrats."
        icon={<Wallet className="h-4 w-4" />}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <Shield className="h-3 w-3" />
            Données chiffrées
          </span>
        }
      >
        <FieldGrid>
          <Field>
            <FieldLabel label="Banque" required />
            <SelectField
              value={form.bank}
              onChange={(v) => update("bank", v)}
              options={banks}
              icon={<Banknote className="h-3.5 w-3.5" />}
            />
          </Field>
          <Field>
            <FieldLabel label="Nom du titulaire" required />
            <input
              className="field-input"
              value={form.accountHolder}
              onChange={(e) => update("accountHolder", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field>
              <FieldLabel label="RIB / IBAN" required hint="24 chiffres au format MA" />
              <input
                className="field-input font-mono tracking-wider"
                value={form.rib}
                onChange={(e) => update("rib", e.target.value)}
                placeholder="007 780 0001234567890123 45"
              />
            </Field>
          </div>
        </FieldGrid>
      </SettingsCard>

      {/* Subscription */}
      <SubscriptionCard plan={activeAgency?.plan ?? "PRO"} />

      {/* Sticky save bar */}
      <StickySaveBar
        dirty={dirty}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={handleSave}
        onReset={handleReset}
      />
    </div>
  )
}

/* ---------- Inline field helpers ---------- */

function IconInput({
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  suffix,
}: {
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  suffix?: React.ReactNode
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input pl-9 pr-20"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>
      )}
    </div>
  )
}

function SelectField({
  value,
  onChange,
  options,
  icon,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  icon?: React.ReactNode
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`field-input ${icon ? "pl-9" : ""} appearance-none pr-9`}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        value ? "bg-indigo-600" : "bg-slate-300"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}
