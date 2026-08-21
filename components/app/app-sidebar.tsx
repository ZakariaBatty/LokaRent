"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Car,
  ChevronsLeft,
  ChevronsRight,
  PanelLeftClose,
} from "lucide-react"
import { navItems, secondaryNav } from "@/lib/dashboard-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "./sidebar-context"
import { AgencySwitcher } from "@/components/agency-switcher"
import { useAgency } from "@/contexts/agency-context"
import { SidebarNavItem } from "./sidebar-nav-item"
import { iconMap } from "./icon-map"

/** Tiny icon shown when sidebar is collapsed */
function CollapsedAgencyBadge() {
  const { activeAgency } = useAgency()
  if (!activeAgency) return null
  const initials = activeAgency.city.slice(0, 2).toUpperCase()
  const gradients: Record<string, string> = {
    agency_casablanca: "from-blue-500 to-indigo-600",
    agency_marrakech:  "from-rose-500 to-orange-500",
    agency_agadir:     "from-emerald-500 to-teal-600",
  }
  const gradient = gradients[activeAgency.id] ?? "from-blue-500 to-indigo-600"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-sm shadow-blue-500/20`}
        >
          <span className="text-xs font-semibold text-white">{initials}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {activeAgency.name}
      </TooltipContent>
    </Tooltip>
  )
}

type SidebarBodyProps = {
  collapsed: boolean
  onHide?: () => void
  onToggleCollapse?: () => void
  showControls?: boolean
}

function SidebarBody({ collapsed, onHide, onToggleCollapse, showControls = true }: SidebarBodyProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex h-full flex-col overflow-hidden bg-white/85 backdrop-blur-xl">
        {/* Soft ambient color blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-indigo-500/[0.04] blur-3xl" />

        {/* Logo + Controls */}
        <div className="relative flex h-16 items-center justify-between px-3.5">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Car className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-baseline gap-0.5 overflow-hidden whitespace-nowrap"
                >
                  <span className="font-serif text-lg font-semibold tracking-tight text-slate-900">Loka</span>
                  <span className="font-serif text-lg font-semibold tracking-tight text-blue-600">Rent</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {showControls && !collapsed && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleCollapse}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                  <TooltipContent side="bottom">Hide</TooltipContent>
              </Tooltip>
              {onHide && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onHide}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Hide sidebar"
                    >
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                <TooltipContent side="bottom">Collapse</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
          {showControls && collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 hover:shadow"
                  aria-label="Expand sidebar"
                >
                  <ChevronsRight className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Active agency card / switcher */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="px-2.5 pt-2"
            >
              <AgencySwitcher />
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="flex justify-center px-2.5 pt-2">
            <CollapsedAgencyBadge />
          </div>
        )}

        {/* Primary nav */}
        <nav className="relative mt-5 flex-1 overflow-y-auto px-2.5">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                Navigation
              </motion.p>
            )}
          </AnimatePresence>
          {collapsed && <div className="pb-1" />}

          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <SidebarNavItem key={item.href} item={item} collapsed={collapsed} isPrimary />
            ))}
          </ul>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                Settings
              </motion.p>
            )}
          </AnimatePresence>
          {collapsed && <div className="my-4 mx-2 h-px bg-slate-200/70" />}

          <ul className="flex flex-col gap-0.5">
            {secondaryNav.map((item) => (
              <SidebarNavItem key={item.href} item={item} collapsed={collapsed} isPrimary={false} />
            ))}
          </ul>
        </nav>

      </div>
    </TooltipProvider>
  )
}

export function AppSidebar() {
  const { state, toggleCollapse, toggleHide, mobileOpen, setMobileOpen } = useSidebar()
  const collapsed = state === "collapsed"
  const hidden = state === "hidden"

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: hidden ? 0 : collapsed ? 76 : 260,
          opacity: hidden ? 0 : 1,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-slate-200/70 lg:block"
        aria-hidden={hidden}
      >
        <SidebarBody
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onHide={toggleHide}
        />
      </motion.aside>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-slate-200 bg-white shadow-2xl lg:hidden"
            >
              <SidebarBody collapsed={false} showControls={false} />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close sidebar"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
