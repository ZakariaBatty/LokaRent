import { Suspense } from "react"
import { redirect } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { getCurrentCompanyContext } from "@/shared/auth"
import { isAppError } from "@/shared/errors"

export const metadata = {
  title: "Configuration initiale | LokaRent",
  description:
    "Configurez votre flotte, vos tarifs et vos paramètres pour démarrer avec LokaRent.",
}

export default async function OnboardingPage() {
  const context = await getOnboardingCompanyContext()

  if (!context) redirect("/login")
  if (context === "provisioning-retry") return <ProvisioningRetryState />
  if (context.companyStatus === "active") redirect("/dashboard")
  if (context.companyStatus === "suspended" || context.companyStatus === "cancelled") {
    redirect("/blocked-account")
  }

  if (String(context.companyStatus) !== "onboarding" && context.companyStatus !== "trial") {
    redirect("/blocked-account")
  }

  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  )
}

function ProvisioningRetryState() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Configuration du compte en cours</h1>
        <p className="text-sm leading-6 text-slate-600">
          Nous finalisons la liaison de votre compte LokaRent. Rechargez la page dans quelques
          instants pour reprendre la configuration.
        </p>
      </div>
    </main>
  )
}

async function getOnboardingCompanyContext() {
  try {
    return await getCurrentCompanyContext()
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") {
      return "provisioning-retry" as const
    }
    throw error
  }
}
