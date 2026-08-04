"use client"

import { motion, AnimatePresence } from "motion/react"
import { ChevronRight } from "lucide-react"
import type { GlobalUser } from "@/lib/mock-workspaces"

export function UsersTable({
  users,
  onSelectUser,
  getUserStats,
}: {
  users: GlobalUser[]
  onSelectUser: (id: string) => void
  getUserStats: (userId: string) => { agenciesCount: number; teamsCount: number }
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
          {users.length} utilisateur{users.length !== 1 ? "s" : ""}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Agences</th>
              <th className="px-4 py-3">Équipes</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {users.map((user, idx) => {
                const stats = getUserStats(user.id)
                return (
                  <motion.tr
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="border-b border-slate-100/50 transition hover:bg-slate-50/40 cursor-pointer"
                    onClick={() => onSelectUser(user.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">
                        {user.firstName} {user.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 w-6 h-6 text-xs font-semibold text-indigo-700">
                        {stats.agenciesCount}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center justify-center rounded-full bg-slate-100 w-6 h-6 text-xs font-semibold text-slate-700">
                        {stats.teamsCount}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Actif
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
