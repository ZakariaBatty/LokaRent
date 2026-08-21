"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronRight } from "lucide-react"
import type { Agency } from "@/lib/mock-workspaces"
import { cn } from "@/lib/utils"

const statusStyles: Record<Agency["status"], { dot: string; bg: string; label: string }> = {
  active: { dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700", label: "Actif" },
  suspended: { dot: "bg-amber-500", bg: "bg-amber-50 text-amber-700", label: "Suspendu" },
  cancelled: { dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700", label: "Annulé" },
}

export function AgenciesTable({
  agencies,
  onSelectAgency,
}: {
  agencies: Agency[]
  onSelectAgency: (id: string) => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          {agencies.length} agence{agencies.length !== 1 ? "s" : ""}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Agence</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Utilisateurs</th>
              <th className="px-4 py-3">Véhicules</th>
              <th className="px-4 py-3">Réservations</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {agencies.map((agency, idx) => {
                const status = statusStyles[agency.status]
                return (
                  <motion.tr
                    key={agency.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="border-b border-slate-100/50 transition hover:bg-slate-50/40 cursor-pointer"
                    onClick={() => onSelectAgency(agency.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{agency.name}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{agency.city}</td>
                    <td className="px-4 py-4 text-slate-600">{agency.memberCount}</td>
                    <td className="px-4 py-4 text-slate-600">{agency.carCount}</td>
                    <td className="px-4 py-4 text-slate-600">{agency.reservationCount}</td>
                    <td className="px-4 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", status.bg)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}
