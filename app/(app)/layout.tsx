import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app/app-sidebar"
import { AppHeader } from "@/components/app/app-header"
import { SidebarProvider } from "@/components/app/sidebar-context"
import { AppShell } from "@/components/app/app-shell"
import { AgencyProvider } from "@/contexts/agency-context"
import { requireCurrentCompanyContext } from "@/shared/auth"

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireCurrentCompanyContext()

  return (
    <AgencyProvider>
    <SidebarProvider>
      <div className="relative min-h-screen overflow-hidden text-slate-900">
        {/* Light premium ambient background */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#f8fafc] via-white to-[#f5f7fb]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_900px_at_20%_-10%,rgba(59,130,246,0.06),transparent_60%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_700px_at_85%_15%,rgba(99,102,241,0.05),transparent_55%)]" />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_800px_at_50%_110%,rgba(14,165,233,0.04),transparent_60%)]" />
        <div
          className="pointer-events-none fixed inset-0 -z-10 opacity-[0.018] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
          }}
        />

        <AppSidebar />
        <AppShell header={<AppHeader />}>{children}</AppShell>
      </div>
    </SidebarProvider>
    </AgencyProvider>
  )
}
