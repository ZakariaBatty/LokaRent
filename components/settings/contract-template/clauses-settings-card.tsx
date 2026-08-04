"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, GripVertical, Pencil, Scale } from "lucide-react"
import { SettingsCard } from "@/components/settings/settings-card"
import type { ContractClause, ContractTemplate } from "@/lib/contract-template-data"
import { ToggleRow } from "./toggle-row"

export function ClausesSettingsCard({
  template,
  update,
}: {
  template: ContractTemplate
  update: (patch: Partial<ContractTemplate>) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const enabledCount = template.clauses.filter((c) => c.enabled).length

  const updateClause = (id: string, patch: Partial<ContractClause>) => {
    update({
      clauses: template.clauses.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  return (
    <SettingsCard
      title="Clauses & conditions"
      description="Activez, modifiez et réorganisez les clauses qui apparaîtront dans le contrat."
      icon={<Scale className="h-5 w-5" />}
      delay={0.15}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {enabledCount} / {template.clauses.length} actives
        </span>
      }
    >
      <ol className="space-y-2">
        {template.clauses.map((clause, idx) => {
          const isOpen = expanded === clause.id
          return (
            <motion.li
              key={clause.id}
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={`overflow-hidden rounded-xl border transition ${
                clause.enabled
                  ? "border-slate-200/70 bg-white"
                  : "border-slate-200/50 bg-slate-50/40"
              }`}
            >
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="grid h-7 w-7 cursor-grab place-items-center rounded-lg bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold ring-1 ring-inset ${
                    clause.enabled
                      ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
                      : "bg-slate-100 text-slate-400 ring-slate-100"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-semibold ${
                      clause.enabled ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {clause.title}
                  </p>
                  {!isOpen && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                      {clause.content}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : clause.id)}
                  className={`grid h-7 w-7 place-items-center rounded-lg ring-1 ring-inset transition ${
                    isOpen
                      ? "bg-indigo-100 text-indigo-700 ring-indigo-100"
                      : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                  }`}
                  aria-label="Modifier"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : clause.id)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Étendre"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <span
                  role="switch"
                  aria-checked={clause.enabled}
                  onClick={() => updateClause(clause.id, { enabled: !clause.enabled })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    clause.enabled ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow ${
                      clause.enabled ? "ml-4" : "ml-0.5"
                    }`}
                  />
                </span>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="border-t border-slate-100 bg-slate-50/40 px-3.5 py-3"
                  >
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      Contenu de la clause
                    </label>
                    <textarea
                      value={clause.content}
                      onChange={(e) => updateClause(clause.id, { content: e.target.value })}
                      rows={5}
                      className="field-input w-full resize-none font-mono text-xs leading-relaxed"
                    />
                    <p className="mt-2 text-[11px] text-slate-500">
                      Astuce : rédigez votre clause en langage juridique clair. Elle sera
                      numérotée automatiquement dans le document final.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          )
        })}
      </ol>
    </SettingsCard>
  )
}

// Workaround: the spread import wasn't used.
// Keep ToggleRow re-export so the file stays cohesive in case the page imports from here.
export { ToggleRow }
