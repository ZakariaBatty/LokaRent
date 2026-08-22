"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { AlertTriangle, ArrowRight, ShieldAlert, Clock } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import type { DashboardAlerts } from "@/modules/dashboard/services/dashboard.service"

export function AlertsBanner({ alerts }: { alerts: DashboardAlerts }) {
  const { t } = useI18n()
  if (alerts.total === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <Link
        href="/alerts"
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/50 px-5 py-4 transition-all hover:border-amber-300/80 hover:shadow-md hover:shadow-amber-100/50"
      >
        {/* Soft glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-100/0 via-amber-100/40 to-amber-100/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Icon */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={2.25} />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
        </div>

        {/* Content */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-amber-950">{t("dashboard.alerts.actionRequired")}</p>
            <span className="rounded-md bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
              {alerts.total} {t("dashboard.alerts.alerts")}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-amber-800/90">
            {alerts.expiringDocuments > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3" />
                {t("dashboard.alerts.expiringDocuments").replace("{count}", String(alerts.expiringDocuments))}
              </span>
            )}
            {alerts.expiringDocuments > 0 && alerts.overdueReturns > 0 && (
              <span className="hidden h-1 w-1 rounded-full bg-amber-400 sm:inline-block" />
            )}
            {alerts.overdueReturns > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {t("dashboard.alerts.overdueReturns").replace("{count}", String(alerts.overdueReturns))}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="relative flex items-center gap-1.5 text-xs font-medium text-amber-900">
          <span className="hidden sm:inline">{t("dashboard.alerts.viewAlerts")}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  )
}
