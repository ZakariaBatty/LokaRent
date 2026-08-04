'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useI18n } from '@/contexts/i18n-context'
import { getNavTranslationKey } from '@/lib/nav-translations'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { NavItem } from '@/lib/dashboard-data'
import { iconMap } from './icon-map'

interface SidebarNavItemProps {
  item: NavItem
  collapsed: boolean
  isPrimary?: boolean
}

export function SidebarNavItem({ item, collapsed, isPrimary = true }: SidebarNavItemProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const Icon = iconMap[item.icon as keyof typeof iconMap]
  const isActive = pathname === item.href

  const translatedLabel = t(getNavTranslationKey(item.label))

  if (isPrimary) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={`group relative flex items-center rounded-lg px-2 py-2 text-sm transition-all ${
                collapsed ? 'justify-center' : 'gap-3'
              } ${
                isActive
                  ? 'text-blue-700'
                  : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/60 ring-1 ring-inset ring-blue-100"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-active-bar"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500"
                />
              )}
              <Icon
                className={`relative h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                }`}
                strokeWidth={2}
              />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="relative flex-1 truncate font-medium"
                  >
                    {translatedLabel}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <span
                  className={`relative inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {item.badge && collapsed && (
                <span className="absolute right-1 top-1 flex h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-white" />
              )}
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{translatedLabel}</TooltipContent>}
        </Tooltip>
      </li>
    )
  }

  // Secondary nav items
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={`group flex items-center rounded-lg px-2 py-2 text-sm transition-all ${
              collapsed ? 'justify-center' : 'gap-3'
            } ${
              isActive
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0 text-slate-500 transition-transform group-hover:scale-110" strokeWidth={2} />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="truncate font-medium"
                >
                  {translatedLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">{translatedLabel}</TooltipContent>}
      </Tooltip>
    </li>
  )
}
