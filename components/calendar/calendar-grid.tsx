"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  type CalendarBlock,
  type CalendarVehicle,
  addDays,
  daysBetween,
  dayShortFr,
  isSameDay,
  isWeekend,
  parseISO,
  startOfDay,
} from "@/lib/calendar-data"
import { ReservationBlock } from "./reservation-block"
import { VehicleRowHeader } from "./vehicle-row-header"
import { EmptyCellPopover } from "./empty-cell-popover"
import { cn } from "@/lib/utils"

const LEFT_COL_WIDTH = 260
const ROW_HEIGHT = 76

export function CalendarGrid({
  vehicles,
  blocks,
  visibleStart,
  daysCount,
  cellWidth,
  onOpenBlock,
}: {
  vehicles: CalendarVehicle[]
  blocks: CalendarBlock[]
  visibleStart: Date
  daysCount: number
  cellWidth: number
  onOpenBlock: (block: CalendarBlock) => void
}) {
  const days = useMemo(
    () => Array.from({ length: daysCount }, (_, i) => addDays(visibleStart, i)),
    [visibleStart, daysCount],
  )

  const today = useMemo(() => startOfDay(new Date()), [])
  const todayIdx = useMemo(() => {
    for (let i = 0; i < days.length; i++) {
      if (isSameDay(days[i], today)) return i
    }
    return -1
  }, [days, today])

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [emptyPopover, setEmptyPopover] = useState<{
    vehicle: CalendarVehicle
    date: Date
    position: { x: number; y: number }
  } | null>(null)

  // Auto-scroll to today on view/day change
  useEffect(() => {
    if (!scrollerRef.current || todayIdx < 0) return
    const targetLeft = Math.max(0, LEFT_COL_WIDTH + todayIdx * cellWidth - 200)
    scrollerRef.current.scrollTo({ left: targetLeft, behavior: "smooth" })
  }, [todayIdx, cellWidth, daysCount])

  const totalGridWidth = LEFT_COL_WIDTH + daysCount * cellWidth

  // Group blocks per vehicle once
  const blocksByVehicle = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>()
    for (const v of vehicles) map.set(v.id, [])
    for (const b of blocks) {
      const list = map.get(b.vehicleId)
      if (list) list.push(b)
    }
    return map
  }, [vehicles, blocks])

  const handleEmptyCellClick = (
    vehicle: CalendarVehicle,
    date: Date,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setEmptyPopover({
      vehicle,
      date,
      position: { x: rect.left, y: rect.bottom + 6 },
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_18px_rgba(15,23,42,0.04)]">
      <div ref={scrollerRef} className="relative overflow-x-auto">
        <div style={{ width: totalGridWidth }} className="relative">
          {/* HEADER ROW */}
          <div
            className="sticky top-0 z-30 flex border-b border-slate-200 bg-white/95 backdrop-blur-xl"
            style={{ width: totalGridWidth }}
          >
            <div
              className="sticky left-0 z-40 flex items-center border-r border-slate-200 bg-white/95 px-4 backdrop-blur-xl"
              style={{ width: LEFT_COL_WIDTH, height: 64 }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Véhicule
              </p>
            </div>
            <div className="flex" style={{ height: 64 }}>
              {days.map((d, i) => {
                const isToday = isSameDay(d, today)
                const weekend = isWeekend(d)
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex shrink-0 flex-col items-center justify-center border-r border-slate-100 text-center",
                      weekend && "bg-slate-50/60",
                      isToday && "bg-indigo-50/80",
                    )}
                    style={{ width: cellWidth }}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        isToday ? "text-indigo-700" : "text-slate-400",
                      )}
                    >
                      {dayShortFr[(d.getDay() + 6) % 7]}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        isToday ? "text-indigo-900" : "text-slate-700",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {cellWidth >= 80 && (
                      <span
                        className={cn(
                          "text-[10px]",
                          isToday ? "text-indigo-600" : "text-slate-400",
                        )}
                      >
                        {d.toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* TODAY vertical highlight line */}
          {todayIdx >= 0 && (
            <div
              className="pointer-events-none absolute z-20"
              style={{
                left: LEFT_COL_WIDTH + todayIdx * cellWidth,
                top: 64,
                bottom: 0,
                width: cellWidth,
              }}
            >
              <div className="h-full bg-indigo-500/[0.04]" />
              <div className="absolute left-0 top-0 h-full w-px bg-indigo-400/40" />
              <div className="absolute right-0 top-0 h-full w-px bg-indigo-400/40" />
            </div>
          )}

          {/* CAR ROWS */}
          <div>
            {vehicles.map((v, rowIndex) => {
              const vehicleBlocks = blocksByVehicle.get(v.id) || []
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.04, duration: 0.25 }}
                  className="group/row flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Sticky left vehicle column */}
                  <div
                    className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur-xl group-hover/row:bg-slate-50/95"
                    style={{ width: LEFT_COL_WIDTH }}
                  >
                    <VehicleRowHeader vehicle={v} />
                  </div>

                  {/* Day cells + absolute reservation blocks */}
                  <div className="relative flex" style={{ width: daysCount * cellWidth }}>
                    {days.map((d, i) => {
                      const weekend = isWeekend(d)
                      const isToday = isSameDay(d, today)
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => handleEmptyCellClick(v, d, e)}
                          className={cn(
                            "h-full shrink-0 border-r border-slate-100 transition-colors",
                            weekend && "bg-slate-50/40",
                            isToday && "bg-indigo-50/40",
                            "hover:bg-indigo-50/70",
                          )}
                          style={{ width: cellWidth }}
                          aria-label="Cellule disponible"
                        />
                      )
                    })}

                    {/* RESERVATION BLOCKS */}
                    {vehicleBlocks.map((b, bi) => {
                      const blockStart = parseISO(b.startDate)
                      const blockEnd = parseISO(b.endDate)
                      const windowEnd = days[days.length - 1]
                      const windowStart = days[0]

                      // Clip to visible window
                      const clipStart = blockStart < windowStart ? windowStart : blockStart
                      const clipEnd = blockEnd > windowEnd ? windowEnd : blockEnd

                      if (clipStart > clipEnd) return null
                      if (blockEnd < windowStart || blockStart > windowEnd) return null

                      const startIdx = daysBetween(windowStart, clipStart)
                      const span = daysBetween(clipStart, clipEnd) + 1

                      const truncatedLeft = blockStart < windowStart
                      const truncatedRight = blockEnd > windowEnd

                      const left = startIdx * cellWidth + 3
                      const width = span * cellWidth - 6

                      return (
                        <ReservationBlock
                          key={b.id}
                          block={b}
                          left={left}
                          width={width}
                          truncatedLeft={truncatedLeft}
                          truncatedRight={truncatedRight}
                          onOpen={onOpenBlock}
                          rowIndex={rowIndex + bi}
                        />
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Edge scroll shadows */}
        <div className="pointer-events-none absolute inset-y-0 left-[260px] w-6 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
      </div>

      <AnimatePresence>
        {emptyPopover && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setEmptyPopover(null)}
              aria-hidden
            />
            <EmptyCellPopover
              vehicle={emptyPopover.vehicle}
              date={emptyPopover.date}
              position={emptyPopover.position}
              onClose={() => setEmptyPopover(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
