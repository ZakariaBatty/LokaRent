"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ChevronRight, Eye, FileText, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { SaveStatusPill, StickySaveBar } from "@/components/settings/sticky-save-bar"
import {
  type ContractTemplate,
  DEFAULT_TEMPLATE,
} from "@/lib/contract-template-data"
import { HeaderSettingsCard } from "@/components/settings/contract-template/header-settings-card"
import { TitleSettingsCard } from "@/components/settings/contract-template/title-settings-card"
import { ClausesSettingsCard } from "@/components/settings/contract-template/clauses-settings-card"
import { FooterSettingsCard } from "@/components/settings/contract-template/footer-settings-card"
import { LanguageSettingsCard } from "@/components/settings/contract-template/language-settings-card"
import { ContractPreview } from "@/components/settings/contract-template/contract-preview"
import { PdfPreviewModal } from "@/components/settings/contract-template/pdf-preview-modal"
import { ResetConfirmDialog } from "@/components/settings/contract-template/reset-confirm-dialog"

export default function ContractTemplatePage() {
  const [baseline, setBaseline] = useState<ContractTemplate>(DEFAULT_TEMPLATE)
  const [template, setTemplate] = useState<ContractTemplate>(DEFAULT_TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const dirty = useMemo(
    () => JSON.stringify(template) !== JSON.stringify(baseline),
    [template, baseline]
  )

  const update = (patch: Partial<ContractTemplate>) =>
    setTemplate((prev) => ({ ...prev, ...patch }))

  const enabledClauses = template.clauses.filter((c) => c.enabled).length

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setBaseline(template)
    setLastSavedAt(new Date())
    setSaving(false)
    toast.success("Modèle de contrat enregistré", {
      description: `${enabledClauses} clauses actives · langue ${template.language.toUpperCase()}`,
    })
  }

  const handleResetForm = () => {
    setTemplate(baseline)
    toast.info("Modifications annulées")
  }

  const handleResetToDefault = () => {
    setTemplate(DEFAULT_TEMPLATE)
    setResetOpen(false)
    toast.success("Modèle réinitialisé", {
      description: "Le contrat reprend la configuration LokaRent par défaut.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-slate-200/70 bg-white/80 px-4 pb-4 pt-4 backdrop-blur"
      >
        <nav className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Link href="/settings" className="hover:text-indigo-600">
            Paramètres
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-900">Modèle de Contrat</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Modèle de Contrat
                </h1>
                <SaveStatusPill
                  dirty={dirty}
                  saving={saving}
                  lastSavedAt={lastSavedAt}
                />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Personnalisez chaque section du contrat de location. Les changements
                sont reflétés instantanément dans l&apos;aperçu.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-700 hover:to-violet-700"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Eye className="relative h-4 w-4" />
              <span className="relative">Aperçu PDF</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* LEFT — Settings */}
        <div className="space-y-4 pb-24">
          <HeaderSettingsCard template={template} update={update} />
          <TitleSettingsCard template={template} update={update} />
          <ClausesSettingsCard template={template} update={update} />
          <FooterSettingsCard template={template} update={update} />
          <LanguageSettingsCard template={template} update={update} />
        </div>

        {/* RIGHT — Live Preview */}
        <div className="hidden xl:block">
          <div className="sticky top-32">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  <Eye className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Aperçu en direct</p>
                  <p className="text-[11px] text-slate-500">
                    {enabledClauses} clauses · {template.language === "fr" ? "Français" : template.language === "ar" ? "العربية" : "Bilingue"}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Synchronisé
              </span>
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-100 p-4 shadow-inner"
              style={{ height: "calc(100vh - 220px)" }}
            >
              <div className="h-full overflow-y-auto rounded-xl">
                <ContractPreview template={template} scale={0.7} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile preview note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 xl:hidden">
        <p className="text-sm font-semibold text-slate-900">
          Aperçu disponible sur écran plus large
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Pour visualiser le contrat en direct, ouvrez l&apos;aperçu PDF ci-dessus.
        </p>
      </div>

      <StickySaveBar
        dirty={dirty}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={handleSave}
        onReset={handleResetForm}
      />

      <PdfPreviewModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        template={template}
      />

      <ResetConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetToDefault}
      />
    </div>
  )
}
