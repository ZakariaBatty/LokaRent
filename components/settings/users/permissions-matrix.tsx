"use client"

import { motion } from "motion/react"
import { Check, Eye, Minus, Pencil, Calculator, Calendar, Crown } from "lucide-react"
import { permissionsMatrix, roleStyles, type UserRole } from "@/lib/users-data"

const roleIcons: Record<UserRole, typeof Crown> = {
  Gérant: Crown,
  Réceptionniste: Calendar,
  Comptable: Calculator,
}

export function PermissionsMatrix() {
  const roles: UserRole[] = ["Gérant", "Réceptionniste", "Comptable"]

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
            <Eye className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Récapitulatif des permissions par rôle
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Survolez chaque cellule pour voir le détail de l&apos;accès accordé.
            </p>
          </div>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="sticky left-0 z-10 bg-slate-50/50 px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Module
              </th>
              {roles.map((r) => {
                const Icon = roleIcons[r]
                const style = roleStyles[r]
                return (
                  <th key={r} className="px-4 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${style.badge} ${style.ring}`}
                      >
                        <Icon className="h-3 w-3" />
                        {r}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {permissionsMatrix.map((row, idx) => (
              <motion.tr
                key={row.module}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className="group border-b border-slate-100 last:border-0 transition hover:bg-slate-50/50"
              >
                <td className="sticky left-0 z-10 bg-white px-6 py-3.5 transition group-hover:bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{row.module}</span>
                    <span className="mt-0.5 text-[11px] text-slate-500">{row.description}</span>
                  </div>
                </td>
                {roles.map((r) => {
                  const cell = row.permissions[r]
                  return (
                    <td key={r} className="px-4 py-3.5 text-center">
                      <PermissionCellView level={cell.level} label={cell.label} />
                    </td>
                  )
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 bg-slate-50/30 px-6 py-3.5 text-[11px]">
        <span className="font-semibold uppercase tracking-wider text-slate-500">Légende</span>
        <LegendItem icon={<Check className="h-3 w-3" />} label="Accès complet" tone="emerald" />
        <LegendItem icon={<Pencil className="h-3 w-3" />} label="Modifier" tone="indigo" />
        <LegendItem icon={<Eye className="h-3 w-3" />} label="Voir uniquement" tone="slate" />
        <LegendItem icon={<Minus className="h-3 w-3" />} label="Aucun accès" tone="rose" />
      </div>
    </motion.section>
  )
}

function PermissionCellView({
  level,
  label,
}: {
  level: "full" | "view" | "edit" | "none"
  label?: string
}) {
  if (level === "none") {
    return (
      <span
        title="Aucun accès"
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-400 ring-1 ring-inset ring-rose-100"
      >
        <Minus className="h-3.5 w-3.5" />
      </span>
    )
  }
  if (level === "view") {
    return (
      <span
        title={label ?? "Voir uniquement"}
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
      >
        <Eye className="h-3 w-3" />
        Voir
      </span>
    )
  }
  if (level === "edit") {
    return (
      <span
        title={label ?? "Modifier"}
        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100"
      >
        <Pencil className="h-3 w-3" />
        {label ?? "Modifier"}
      </span>
    )
  }
  // full
  return (
    <span
      title="Accès complet"
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  )
}

function LegendItem({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode
  label: string
  tone: "emerald" | "indigo" | "slate" | "rose"
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : tone === "indigo"
        ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
        : tone === "slate"
          ? "bg-slate-100 text-slate-600 ring-slate-200"
          : "bg-rose-50 text-rose-400 ring-rose-100"
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md ring-1 ring-inset ${cls}`}
      >
        {icon}
      </span>
      {label}
    </span>
  )
}
