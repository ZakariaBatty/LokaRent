"use client"

import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import type { GlobalUser } from "@/lib/mock-workspaces"

export function MemberDeleteDialog({
  open,
  user,
  onClose,
  onConfirm,
}: {
  open: boolean
  user: GlobalUser | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!user) return null

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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.16)]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-slate-900">Supprimer le membre</h3>
                    <p className="text-xs text-slate-500">Cette action est irréversible</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <p className="text-sm text-slate-700">
                  Vous êtes sur le point de supprimer{" "}
                  <span className="font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </span>{" "}
                  du workspace. Tous ses accès et memberships seront révoqués.
                </p>
                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <p className="text-xs font-semibold text-rose-700">
                    Cette action supprimera définitivement ce membre et ne peut pas être annulée.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { onConfirm(); onClose() }}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
