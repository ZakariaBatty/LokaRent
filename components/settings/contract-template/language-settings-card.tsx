"use client"

import { motion } from "motion/react"
import { Languages } from "lucide-react"
import { SettingsCard } from "@/components/settings/settings-card"
import type { ContractLanguage, ContractTemplate } from "@/lib/contract-template-data"

const OPTIONS: { value: ContractLanguage; label: string; sub: string; flag: string }[] = [
  { value: "fr", label: "Français", sub: "Document monolingue FR", flag: "FR" },
  { value: "ar", label: "العربية", sub: "Document monolingue AR", flag: "AR" },
  { value: "bilingue", label: "Bilingue", sub: "FR + AR côte à côte", flag: "FR/AR" },
]

export function LanguageSettingsCard({
  template,
  update,
}: {
  template: ContractTemplate
  update: (patch: Partial<ContractTemplate>) => void
}) {
  return (
    <SettingsCard
      title="Langue du document"
      description="Choisissez la langue de rédaction. Le contrat bilingue affiche les deux versions sur la même page."
      icon={<Languages className="h-5 w-5" />}
      delay={0.25}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const active = template.language === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ language: opt.value })}
              className={`relative overflow-hidden rounded-xl border px-3.5 py-3.5 text-left transition ${
                active
                  ? "border-indigo-300 bg-indigo-50/50"
                  : "border-slate-200/70 bg-white hover:border-slate-300"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="lang-active"
                  className="absolute inset-0 rounded-xl ring-2 ring-inset ring-indigo-300"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative flex items-center gap-2.5">
                <span
                  className={`grid h-8 w-9 place-items-center rounded-lg text-[11px] font-bold ring-1 ring-inset ${
                    active
                      ? "bg-indigo-100 text-indigo-700 ring-indigo-100"
                      : "bg-slate-100 text-slate-600 ring-slate-100"
                  }`}
                >
                  {opt.flag}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      active ? "text-indigo-700" : "text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{opt.sub}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </SettingsCard>
  )
}
