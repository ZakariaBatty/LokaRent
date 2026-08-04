"use client"

import { Heading1 } from "lucide-react"
import { motion } from "motion/react"
import { SettingsCard, FieldLabel, Field } from "@/components/settings/settings-card"
import type { ContractTemplate, TitleSize } from "@/lib/contract-template-data"

const SIZES: { value: TitleSize; label: string; preview: string }[] = [
  { value: "small", label: "Petit", preview: "text-xs" },
  { value: "medium", label: "Moyen", preview: "text-sm" },
  { value: "large", label: "Grand", preview: "text-base" },
]

export function TitleSettingsCard({
  template,
  update,
}: {
  template: ContractTemplate
  update: (patch: Partial<ContractTemplate>) => void
}) {
  return (
    <SettingsCard
      title="Titre du contrat"
      description="Personnalisez l'intitulé principal affiché en tête du document."
      icon={<Heading1 className="h-5 w-5" />}
      delay={0.1}
    >
      <div className="space-y-5">
        <Field>
          <FieldLabel label="Intitulé du contrat" />
          <input
            type="text"
            value={template.title}
            onChange={(e) => update({ title: e.target.value })}
            className="field-input"
            placeholder="CONTRAT DE LOCATION DE VÉHICULE SANS CHAUFFEUR"
          />
        </Field>

        <Field>
          <FieldLabel label="Taille de la typographie" />
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((s) => {
              const active = template.titleSize === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => update({ titleSize: s.value })}
                  className={`relative overflow-hidden rounded-xl border px-3 py-3 text-center transition ${
                    active
                      ? "border-indigo-300 bg-indigo-50/50 ring-1 ring-inset ring-indigo-100"
                      : "border-slate-200/70 bg-white hover:border-slate-300"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="title-size-active"
                      className="absolute inset-0 rounded-xl ring-2 ring-inset ring-indigo-300"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative block font-bold tracking-tight ${
                      active ? "text-indigo-700" : "text-slate-700"
                    } ${s.preview}`}
                  >
                    Aa
                  </span>
                  <span
                    className={`relative mt-1 block text-[11px] font-semibold ${
                      active ? "text-indigo-700" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </SettingsCard>
  )
}
