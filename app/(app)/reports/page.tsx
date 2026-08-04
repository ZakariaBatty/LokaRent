"use client"

import { useState } from "react"
import type { Period } from "@/lib/reports-data"
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

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("thisMonth")

  return (
    <div className="space-y-5">
      <ReportsToolbar period={period} onPeriodChange={setPeriod} />

      <ReportsSummaryCards />

      <ReportsAiSummary />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReportsRevenueTrendChart />
        </div>
        <ReportsSegmentsDonut />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportsOccupancyChart />
        <ReportsExpensesCard />
        <ReportsFunnelCard />
      </div>

      <ReportsCarsTable />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportsTopClients />
        <ReportsComplianceCard />
      </div>
    </div>
  )
}
