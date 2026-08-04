"use client"

import { motion, AnimatePresence } from "motion/react"
import { Check, Loader2, Save } from "lucide-react"

export function StickySaveBar({
  dirty,
  saving,
  lastSavedAt,
  onSave,
  onReset,
}: {
  dirty: boolean
  saving: boolean
  lastSavedAt: Date | null
  onSave: () => void
  onReset: () => void
}) {
  return (
    <AnimatePresence>
      {(dirty || saving) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div className="flex w-full max-w-2xl items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Modifications non enregistrées
              </p>
              <p className="text-xs text-slate-500">
                {lastSavedAt
                  ? `Dernière sauvegarde · ${lastSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Sauvegardez pour appliquer vos changements"}
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SaveStatusPill({
  dirty,
  saving,
  lastSavedAt,
}: {
  dirty: boolean
  saving: boolean
  lastSavedAt: Date | null
}) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Enregistrement…
      </span>
    )
  }
  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Modifications non enregistrées
      </span>
    )
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Check className="h-3 w-3" />
        À jour ·{" "}
        {lastSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </span>
    )
  }
  return null
}
