import type { ReactNode } from "react"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <SettingsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
