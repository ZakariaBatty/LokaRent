"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronRight } from "lucide-react"
import type { AgencyTeam } from "@/lib/mock-workspaces"
import { getAgencyById } from "@/lib/mock-workspaces"

export function TeamsTable({
  teams,
  onSelectTeam,
}: {
  teams: AgencyTeam[]
  onSelectTeam: (id: string) => void
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
          {teams.length} équipe{teams.length !== 1 ? "s" : ""}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Équipe</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Agence</th>
              <th className="px-4 py-3">Membres</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {teams.map((team, idx) => {
                const agency = getAgencyById(team.agencyId)
                return (
                  <motion.tr
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="cursor-pointer border-b border-slate-100/50 transition hover:bg-slate-50/40"
                    onClick={() => onSelectTeam(team.id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{team.name}</td>
                    <td className="px-4 py-4 text-slate-600">{team.description}</td>
                    <td className="px-4 py-4 text-slate-600">{agency?.name ?? "—"}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {team.memberIds.length}
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
