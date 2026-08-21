"use client"

import { motion } from "motion/react"
import {
  Activity,
  Building2,
  CreditCard,
  Crown,
  Mail,
  Shield,
  Users,
  Users2,
} from "lucide-react"

const headerIcons = {
  activity: Activity,
  building: Building2,
  creditCard: CreditCard,
  crown: Crown,
  mail: Mail,
  shield: Shield,
  users: Users,
  users2: Users2,
} as const

export type WorkspacePageHeaderIcon = keyof typeof headerIcons

export function WorkspacePageHeader({
  icon,
  breadcrumb,
  title,
  description,
  actions,
}: {
  icon: WorkspacePageHeaderIcon
  breadcrumb: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  const Icon = headerIcons[icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-start justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Espace de travail
            </p>
            <span className="text-slate-300">/</span>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
              {breadcrumb}
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  )
}
