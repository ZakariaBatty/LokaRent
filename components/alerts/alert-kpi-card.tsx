'use client'

import { motion } from 'motion/react'
import { AlertCircle, CheckCircle, Info, Clock } from 'lucide-react'
import type { Alert } from '@/lib/alerts-data'
import { cn } from '@/lib/utils'

const priorityConfig = {
  urgent: { color: 'rose', icon: AlertCircle, label: 'Urgente' },
  proche: { color: 'amber', icon: Clock, label: 'Proche' },
  info: { color: 'blue', icon: Info, label: 'Information' },
  resolved: { color: 'emerald', icon: CheckCircle, label: 'Résolue' },
}

const categoryConfig = {
  assurance: 'Assurance',
  vignette: 'Vignette',
  visite_technique: 'Visite technique',
  retard: 'Retard de retour',
  maintenance: 'Maintenance',
  autre: 'Autre',
}

interface AlertKpiCardProps {
  count: number
  label: string
  priority: Alert['priority']
  onClick?: () => void
}

export function AlertKpiCard({ count, label, priority, onClick }: AlertKpiCardProps) {
  const config = priorityConfig[priority]
  const colorMap = {
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300',
        colorMap[config.color],
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('grid h-10 w-10 place-items-center rounded-lg', colorMap[config.color])}>
          <config.icon className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="text-2xl font-bold tabular-nums">{count}</div>
          <div className="text-xs font-medium text-slate-600">{label}</div>
        </div>
      </div>
    </motion.button>
  )
}
