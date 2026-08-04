"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { toast } from "sonner"
import {
  CalendarRange,
  Clock,
  History,
  Layers,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Tag,
} from "lucide-react"
import { SettingsCard } from "@/components/settings/settings-card"
import { SaveStatusPill, StickySaveBar } from "@/components/settings/sticky-save-bar"
import { PricingTable } from "@/components/settings/pricing/pricing-table"
import { SeasonsManager } from "@/components/settings/pricing/seasons-manager"
import { OptionsTable } from "@/components/settings/pricing/options-table"
import { LateReturnPolicy } from "@/components/settings/pricing/late-return-policy"
import { LivePreviewCard } from "@/components/settings/pricing/live-preview-card"
import {
  type CategoryRow,
  type LatePolicy,
  type PricingOption,
  type Season,
  defaultCategories,
  defaultLatePolicy,
  defaultOptions,
  defaultSeasons,
  suggestedMonth,
  suggestedWeek,
} from "@/lib/pricing-grid-data"

type Snapshot = {
  categories: CategoryRow[]
  seasonsEnabled: boolean
  seasons: Season[]
  options: PricingOption[]
  late: LatePolicy
}

const initial: Snapshot = {
  categories: defaultCategories,
  seasonsEnabled: true,
  seasons: defaultSeasons,
  options: defaultOptions,
  late: defaultLatePolicy,
}

