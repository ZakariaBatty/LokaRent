"use client"

import { motion } from "motion/react"
import { Baby, Navigation, Plus, ShieldCheck, Trash2, Truck, UserPlus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { type PricingOption } from "@/lib/pricing-grid-data"
import { EditableCurrencyCell } from "./editable-currency-cell"

const iconMap: Record<PricingOption["icon"], LucideIcon> = {
  "user-plus": UserPlus,
  navigation: Navigation,
  baby: Baby,
  "shield-check": ShieldCheck,
  truck: Truck,
}

const tileColors = [
  "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "bg-amber-50 text-amber-700 ring-amber-200",
  "bg-rose-50 text-rose-700 ring-rose-200",
  "bg-violet-50 text-violet-700 ring-violet-200",
]

export function OptionsTable({
  options,
  onChange,
  onDelete,
  onAdd,
}: {
  options: PricingOption[]
  onChange: (id: string, patch: Partial<PricingOption>) => void
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Option</th>
              <th className="px-3 py-3">Prix / jour</th>
              <th className="px-3 py-3">Inclus dans le forfait</th>
              <th className="w-16 px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {options.map((o, i) => {
              const Icon = iconMap[o.icon]
              const tile = tileColors[i % tileColors.length]
              return (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="transition hover:bg-slate-50/60"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset ${tile}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900">{o.name}</div>
                        {o.description && (
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {o.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={o.included ? "opacity-50" : ""}>
                      <EditableCurrencyCell
                        value={o.perDay}
                        onChange={(v) => onChange(o.id, { perDay: v })}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <label className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onChange(o.id, { included: !o.included })}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                          o.included ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <motion.span
                          layout
                          transition={{ type: "spring", stiffness: 700, damping: 30 }}
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow ${
                            o.included ? "ml-4" : "ml-0.5"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-semibold ${
                          o.included ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {o.included ? "Inclus" : "Optionnel"}
                      </span>
                    </label>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onDelete(o.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Ajouter une option
      </button>
    </div>
  )
}
