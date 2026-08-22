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
    pricingSnapshot: true;
    supersedesContract: true;
    supersededBy: true;
    customer: { include: { individual: true; business: true } };
    vehicle: { include: { category: true } };
    inspectionItems: true;
    signatures: true;
    template: true;
    templateVersion: true;
  };
}>;

type FrozenContractSnapshot = {
  contract?: {
    pickupMileage?: number;
    pickupFuelLevel?: number | null;
    pickupInspectionItems?: { zone?: string; condition?: string; notes?: string | null }[];
  };
  reservation?: {
    startsAt?: string;
    endsAt?: string;
    durationValue?: number;
  };
  pricing?: {
    pricePerDay?: string;
    discountAmount?: string;
    discountReason?: string | null;
    totalAmount?: string;
    mileageLimit?: number | null;
    extraMileageRate?: string | null;
    depositAmount?: string | null;
    currency?: string;
    extras?: { label?: string; totalPrice?: string }[];
  };
  authorizedDrivers?: { fullName?: string; licenseNumber?: string }[];
  internalDrivers?: { fullName?: string; phone?: string | null; role?: string }[];
};

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

function frozenSnapshot(contract: ContractPayload) {
  return contract.contentSnapshot && typeof contract.contentSnapshot === "object"
    ? (contract.contentSnapshot as FrozenContractSnapshot)
    : {};
}

function numberFromSnapshot(value: string | number | null | undefined, fallback: number) {
  if (value === null || value === undefined || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function dateFromSnapshot(value: string | undefined, fallback: Date) {
  if (!value) return fallback.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
}

function groupInspection(items: ContractPayload["inspectionItems"], event: InspectionEvent, mileage: number, fuel?: number | null): EtatBlock {
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
    km: mileage,
  };
}

function groupFrozenPickupInspection(snapshot: FrozenContractSnapshot, fallback: EtatBlock): EtatBlock {
  const items = snapshot.contract?.pickupInspectionItems ?? [];
  if (items.length === 0) return fallback;
  return {
    ...fallback,
    carrosserie: items.map((item) => ({ label: item.zone ?? "", ok: item.condition === "ok" })),
    interieur: [],
    equipements: [],
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
  const contractSnapshot = contract.pricingSnapshot ?? contract.reservation.pricingSnapshots.find((snapshot) => snapshot.id === contract.pricingSnapshotId);
  const currentSnapshot = contractSnapshot ?? contract.reservation.pricingSnapshots.find((snapshot) => snapshot.isCurrent) ?? contract.reservation.pricingSnapshots[0];
  const frozen = frozenSnapshot(contract);
  const additionalDriver = contract.reservation.authorizedDrivers[0];
  const assignedDriver = contract.reservation.driverAssignments[0];
  const frozenAdditionalDriver = frozen.authorizedDrivers?.[0];
  const frozenAssignedDriver = frozen.internalDrivers?.[0];
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

  const pickupMileage = numberFromSnapshot(frozen.contract?.pickupMileage, contract.pickupMileage);
  const pickupFuelLevel = frozen.contract?.pickupFuelLevel ?? contract.pickupFuelLevel;
  const frozenPricing = frozen.pricing ?? {};
  const pricePerDay = numberFromSnapshot(frozenPricing.pricePerDay, Number(currentSnapshot?.pricePerDay ?? contract.reservation.pricePerDay));
  const discount = numberFromSnapshot(frozenPricing.discountAmount, Number(currentSnapshot?.discountAmount ?? contract.reservation.discountAmount));
  const total = numberFromSnapshot(frozenPricing.totalAmount, Number(currentSnapshot?.totalAmount ?? contract.reservation.totalAmount));
  const deposit = numberFromSnapshot(frozenPricing.depositAmount, Number(currentSnapshot?.depositAmount ?? contract.reservation.depositAmount));
  const departureInspection = groupFrozenPickupInspection(
    frozen,
    groupInspection(contract.inspectionItems, InspectionEvent.pickup, pickupMileage, pickupFuelLevel),
  );

  return {
    id: contract.id,
    code: contract.code,
    versionNumber: contract.versionNumber,
    isCurrent: contract.isCurrent,
    supersedesContractId: contract.supersedesContractId,
    pricingSnapshotId: contract.pricingSnapshotId,
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
    additionalDriver: frozenAdditionalDriver
      ? {
          fullName: frozenAdditionalDriver.fullName ?? "",
          cinMasked: "",
          permis: frozenAdditionalDriver.licenseNumber ?? "",
        }
      : additionalDriver
      ? {
          fullName: additionalDriver.fullName,
          cinMasked: "",
          permis: additionalDriver.licenseNumber,
        }
      : undefined,
    assignedDriver: frozenAssignedDriver
      ? {
          fullName: frozenAssignedDriver.fullName ?? "",
          phone: frozenAssignedDriver.phone,
          role: frozenAssignedDriver.role,
        }
      : assignedDriver
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
      start: dateFromSnapshot(frozen.reservation?.startsAt, currentSnapshot?.startsAt ?? contract.reservation.startsAt),
      end: dateFromSnapshot(frozen.reservation?.endsAt, currentSnapshot?.endsAt ?? contract.reservation.endsAt),
      days: frozen.reservation?.durationValue ?? currentSnapshot?.durationValue ?? currentSnapshot?.days ?? contract.reservation.days,
    },
    locations: {
      pickup: contract.reservation.pickupLocation ?? "",
      dropoff: contract.reservation.returnLocation ?? "",
    },
    pricing: {
      pricePerDay,
      discount,
      discountReason: frozenPricing.discountReason ?? currentSnapshot?.discountReason ?? contract.reservation.discountReason,
      options: frozenPricing.extras?.map((extra) => ({ label: extra.label ?? "", amount: numberFromSnapshot(extra.totalPrice, 0) })) ??
        contract.reservation.extras.map((extra) => ({ label: extra.label, amount: Number(extra.totalPrice) })),
      total,
      currency: frozenPricing.currency ?? currentSnapshot?.currency ?? contract.reservation.currency,
      mileageLimit: frozenPricing.mileageLimit ?? currentSnapshot?.mileageLimit ?? null,
      extraMileageRate: frozenPricing.extraMileageRate
        ? Number(frozenPricing.extraMileageRate)
        : currentSnapshot?.extraMileageRate
          ? Number(currentSnapshot.extraMileageRate)
          : null,
    },
    caution: {
      amount: deposit,
      type: "Cash",
      status: contract.status === DbContractStatus.completed ? "restituee" : "en_attente",
    },
    payments: [],
    balance: Number(contract.reservation.advanceAmount) >= Number(contract.reservation.totalAmount) ? "paid" : Number(contract.reservation.advanceAmount) > 0 ? "partial" : "unpaid",
    etat: {
      depart: departureInspection,
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
    pickupMileage,
    pickupFuelLevel,
    history: history(contract),
  };
}
