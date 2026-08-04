"use client"

import { MoreHorizontal, Pencil, Trash2, Eye, Phone, Calendar, CarFront } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  type Driver,
  statusConfig,
  paymentTypeConfig,
  formatMAD,
  formatDate,
  driverFullName,
  daysUntil,
} from "@/lib/drivers-data"
import { cn } from "@/lib/utils"

function DriverAvatar({ driver }: { driver: Driver }) {
  const initials = `${driver.firstName[0]}${driver.lastName[0]}`.toUpperCase()
  const colors = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-500", "from-rose-500 to-pink-600", "from-violet-500 to-purple-600"]
  const color = colors[parseInt(driver.id.replace("d", ""), 10) % colors.length]
  return (
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm", color)}>
      {initials}
    </div>
  )
}

function ActionsMenu({
  driver,
  onView,
  onEdit,
  onDelete,
}: {
  driver: Driver
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              {[
                { icon: Eye, label: "Voir le dossier", action: onView },
                { icon: Pencil, label: "Modifier", action: onEdit },
                { icon: Trash2, label: "Supprimer", action: onDelete, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button
                  key={label}
                  onClick={(e) => { e.stopPropagation(); setOpen(false); action() }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-slate-50",
                    danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DriversTable({
  drivers,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  drivers: Driver[]
  selectedId?: string | null
  onSelect: (d: Driver) => void
  onEdit: (d: Driver) => void
  onDelete: (d: Driver) => void
}) {
  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <CarFront className="h-7 w-7 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Aucun chauffeur trouvé</p>
        <p className="mt-1 text-xs text-slate-400">Modifiez vos filtres ou ajoutez un nouveau chauffeur.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {["Chauffeur", "Téléphone", "Type paiement", "Tarif actuel", "Missions", "Statut", "Permis", ""].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 first:pl-5 last:pr-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {drivers.map((driver) => {
              const status = statusConfig[driver.status]
              const pt = paymentTypeConfig[driver.paymentType]
              const licenseDays = daysUntil(driver.licenseExpiry)
              const isSelected = selectedId === driver.id
              return (
                <tr
                  key={driver.id}
                  onClick={() => onSelect(driver)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80",
                  )}
                >
                  {/* Driver */}
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <DriverAvatar driver={driver} />
                      <div>
                        <p className="font-semibold text-slate-900">{driverFullName(driver)}</p>
                        <p className="text-[11px] text-slate-400">{driver.city}</p>
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3.5">
                    <a
                      href={`tel:${driver.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-slate-700 hover:text-blue-600"
                    >
                      <Phone className="h-3 w-3" />
                      {driver.phone}
                    </a>
                  </td>

                  {/* Payment type */}
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", pt.color)}>
                      {pt.label}
                    </span>
                  </td>

                  {/* Current rate */}
                  <td className="px-4 py-3.5 font-mono text-sm tabular-nums text-slate-900">
                    {driver.paymentType === "monthly"
                      ? formatMAD(driver.currentRate.monthlySalary ?? 0) + "/mois"
                      : formatMAD(driver.currentRate.pricePerMission ?? 0) + "/miss."}
                  </td>

                  {/* Assignments */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <CarFront className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold tabular-nums text-slate-900">{driver.totalAssignments}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <div className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5", status.pillClass)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", status.textClass)}>
                        {status.label}
                      </span>
                    </div>
                  </td>

                  {/* License expiry */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-700">{formatDate(driver.licenseExpiry)}</span>
                      <span className={cn(
                        "rounded px-1 py-0.5 text-[9px] font-bold uppercase",
                        licenseDays > 90 ? "bg-emerald-50 text-emerald-700" :
                        licenseDays > 0 ? "bg-amber-50 text-amber-700" :
                        "bg-rose-50 text-rose-700",
                      )}>
                        {licenseDays > 0 ? `${licenseDays}j` : "Expiré"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="pr-4 py-3.5 pl-2" onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu
                      driver={driver}
                      onView={() => onSelect(driver)}
                      onEdit={() => onEdit(driver)}
                      onDelete={() => onDelete(driver)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
