"use client"

import { motion, AnimatePresence } from "motion/react"
import { X, Printer, Download } from "lucide-react"
import { useEffect } from "react"
import { ContractPreview } from "./contract-preview"
import type { ContractTemplate } from "@/lib/contract-template-data"

export function PdfPreviewModal({
  open,
  onClose,
  template,
}: {
  open: boolean
  onClose: () => void
  template: ContractTemplate
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-sm"
        >
          {/* Header */}
          <motion.header
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-900">Aperçu PDF du contrat</p>
                <p className="text-[11px] text-slate-500">
                  Format A4 · Échelle 100% · Données fictives
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.6)] transition hover:from-indigo-700 hover:to-violet-700"
              >
                <Download className="h-4 w-4" />
                Télécharger PDF
              </button>
            </div>
          </motion.header>

          {/* Document */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30, delay: 0.05 }}
            className="flex-1 overflow-y-auto bg-slate-100 px-6 py-8"
          >
            <ContractPreview template={template} scale={1} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
