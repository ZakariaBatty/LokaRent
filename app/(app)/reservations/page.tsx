"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  type Reservation,
  type ReservationStatus,
} from "@/lib/reservations-data"
import { useAgency } from "@/contexts/agency-context"
import { ReservationsKpiBar } from "@/components/reservations/reservations-kpi-bar"
import {
  ReservationsFilters,
  type ReservationsFiltersState,
} from "@/components/reservations/reservations-filters"
import { KanbanBoard } from "@/components/reservations/kanban-board"
import { ListView } from "@/components/reservations/list-view"
import { ReservationDetailPanel } from "@/components/reservations/reservation-detail-panel"
import type { ReservationView } from "@/components/reservations/view-toggle"
import { useRouter } from "next/navigation"

export default function ReservationsPage() {
  const router = useRouter()
  const { agencyData } = useAgency()
  const [reservations, setReservations] = useState<Reservation[]>(agencyData.reservations)
  const [view, setView] = useState<ReservationView>("kanban")
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [filters, setFilters] = useState<ReservationsFiltersState>({
    search: "",
    status: "all",
    payment: "all",
    onlyOverdue: false,
    sort: "recent",
  })

  // Reset when agency switches
  useEffect(() => {
    setReservations(agencyData.reservations)
    setSelected(null)
  }, [agencyData])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    let list = reservations.filter((r) => {
      if (filters.status !== "all" && r.status !== filters.status) return false
      if (filters.payment !== "all" && r.paymentStatus !== filters.payment) return false
      if (filters.onlyOverdue && !r.overdue) return false
      if (q) {
        const hay = `${r.code} ${r.client.name} ${r.client.phone} ${r.car.brand} ${r.car.model} ${r.car.plate}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (filters.sort === "amount_desc") return b.total - a.total
      if (filters.sort === "date_asc") return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [reservations, filters])

  const handleOpen = (r: Reservation) => setSelected(r)
  const handleClose = () => setSelected(null)

  const handleStatusChange = (id: string, next: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: next,
              overdue: next === "terminee" || next === "annulee" ? false : r.overdue,
              timeline: [
                ...r.timeline,
                {
                  id: `t-${id}-${Date.now()}`,
                  type: "status",
                  label: `Statut → ${next}`,
                  description: `Changement manuel via le panneau de contrôle`,
                  timestamp: new Date().toISOString(),
                  author: "Vous",
                },
              ],
            }
          : r,
      ),
    )
    setSelected((cur) => (cur && cur.id === id ? { ...cur, status: next } : cur))
  }

  const handleCancel = (id: string) => handleStatusChange(id, "annulee")
  const handleDelete = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id))
    setSelected((cur) => (cur && cur.id === id ? null : cur))
  }

  const handleNew = () => {
    router.push("/reservations/new")
  }

  const handleEdit = (r: Reservation) => {
    router.push(`/reservations/${r.id}/edit`)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      {/* Page header */}
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

      {/* KPI bar */}
      <ReservationsKpiBar reservations={reservations} />

      {/* Filters */}
      <ReservationsFilters
        state={filters}
        onChange={setFilters}
        view={view}
        onViewChange={setView}
        count={filtered.length}
        onNew={handleNew}
      />

      {/* Main content */}
      <AnimatePresence mode="wait" initial={false}>
        {view === "kanban" ? (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <KanbanBoard reservations={filtered} onOpen={handleOpen} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <ListView
              reservations={filtered}
              onOpen={handleOpen}
              onEdit={handleEdit}
              selectedId={selected?.id ?? null}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over detail panel (80%) */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 md:w-[85%] lg:w-[80%]"
            >
              <ReservationDetailPanel
                reservation={selected}
                onClose={handleClose}
                onStatusChange={handleStatusChange}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </div>
  )
}
