import { Suspense } from "react"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata = {
  title: "Configuration initiale | LokaRent",
  description:
    "Configurez votre flotte, vos tarifs et vos paramètres pour démarrer avec LokaRent.",
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingWizard />
    </Suspense>
  )
}
