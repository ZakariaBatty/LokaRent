import { notFound } from "next/navigation"
import { requireCurrentAgencyContext } from "@/shared/auth"
import { PERMISSIONS, requirePermission } from "@/shared/permissions"
import { WizardProvider } from "@/components/reservations/new/wizard-context"
import { WizardShell } from "@/components/reservations/new/wizard-shell"
import { listCustomersService } from "@/modules/clients/services/clients.service"
import { mapCustomerToClient } from "@/modules/clients/mappers/client.mapper"
import { listAvailableVehiclesService } from "@/modules/cars/services/cars.service"
import {
  getReservationService,
  listReservationExtraDefinitionsService,
  listReservationSourcesService,
} from "@/modules/reservations/services/reservations.service"
import {
  mapClientToReservationOption,
  mapReservationToUi,
  mapVehicleToReservationOption,
} from "@/modules/reservations/mappers/reservation.mapper"

export const metadata = {
  title: "Éditer réservation · LokaRent",
  description: "Modification d'un contrat de location.",
}

export default function EditReservationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <EditReservationContent params={params} />
}

async function EditReservationContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const context = await requireCurrentAgencyContext()
  await requirePermission(PERMISSIONS.RESERVATIONS_EDIT, context)
  const reservation = await getReservationService({
    companyId: context.companyId,
    agencyId: context.agencyId,
    reservationId: id,
  }).catch(() => null)
  if (!reservation) notFound()
  const [customers, vehicles, sources, extraDefinitions] = await Promise.all([
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
    listReservationExtraDefinitionsService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      includeInactive: true,
    }),
  ])
  const carOptions = vehicles.map(mapVehicleToReservationOption)
  if (!carOptions.some((car) => car.id === reservation.vehicleId)) {
    carOptions.push({
      id: reservation.vehicle.id,
      brand: reservation.vehicle.brand,
      model: reservation.vehicle.model,
      year: reservation.vehicle.year,
      plate: reservation.vehicle.plate,
      category: reservation.vehicle.category.name,
      status: "disponible",
      priceDay: Number(reservation.pricePerDay),
      priceWeek: Number(reservation.pricePerDay) * 7,
      priceMonth: Number(reservation.pricePerDay) * 30,
      depositAmount: Number(reservation.depositAmount),
      currency: reservation.currency,
    })
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <WizardProvider
        mode="edit"
        initialReservation={mapReservationToUi(reservation)}
        cars={carOptions}
        clients={customers.data.map(mapCustomerToClient).map(mapClientToReservationOption)}
        sources={sources.map((source) => ({ id: source.id, key: source.key, label: source.label }))}
        extraDefinitions={extraDefinitions.map((definition) => ({
          id: definition.id,
          key: definition.key,
          label: definition.label,
          description: definition.description,
          price: Number(definition.price),
          currency: definition.currency,
          sortOrder: definition.sortOrder,
          isActive: definition.isActive,
        }))}
      >
        <WizardShell />
      </WizardProvider>
    </div>
  )
}
