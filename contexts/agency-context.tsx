'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
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

interface AgencyContextType {
  currentUser: GlobalUser | null
  activeAgency: Agency | null
  userAgencies: Agency[]
  userRole: UserRole
  agencyData: AgencyDataSlice
  switchAgency: (agencyId: string) => void
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined)

export function AgencyProvider({ children }: { children: React.ReactNode }) {
  const currentUser = getGlobalUserById(CURRENT_USER_ID) || null
  const userAgencies = getUserAgencies()
  const [activeAgencyId, setActiveAgencyId] = useState<string>(
    userAgencies[0]?.id || 'agency_casablanca'
  )

  const activeAgency = getAgencyById(activeAgencyId) || null
  const userRole = activeAgency ? getCurrentUserRoleInAgency(activeAgencyId) : 'EMPLOYEE'

  const agencyData = useMemo(() => getAgencyData(activeAgencyId), [activeAgencyId])

  const switchAgency = useCallback((agencyId: string) => {
    const agency = getAgencyById(agencyId)
    if (agency) {
      setActiveAgencyId(agencyId)
    }
  }, [])

  return (
    <AgencyContext.Provider
      value={{
        currentUser,
        activeAgency,
        userAgencies,
        userRole,
        agencyData,
        switchAgency,
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
