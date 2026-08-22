"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FinancesDateRange } from "@/components/finances/finances-date-range"
import { FinancesSummaryCards } from "@/components/finances/finances-summary-cards"
import { RevenueVsExpensesChart } from "@/components/finances/revenue-vs-expenses-chart"
import { RevenuePerCarChart } from "@/components/finances/revenue-per-car-chart"
import { FinancesPerCarTable } from "@/components/finances/finances-per-car-table"
import { UpcomingCharges } from "@/components/finances/upcoming-charges"
import { CarFinanceDetailPanel } from "@/components/finances/car-finance-detail-panel"
import { type DateRange, type CarFinance } from "@/lib/finances-data"
import type { FinanceOverviewReport } from "@/modules/finances/services/finances.service"

export function FinancesPageClient({ report }: { report: FinanceOverviewReport }) {
  const [range, setRange] = useState<DateRange>(report.range)
  const [customRange, setCustomRange] = useState({ from: "", to: "" })
  const [selected, setSelected] = useState<CarFinance | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setRange(report.range)
  }, [report.range])

  useEffect(() => {
    setCustomRange({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    })
  }, [searchParams])

  function handleRangeChange(nextRange: DateRange) {
    setRange(nextRange)
    setSelected(null)
    const params = new URLSearchParams(searchParams.toString())
    if (nextRange === "this_month") params.delete("range")
    else params.set("range", nextRange)
    if (nextRange !== "custom") {
      params.delete("from")
      params.delete("to")
    }
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
  }

  function applyCustomRange() {
    const params = new URLSearchParams(searchParams.toString())
    params.set("range", "custom")
    params.set("from", customRange.from)
    params.set("to", customRange.to)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Header + date range */}
      <FinancesDateRange
        value={range}
        onChange={handleRangeChange}
        customFrom={customRange.from}
        customTo={customRange.to}
        onCustomChange={setCustomRange}
        onCustomApply={applyCustomRange}
      />

      {/* Summary cards */}
      <FinancesSummaryCards summary={report.summary} currency={report.currency} />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RevenueVsExpensesChart data={report.revenueVsExpenses} currency={report.currency} />
        <RevenuePerCarChart rows={report.vehicles} currency={report.currency} />
      </div>

      {/* Per-car table */}
      <FinancesPerCarTable
        rows={report.vehicles}
        selectedId={selected?.id ?? null}
        onSelect={(c) => setSelected(c)}
        currency={report.currency}
      />

      {/* Upcoming charges */}
      <UpcomingCharges charges={report.upcomingCharges} currency={report.currency} />

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
              <CarFinanceDetailPanel car={selected} onClose={() => setSelected(null)} currency={report.currency} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
