"use client"

import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

export function ActiveRentals() {
  const { agencyData } = useAgency()
  // Build active rentals from car reservation histories
  const activeRentals = agencyData.cars
    .flatMap((car) =>
      car.reservations
        .filter((r) => r.status === "active")
        .map((r) => ({
          id: r.id,
          client: r.clientName,
          avatar: r.clientInitials,
          vehicle: `${car.brand} ${car.model}`,
          plate: car.plate,
          start: new Date(r.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          end: new Date(r.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          amount: `${r.amount.toLocaleString("fr-FR")} DH`,
          status: "En cours",
        }))
    )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Locations actives</h3>
          <p className="mt-0.5 text-xs text-slate-500">{activeRentals.length} contrats en cours</p>
        </div>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
          Voir tout
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Client
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Véhicule
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Période
              </th>
              <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Montant
              </th>
            </tr>
          </thead>
          <tbody>
            {activeRentals.map((rental, i) => (
              <motion.tr
                key={rental.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.3 }}
                className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200">
                      <span className="text-[10px] font-semibold text-slate-700">{rental.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rental.client}</p>
                      <p className="text-[10px] text-slate-400">{rental.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-slate-900">{rental.vehicle}</p>
                  <p className="font-mono text-[10px] text-slate-400">{rental.plate}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-slate-700">
                    {rental.start} <span className="text-slate-300">→</span> {rental.end}
                  </p>
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    {rental.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-sm font-semibold text-slate-900">{rental.amount}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
