'use client'

import { useState } from 'react'
import { ChevronsUpDown, Check, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAgency } from '@/contexts/agency-context'
import { cn } from '@/lib/utils'
import type { Agency } from '@/lib/mock-workspaces'

const planBadge: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  PRO:       { label: 'Pro',     bg: 'bg-blue-50',   text: 'text-blue-600',  ring: 'ring-blue-100' },
  STARTER:   { label: 'Starter', bg: 'bg-slate-50',  text: 'text-slate-500', ring: 'ring-slate-200' },
  ENTERPRISE:{ label: 'Ent.',    bg: 'bg-amber-50',  text: 'text-amber-600', ring: 'ring-amber-100' },
}

function agencyInitials(name: string) {
  return name
    .replace(/LokaRent\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function agencyGradient(id: string) {
  const map: Record<string, string> = {
    agency_casablanca: 'from-blue-500 to-indigo-600',
    agency_marrakech:  'from-rose-500 to-orange-500',
    agency_agadir:     'from-emerald-500 to-teal-600',
  }
  return map[id] ?? 'from-blue-500 to-indigo-600'
}

export function AgencySwitcher() {
  const { activeAgency, userAgencies, switchAgency, agencyData } = useAgency()
  const [open, setOpen] = useState(false)

  if (!activeAgency) return null

  const badge = planBadge[activeAgency.plan] ?? planBadge.PRO
  const carCount = agencyData.cars.length
  const initials = agencyInitials(activeAgency.name)
  const gradient = agencyGradient(activeAgency.id)

  return (
    <div className="relative">
      {/* Trigger — mirrors the existing hardcoded card */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="group relative flex w-full items-center rounded-xl border border-slate-200/70 bg-white p-2 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-blue-200/70 hover:shadow-[0_4px_12px_rgba(59,130,246,0.08)]"
      >
        <div
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm`}
        >
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
        <div className="ml-2.5 flex min-w-0 flex-1 items-center overflow-hidden">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-slate-900">{activeAgency.city}</p>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset',
                  badge.bg, badge.text, badge.ring
                )}
              >
                {badge.label}
              </span>
            </div>
            <p className="truncate text-[11px] text-slate-500">
              {activeAgency.city} · {carCount} véhicule{carCount !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronsUpDown
            className={cn(
              'ml-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-[calc(100%+6px)] z-40 w-full overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
          >
            {userAgencies.map((agency: Agency) => {
              const isActive = agency.id === activeAgency.id
              const ab = planBadge[agency.plan] ?? planBadge.PRO
              const ag = agencyGradient(agency.id)
              const ai = agencyInitials(agency.name)
              const ac = agencyData.cars.length // only accurate for active; just show city
              return (
                <button
                  key={agency.id}
                  onClick={() => {
                    switchAgency(agency.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50/60 ring-1 ring-inset ring-blue-100'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${ag} shadow-sm`}
                  >
                    <span className="text-[11px] font-semibold text-white">{ai}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'truncate text-[13px] font-semibold',
                          isActive ? 'text-blue-700' : 'text-slate-900'
                        )}
                      >
                        {agency.city}
                      </span>
                      <span
                        className={cn(
                          'rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ring-1 ring-inset',
                          ab.bg, ab.text, ab.ring
                        )}
                      >
                        {ab.label}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-500">{agency.name}</p>
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
