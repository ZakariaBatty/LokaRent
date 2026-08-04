"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  type CalendarBlock,
  calendarVehicles,
  calendarBlocks,
  addDays,
  endOfMonth,
  monthNamesFr,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendar-data"
import { CalendarKpiBar } from "@/components/calendar/calendar-kpi-bar"
import { CalendarToolbar, type CalendarView } from "@/components/calendar/calendar-toolbar"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { CalendarLegend } from "@/components/calendar/calendar-legend"
import { CalendarBlockDetailPanel } from "@/components/calendar/calendar-block-detail-panel"

function viewToCellWidth(v: CalendarView): number {
  if (v === "week") return 156
  if (v === "twoweeks") return 88
  return 48 // month
}

function getWindow(anchor: Date, view: CalendarView): { start: Date; days: number } {
  if (view === "week") {
    return { start: startOfWeekMonday(anchor), days: 7 }
  }
  if (view === "twoweeks") {
    return { start: startOfWeekMonday(anchor), days: 14 }
  }
  // month
  const start = startOfMonth(anchor)
  const end = endOfMonth(anchor)
  const days = end.getDate()
  return { start, days }
}

function shiftAnchor(anchor: Date, view: CalendarView, direction: 1 | -1): Date {
  const next = new Date(anchor)
  if (view === "month") {
    next.setDate(1)
    next.setMonth(next.getMonth() + direction)
  } else if (view === "twoweeks") {
    next.setDate(next.getDate() + direction * 14)
  } else {
    next.setDate(next.getDate() + direction * 7)
  }
  return next
}

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month")
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()))
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null)

  const { start: visibleStart, days: daysCount } = useMemo(
    () => getWindow(anchor, view),
    [anchor, view],
  )
  const cellWidth = viewToCellWidth(view)

  const rangeLabel = useMemo(() => {
    const last = addDays(visibleStart, daysCount - 1)
    if (view === "month") {
      return `${monthNamesFr[visibleStart.getMonth()]} ${visibleStart.getFullYear()}`
    }
    const sameYear = visibleStart.getFullYear() === last.getFullYear()
    const sameMonth = visibleStart.getMonth() === last.getMonth() && sameYear
    if (sameMonth) {
      return `${visibleStart.getDate()} – ${last.getDate()} ${monthNamesFr[visibleStart.getMonth()]} ${visibleStart.getFullYear()}`
    }
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
    return `${visibleStart.toLocaleDateString("fr-FR", opts)} – ${last.toLocaleDateString("fr-FR", opts)} ${last.getFullYear()}`
  }, [visibleStart, daysCount, view])

  // KPIs (computed from data + today)
  const kpis = useMemo(() => {
    const today = startOfDay(new Date())
    let active = 0
    let maintenanceNow = 0
    const busyVehicleIds = new Set<string>()
    for (const b of calendarBlocks) {
      const s = parseISO(b.startDate)
      const e = parseISO(b.endDate)
      if (today >= s && today <= e) {
        busyVehicleIds.add(b.vehicleId)
        if (b.type === "reservation") active++
        if (b.type === "maintenance") maintenanceNow++
      }
    }
    // active reservations include both en_cours today + future confirmed
    const upcomingConfirmed = calendarBlocks.filter(
      (b) => b.type === "reservation" && parseISO(b.startDate) > today,
    ).length
    const totalVehicles = calendarVehicles.length
    const availableToday = totalVehicles - busyVehicleIds.size
    const occupancy = Math.round((busyVehicleIds.size / totalVehicles) * 100)
    return {
      totalVehicles,
      availableToday,
      activeReservations: active + upcomingConfirmed,
      inMaintenance: maintenanceNow,
      occupancy,
    }
  }, [])

  const selectedVehicle = useMemo(() => {
    if (!selectedBlock) return null
    return calendarVehicles.find((v) => v.id === selectedBlock.vehicleId) ?? null
  }, [selectedBlock])

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        rangeLabel={rangeLabel}
        onPrev={() => setAnchor((a) => shiftAnchor(a, view, -1))}
        onNext={() => setAnchor((a) => shiftAnchor(a, view, 1))}
        onToday={() => setAnchor(startOfDay(new Date()))}
      />

      <CalendarKpiBar
        totalVehicles={kpis.totalVehicles}
        availableToday={kpis.availableToday}
        activeReservations={kpis.activeReservations}
        inMaintenance={kpis.inMaintenance}
        occupancy={kpis.occupancy}
      />

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <CalendarGrid
          vehicles={calendarVehicles}
          blocks={calendarBlocks}
          visibleStart={visibleStart}
          daysCount={daysCount}
          cellWidth={cellWidth}
          onOpenBlock={(b) => setSelectedBlock(b)}
        />
      </motion.div>

      <CalendarLegend />

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selectedBlock && selectedVehicle && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedBlock(null)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 sm:max-w-[480px] md:max-w-[520px]"
            >
              <CalendarBlockDetailPanel
                block={selectedBlock}
                vehicle={selectedVehicle}
                onClose={() => setSelectedBlock(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
