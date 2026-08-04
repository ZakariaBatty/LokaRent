'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, Search, RotateCcw } from 'lucide-react'
import { alerts, type Alert } from '@/lib/alerts-data'
import { AlertKpiCard } from '@/components/alerts/alert-kpi-card'
import { AlertFilterTabs } from '@/components/alerts/alert-filter-tabs'
import { AlertCard } from '@/components/alerts/alert-card'
import { AlertDetailPanel } from '@/components/alerts/alert-detail-panel'
import { toast } from 'sonner'

export default function AlertsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'assurance' | 'vignette' | 'visite_technique' | 'retard' | 'paiement' | 'maintenance'>('all')

  const selectedAlert = alerts.find((a) => a.id === selectedId) || null

  const filtered = alerts.filter((a) => {
    const matchesSearch = `${a.carBrand} ${a.carModel}`.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || a.type === typeFilter
    return matchesSearch && matchesType
  })

  const types = [
    { key: 'all', label: 'Tous', count: alerts.length },
    { key: 'assurance', label: 'Assurances', count: alerts.filter((a) => a.type === 'assurance').length },
    { key: 'vignette', label: 'Vignettes', count: alerts.filter((a) => a.type === 'vignette').length },
    { key: 'visite_technique', label: 'Visites techniques', count: alerts.filter((a) => a.type === 'visite_technique').length },
    { key: 'retard', label: 'Retards', count: alerts.filter((a) => a.type === 'retard').length },
    { key: 'paiement', label: 'Paiements', count: alerts.filter((a) => a.type === 'paiement').length },
    { key: 'maintenance', label: 'Maintenance', count: alerts.filter((a) => a.type === 'maintenance').length },
  ] as const

  const urgentCount = alerts.filter((a) => a.priority === 'urgent').length
  const closeCount = alerts.filter((a) => a.priority === 'proche').length
  const infoCount = alerts.filter((a) => a.priority === 'info').length
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 ring-1 ring-inset ring-indigo-200">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Alertes</h1>
          </div>
          <p className="text-sm text-slate-600">Suivez les événements importants de votre flotte</p>
        </div>
        <button
          onClick={() => {
            setSearch('')
            setTypeFilter('all')
            toast.success('Alertes actualisées')
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition border border-slate-200"
        >
          <RotateCcw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <AlertKpiCard count={urgentCount} label="Urgentes" priority="urgent" />
        <AlertKpiCard count={closeCount} label="Proches" priority="proche" />
        <AlertKpiCard count={infoCount} label="Informations" priority="info" />
        <AlertKpiCard count={resolvedCount} label="Résolues" priority="info" />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un véhicule ou une alerte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-9 w-full"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <AlertFilterTabs categories={types} activeCategory={typeFilter} onCategoryChange={(key: any) => setTypeFilter(key)} />

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 gap-3 lg:gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: idx * 0.05 }}
              >
                <AlertCard alert={alert} onClick={() => setSelectedId(alert.id)} isSelected={selectedId === alert.id} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center"
            >
              <Bell className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-600">Aucune alerte</p>
              <p className="text-xs text-slate-500 mt-1">Tout est à jour dans votre flotte</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 md:w-[85%] lg:w-[560px]"
            >
              <AlertDetailPanel alert={selectedAlert} onClose={() => setSelectedId(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
