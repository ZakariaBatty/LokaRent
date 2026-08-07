"use client"

import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

export function BlockedAccountView() {
  const { t } = useI18n()

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t("blockedAccount.title")}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("blockedAccount.description")}
          </p>
        </div>
      </div>
    </main>
  )
}
