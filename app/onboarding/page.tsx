import { Suspense } from "react"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { requireAuth } from "@/shared/auth"

export const metadata = {
  title: "Configuration initiale | LokaRent",
  description:
    "Configurez votre flotte, vos tarifs et vos paramètres pour démarrer avec LokaRent.",
}

export default async function OnboardingPage() {
  await requireAuth()

  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  )
}
