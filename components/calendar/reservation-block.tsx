"use client"

import { motion } from "motion/react"
import { Wrench, AlertCircle } from "lucide-react"
import {
  type CalendarBlock,
  blockStyle,
  formatMAD,
  parseISO,
  formatDateFr,
} from "@/lib/calendar-data"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function ReservationBlock({
  block,
  left,
  width,
  truncatedLeft,
  truncatedRight,
  onOpen,
  rowIndex,
}: {
  block: CalendarBlock
  left: number
  width: number
  truncatedLeft: boolean
  truncatedRight: boolean
  onOpen: (block: CalendarBlock) => void
  rowIndex: number
}) {
  const style = blockStyle[block.status]
  const isMaintenance = block.type === "maintenance"
  const overdue = !!block.overdue

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={() => onOpen(block)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: rowIndex * 0.02 + 0.05, duration: 0.25 }}
            whileHover={{ y: -1 }}
            className={cn(
              "group absolute top-1/2 z-10 flex h-[56px] -translate-y-1/2 items-center gap-2 overflow-hidden border px-3 text-left transition-all",
              style.bg,
              style.border,
              "shadow-[0_2px_6px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.10)] hover:z-20",
              truncatedLeft ? "rounded-l-none" : "rounded-l-xl",
              truncatedRight ? "rounded-r-none" : "rounded-r-xl",
              overdue &&
                "ring-1 ring-rose-400/70 shadow-[0_0_0_2px_rgba(244,63,94,0.12),0_8px_20px_rgba(244,63,94,0.18)]",
            )}
            style={{ left, width: Math.max(width, 32) }}
          >
            {/* Left accent bar */}
            <span
              className={cn(
                "absolute inset-y-2 left-0 w-1 rounded-r-full",
                style.bar,
                truncatedLeft && "hidden",
              )}
            />

            {/* Truncation chevron indicators */}
            {truncatedLeft && (
              <span className={cn("absolute inset-y-0 left-0 w-1.5", style.bar, "opacity-50")} />
            )}
            {truncatedRight && (
              <span className={cn("absolute inset-y-0 right-0 w-1.5", style.bar, "opacity-50")} />
            )}

            {isMaintenance ? (
              <div className={cn("flex min-w-0 items-center gap-2", style.text)}>
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold uppercase tracking-wider">
                    Maintenance
                  </p>
                  <p className="truncate text-[11px] opacity-80">
                    {block.maintenanceReason}
                  </p>
                </div>
              </div>
            ) : (
              <div className={cn("flex min-w-0 flex-1 items-center gap-2", style.text)}>
                {overdue && (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {block.clientName}
                  </p>
                  <p className="truncate text-[11px] leading-tight opacity-80">
                    {block.reservationCode}
                  </p>
                </div>
              </div>
            )}

            {/* subtle shimmer on hover */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={10}
          className="z-50 max-w-[280px] rounded-xl border border-slate-200/80 bg-white/95 p-0 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.15)] backdrop-blur-xl"
        >
          <div className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                {isMaintenance ? (
                  <p className="text-sm font-bold">Maintenance planifiée</p>
                ) : (
                  <>
                    <p className="text-sm font-bold">{block.clientName}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {block.reservationCode}
                    </p>
                  </>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                  style.bg,
                  style.text,
                  style.border,
                )}
              >
                <span className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle", style.dot)} />
                {style.label}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-[11px]">
              <div>
                <p className="text-slate-500">Du</p>
                <p className="font-semibold text-slate-900">
                  {formatDateFr(parseISO(block.startDate))}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Au</p>
                <p className="font-semibold text-slate-900">
                  {formatDateFr(parseISO(block.endDate))}
                </p>
              </div>
            </div>

            {isMaintenance ? (
              <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
                <span className="font-medium">Motif :</span> {block.maintenanceReason}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                <span className="text-[11px] text-slate-500">Montant</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatMAD(block.total ?? 0)}
                </span>
              </div>
            )}

            {overdue && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700">
                <AlertCircle className="h-3 w-3" />
                Retour en retard
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
