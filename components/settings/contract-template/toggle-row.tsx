"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        checked
          ? "border-indigo-200 bg-indigo-50/50 hover:border-indigo-300"
          : "border-slate-200/70 bg-white hover:border-slate-300"
      }`}
    >
      {icon && (
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset transition ${
            checked
              ? "bg-indigo-100 text-indigo-700 ring-indigo-100"
              : "bg-slate-100 text-slate-500 ring-slate-100"
          }`}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{description}</p>
        )}
      </div>
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-slate-200"
        }`}
        aria-pressed={checked}
        role="switch"
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`inline-block h-4 w-4 rounded-full bg-white shadow ${
            checked ? "ml-4" : "ml-0.5"
          }`}
        />
      </span>
    </button>
  )
}
