"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertTriangle,
  CalendarRange,
  ChevronDown,
  Plus,
  Tag,
  Timer,
  Trash2,
} from "lucide-react"
import {
  type CategoryRow,
  type Season,
  type SeasonAccent,
  accentClasses,
  daysUntil,
} from "@/lib/pricing-grid-data"

const accents: SeasonAccent[] = ["amber", "rose", "indigo", "emerald", "violet"]

export function SeasonsManager({
  enabled,
  onToggleEnabled,
  seasons,
  onChange,
  onAdd,
  onDelete,
  categories,
}: {
  enabled: boolean
  onToggleEnabled: (on: boolean) => void
  seasons: Season[]
  onChange: (id: string, patch: Partial<Season>) => void
  onAdd: () => void
  onDelete: (id: string) => void
  categories: CategoryRow[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  // Detect overlap conflicts (active seasons covering same scope+date range)
  const conflicts = new Set<string>()
  for (let i = 0; i < seasons.length; i++) {
    for (let j = i + 1; j < seasons.length; j++) {
      const a = seasons[i]
      const b = seasons[j]
      if (!a.active || !b.active) continue
      const overlap =
        new Date(a.startDate).getTime() <= new Date(b.endDate).getTime() &&
        new Date(b.startDate).getTime() <= new Date(a.endDate).getTime()
      if (!overlap) continue
      const scopeOverlap =
        a.scope === "all" ||
        b.scope === "all" ||
        a.categoryIds.some((id) => b.categoryIds.includes(id))
      if (scopeOverlap) {
        conflicts.add(a.id)
        conflicts.add(b.id)
      }
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/40 p-4">
        <button
          type="button"
          onClick={() => onToggleEnabled(!enabled)}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            className={`inline-block h-5 w-5 rounded-full bg-white shadow ${
              enabled ? "ml-5" : "ml-0.5"
            }`}
          />
        </button>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">
            Activer les tarifs saisonniers
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Appliquez automatiquement une majoration ou une remise pendant des périodes
            spécifiques (été, fêtes, événements…).
          </p>
        </div>
      </label>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {seasons.map((s, i) => {
                const a = accentClasses[s.accent]
                const open = openId === s.id
                const dStart = daysUntil(s.startDate)
                const dEnd = daysUntil(s.endDate)
                const status =
                  dStart > 0 ? "upcoming" : dEnd >= 0 ? "live" : "past"
                const conflict = conflicts.has(s.id)
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className={`overflow-hidden rounded-xl border bg-white transition ${
                      open
                        ? "border-indigo-300 shadow-[0_8px_24px_-12px_rgba(79,70,229,0.25)]"
                        : "border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : s.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <span
                        className={`h-10 w-1 rounded-full ${a.bar}`}
                        aria-hidden
                      />
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-xl ${a.bg} ${a.text} ring-1 ring-inset ${a.ring}`}
                      >
                        <CalendarRange className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {s.name}
                          </span>
                          {!s.active && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Inactif
                            </span>
                          )}
                          {s.active && status === "live" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                              En cours
                            </span>
                          )}
                          {s.active && status === "upcoming" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                              <Timer className="h-2.5 w-2.5" />
                              Dans {dStart} j
                            </span>
                          )}
                          {conflict && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Conflit
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {new Date(s.startDate).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          →{" "}
                          {new Date(s.endDate).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          ·{" "}
                          {s.scope === "all"
                            ? "Toutes catégories"
                            : `${s.categoryIds.length} catégorie${
                                s.categoryIds.length > 1 ? "s" : ""
                              }`}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
                          s.surcharge >= 0
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                        }`}
                      >
                        {s.surcharge >= 0 ? "+" : ""}
                        {s.surcharge}%
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden border-t border-slate-100"
                        >
                          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Nom de la saison
                              </label>
                              <input
                                value={s.name}
                                onChange={(e) =>
                                  onChange(s.id, { name: e.target.value })
                                }
                                className="field-input"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Couleur d&apos;accent
                              </label>
                              <div className="flex items-center gap-2">
                                {accents.map((acc) => (
                                  <button
                                    key={acc}
                                    type="button"
                                    onClick={() => onChange(s.id, { accent: acc })}
                                    className={`h-7 w-7 rounded-full ring-2 ring-offset-2 transition ${
                                      accentClasses[acc].bar
                                    } ${
                                      s.accent === acc
                                        ? "ring-slate-900"
                                        : "ring-transparent"
                                    }`}
                                    aria-label={acc}
                                  />
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Date de début
                              </label>
                              <input
                                type="date"
                                value={s.startDate}
                                onChange={(e) =>
                                  onChange(s.id, { startDate: e.target.value })
                                }
                                className="field-input"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Date de fin
                              </label>
                              <input
                                type="date"
                                value={s.endDate}
                                onChange={(e) =>
                                  onChange(s.id, { endDate: e.target.value })
                                }
                                className="field-input"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Majoration / remise
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={s.surcharge}
                                  onChange={(e) =>
                                    onChange(s.id, {
                                      surcharge: Number(e.target.value),
                                    })
                                  }
                                  className="field-input pr-10"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm font-semibold text-slate-400">
                                  %
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                S&apos;applique à
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange(s.id, {
                                      scope: "all",
                                      categoryIds: [],
                                    })
                                  }
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    s.scope === "all"
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  Toutes catégories
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onChange(s.id, { scope: "selected" })}
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    s.scope === "selected"
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  Catégories choisies
                                </button>
                              </div>
                            </div>
                            {s.scope === "selected" && (
                              <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                  Catégories
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {categories.map((c) => {
                                    const on = s.categoryIds.includes(c.id)
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() =>
                                          onChange(s.id, {
                                            categoryIds: on
                                              ? s.categoryIds.filter((x) => x !== c.id)
                                              : [...s.categoryIds, c.id],
                                          })
                                        }
                                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                          on
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                      >
                                        <Tag className="h-3 w-3" />
                                        {c.name}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="sm:col-span-2 flex items-center justify-between border-t border-slate-100 pt-4">
                              <label className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onChange(s.id, { active: !s.active })}
                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                                    s.active ? "bg-emerald-500" : "bg-slate-300"
                                  }`}
                                >
                                  <motion.span
                                    layout
                                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow ${
                                      s.active ? "ml-4" : "ml-0.5"
                                    }`}
                                  />
                                </button>
                                <span className="text-xs font-semibold text-slate-700">
                                  {s.active ? "Saison active" : "Saison désactivée"}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => onDelete(s.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              <button
                type="button"
                onClick={onAdd}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Ajouter une saison
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
