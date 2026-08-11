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
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import { type Reservation, type ContractChecklistItem } from "@/lib/reservations-data"
import { type Contract } from "@/lib/contracts-data"
import { cn } from "@/lib/utils"
import {
  listReservationDocumentsAction,
  uploadReservationDocumentAction,
} from "@/modules/reservations/actions/create-reservation.action"
import {
  generateContractAction,
  listContractsByReservationAction,
  listContractDocumentsAction,
} from "@/modules/contracts/actions/create-contract.action"

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

const contractRelevantTimelineEventTypes = new Set([
  "pricing_adjusted",
  "driver_assigned",
  "driver_unassigned",
  "contract_details_updated",
])

export function ContractTab({ reservation }: { reservation: Reservation }) {
  const { t } = useI18n()
  const [dragOver, setDragOver] = useState<"departure" | "return" | null>(null)
  const [documents, setDocuments] = useState<{ id: string; filename: string; storageUrl: string }[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [contractVersions, setContractVersions] = useState<Contract[]>([])
  const [loadingContractContext, setLoadingContractContext] = useState(true)
  const [uploadingZone, setUploadingZone] = useState<"departure" | "return" | null>(null)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedZoneRef = useRef<"departure" | "return">("departure")

  useEffect(() => {
    let cancelled = false
    async function loadContractContext() {
      setLoadingContractContext(true)
      const historyResult = await listContractsByReservationAction({ reservationId: reservation.id })
      if (cancelled) return
      if (historyResult.success && historyResult.contracts.length > 0) {
        const versions = historyResult.contracts
        const current = versions.find((item) => item.isCurrent) ?? versions[0]
        setContract(current)
        setContractVersions(versions)
        const documentResult = await listContractDocumentsAction({ contractId: current.id })
        if (!cancelled && documentResult.success) setDocuments(documentResult.documents)
        if (!cancelled) setLoadingContractContext(false)
        return
      }
      setContract(null)
      setContractVersions([])
      const reservationDocuments = await listReservationDocumentsAction({ reservationId: reservation.id })
      if (!cancelled && reservationDocuments.success) setDocuments(reservationDocuments.documents)
      if (!cancelled) setLoadingContractContext(false)
    }
    void loadContractContext()
    return () => {
      cancelled = true
    }
  }, [reservation.id])

  async function refreshContractContext() {
    const historyResult = await listContractsByReservationAction({ reservationId: reservation.id })
    if (!historyResult.success) return
    if (historyResult.contracts.length === 0) {
      setContractVersions([])
      setContract(null)
      return
    }
    const current = historyResult.contracts.find((item) => item.isCurrent) ?? historyResult.contracts[0]
    setContractVersions(historyResult.contracts)
    setContract(current)
    const documentResult = await listContractDocumentsAction({ contractId: current.id })
    if (documentResult.success) setDocuments(documentResult.documents)
  }

  async function selectContractVersion(nextContract: Contract) {
    setContract(nextContract)
    const documentResult = await listContractDocumentsAction({ contractId: nextContract.id })
    if (documentResult.success) setDocuments(documentResult.documents)
  }

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

  function downloadFrozenContract(targetContract = contract) {
    if (!targetContract?.renderedHtml) {
      toast.error(t("contracts.errors.downloadUnavailable"))
      return
    }
    const blob = new Blob([targetContract.renderedHtml], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${targetContract.code}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function generateContract() {
    const persistedMileage = reservation.startKm
    const mileage = persistedMileage === null ? window.prompt(t("contracts.generate.pickupMileagePrompt")) : String(persistedMileage)
    if (!mileage) return
    const pickupMileage = Number(mileage)
    if (!Number.isInteger(pickupMileage) || pickupMileage < 0) {
      toast.error(t("contracts.errors.invalidPickupMileage"))
      return
    }
    setGenerating(true)
    const currentContract = contractVersions.find((item) => item.isCurrent) ?? contract
    const result = await generateContractAction({
      reservationId: reservation.id,
      pickupMileage,
      pickupFuelLevel: currentContract?.pickupFuelLevel ?? undefined,
    })
    setGenerating(false)
    if (!result.success) {
      toast.error(t(result.messageKey))
      return
    }
    await refreshContractContext()
    toast.success(contract ? t("contracts.generate.amendmentCreated") : t("contracts.generate.created"))
  }

  const currentContract = contractVersions.find((item) => item.isCurrent) ?? contract
  const generationAllowed = reservation.status === "confirmee" || reservation.status === "en_cours"
  const pricingSnapshotAmendmentRequired = Boolean(
    currentContract?.pricingSnapshotId &&
    reservation.currentPricingSnapshotId &&
    currentContract.pricingSnapshotId !== reservation.currentPricingSnapshotId,
  )
  const contractDetailsAmendmentRequired = Boolean(
    currentContract &&
    reservation.timeline.some(
      (event) =>
        contractRelevantTimelineEventTypes.has(event.label) &&
        new Date(event.timestamp).getTime() > new Date(currentContract.createdAt).getTime(),
    ),
  )
  const amendmentRequired = pricingSnapshotAmendmentRequired || contractDetailsAmendmentRequired
  const canGenerateInitialContract = !loadingContractContext && !currentContract && generationAllowed
  const canGenerateAmendment = !loadingContractContext && Boolean(currentContract) && amendmentRequired && generationAllowed
  const contractVersionLabel = (item: Contract) => {
    if (amendmentRequired && item.id === currentContract?.id) return t("contracts.details.outdated")
    return item.isCurrent ? t("contracts.details.current") : t("contracts.details.previous")
  }

  const departureChecklist = contract
    ? [
        ...contract.etat.depart.carrosserie,
        ...contract.etat.depart.interieur,
        ...contract.etat.depart.equipements,
      ]
    : reservation.contract.departureChecklist
  const returnChecklist = contract?.etat.retour
    ? [
        ...contract.etat.retour.carrosserie,
        ...contract.etat.retour.interieur,
        ...contract.etat.retour.equipements,
      ]
    : reservation.contract.returnChecklist
  const damages = contract?.etat.retour?.damages ?? reservation.contract.damages
  const departureProgress =
    departureChecklist.length === 0 ? 0 : (departureChecklist.filter((i) => i.ok).length / departureChecklist.length) *
    100
  const returnProgress =
    returnChecklist.length === 0 ? 0 : (returnChecklist.filter((i) => i.ok).length / returnChecklist.length) *
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
        {loadingContractContext ? (
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-700 opacity-70"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{t("common.loading")}</span>
          </button>
        ) : currentContract ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canGenerateAmendment && (
              <button
                type="button"
                disabled={generating}
                onClick={generateContract}
                className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-700 shadow-sm disabled:opacity-60"
              >
                <FileText className="relative h-3.5 w-3.5" />
                <span className="relative">{generating ? t("contracts.generate.generating") : t("contracts.generate.amendmentAction")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadFrozenContract(contract)}
              className="group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 px-3 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(217,119,6,0.3)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Download className="relative h-3.5 w-3.5" />
              <span className="relative">{t("contracts.downloadContract")}</span>
            </button>
          </div>
        ) : canGenerateInitialContract ? (
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
        ) : null}
      </div>

      {!loadingContractContext && !currentContract && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{t("contracts.details.emptyTitle")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("contracts.details.emptyDescription")}</p>
        </div>
      )}

      {currentContract && amendmentRequired && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold">{t("contracts.details.amendmentRequired")}</p>
          <p className="mt-1">{t("contracts.details.amendmentRequiredDescription")}</p>
        </div>
      )}

      {currentContract && !amendmentRequired && contract?.id === currentContract.id && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <p className="font-semibold">{t("contracts.details.agreementCurrent")}</p>
        </div>
      )}

      {contractVersions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h4 className="mb-3 text-sm font-semibold text-slate-900">{t("contracts.details.versionHistory")}</h4>
          <div className="space-y-2">
            {contractVersions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    {t("contracts.details.version")} {item.versionNumber ?? 1}
                    <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] uppercase text-slate-500">
                      {contractVersionLabel(item)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()} - {item.pricing.total} {item.pricing.currency ?? "MAD"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void selectContractVersion(item)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t("contracts.viewContract")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadFrozenContract(item)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t("contracts.downloadContract")}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {contract && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{contract.code}</h4>
              <p className="mt-0.5 text-xs text-slate-500">
                {contract.template?.name ?? t("contracts.details.template")} - {t("contracts.details.version")} {contract.versionNumber ?? 1}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase text-slate-600">
              {contractVersionLabel(contract)} - {t(`contracts.statuses.${contract.status}`)}
            </span>
          </div>
          {contractVersions.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {contractVersions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void selectContractVersion(item)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                    item.id === contract.id
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {t("contracts.details.version")} {item.versionNumber ?? 1}
                  {item.isCurrent || item.id === currentContract?.id ? ` - ${contractVersionLabel(item)}` : ""}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-slate-400">{t("contracts.client")}</p>
              <p className="font-semibold text-slate-800">{contract.client.fullName}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.vehicle")}</p>
              <p className="font-semibold text-slate-800">
                {contract.car.brand} {contract.car.model} - {contract.car.plate}
              </p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.assignedDriver")}</p>
              <p className="font-semibold text-slate-800">{contract.assignedDriver?.fullName ?? "-"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.authorizedDriver")}</p>
              <p className="font-semibold text-slate-800">{contract.additionalDriver?.fullName ?? "-"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.startDate")}</p>
              <p className="font-semibold text-slate-800">{new Date(contract.period.start).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.endDate")}</p>
              <p className="font-semibold text-slate-800">{new Date(contract.period.end).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.mileageTerms")}</p>
              <p className="font-semibold text-slate-800">
                {contract.pricing.mileageLimit ?? "-"} / {contract.pricing.extraMileageRate ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.deposit")}</p>
              <p className="font-semibold text-slate-800">{contract.caution.amount} {contract.pricing.currency ?? "MAD"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.discountReason")}</p>
              <p className="font-semibold text-slate-800">{contract.pricing.discountReason ?? "-"}</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.pickupMileage")}</p>
              <p className="font-semibold text-slate-800">{contract.pickupMileage ?? "-"} km</p>
            </div>
            <div>
              <p className="text-slate-400">{t("contracts.details.pickupFuel")}</p>
              <p className="font-semibold text-slate-800">{contract.pickupFuelLevel ?? "-"} / 8</p>
            </div>
          </div>
          {contract.renderedHtml && (
            <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="contract-preview text-xs text-slate-700" dangerouslySetInnerHTML={{ __html: contract.renderedHtml }} />
            </div>
          )}
        </div>
      )}

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
          {departureChecklist.map((item) => (
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
          {returnChecklist.map((item) => (
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
            {damages.length}
          </span>
        </div>
        {damages.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Aucun dommage signalé sur cette réservation.
          </div>
        ) : (
          <div className="space-y-2">
            {damages.map((d, i) => (
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
