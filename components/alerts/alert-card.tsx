'use client'

import { motion } from 'motion/react'
import { AlertCircle, ChevronRight, Clock } from 'lucide-react'
import type { Alert } from '@/lib/alerts-data'
import { alertTypeConfig, priorityConfig } from '@/lib/alerts-data'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  alert: Alert
  onClick: () => void
  isSelected: boolean
}

export function AlertCard({ alert, onClick, isSelected }: AlertCardProps) {
  const pCfg = priorityConfig[alert.priority]
  const tCfg = alertTypeConfig[alert.type]
  const vehicleLabel = `${alert.carBrand} ${alert.carModel} · ${alert.plate}`
  const daysLeft = alert.daysRemaining ?? (
    alert.dueDate
      ? Math.ceil((new Date(alert.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null
  )

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'w-full text-left rounded-2xl border transition hover:shadow-md p-4',
        isSelected ? 'bg-indigo-50/40 border-indigo-200 shadow-sm' : 'bg-white border-slate-200/70 shadow-sm hover:border-slate-300',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg', tCfg.color.split(' ')[1], tCfg.color.split(' ')[1])}>
          <AlertCircle className={cn('h-5 w-5', tCfg.color.split(' ')[0])} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{vehicleLabel}</h3>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', pCfg.badgeColor)}>
              {pCfg.label}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-2">{alert.title}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {daysLeft !== null && daysLeft > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{daysLeft} {daysLeft === 1 ? 'jour' : 'jours'} restants</span>
              </div>
            )}
            {daysLeft !== null && daysLeft <= 0 && (
              <span className="text-rose-600 font-medium">Dépassé</span>
            )}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', tCfg.color)}>
              {tCfg.label}
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
      </div>
    </motion.button>
  )
}
