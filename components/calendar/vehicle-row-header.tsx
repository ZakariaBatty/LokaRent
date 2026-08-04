"use client"

import { Car } from "lucide-react"
import { type CalendarVehicle, vehicleStatusDot, categoryBadge } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"

export function VehicleRowHeader({ vehicle }: { vehicle: CalendarVehicle }) {
  const status = vehicleStatusDot[vehicle.currentStatus]
  return (
    <div className="flex h-full items-center gap-3 px-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-inset ring-slate-200">
        <Car className="h-5 w-5 text-slate-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inset-0 rounded-full opacity-60 blur-[2px]", status.dot)} />
            <span className={cn("relative h-2 w-2 rounded-full", status.dot)} />
          </span>
          <p className="truncate text-sm font-semibold text-slate-900">
            {vehicle.brand} {vehicle.model}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
            {vehicle.plate}
          </span>
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              categoryBadge[vehicle.category],
            )}
          >
            {vehicle.category}
          </span>
        </div>
      </div>
    </div>
  )
}