export default function PricingSettingsPage() {
  const [state, setState] = useState<Snapshot>(initial)
  const [saved, setSaved] = useState<Snapshot>(initial)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("citadine")

  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(saved), [state, saved])

  function patchCategory(id: string, patch: Partial<CategoryRow>) {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  function addCategory() {
    const id = `nouvelle-${Math.random().toString(36).slice(2, 6)}`
    setState((s) => ({
      ...s,
      categories: [
        ...s.categories,
        {
          id,
          name: "Nouvelle catégorie",
          perDay: 300,
          perWeek: suggestedWeek(300),
          perMonth: suggestedMonth(300),
          caution: 5000,
        },
      ],
    }))
    setSelectedCategoryId(id)
  }

  function duplicateCategory(id: string) {
    const cat = state.categories.find((c) => c.id === id)
    if (!cat) return
    const newId = `${cat.id}-copie-${Math.random().toString(36).slice(2, 5)}`
    setState((s) => {
      const idx = s.categories.findIndex((c) => c.id === id)
      const copy: CategoryRow = {
        ...cat,
        id: newId,
        name: `${cat.name} (copie)`,
        popular: false,
      }
      const next = [...s.categories]
      next.splice(idx + 1, 0, copy)
      return { ...s, categories: next }
    })
  }

  function deleteCategory(id: string) {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
    }))
    if (selectedCategoryId === id) {
      setSelectedCategoryId(state.categories[0]?.id ?? "")
    }
  }

  function patchSeason(id: string, patch: Partial<Season>) {
    setState((s) => ({
      ...s,
      seasons: s.seasons.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }))
  }

  function addSeason() {
    const start = new Date()
    start.setDate(start.getDate() + 30)
    const end = new Date(start)
    end.setDate(end.getDate() + 30)
    setState((s) => ({
      ...s,
      seasons: [
        ...s.seasons,
        {
          id: `saison-${Math.random().toString(36).slice(2, 6)}`,
          name: "Nouvelle saison",
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          surcharge: 15,
          scope: "all",
          categoryIds: [],
          active: true,
          accent: "indigo",
        },
      ],
    }))
  }

  function deleteSeason(id: string) {
    setState((s) => ({ ...s, seasons: s.seasons.filter((x) => x.id !== id) }))
  }

  function patchOption(id: string, patch: Partial<PricingOption>) {
    setState((s) => ({
      ...s,
      options: s.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }))
  }

  function addOption() {
    setState((s) => ({
      ...s,
      options: [
        ...s.options,
        {
          id: `opt-${Math.random().toString(36).slice(2, 6)}`,
          name: "Nouvelle option",
          icon: "navigation",
          perDay: 25,
          included: false,
        },
      ],
    }))
  }

  function deleteOption(id: string) {
    setState((s) => ({ ...s, options: s.options.filter((o) => o.id !== id) }))
  }

  function patchLate(patch: Partial<LatePolicy>) {
    setState((s) => ({ ...s, late: { ...s.late, ...patch } }))
  }

  async function save() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaved(state)
    setLastSavedAt(new Date())
    setSaving(false)
    toast.success("Grille tarifaire enregistrée", {
      description: "Vos nouveaux tarifs sont actifs immédiatement.",
    })
  }

  function reset() {
    setState(saved)
    toast("Modifications annulées")
  }

  function restoreDefaults() {
    setState(initial)
    toast("Grille par défaut restaurée", {
      description: "Cliquez sur Enregistrer pour appliquer.",
    })
  }

  // Stats
  const avgPerDay = Math.round(
    state.categories.reduce((s, c) => s + c.perDay, 0) /
      Math.max(1, state.categories.length),
  )
  const activeSeasons = state.seasonsEnabled
    ? state.seasons.filter((s) => s.active).length
    : 0
  const includedOptions = state.options.filter((o) => o.included).length

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              Paramètres
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tarification
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Grille Tarifaire
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Définissez vos prix par catégorie de véhicule, vos saisons, options et règles
            opérationnelles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SaveStatusPill dirty={dirty} saving={saving} lastSavedAt={lastSavedAt} />
          <button
            type="button"
            onClick={restoreDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-700 hover:to-violet-700"
          >
            <Plus className="h-4 w-4" />
            Ajouter une catégorie
          </button>
        </div>
      </motion.div>

      {/* Stat tiles */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <StatTile
          icon={<Layers className="h-4 w-4" />}
          tone="indigo"
          label="Catégories"
          value={state.categories.length.toString()}
          hint="actives"
        />
        <StatTile
          icon={<Sparkles className="h-4 w-4" />}
          tone="emerald"
          label="Prix moyen / jour"
          value={`${new Intl.NumberFormat("fr-FR").format(avgPerDay)} DH`}
          hint="sur la flotte"
        />
        <StatTile
          icon={<CalendarRange className="h-4 w-4" />}
          tone="amber"
          label="Saisons actives"
          value={activeSeasons.toString()}
          hint={state.seasonsEnabled ? "appliquées" : "désactivées"}
        />
        <StatTile
          icon={<Tag className="h-4 w-4" />}
          tone="violet"
          label="Options incluses"
          value={`${includedOptions}/${state.options.length}`}
          hint="par défaut"
        />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SettingsCard
            title="Tarifs par catégorie"
            description="Cliquez n'importe quelle cellule pour la modifier. Les prix semaine et mois sont suggérés automatiquement."
            icon={<Layers className="h-4 w-4" />}
            action={
              <span className="hidden items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                Suggestions intelligentes
              </span>
            }
          >
            <PricingTable
              rows={state.categories}
              onChange={patchCategory}
              onDuplicate={duplicateCategory}
              onDelete={deleteCategory}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </SettingsCard>

          <SettingsCard
            title="Tarifs saisonniers"
            description="Appliquez automatiquement des majorations ou remises sur vos catégories pendant des périodes définies."
            icon={<CalendarRange className="h-4 w-4" />}
            delay={0.05}
          >
            <SeasonsManager
              enabled={state.seasonsEnabled}
              onToggleEnabled={(on) => setState((s) => ({ ...s, seasonsEnabled: on }))}
              seasons={state.seasons}
              onChange={patchSeason}
              onAdd={addSeason}
              onDelete={deleteSeason}
              categories={state.categories}
            />
          </SettingsCard>

          <SettingsCard
            title="Options & extras"
            description="Tarifs des prestations additionnelles facturées en supplément de la location."
            icon={<Settings2 className="h-4 w-4" />}
            delay={0.1}
          >
            <OptionsTable
              options={state.options}
              onChange={patchOption}
              onDelete={deleteOption}
              onAdd={addOption}
            />
          </SettingsCard>

          <SettingsCard
            title="Politique de retard"
            description="Définissez la tolérance et les frais facturés en cas de retour tardif du véhicule."
            icon={<Clock className="h-4 w-4" />}
            delay={0.15}
          >
            <LateReturnPolicy policy={state.late} onChange={patchLate} />
          </SettingsCard>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 text-xs text-slate-500"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
              <History className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <span className="font-semibold text-slate-700">Historique des prix</span> ·
              chaque modification est versionnée et peut être restaurée.
            </div>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Voir l&apos;historique
            </button>
          </motion.div>
        </div>

        {/* Live preview sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <LivePreviewCard
            categories={state.categories}
            seasons={state.seasons}
            options={state.options}
            seasonsEnabled={state.seasonsEnabled}
            selectedCategoryId={selectedCategoryId || state.categories[0]?.id}
            onSelectCategory={setSelectedCategoryId}
          />
        </motion.aside>
      </div>

      <StickySaveBar
        dirty={dirty}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={save}
        onReset={reset}
      />
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone: "indigo" | "emerald" | "amber" | "violet"
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  }
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset ${tones[tone]}`}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <div className="mt-2 text-xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{hint}</div>
    </div>
  )
}
