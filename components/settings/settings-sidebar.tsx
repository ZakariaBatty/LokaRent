"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { Bell, Building2, FileText, SlidersHorizontal, Tag } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const items: { href: string; label: string; icon: LucideIcon; description: string }[] = [
  {
    href: "/settings/agency",
    label: "Profil & Marque",
    icon: Building2,
    description: "Identité & coordonnées",
  },
  {
    href: "/settings/pricing",
    label: "Tarifs & Options",
    icon: Tag,
    description: "Grilles & politiques",
  },
  {
    href: "/settings/contract-template",
    label: "Modèle de contrat",
    icon: FileText,
    description: "Clauses & mise en page",
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alertes & rappels",
  },
  {
    href: "/settings/business-rules",
    label: "Règles métier",
    icon: SlidersHorizontal,
    description: "Automatisations & limites",
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-6 w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
        <div className="mb-2 px-3 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Paramètres
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">Configuration</p>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
              >
                {active && (
                  <motion.span
                    layoutId="settings-active-pill"
                    className="absolute inset-0 rounded-xl bg-indigo-50 ring-1 ring-inset ring-indigo-100"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className={`relative grid h-8 w-8 place-items-center rounded-lg transition ${
                    active
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="relative flex-1 min-w-0">
                  <span
                    className={`block text-sm font-semibold leading-tight ${
                      active ? "text-indigo-700" : "text-slate-800"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
          Besoin d&apos;aide ?
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          Contactez le support LokaRent
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Notre équipe vous accompagne dans la configuration de votre agence.
        </p>
        <a
          href="mailto:support@lokarent.ma"
          className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          support@lokarent.ma →
        </a>
      </div>
    </aside>
  )
}
