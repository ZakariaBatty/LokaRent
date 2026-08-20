"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Pencil, Info, FileText, BarChart3, History, Trash2 } from "lucide-react"
import { type Car, type CarStatus, statusConfig, formatMAD } from "@/lib/cars-data"

const statusTextColor: Record<CarStatus, string> = {
  disponible: "text-emerald-700",
  louee: "text-blue-700",
  maintenance: "text-amber-700",
  hors_service: "text-rose-700",
}
import { CarIllustration } from "./car-illustration"
import { InfosTab } from "./tabs/infos-tab"
import { DocumentsTab } from "./tabs/documents-tab"
import { FinancesTab } from "./tabs/finances-tab"
import { HistoriqueTab } from "./tabs/historique-tab"
import { cn } from "@/lib/utils"
import fr from "@/translations/fr"

type TabKey = "infos" | "documents" | "finances" | "historique"

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "infos", label: "Infos", icon: Info },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "finances", label: "Finances", icon: BarChart3 },
  { key: "historique", label: "Historique", icon: History },
]

export function CarDetailPanel({
  car,
  onClose,
  onEdit,
  onEditDocuments,
  onSaveDocument,
  onDelete,
  canDelete = false,
}: {
  car: Car
  onClose: () => void
  onEdit?: () => void
  onEditDocuments?: () => void
  onSaveDocument?: Parameters<typeof DocumentsTab>[0]["onSaveDocument"]
  onDelete?: () => void
  canDelete?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("infos")
  const status = statusConfig[car.status]

  return (
    <motion.div
      key={car.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 backdrop-blur">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <CarIllustration category={car.category} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", status.dotClass)} />
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      statusTextColor[car.status],
                    )}
                  >
                    {status.label}
                  </span>
                  <span className="text-[10px] text-slate-300">·</span>
                  <span className="text-[10px] font-medium text-slate-500">{car.category}</span>
                </div>
                <h2 className="mt-1 font-serif text-2xl text-slate-900 lg:text-3xl">
                  {car.brand} {car.model}
                  <span className="ml-2 text-base font-normal text-slate-400">{car.year}</span>
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <div className="inline-flex items-center rounded-md border border-slate-300 bg-gradient-to-b from-white to-slate-50 px-3 py-1 font-mono text-sm font-bold tracking-wider text-slate-800 shadow-sm">
                    {car.plate}
                  </div>
                  <span className="text-xs text-slate-500">
                    {car.km.toLocaleString("fr-FR")} km · {car.fuel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Pencil className="h-4 w-4" />
                <span className="text-xs font-semibold">Modifier</span>
              </button>
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
                  aria-label={fr.fleet.deleteVehicle}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div className="mx-1 h-6 w-px bg-slate-200" />
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {fr.fleet.pricing.dailyRate}
              </p>
              <p className="text-base font-bold text-slate-900 tabular-nums">{formatMAD(car.priceDay)}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {fr.fleet.finance.revenue}
              </p>
              <p className="text-base font-bold text-emerald-700 tabular-nums">
                {formatMAD(car.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {fr.fleet.finance.occupancy}
              </p>
              <p className="text-base font-bold text-slate-900 tabular-nums">{car.occupancyRate}%</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {fr.fleet.finance.netProfit}
              </p>
              <p
                className={cn(
                  "text-base font-bold tabular-nums",
                  car.revenue - car.expenses >= 0 ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {formatMAD(car.revenue - car.expenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-200/80 px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-3 text-sm font-semibold transition",
                  active ? "text-indigo-700" : "text-slate-500 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-5"
          >
            {activeTab === "infos" && <InfosTab car={car} />}
            {activeTab === "documents" && (
              <DocumentsTab car={car} onEdit={onEditDocuments ?? onEdit} onSaveDocument={onSaveDocument} />
            )}
            {activeTab === "finances" && <FinancesTab car={car} />}
            {activeTab === "historique" && <HistoriqueTab car={car} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
