"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageCircle, Send, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  buildWhatsAppUrl,
  isValidPhoneNumber,
  type WhatsAppTemplate,
  generateMessage,
} from "@/lib/whatsapp-templates"

export interface WhatsAppShareButtonProps {
  template: WhatsAppTemplate
  phoneNumber: string | null | undefined
  templateData: Record<string, any>
  title: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function WhatsAppShareButton({
  template,
  phoneNumber,
  templateData,
  title,
  className,
  variant = "default",
  size = "md",
}: WhatsAppShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(() => generateMessage(template, templateData))
  const [copied, setCopied] = useState(false)

  const isValid = isValidPhoneNumber(phoneNumber)
  const isDisabled = !isValid

  const handleOpenDialog = () => {
    if (!isDisabled) {
      setOpen(true)
    }
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy message")
    }
  }

  const handleSendWhatsApp = () => {
    const url = buildWhatsAppUrl(phoneNumber!, message)
    window.open(url, "_blank", "noopener,noreferrer")
    setOpen(false)
  }

  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-3.5 text-sm gap-2",
    lg: "h-10 px-4 text-base gap-2",
  }

  const variantClasses = {
    default: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/20",
    outline:
      "border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 hover:border-green-300",
    ghost: "text-green-600 hover:bg-green-50",
  }

  const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : ""

  return (
    <>
      <button
        type="button"
        onClick={handleOpenDialog}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all",
          "disabled:hover:shadow-none",
          sizeClasses[size],
          variantClasses[variant],
          disabledClasses,
          className,
        )}
        title={isDisabled ? "Numéro de téléphone non disponible" : `Partager via WhatsApp: ${title}`}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
        <span>WhatsApp</span>
      </button>

      {/* Dialog overlay and content */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.15)]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/50">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Partager via WhatsApp</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{title}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message editor */}
              <div className="py-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="field-input min-h-32 resize-none"
                  placeholder="Votre message..."
                />
                <p className="text-xs text-slate-500">
                  {message.length} caractères
                </p>
              </div>

              {/* Footer with actions */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    copied
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  <span>{copied ? "✓ Copié" : "Copier"}</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/20"
                  >
                    <Send className="h-4 w-4" />
                    <span>Envoyer</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
