import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { AlertsBanner } from "@/components/dashboard/alerts-banner"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { FleetStatusChart } from "@/components/dashboard/fleet-status-chart"
import { ActiveRentals } from "@/components/dashboard/active-rentals"
import { UpcomingReturns } from "@/components/dashboard/upcoming-returns"
import { TopCars } from "@/components/dashboard/top-cars"
import { TopClients } from "@/components/dashboard/top-clients"

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-7 lg:space-y-8">
      <KpiGrid />
      <AlertsBanner />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-7">
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>
        <div className="lg:col-span-2">
          <FleetStatusChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-7">
        <div className="lg:col-span-3">
          <ActiveRentals />
        </div>
        <div className="lg:col-span-2">
          <UpcomingReturns />
        </div>
      </div>

      <div className="space-y-7 pt-2 lg:space-y-8">
        <TopCars />
        <TopClients />
      </div>
    </div>
  )
}
