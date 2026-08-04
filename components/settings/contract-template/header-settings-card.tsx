"use client"

import { motion } from "motion/react"
import { Lock } from "lucide-react"
import { SettingsCard } from "@/components/settings/settings-card"
import { Building2 } from "lucide-react"
import type { ContractTemplate } from "@/lib/contract-template-data"
import { AGENCY_INFO } from "@/lib/contract-template-data"
import { ToggleRow } from "./toggle-row"

export function HeaderSettingsCard({
  template,
  update,
}: {
  template: ContractTemplate
  update: (patch: Partial<ContractTemplate>) => void
}) {
  return (
    <SettingsCard
      title="En-tête du contrat"
      description="Choisissez les informations de votre agence à afficher en haut du document."
      icon={<Building2 className="h-5 w-5" />}
      delay={0.05}
    >
      <div className="space-y-5">
        {/* Auto-filled (locked) */}
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Données pré-remplies depuis Agence
            </p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Nom de l'agence" value={AGENCY_INFO.name} />
            <ReadOnlyField label="Adresse" value={AGENCY_INFO.address} />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 gap-2">
          <ToggleRow
            label="Logo de l'agence"
            description="Affiché en haut à gauche du document"
            checked={template.showLogo}
            onChange={(v) => update({ showLogo: v })}
          />
          <ToggleRow
            label="Téléphone"
            description={AGENCY_INFO.phone}
            checked={template.showPhone}
            onChange={(v) => update({ showPhone: v })}
          />
          <ToggleRow
            label="Email"
            description={AGENCY_INFO.email}
            checked={template.showEmail}
            onChange={(v) => update({ showEmail: v })}
          />
          <ToggleRow
            label="Numéro RC"
            description={AGENCY_INFO.rc}
            checked={template.showRC}
            onChange={(v) => update({ showRC: v })}
          />
          <ToggleRow
            label="ICE"
            description={AGENCY_INFO.ice}
            checked={template.showICE}
            onChange={(v) => update({ showICE: v })}
          />
        </div>
      </div>
    </SettingsCard>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg border border-slate-200/70 bg-white px-3 py-2"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{value}</p>
    </motion.div>
  )
}
