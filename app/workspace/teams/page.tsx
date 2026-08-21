"use client"

import { useState, useMemo } from "react"
import { AnimatePresence } from "motion/react"
import { Search, Users2 } from "lucide-react"
import { mockTeams } from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { TeamsTable } from "@/components/workspace/teams/teams-table"
import { TeamDetailPanel } from "@/components/workspace/teams/team-detail-panel"

export default function TeamsPage() {
  const [search, setSearch] = useState("")
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const selectedTeam = mockTeams.find((t) => t.id === selectedTeamId)

  const filtered = useMemo(() => {
    return mockTeams.filter(
      (team) =>
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        team.description.toLowerCase().includes(search.toLowerCase()),
    )
  }, [search])

  return (
    <>
      <div className="space-y-6">
        <WorkspacePageHeader
          icon="users2"
          breadcrumb="Équipes"
          title="Gestion des équipes"
          description="Organisez vos utilisateurs en équipes et gérez leurs accès."
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une équipe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <TeamsTable teams={filtered} onSelectTeam={setSelectedTeamId} />

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200/50 bg-slate-50/50 py-12 text-center">
            <Users2 className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-600">Aucune équipe trouvée</p>
            <p className="mt-1 text-xs text-slate-500">Essayez une autre recherche</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTeam && (
          <TeamDetailPanel team={selectedTeam} onClose={() => setSelectedTeamId(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
