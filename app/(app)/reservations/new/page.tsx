import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, requirePermission } from "@/shared/permissions"
import { WizardProvider } from "@/components/reservations/new/wizard-context"
import { WizardShell } from "@/components/reservations/new/wizard-shell"
import { listCustomersService } from "@/modules/clients/services/clients.service"
import { mapCustomerToClient } from "@/modules/clients/mappers/client.mapper"
import { listAvailableVehiclesService } from "@/modules/cars/services/cars.service"
import { listReservationSourcesService } from "@/modules/reservations/services/reservations.service"
import {
  mapClientToReservationOption,
  mapVehicleToReservationOption,
} from "@/modules/reservations/mappers/reservation.mapper"

export const metadata = {
  title: "Nouvelle réservation · LokaRent",
  description: "Création d'un contrat de location en 5 étapes.",
}

export default async function NewReservationPage() {
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.RESERVATIONS_CREATE, context)
  const [customers, vehicles, sources] = await Promise.all([
    listCustomersService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      page: 1,
      pageSize: 100,
      orderBy: "createdAt",
      direction: "desc",
    }),
    listAvailableVehiclesService({
      companyId: context.companyId,
      agencyId: context.agencyId,
    }),
    listReservationSourcesService(),
  ])

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <WizardProvider
        cars={vehicles.map(mapVehicleToReservationOption)}
        clients={customers.data.map(mapCustomerToClient).map(mapClientToReservationOption)}
        sources={sources.map((source) => ({ id: source.id, key: source.key, label: source.label }))}
      >
        <WizardShell />
      </WizardProvider>
    </div>
  )
}
