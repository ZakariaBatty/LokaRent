"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"

export function SettingsCard({
  title,
  description,
  icon,
  children,
  action,
  delay = 0,
}: {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  action?: ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="px-6 py-6">{children}</div>
    </motion.section>
  )
}

export function FieldLabel({
  label,
  required,
  hint,
  optional,
}: {
  label: string
  required?: boolean
  hint?: string
  optional?: boolean
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
        {optional && (
          <span className="ml-1 text-[10px] font-medium normal-case tracking-normal text-slate-400">
            (optionnel)
          </span>
        )}
      </label>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  )
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
  )
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>
}
