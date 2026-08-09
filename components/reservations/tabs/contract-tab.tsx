"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import {
  Check,
  X,
  FileText,
  ImagePlus,
  Download,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import { type Reservation, type ContractChecklistItem } from "@/lib/reservations-data"
import { cn } from "@/lib/utils"
import {
  listReservationDocumentsAction,
  uploadReservationDocumentAction,
} from "@/modules/reservations/actions/create-reservation.action"
import { generateContractAction } from "@/modules/contracts/actions/create-contract.action"

function ChecklistRow({ item }: { item: ContractChecklistItem }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="text-sm text-slate-700">{item.label}</span>
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          item.ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400",
        )}
      >
        {item.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
    </div>
  )
}

export function ContractTab({ reservation }: { reservation: Reservation }) {
  const { t } = useI18n()
  const [dragOver, setDragOver] = useState<"departure" | "return" | null>(null)
  const [documents, setDocuments] = useState<{ id: string; filename: string; storageUrl: string }[]>([])
  const [uploadingZone, setUploadingZone] = useState<"departure" | "return" | null>(null)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedZoneRef = useRef<"departure" | "return">("departure")

  useEffect(() => {
    let cancelled = false
    listReservationDocumentsAction({ reservationId: reservation.id }).then((result) => {
      if (!cancelled && result.success) setDocuments(result.documents)
    })
    return () => {
      cancelled = true
    }
  }, [reservation.id])

  async function uploadFile(file: File, zone: "departure" | "return") {
    setUploadingZone(zone)
    const formData = new FormData()
    formData.set("reservationId", reservation.id)
    formData.set("file", file)
    const result = await uploadReservationDocumentAction(formData)
    setUploadingZone(null)
    if (!result.success) {
      toast.error(t(result.messageKey))
      return
    }
    const refreshed = await listReservationDocumentsAction({ reservationId: reservation.id })
    if (refreshed.success) setDocuments(refreshed.documents)
    toast.success(t("reservations.documents.uploaded"))
  }

  async function generateContract() {
    const mileage = window.prompt(t("contracts.generate.pickupMileagePrompt"))
    if (!mileage) return
    const pickupMileage = Number(mileage)
    if (!Number.isInteger(pickupMileage) || pickupMileage < 0) {
      toast.error(t("contracts.errors.invalidPickupMileage"))
      return
    }
    setGenerating(true)
    const result = await generateContractAction({ reservationId: reservation.id, pickupMileage })
    setGenerating(false)
    if (!result.success) {
      toast.error(t(result.messageKey))
      return
    }
    toast.success(t("contracts.generate.created"))
  }

  const departureProgress =
    (reservation.contract.departureChecklist.filter((i) => i.ok).length /
      reservation.contract.departureChecklist.length) *
    100
  const returnProgress =
    (reservation.contract.returnChecklist.filter((i) => i.ok).length /
      reservation.contract.returnChecklist.length) *
    100

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Admin actions banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-amber-50/40 p-3.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <Lock className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-semibold text-amber-900">Zone administrative</p>
          <p className="mt-0.5 text-amber-700">
            Les modifications du contrat sont auditées et requièrent les droits superviseur.
          </p>
        </div>
        {reservation.contract.signed ? (
          <button
            type="button"
            onClick={() => toast.success(t("contracts.preview.pdfUnavailable"))}
            className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 px-3 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(217,119,6,0.3)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Download className="relative h-3.5 w-3.5" />
            <span className="relative">{t("contracts.downloadContract")}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={generating}
            onClick={generateContract}
            className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 px-3 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(217,119,6,0.3)] disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <FileText className="relative h-3.5 w-3.5" />
            <span className="relative">{generating ? t("contracts.generate.generating") : t("contracts.generate.action")}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Départ */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">État des lieux — Départ</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{Math.round(departureProgress)}%</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${departureProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          {reservation.contract.departureChecklist.map((item) => (
            <ChecklistRow key={item.label} item={item} />
          ))}
        </div>

        {/* Retour */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900">État des lieux — Retour</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-500">{Math.round(returnProgress)}%</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${returnProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </div>
          {reservation.contract.returnChecklist.map((item) => (
            <ChecklistRow key={item.label} item={item} />
          ))}
        </div>
      </div>

      {/* Dommages */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Suivi des dommages</h4>
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
            {reservation.contract.damages.length}
          </span>
        </div>
        {reservation.contract.damages.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Aucun dommage signalé sur cette réservation.
          </div>
        ) : (
          <div className="space-y-2">
            {reservation.contract.damages.map((d, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{d.zone}</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        d.severity === "grave"
                          ? "bg-rose-100 text-rose-700"
                          : d.severity === "moyen"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {d.severity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ImagePlus className="h-3.5 w-3.5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Photos & justificatifs</h4>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {documents.length} fichier{documents.length > 1 ? "s" : ""}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ""
            if (file) void uploadFile(file, selectedZoneRef.current)
          }}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["departure", "return"] as const).map((zone) => (
            <button
              key={zone}
              type="button"
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(zone)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(null)
                const file = e.dataTransfer.files[0]
                if (file) void uploadFile(file, zone)
              }}
              onClick={() => {
                selectedZoneRef.current = zone
                fileInputRef.current?.click()
              }}
              className={cn(
                "flex h-32 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-xs font-medium transition-colors",
                dragOver === zone
                  ? "border-blue-400 bg-blue-50/60 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-600",
              )}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">
                {zone === "departure" ? "Photos départ" : "Photos retour"}
              </span>
              <span className="text-[10px] text-slate-400">Glisser-déposer ou cliquer</span>
              {uploadingZone === zone && (
                <span className="text-[10px] font-semibold text-blue-600">{t("reservations.documents.uploading")}</span>
              )}
            </button>
          ))}
        </div>
        {documents.length > 0 && (
          <div className="mt-3 space-y-2">
            {documents.map((document) => (
              <a
                key={document.id}
                href={document.storageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700"
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="min-w-0 flex-1 truncate">{document.filename}</span>
                <Download className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
