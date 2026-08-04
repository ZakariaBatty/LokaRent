import { notFound } from "next/navigation"
import { cars } from "@/lib/cars-data"
import { WizardProvider } from "@/components/reservations/new/wizard-context"
import { WizardShell } from "@/components/reservations/new/wizard-shell"

export const metadata = {
  title: "Éditer réservation · LokaRent",
  description: "Modification d'un contrat de location.",
}

export default function EditReservationPage({
  params,
}: {
  params: { id: string }
}) {
  // TODO: In a real app, fetch the reservation by ID and pass it to the wizard
  // For now, we'll just use the wizard in create mode

  const minimalCars = cars.map((c) => ({ id: c.id, priceDay: c.priceDay }))

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <WizardProvider cars={minimalCars}>
        <WizardShell />
      </WizardProvider>
    </div>
  )
}
