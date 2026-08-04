'use client'

import { motion } from 'motion/react'
import { X, CheckCircle, Car, Calendar, Tag } from 'lucide-react'
import type { Alert } from '@/lib/alerts-data'
import { alertTypeConfig, priorityConfig } from '@/lib/alerts-data'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'

interface AlertDetailPanelProps {
  alert: Alert | null
  onClose: () => void
}

export function AlertDetailPanel({ alert, onClose }: AlertDetailPanelProps) {
  const [isResolving, setIsResolving] = useState(false)

  if (!alert) return null

  const handleResolve = async () => {
    setIsResolving(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsResolving(false)
    toast.success('Alerte marquée comme résolue')
    onClose()
  }

  const daysLeft = alert.daysRemaining ?? (
    alert.dueDate
      ? Math.ceil((new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null
  )

  const pCfg = priorityConfig[alert.priority]
  const tCfg = alertTypeConfig[alert.type]
  const vehicleLabel = `${alert.carBrand} ${alert.carModel}`

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      className="absolute inset-0 rounded-2xl border border-slate-200/70 bg-white shadow-lg flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur px-6 py-4 rounded-t-2xl">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900 truncate">{vehicleLabel}</h2>
          <p className="text-xs text-slate-500 font-mono">{alert.plate}</p>
        </div>
        <button onClick={onClose} className="ml-3 flex-shrink-0 text-slate-400 hover:text-slate-600 transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Priority + type badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', pCfg.badgeColor)}>
            {pCfg.label}
          </span>
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', tCfg.color)}>
            {tCfg.label}
          </span>
        </div>

        {/* Alert title + description */}
        <div className="space-y-2">
          <p className="font-semibold text-slate-900">{alert.title}</p>
          {alert.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{alert.description}</p>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Car className="h-3.5 w-3.5" />
              Véhicule
            </div>
            <p className="text-sm font-medium text-slate-900">{vehicleLabel}</p>
            <p className="font-mono text-xs text-slate-500">{alert.plate}</p>
          </div>
          {alert.dueDate && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Date limite
              </div>
              <p className="text-sm font-medium text-slate-900">
                {new Date(alert.dueDate).toLocaleDateString('fr-FR')}
              </p>
              {daysLeft !== null && (
                <p className={cn('text-xs font-medium', daysLeft <= 0 ? 'text-rose-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-slate-500')}>
                  {daysLeft <= 0 ? 'Dépassé' : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restants`}
                </p>
              )}
            </div>
          )}
          {alert.clientName && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Tag className="h-3.5 w-3.5" />
                Client
              </div>
              <p className="text-sm font-medium text-slate-900">{alert.clientName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t border-slate-200/70 bg-white/80 backdrop-blur px-6 py-4 flex gap-3 rounded-b-2xl">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition border border-slate-200"
        >
          Fermer
        </button>
        {alert.status !== 'resolved' && (
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white hover:shadow-md transition disabled:opacity-75"
          >
            {isResolving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Marquer résolu
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}
