"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { Settings2, BarChart3 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const workspaceTabs: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Aperçu", href: "/workspace", icon: Settings2 },
  { label: "Agences", href: "/workspace/agencies", icon: Settings2 },
  { label: "Membres", href: "/workspace/members", icon: Settings2 },
  { label: "Permissions", href: "/workspace/permissions", icon: Settings2 },
  { label: "Invitations", href: "/workspace/invitations", icon: Settings2 },
  { label: "Facturation", href: "/workspace/billing", icon: Settings2 },
  { label: "Activité", href: "/workspace/activity", icon: BarChart3 },
]

export function WorkspaceTabs() {
  const pathname = usePathname()
  
  // Determine active tab - handle /workspace route specially
  let activeHref = pathname
  if (pathname === "/workspace" || pathname === "/workspace/") {
    activeHref = "/workspace"
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200/60 pb-0">
      {workspaceTabs.map((tab) => {
        const isActive = activeHref === tab.href || (tab.href !== "/workspace" && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="workspace-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}
