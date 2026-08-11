'use client'

import { createContext, useContext, useState, useCallback, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAgencyById,
  getUserAgencies,
  getCurrentUserRoleInAgency,
  getGlobalUserById,
  CURRENT_USER_ID,
  type Agency,
  type UserRole,
  type GlobalUser,
} from '@/lib/mock-workspaces'
import { getAgencyData, type AgencyDataSlice } from '@/lib/agency-data'
import { switchCurrentAgencyAction } from '@/modules/workspace/agencies/actions/switch-agency.action'
import type { CurrentAgencyOption } from '@/shared/auth/current-agency-context'

export type SidebarAgency = CurrentAgencyOption | Agency

interface AgencyContextType {
  currentUser: GlobalUser | null
  activeAgency: SidebarAgency | null
  userAgencies: SidebarAgency[]
  userRole: UserRole
  agencyData: AgencyDataSlice
  switchAgency: (agencyId: string) => void
  switchingAgency: boolean
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined)

function hasRoleName(agency: SidebarAgency): agency is CurrentAgencyOption {
  return 'roleName' in agency && typeof agency.roleName === 'string'
}

type AgencyProviderProps = {
  children: React.ReactNode
  initialAgencies?: CurrentAgencyOption[]
  initialAgencyId?: string
}

export function AgencyProvider({
  children,
  initialAgencies,
  initialAgencyId,
}: AgencyProviderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const currentUser = getGlobalUserById(CURRENT_USER_ID) || null
  const userAgencies = initialAgencies?.length ? initialAgencies : getUserAgencies()
  const [activeAgencyId, setActiveAgencyId] = useState<string>(
    initialAgencyId || userAgencies[0]?.id || 'agency_casablanca'
  )

  const activeAgency =
    userAgencies.find((agency) => agency.id === activeAgencyId) ??
    getAgencyById(activeAgencyId) ??
    null
  const userRole =
    activeAgency && hasRoleName(activeAgency)
      ? (activeAgency.roleName.toUpperCase() as UserRole)
      : activeAgency
        ? getCurrentUserRoleInAgency(activeAgencyId)
        : 'EMPLOYEE'

  const agencyData = useMemo(() => getAgencyData(activeAgencyId), [activeAgencyId])

  const switchAgency = useCallback((agencyId: string) => {
    const agency = userAgencies.find((item) => item.id === agencyId)
    if (!agency) return

    if (initialAgencies?.length) {
      setActiveAgencyId(agencyId)
      startTransition(async () => {
        await switchCurrentAgencyAction(agencyId)
        router.refresh()
      })
      return
    }

    if (getAgencyById(agencyId)) {
      setActiveAgencyId(agencyId)
    }
  }, [initialAgencies?.length, router, userAgencies])

  return (
    <AgencyContext.Provider
      value={{
        currentUser,
        activeAgency,
        userAgencies,
        userRole,
        agencyData,
        switchAgency,
        switchingAgency: isPending,
      }}
    >
      {children}
    </AgencyContext.Provider>
  )
}

export function useAgency() {
  const context = useContext(AgencyContext)
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider')
  }
  return context
}
