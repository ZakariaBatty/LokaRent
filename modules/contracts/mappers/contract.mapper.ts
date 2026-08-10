import { ContractStatus as DbContractStatus, InspectionCondition, InspectionEvent, SignerType, type Prisma } from "@lokarent/db";
import type { Contract, ContractStatus, EtatBlock, HistoryEvent } from "@/lib/contracts-data";
import { mapCategoryName } from "@/modules/cars/mappers/car.mapper";

type ContractPayload = Prisma.ContractGetPayload<{
  include: {
    reservation: {
      include: {
        pricingSnapshots: true;
        extras: { include: { definition: true } };
        authorizedDrivers: true;
        driverAssignments: { include: { driver: true } };
        timelineEvents: true;
      };
    };
    customer: { include: { individual: true; business: true } };
    vehicle: { include: { category: true } };
    inspectionItems: true;
    signatures: true;
    template: true;
    templateVersion: true;
  };
}>;

function customerName(contract: ContractPayload) {
  if (contract.customer.type === "company") return contract.customer.business?.companyName ?? contract.customer.email ?? contract.customer.code;
  return [contract.customer.individual?.firstName, contract.customer.individual?.lastName].filter(Boolean).join(" ") || contract.customer.email || contract.customer.code;
}

function customerCin(contract: ContractPayload) {
  if (contract.customer.type === "company") return contract.customer.business?.taxId ?? contract.customer.code;
  return contract.customer.individual?.cinNumber ?? contract.customer.code;
}

function customerLicense(contract: ContractPayload) {
  return contract.customer.individual?.drivingLicenseNumber ?? "";
}

export function mapContractStatusToUi(status: DbContractStatus): ContractStatus {
  if (status === DbContractStatus.completed) return "termine";
  if (status === DbContractStatus.cancelled) return "annule";
  return "en_cours";
}

function conditionOk(condition: InspectionCondition) {
  return condition === InspectionCondition.ok;
}

function groupInspection(items: ContractPayload["inspectionItems"], event: InspectionEvent, pickupMileage: number, fuel?: number | null): EtatBlock {
  const filtered = items.filter((item) => item.event === event);
  const section = (terms: string[]) =>
    filtered
      .filter((item) => terms.some((term) => item.zone.toLowerCase().includes(term)))
      .map((item) => ({ label: item.zone, ok: conditionOk(item.condition) }));
  const fallback = filtered.map((item) => ({ label: item.zone, ok: conditionOk(item.condition) }));
  return {
    carrosserie: section(["body", "bumper", "door", "roof", "windshield", "carrosserie"]).concat(fallback).slice(0, Math.max(1, fallback.length)),
    interieur: section(["interior", "seat", "dashboard", "intérieur", "interieur"]),
    equipements: section(["equipment", "spare", "triangle", "gilet", "équipement", "equipement"]),
    fuel: fuel && fuel >= 6 ? 4 : fuel && fuel >= 4 ? 3 : fuel && fuel >= 2 ? 2 : 1,
    km: event === InspectionEvent.return ? pickupMileage : pickupMileage,
  };
}

function history(contract: ContractPayload): HistoryEvent[] {
  const events: HistoryEvent[] = [
    {
      id: `${contract.id}:created`,
      type: "created",
      label: "contract.history.generated",
      at: contract.createdAt.toISOString(),
    },
  ];
  for (const signature of contract.signatures) {
    events.push({
      id: signature.id,
      type: signature.signerType === SignerType.agent ? "signed_agency" : "signed_client",
      label: signature.signerType === SignerType.agent ? "contract.history.signedAgency" : "contract.history.signedClient",
      actor: signature.signerName,
      at: signature.signedAt.toISOString(),
    });
  }
  if (contract.status === DbContractStatus.completed && contract.returnedAt) {
    events.push({ id: `${contract.id}:completed`, type: "completed", label: "contract.history.completed", at: contract.returnedAt.toISOString() });
  }
  return events;
}

