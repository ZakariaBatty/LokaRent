import { cars } from "@/lib/cars-data"
import { WizardProvider } from "@/components/reservations/new/wizard-context"
import { WizardShell } from "@/components/reservations/new/wizard-shell"

export const metadata = {
  title: "Nouvelle réservation · LokaRent",
  description: "Création d'un contrat de location en 5 étapes.",
}

export default function NewReservationPage() {
  const minimalCars = cars.map((c) => ({ id: c.id, priceDay: c.priceDay }))
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <WizardProvider cars={minimalCars}>
        <WizardShell />
      </WizardProvider>
    </div>
  )
}
