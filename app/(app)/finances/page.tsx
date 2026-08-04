"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { FinancesDateRange } from "@/components/finances/finances-date-range"
import { FinancesSummaryCards } from "@/components/finances/finances-summary-cards"
import { RevenueVsExpensesChart } from "@/components/finances/revenue-vs-expenses-chart"
import { RevenuePerCarChart } from "@/components/finances/revenue-per-car-chart"
import { FinancesPerCarTable } from "@/components/finances/finances-per-car-table"
import { UpcomingCharges } from "@/components/finances/upcoming-charges"
import { CarFinanceDetailPanel } from "@/components/finances/car-finance-detail-panel"
import { type DateRange, type CarFinance } from "@/lib/finances-data"
import { useAgency } from "@/contexts/agency-context"

export default function FinancesPage() {
  const { agencyData } = useAgency()
  const [range, setRange] = useState<DateRange>("this_month")
  const [selected, setSelected] = useState<CarFinance | null>(null)

  const rows = useMemo<CarFinance[]>(() => agencyData.cars.map((c) => ({
    id: c.id,
    brand: c.brand,
    model: c.model,
    plate: c.plate,
    category: c.category,
    revenue: c.revenue,
    expenses: c.expenses,
    profit: c.revenue - c.expenses,
    occupancyRate: c.occupancyRate,
    roi: c.expenses > 0 ? Math.round(((c.revenue - c.expenses) / c.expenses) * 100) : 0,
    monthlyRevenue: c.monthlyRevenue,
    recentExpenses: c.recentExpenses,
  })), [agencyData])

  return (
    <div className="space-y-6">
      {/* Header + date range */}
      <FinancesDateRange value={range} onChange={setRange} />

      {/* Summary cards */}
      <FinancesSummaryCards />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueVsExpensesChart />
        <RevenuePerCarChart />
      </div>

      {/* Per-car table */}
      <FinancesPerCarTable
        rows={rows}
        selectedId={selected?.id ?? null}
        onSelect={(c) => setSelected(c)}
      />

      {/* Upcoming charges */}
      <UpcomingCharges />

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 sm:w-[560px] md:w-[640px] lg:w-[680px]"
            >
              <CarFinanceDetailPanel car={selected} onClose={() => setSelected(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
