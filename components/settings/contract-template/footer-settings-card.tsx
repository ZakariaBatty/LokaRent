"use client"

import { PenTool } from "lucide-react"
import { SettingsCard, FieldLabel, Field } from "@/components/settings/settings-card"
import type { ContractTemplate } from "@/lib/contract-template-data"
import { ToggleRow } from "./toggle-row"

export function FooterSettingsCard({
  template,
  update,
}: {
  template: ContractTemplate
  update: (patch: Partial<ContractTemplate>) => void
}) {
  return (
    <SettingsCard
      title="Pied de page"
      description="Configurez les zones de signature et le texte affiché en bas du document."
      icon={<PenTool className="h-5 w-5" />}
      delay={0.2}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          <ToggleRow
            label="Lu et approuvé — Signature du locataire"
            description="Bloc de signature côté client"
            checked={template.showClientSignature}
            onChange={(v) => update({ showClientSignature: v })}
          />
          <ToggleRow
            label="Cachet et signature de l'agence"
            description="Bloc de signature côté agence"
            checked={template.showAgencySignature}
            onChange={(v) => update({ showAgencySignature: v })}
          />
          <ToggleRow
            label="Numéro de page"
            description="Affiché en bas à droite de chaque page"
            checked={template.showPageNumber}
            onChange={(v) => update({ showPageNumber: v })}
          />
        </div>

        <Field>
          <FieldLabel label="Texte personnalisé en bas de page" optional />
          <textarea
            value={template.footerText}
            onChange={(e) => update({ footerText: e.target.value })}
            rows={2}
            className="field-input w-full resize-none"
            placeholder="Ex: Merci de votre confiance — LokaRent"
          />
        </Field>
      </div>
    </SettingsCard>
  )
}
