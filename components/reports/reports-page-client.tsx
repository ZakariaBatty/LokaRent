"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ReportsAiSummary } from "@/components/reports/reports-ai-summary"
import { ReportsCarsTable } from "@/components/reports/reports-cars-table"
import { ReportsComplianceCard } from "@/components/reports/reports-compliance-card"
import { ReportsExpensesCard } from "@/components/reports/reports-expenses-card"
import { ReportsFunnelCard } from "@/components/reports/reports-funnel-card"
import { ReportsOccupancyChart } from "@/components/reports/reports-occupancy-chart"
import { ReportsRevenueTrendChart } from "@/components/reports/reports-revenue-trend-chart"
import { ReportsSegmentsDonut } from "@/components/reports/reports-segments-donut"
import { ReportsSummaryCards } from "@/components/reports/reports-summary-cards"
import { ReportsToolbar } from "@/components/reports/reports-toolbar"
import { ReportsTopClients } from "@/components/reports/reports-top-clients"
import type { ReportsOverview, ReportsPeriod } from "@/modules/reports/services/reports.service"

export function ReportsPageClient({ report }: { report: ReportsOverview }) {
  const [period, setPeriod] = useState<ReportsPeriod>(report.period)
  const [customRange, setCustomRange] = useState({ from: "", to: "" })
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setPeriod(report.period)
  }, [report.period])

  useEffect(() => {
    setCustomRange({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    })
  }, [searchParams])

  function handlePeriodChange(nextPeriod: ReportsPeriod) {
    setPeriod(nextPeriod)
    const params = new URLSearchParams(searchParams.toString())
    if (nextPeriod === "this_month") params.delete("range")
    else params.set("range", nextPeriod)
    if (nextPeriod !== "custom") {
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
    <div className="space-y-5">
      <ReportsToolbar
        period={period}
        onPeriodChange={handlePeriodChange}
        customFrom={customRange.from}
        customTo={customRange.to}
        onCustomChange={setCustomRange}
        onCustomApply={applyCustomRange}
      />

      <ReportsSummaryCards kpi={report.kpi} currency={report.currency} />

      <ReportsAiSummary kpi={report.kpi} vehicles={report.vehicles} currency={report.currency} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReportsRevenueTrendChart data={report.revenueVsExpenses} currency={report.currency} />
        </div>
        <ReportsSegmentsDonut data={report.customerSegments} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportsOccupancyChart data={report.weekdayLoad} />
        <ReportsExpensesCard rows={report.expensesByCategory} currency={report.currency} />
        <ReportsFunnelCard funnel={report.reservationFunnel} cancellationReasons={report.cancellationReasons} />
      </div>

      <ReportsCarsTable rows={report.vehicles} currency={report.currency} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportsTopClients rows={report.clients} currency={report.currency} />
        <ReportsComplianceCard
          items={report.complianceItems}
          totalCost={report.complianceTotalCost}
          currency={report.currency}
        />
      </div>
    </div>
  )
}
