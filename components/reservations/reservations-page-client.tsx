"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import {
  type Reservation,
  type ReservationStatus,
} from "@/lib/reservations-data"
import {
  activateReservationAction,
  cancelReservationAction,
  completeReservationAction,
  confirmReservationAction,
  deleteReservationAction,
} from "@/modules/reservations/actions/create-reservation.action"
import { ReservationsKpiBar } from "@/components/reservations/reservations-kpi-bar"
import {
  ReservationsFilters,
  type ReservationsFiltersState,
} from "@/components/reservations/reservations-filters"
import { KanbanBoard } from "@/components/reservations/kanban-board"
import { ListView } from "@/components/reservations/list-view"
import { ReservationDetailPanel } from "@/components/reservations/reservation-detail-panel"
import type { ReservationView } from "@/components/reservations/view-toggle"

export function ReservationsPageClient({
  initialReservations,
  initialFilters,
}: {
  initialReservations: Reservation[]
  initialFilters: ReservationsFiltersState
}) {
  const router = useRouter()
  const { t } = useI18n()
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [view, setView] = useState<ReservationView>("kanban")
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [filters, setFilters] = useState<ReservationsFiltersState>(initialFilters)

  const filtered = useMemo(() => reservations, [reservations])

  const refresh = () => router.refresh()
  const handleOpen = (r: Reservation) => setSelected(r)
  const handleClose = () => setSelected(null)

  const runLifecycle = async (id: string, next: ReservationStatus) => {
    const action =
      next === "confirmee"
        ? confirmReservationAction({ reservationId: id })
        : next === "en_cours"
          ? activateReservationAction({ reservationId: id })
          : next === "terminee"
            ? completeReservationAction({ reservationId: id })
            : next === "annulee"
              ? cancelReservationAction({ reservationId: id, reason: "cancelled_from_reservation_ui" })
              : Promise.resolve({ success: false as const, messageKey: "reservations.errors.invalidStatusTransition" })
    const result = await action
    if (!result.success) {
      toast.error(t("reservations.form.actionUnavailable"))
      return
    }
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)))
    setSelected((cur) => (cur && cur.id === id ? { ...cur, status: next } : cur))
    refresh()
  }

  const handleDelete = async (id: string) => {
    const result = await deleteReservationAction({ reservationId: id })
    if (!result.success) {
      toast.error(t("reservations.form.deleteUnavailable"))
      return false
    }
    setReservations((prev) => prev.filter((r) => r.id !== id))
    setSelected((cur) => (cur && cur.id === id ? null : cur))
    refresh()
    return true
  }

  const handleNew = () => router.push("/reservations/new")
  const handleEdit = (r: Reservation) => router.push(`/reservations/${r.id}/edit`)

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
            Réservations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Centre de contrôle opérationnel · workflow et flux financier
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Données temps réel · auto-rafraîchissement
        </div>
      </motion.div>

      <ReservationsKpiBar reservations={reservations} />
      <ReservationsFilters
        state={filters}
        onChange={setFilters}
        view={view}
        onViewChange={setView}
        count={filtered.length}
        onNew={handleNew}
      />

      <AnimatePresence mode="wait" initial={false}>
        {view === "kanban" ? (
          <motion.div key="kanban" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <KanbanBoard reservations={filtered} onOpen={handleOpen} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <ListView
              reservations={filtered}
              onOpen={handleOpen}
              onEdit={handleEdit}
              selectedId={selected?.id ?? null}
              onCancel={(id) => void runLifecycle(id, "annulee")}
              onDelete={handleDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={handleClose} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
            <motion.div key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 32 }} className="fixed inset-y-0 right-0 z-50 w-full p-3 md:w-[85%] lg:w-[80%]">
              <ReservationDetailPanel
                reservation={selected}
                onClose={handleClose}
                onStatusChange={(id, next) => void runLifecycle(id, next)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
