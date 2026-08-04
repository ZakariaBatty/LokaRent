"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  Building2,
  Users,
  Shield,
  Mail,
  Activity,
  CreditCard,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const items: { href: string; label: string; icon: LucideIcon; description: string }[] = [
  {
    href: "/workspace/agencies",
    label: "Agences",
    icon: Building2,
    description: "Gestion multi-agences",
  },
  {
    href: "/workspace/members",
    label: "Membres",
    icon: Users,
    description: "Accès & rôles",
  },
  {
    href: "/workspace/permissions",
    label: "Permissions",
    icon: Shield,
    description: "Rôles & droits",
  },
  {
    href: "/workspace/invitations",
    label: "Invitations",
    icon: Mail,
    description: "Invites en attente",
  },
  {
    href: "/workspace/billing",
    label: "Facturation",
    icon: CreditCard,
    description: "Abonnements & factures",
  },
  {
    href: "/workspace/activity",
    label: "Journaux",
    icon: Activity,
    description: "Historique & logs",
  },
]

export function WorkspaceSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-6 w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm">
        <div className="mb-2 px-3 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Espace de travail
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">Administration</p>
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
                    layoutId="workspace-active-pill"
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
                  <span
                    className={`text-[11px] leading-tight ${
                      active ? "text-indigo-600" : "text-slate-500"
                    }`}
                  >
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
          Administration
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          Besoin d&apos;aide ?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Contactez l&apos;équipe LokaRent pour toute question sur votre workspace.
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
