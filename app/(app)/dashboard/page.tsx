import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { AlertsBanner } from "@/components/dashboard/alerts-banner"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { FleetStatusChart } from "@/components/dashboard/fleet-status-chart"
import { ActiveRentals } from "@/components/dashboard/active-rentals"
import { UpcomingReturns } from "@/components/dashboard/upcoming-returns"
import { TopCars } from "@/components/dashboard/top-cars"
import { TopClients } from "@/components/dashboard/top-clients"
import { getDashboardOverviewAction } from "@/modules/dashboard/actions/get-dashboard-overview.action"

export default async function DashboardPage() {
  const result = await getDashboardOverviewAction()

  if (!result.success) {
    throw new Error(result.messageKey)
  }

  const dashboard = result.report

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 lg:space-y-8">
      <KpiGrid kpis={dashboard.kpis} />
      <AlertsBanner alerts={dashboard.alerts} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-7">
        <div className="lg:col-span-3">
          <RevenueChart data={dashboard.bookedValueSeries} delta={dashboard.bookedValueDelta} currency={dashboard.currency} />
        </div>
        <div className="lg:col-span-2">
          <FleetStatusChart data={dashboard.fleetStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-7">
        <div className="lg:col-span-3">
          <ActiveRentals rows={dashboard.activeRentals} currency={dashboard.currency} />
        </div>
        <div className="lg:col-span-2">
          <UpcomingReturns rows={dashboard.upcomingReturns} />
        </div>
      </div>

      <div className="space-y-7 pt-2 lg:space-y-8">
        <TopCars rows={dashboard.topVehicles} currency={dashboard.currency} />
        <TopClients rows={dashboard.topClients} currency={dashboard.currency} />
      </div>
    </div>
  )
}
