"use client"

import { motion } from "motion/react"
import { Crown, Sparkles } from "lucide-react"
import { useAgency } from "@/contexts/agency-context"

const loyaltyStyles = {
  Gold: {
    bg: "bg-amber-50 text-amber-700 ring-amber-100",
    icon: Crown,
  },
  Silver: {
    bg: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: Sparkles,
  },
} as const

export function TopClients() {
  const { agencyData } = useAgency()
  const topClients = agencyData.clients
    .slice()
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 3)
    .map((c) => {
      const parts = c.fullName.trim().split(" ")
      const initials = parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : c.fullName.slice(0, 2).toUpperCase()
      return {
        name: c.fullName,
        initials,
        rentals: c.totalRentals,
        spent: `${c.totalSpent.toLocaleString("fr-FR")} DH`,
        loyalty: c.totalRentals >= 5 ? "Gold" : "Silver",
      }
    })

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Meilleurs clients</h3>
          <p className="mt-0.5 text-xs text-slate-500">Classement par fidélité</p>
        </div>
        <button className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
          Voir tout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {topClients.map((client, i) => {
          const loyalty = loyaltyStyles[client.loyalty as keyof typeof loyaltyStyles]
          const LoyaltyIcon = loyalty.icon
          return (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.08, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md hover:shadow-slate-200/60"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900">
                    <span className="text-xs font-semibold text-white">{client.initials}</span>
                  </div>
                  {client.loyalty === "Gold" && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 ring-2 ring-white">
                      <Crown className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{client.name}</p>
                  <p className="text-[10px] text-slate-400">{client.rentals} locations</p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-slate-900">{client.spent}</p>
                  <p className="text-[10px] text-slate-400">Total dépensé</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${loyalty.bg}`}
                >
                  <LoyaltyIcon className="h-2.5 w-2.5" />
                  {client.loyalty}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
