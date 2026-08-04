"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import { type Client } from "@/lib/clients-data"
import { ClientAvatar } from "./client-avatar"
import { toast } from "sonner"

export function ClientDeleteDialog({
  open,
  client,
  onClose,
  onConfirm,
}: {
  open: boolean
  client: Client | null
  onClose: () => void
  onConfirm: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  if (!client) return null

  const confirm = async () => {
    setDeleting(true)
    await new Promise((r) => setTimeout(r, 350))
    onConfirm()
    setDeleting(false)
    toast.success("Client supprimé", {
      description: `Le dossier de ${client.fullName} a été supprimé.`,
    })
    onClose()
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
              {/* Decorative top glow */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-50 to-transparent" />

              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative px-6 pt-7 pb-5">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 18 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_4px_24px_rgba(244,63,94,0.35)]"
                >
                  <AlertTriangle className="h-6 w-6" />
                </motion.div>

                <h2 className="mt-4 text-center font-serif text-xl text-slate-900">
                  Supprimer le client ?
                </h2>
                <p className="mt-1 text-center text-sm text-slate-500">
                  Cette action est irréversible. Toutes les informations associées seront perdues.
                </p>

                {/* Client preview */}
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <ClientAvatar
                    id={client.id}
                    name={client.fullName}
                    nationality={client.nationality}
                    showFlag
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {client.fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {client.totalRentals} location{client.totalRentals > 1 ? "s" : ""} ·{" "}
                      {client.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
                <button
                  onClick={onClose}
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  onClick={confirm}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(244,63,94,0.30)] transition hover:shadow-[0_6px_24px_rgba(244,63,94,0.40)] disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
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
