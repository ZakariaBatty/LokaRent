"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { X, Info, FileText, Wallet, History, ChevronRight, CarFront, ChevronDown, Check, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import {
  type Reservation,
  type ReservationStatus,
  reservationStatuses,
  statusConfig,
  formatDate,
  formatMAD,
} from "@/lib/reservations-data"
import {
  assignReservationDriverAction,
  listAssignableReservationDriversAction,
} from "@/modules/reservations/actions/create-reservation.action"
import { DetailsTab } from "./tabs/details-tab"
import { ContractTab } from "./tabs/contract-tab"
import { PaymentTab } from "./tabs/payment-tab"
import { TimelineTab } from "./tabs/timeline-tab"
import { WhatsAppShareButton } from "@/components/communication/whatsapp-share-button"
import { cn } from "@/lib/utils"

type TabId = "details" | "contract" | "payment" | "timeline"

type AssignableDriver = {
  id: string
  firstName: string
  lastName: string
  phone: string | null
}

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "details", label: "Détails", icon: Info },
  { id: "contract", label: "Contrat", icon: FileText },
  { id: "payment", label: "Paiement", icon: Wallet },
  { id: "timeline", label: "Timeline", icon: History },
]

export function ReservationDetailPanel({
  reservation,
  onClose,
  onStatusChange,
  onReservationUpdated,
}: {
  reservation: Reservation
  onClose: () => void
  onStatusChange: (id: string, next: ReservationStatus) => void
  onReservationUpdated?: (reservation: Reservation) => void
}) {
  const router = useRouter()
  const { t } = useI18n()
  const [tab, setTab] = useState<TabId>("details")
  const [assignedDriver, setAssignedDriver] = useState<Reservation["driver"]>(reservation.driver ?? null)
  const [availableDrivers, setAvailableDrivers] = useState<AssignableDriver[]>([])
  const [driversLoaded, setDriversLoaded] = useState(false)
  const [driversLoading, setDriversLoading] = useState(false)
  const [driverSaving, setDriverSaving] = useState(false)
  const [driverOpen, setDriverOpen] = useState(false)
  const cfg = statusConfig[reservation.status]

  const openDriverMenu = async () => {
    setDriverOpen((value) => !value)
    if (driversLoaded || driversLoading) return
    setDriversLoading(true)
    const result = await listAssignableReservationDriversAction()
    setDriversLoading(false)
    if (!result.success) {
      toast.error(t("reservations.form.driverLoadFailed"))
      return
    }
    setAvailableDrivers(result.drivers)
    setDriversLoaded(true)
  }

  const assignDriver = async (driver: AssignableDriver | null) => {
    setDriverSaving(true)
    const result = await assignReservationDriverAction({
      reservationId: reservation.id,
      driverId: driver?.id ?? null,
    })
    setDriverSaving(false)
    if (!result.success) {
      toast.error(t(result.messageKey))
      return
    }
    setAssignedDriver(
      driver
        ? {
            id: driver.id,
            name: `${driver.firstName} ${driver.lastName}`,
            phone: driver.phone ?? "",
          }
        : null,
    )
    setDriverOpen(false)
    toast.success(driver ? t("reservations.form.driverAssigned") : t("reservations.form.driverRemoved"))
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {reservation.code}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  cfg.pillBg,
                  cfg.pillText,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
              {reservation.overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                  Retard
                </span>
              )}
            </div>

            <h2 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-900">
              {reservation.client.name}
              <span className="text-slate-400"> · </span>
              <span className="text-slate-700">
                {reservation.car.brand} {reservation.car.model}
              </span>
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>
                {formatDate(reservation.startDate)} → {formatDate(reservation.endDate)}
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-700">{formatMAD(reservation.total)}</span>
              <span className="text-slate-300">·</span>
              <span>{reservation.days} jours</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick status change */}
        <div className="mt-3 px-5 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-1">
            {reservationStatuses.map((s, i) => {
              const sCfg = statusConfig[s]
              const active = s === reservation.status
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (active) return
                      onStatusChange(reservation.id, s)
                      toast.success(`Statut → ${sCfg.label}`)
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      active
                        ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-slate-200"
                        : "text-slate-500 hover:bg-white hover:text-slate-700",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", sCfg.dot)} />
                    {sCfg.label}
                  </button>
                  {i < reservationStatuses.length - 1 && (
                    <ChevronRight className="h-3 w-3 flex-shrink-0 text-slate-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mx-5 mb-3 flex items-center gap-2">
          <WhatsAppShareButton
            template="reservation_summary"
            phoneNumber={reservation.client.phone}
            templateData={{
              code: reservation.code,
              clientName: reservation.client.name,
              carBrand: reservation.car.brand,
              carModel: reservation.car.model,
              carPlate: reservation.car.plate,
              startDate: reservation.startDate,
              endDate: reservation.endDate,
              days: reservation.days,
              total: reservation.total,
              pickupLocation: "Agence centrale",
              returnLocation: "Agence centrale",
            }}
            title={`Réservation #${reservation.code}`}
            size="sm"
          />
        </div>

        {/* Driver assignment */}
        <div className="mx-5 mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <CarFront className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Chauffeur</span>
          <div className="relative ml-auto">
            <button
              onClick={() => void openDriverMenu()}
              disabled={driverSaving}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition",
                assignedDriver
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {assignedDriver
                ? assignedDriver.name
                : t("reservations.form.assignDriver")}
              {driverSaving ? <Loader2 className="h-3 w-3 animate-spin opacity-60" /> : <ChevronDown className="h-3 w-3 opacity-60" />}
            </button>
            <AnimatePresence>
              {driverOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDriverOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <button
                      onClick={() => void assignDriver(null)}
                      disabled={driverSaving}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      {t("reservations.form.noDriver")}
                    </button>
                    <div className="my-1 h-px bg-slate-100" />
                    {driversLoading ? (
                      <div className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-500">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t("reservations.form.loadingDrivers")}
                      </div>
                    ) : availableDrivers.length === 0 ? (
                      <div className="px-3.5 py-2 text-xs text-slate-500">
                        {t("reservations.form.noAssignableDrivers")}
                      </div>
                    ) : (
                      availableDrivers.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => void assignDriver(d)}
                          disabled={driverSaving}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <span className="flex-1 text-left">{d.firstName} {d.lastName}</span>
                          {assignedDriver?.id === d.id && <Check className="h-3 w-3 text-blue-600" />}
                        </button>
                      ))
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-slate-200/80 px-5">
          <div className="flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {active && (
                    <motion.span
                      layoutId="reservation-detail-tab"
                      className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/40 px-5 py-5">
        {tab === "details" && (
          <DetailsTab
            reservation={{
              ...reservation,
              driver: assignedDriver,
            }}
          />
        )}
        {tab === "contract" && <ContractTab reservation={reservation} />}
        {tab === "payment" && <PaymentTab reservation={reservation} onReservationUpdated={onReservationUpdated} />}
        {tab === "timeline" && <TimelineTab reservation={reservation} />}
      </div>
    </div>
  )
}
