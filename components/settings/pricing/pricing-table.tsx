"use client"

import { motion } from "motion/react"
import { Copy, Sparkles, Star, Trash2, TrendingUp } from "lucide-react"
import {
  type CategoryRow,
  formatMAD,
  suggestedMonth,
  suggestedWeek,
} from "@/lib/pricing-grid-data"
import { EditableCurrencyCell } from "./editable-currency-cell"

export function PricingTable({
  rows,
  onChange,
  onDuplicate,
  onDelete,
  selectedId,
  onSelect,
}: {
  rows: CategoryRow[]
  onChange: (id: string, patch: Partial<CategoryRow>) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Catégorie</th>
              <th className="px-3 py-3">Prix / jour</th>
              <th className="px-3 py-3">Prix / semaine</th>
              <th className="px-3 py-3">Prix / mois</th>
              <th className="px-3 py-3">Caution</th>
              <th className="px-3 py-3">Occupation</th>
              <th className="w-32 px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => {
              const sw = suggestedWeek(r.perDay)
              const sm = suggestedMonth(r.perDay)
              const reco = r.recommendedPerDay && r.recommendedPerDay > r.perDay
              const selected = selectedId === r.id
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  onClick={() => onSelect(r.id)}
                  className={`cursor-pointer transition ${
                    selected ? "bg-indigo-50/40" : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-bold ${
                          selected
                            ? "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{r.name}</span>
                          {r.popular && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                              <Star className="h-2.5 w-2.5 fill-current" />
                              Populaire
                            </span>
                          )}
                        </div>
                        {reco && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            Recommandé : {formatMAD(r.recommendedPerDay!)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <EditableCurrencyCell
                      value={r.perDay}
                      onChange={(v) => onChange(r.id, { perDay: v })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <EditableCurrencyCell
                      value={r.perWeek}
                      suggestion={sw}
                      highlight={Math.abs(r.perWeek - sw) > sw * 0.15}
                      onChange={(v) => onChange(r.id, { perWeek: v })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <EditableCurrencyCell
                      value={r.perMonth}
                      suggestion={sm}
                      highlight={Math.abs(r.perMonth - sm) > sm * 0.15}
                      onChange={(v) => onChange(r.id, { perMonth: v })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <EditableCurrencyCell
                      value={r.caution}
                      onChange={(v) => onChange(r.id, { caution: v })}
                    />
                  </td>
                  <td className="px-3 py-3">
                    {r.occupancy !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="relative h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${
                              r.occupancy >= 80
                                ? "bg-emerald-500"
                                : r.occupancy >= 60
                                  ? "bg-indigo-500"
                                  : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, r.occupancy)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-slate-600">
                          {r.occupancy}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicate(r.id)
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Dupliquer"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(r.id)
                        }}
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
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-[11px] text-slate-500">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
        <span>
          Suggestions automatiques :{" "}
          <span className="font-semibold text-slate-700">semaine = jour × 6</span> ·{" "}
          <span className="font-semibold text-slate-700">mois = jour × 25</span>. Cliquez
          n&apos;importe quelle cellule pour modifier.
        </span>
      </div>
    </div>
  )
}
