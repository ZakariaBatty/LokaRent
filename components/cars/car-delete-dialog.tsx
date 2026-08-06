"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import type { Car } from "@/lib/cars-data"
import { CarIllustration } from "./car-illustration"
import fr from "@/translations/fr"

export function CarDeleteDialog({
  open,
  car,
  onClose,
  onConfirm,
}: {
  open: boolean
  car: Car | null
  onClose: () => void
  onConfirm: () => Promise<boolean>
}) {
  const [deleting, setDeleting] = useState(false)

  if (!car) return null

  const confirm = async () => {
    setDeleting(true)
    try {
      const ok = await onConfirm()
      if (ok) onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-50 to-transparent" />
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={fr.fleet.deleteDialog.close}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative px-6 pb-5 pt-7">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_4px_24px_rgba(244,63,94,0.35)]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-center font-serif text-xl text-slate-900">
                  {fr.fleet.deleteDialog.title}
                </h2>
                <p className="mt-1 text-center text-sm text-slate-500">
                  {fr.fleet.deleteDialog.description}
                </p>

                <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <CarIllustration category={car.category} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {car.brand} {car.model}
                    </p>
                    <p className="truncate font-mono text-xs font-semibold text-slate-500">{car.plate}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {fr.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(244,63,94,0.30)] transition hover:shadow-[0_6px_24px_rgba(244,63,94,0.40)] disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {fr.fleet.deleteDialog.loading}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      {fr.fleet.deleteDialog.confirm}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
