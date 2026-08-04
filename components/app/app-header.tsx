"use client"

import Link from "next/link"
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  PanelLeftOpen,
  PanelLeftClose,
  User,
  Building2,
  Users as UsersIcon,
  CreditCard,
  Crown,
  LifeBuoy,
  LogOut,
  AlertTriangle,
  CalendarClock,
  ShieldCheck,
  RotateCcw,
  CheckCheck,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebar } from "./sidebar-context"
import { useAgency } from "@/contexts/agency-context"
import { LanguageSwitcher } from "./language-switcher"
import { useI18n } from "@/contexts/i18n-context"

const notifications = [
  {
    id: 1,
    type: "alert",
    icon: ShieldCheck,
    color: "amber",
    title: "Assurance expire bientôt",
    description: "Dacia Logan · 12345-A-1 — Dans 7 jours",
    time: "Il y a 2h",
    unread: true,
  },
  {
    id: 2,
    type: "return",
    icon: CalendarClock,
    color: "blue",
    title: "Retour prévu aujourd'hui",
    description: "Ahmed Benali — Dacia Logan à 17h30",
    time: "Il y a 3h",
    unread: true,
  },
  {
    id: 3,
    type: "overdue",
    icon: AlertTriangle,
    color: "rose",
    title: "Retour en retard",
    description: "Karim Ouazzani — Hyundai i10 (1 jour)",
    time: "Il y a 5h",
    unread: true,
  },
  {
    id: 4,
    type: "reminder",
    icon: RotateCcw,
    color: "slate",
    title: "Visite technique à programmer",
    description: "Renault Clio · 87654-B-3 — Dans 14 jours",
    time: "Hier",
    unread: false,
  },
]

const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
  amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100" },
  slate: { bg: "bg-slate-50", text: "text-slate-500", ring: "ring-slate-100" },
}

export function AppHeader() {
  const { state, setState, toggleCollapse, setMobileOpen } = useSidebar()
  const { activeAgency } = useAgency()
  const { t } = useI18n()
  const unreadCount = notifications.filter((n) => n.unread).length
  const agencyName = activeAgency?.name ?? "LokaRent"

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-4 md:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop sidebar toggle (collapse/expand or show when hidden) */}
        <button
          onClick={state === "hidden" ? () => setState("expanded") : toggleCollapse}
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-slate-500 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 lg:flex"
          aria-label="Toggle sidebar"
        >
          {state === "hidden" ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Greeting */}
        <div className="hidden flex-1 md:block">
          <motion.h1
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[15px] font-semibold tracking-tight text-slate-900"
          >
            {t('header.greeting')} Ahmed
            <motion.span
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 14, -8, 14, 0] }}
              transition={{ delay: 0.5, duration: 1.2, ease: "easeInOut" }}
              className="ml-1 inline-block"
              style={{ transformOrigin: "70% 70%" }}
            >
              👋
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[12px] text-slate-500"
          >
            {agencyName} — {t('header.agencyStatus')}
          </motion.p>
        </div>
        <div className="flex-1 md:hidden" />

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t('common.search')}
              className="h-9 w-56 rounded-lg border border-slate-200/70 bg-white/60 pl-10 pr-14 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 xl:w-72"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                aria-label={t('header.notifications')}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 px-1 text-[9px] font-bold text-white shadow-sm">
                      {unreadCount}
                    </span>
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                    </span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={10}
              className="w-[380px] overflow-hidden rounded-2xl border-slate-200/70 bg-white/95 p-0 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
            >
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{t('header.notifications')}</h3>
                      <p className="text-[11px] text-slate-500">
                        {unreadCount} {t('header.notificationCount')}{unreadCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
                      <CheckCheck className="h-3 w-3" />
                      {t('header.markAllRead')}
                    </button>
                  </div>

                  {/* List */}
                  <ScrollArea className="max-h-[380px]">
                    <ul className="py-1">
                      {notifications.map((n, i) => {
                        const Icon = n.icon
                        const c = colorClasses[n.color]
                        return (
                          <motion.li
                            key={n.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.25 }}
                          >
                            <button className="group relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/80">
                              {n.unread && (
                                <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500 ring-2 ring-blue-100" />
                              )}
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.bg} ${c.text} ring-1 ring-inset ${c.ring}`}
                              >
                                <Icon className="h-4 w-4" strokeWidth={2.2} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-slate-900">{n.title}</p>
                                <p className="truncate text-[11.5px] text-slate-500">{n.description}</p>
                                <p className="mt-0.5 text-[10.5px] font-medium text-slate-400">{n.time}</p>
                              </div>
                            </button>
                          </motion.li>
                        )
                      })}
                    </ul>
                  </ScrollArea>

                  {/* Footer */}
                  <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2.5">
                    <Link
                      href="/alerts"
                      className="flex w-full items-center justify-center rounded-md py-1.5 text-[12px] font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      {t('header.seeAllAlerts')}
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </PopoverContent>
          </Popover>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Divider */}
          <div className="mx-1 hidden h-7 w-px bg-slate-200/70 md:block" />

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white py-1 pl-1 pr-2.5 transition-all hover:border-slate-300 hover:bg-slate-50">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/20">
                  <span className="text-[10px] font-semibold text-white">AB</span>
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-[11.5px] font-semibold leading-tight text-slate-900">{activeAgency?.city ?? "Agence"}</p>
                  <p className="text-[10px] leading-tight text-slate-500">Admin</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-[280px] overflow-hidden rounded-2xl border-slate-200/70 bg-white/95 p-0 shadow-2xl shadow-slate-900/10 backdrop-blur-xl"
            >
              {/* Profile header */}
              <div className="relative overflow-hidden border-b border-slate-100 px-4 py-4">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/30">
                      <span className="text-sm font-semibold text-white">AB</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-slate-900">Ahmed Benali</p>
                      <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-600 ring-1 ring-inset ring-blue-100">
                        Pro
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-500">ahmed@atlasrent.ma</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <DropdownMenuLabel className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {t('header.agencySettings')}
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-md py-2 text-[13px] focus:bg-slate-50">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  {t('header.myProfile')}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-md py-2 text-[13px] focus:bg-slate-50">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  {t('header.agencySettings')}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-md py-2 text-[13px] focus:bg-slate-50">
                  <UsersIcon className="h-3.5 w-3.5 text-slate-500" />
                  {t('header.userManagement')}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                <DropdownMenuLabel className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {t('header.upgradePlan')}
                </DropdownMenuLabel>
                <DropdownMenuItem className="group cursor-pointer gap-2.5 rounded-md py-2 text-[13px] focus:bg-gradient-to-r focus:from-amber-50/70 focus:to-amber-50/30">
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t('header.upgradePlan')}</span>
                  <span className="ml-auto rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                    Pro
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-md py-2 text-[13px] focus:bg-slate-50">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                  {t('header.billing')}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-md py-2 text-[13px] focus:bg-slate-50">
                  <LifeBuoy className="h-3.5 w-3.5 text-slate-500" />
                  {t('header.helpCenter')}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-md py-2 text-[13px] text-rose-600 focus:bg-rose-50/60 focus:text-rose-700">
                  <LogOut className="h-3.5 w-3.5" />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