export function mapContractToUi(contract: ContractPayload): Contract {
  const currentSnapshot = contract.reservation.pricingSnapshots.find((snapshot) => snapshot.isCurrent) ?? contract.reservation.pricingSnapshots[0];
  const additionalDriver = contract.reservation.authorizedDrivers[0];
  const assignedDriver = contract.reservation.driverAssignments[0];
  const signedByClient = contract.signatures.some((signature) => signature.signerType === SignerType.customer);
  const signedByAgency = contract.signatures.some((signature) => signature.signerType === SignerType.agent);
  const returnItems = contract.inspectionItems.filter((item) => item.event === InspectionEvent.return);
  const returnDamages = returnItems
    .filter((item) => item.condition !== InspectionCondition.ok)
    .map((item) => ({
      zone: item.zone,
      description: item.notes ?? item.condition,
      severity: item.condition === InspectionCondition.broken || item.condition === InspectionCondition.missing ? "grave" as const : "moyen" as const,
    }));

  return {
    id: contract.id,
    code: contract.code,
    status: mapContractStatusToUi(contract.status),
    createdAt: contract.createdAt.toISOString(),
    createdBy: contract.signatures.find((signature) => signature.signerType === SignerType.agent)?.signerName ?? "System",
    reservationCode: contract.reservation.code,
    renderedHtml: contract.renderedHtml,
    contentHash: contract.contentHash,
    template: {
      id: contract.template?.id,
      name: contract.template?.name,
      versionNumber: contract.templateVersion?.versionNumber,
    },
    client: {
      fullName: customerName(contract),
      cinMasked: customerCin(contract),
      permis: customerLicense(contract),
      phone: contract.customer.phone ?? "",
    },
    additionalDriver: additionalDriver
      ? {
          fullName: additionalDriver.fullName,
          cinMasked: "",
          permis: additionalDriver.licenseNumber,
        }
      : undefined,
    assignedDriver: assignedDriver
      ? {
          fullName: `${assignedDriver.driver.firstName} ${assignedDriver.driver.lastName}`,
          phone: assignedDriver.driver.phone,
          role: assignedDriver.role,
        }
      : undefined,
    car: {
      brand: contract.vehicle.brand,
      model: contract.vehicle.model,
      plate: contract.vehicle.plate,
      category: mapCategoryName(contract.vehicle.category?.name ?? "Compact") === "Citadine"
        ? "economique"
        : mapCategoryName(contract.vehicle.category?.name ?? "Compact").toLowerCase() as Contract["car"]["category"],
    },
    period: {
      start: (currentSnapshot?.startsAt ?? contract.reservation.startsAt).toISOString(),
      end: (currentSnapshot?.endsAt ?? contract.reservation.endsAt).toISOString(),
      days: currentSnapshot?.durationValue ?? currentSnapshot?.days ?? contract.reservation.days,
    },
    locations: {
      pickup: contract.reservation.pickupLocation ?? "",
      dropoff: contract.reservation.returnLocation ?? "",
    },
    pricing: {
      pricePerDay: Number(currentSnapshot?.pricePerDay ?? contract.reservation.pricePerDay),
      discount: Number(currentSnapshot?.discountAmount ?? contract.reservation.discountAmount),
      options: contract.reservation.extras.map((extra) => ({ label: extra.label, amount: Number(extra.totalPrice) })),
      total: Number(currentSnapshot?.totalAmount ?? contract.reservation.totalAmount),
      currency: currentSnapshot?.currency ?? contract.reservation.currency,
      mileageLimit: currentSnapshot?.mileageLimit ?? null,
      extraMileageRate: currentSnapshot?.extraMileageRate ? Number(currentSnapshot.extraMileageRate) : null,
    },
    caution: {
      amount: Number(currentSnapshot?.depositAmount ?? contract.reservation.depositAmount),
      type: "Cash",
      status: contract.status === DbContractStatus.completed ? "restituee" : "en_attente",
    },
    payments: [],
    balance: Number(contract.reservation.advanceAmount) >= Number(contract.reservation.totalAmount) ? "paid" : Number(contract.reservation.advanceAmount) > 0 ? "partial" : "unpaid",
    etat: {
      depart: groupInspection(contract.inspectionItems, InspectionEvent.pickup, contract.pickupMileage, contract.pickupFuelLevel),
      retour: contract.returnMileage
        ? {
            ...groupInspection(contract.inspectionItems, InspectionEvent.return, contract.returnMileage, contract.returnFuelLevel),
            damages: returnDamages,
            notes: contract.notes ?? undefined,
          }
        : undefined,
    },
    signedByClient,
    signedByAgency,
    history: history(contract),
  };
}
