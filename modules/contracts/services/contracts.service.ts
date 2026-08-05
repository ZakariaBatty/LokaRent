import { createId, createNotFoundError, createValidationError, publishDomainEvent, runInTransaction } from "@/shared";
import { createVehicleMileageLog } from "@/modules/cars/repositories/cars.repository";
import { updateReservation } from "@/modules/reservations/repositories/reservations.repository";
import {
  createContract,
  createContractInspectionItem,
  createContractSignature,
  createContractTemplate,
  createContractTemplateVersion,
  findContractById,
  findContractByReservation,
  findCurrentContractTemplateVersion,
  findDefaultContractTemplate,
  listContractInspectionItems,
  listContractSignatures,
  softDeleteContract,
  updateContract,
  updateContractInspectionItem,
  updateContractTemplate,
} from "../repositories/contracts.repository";

export type ContractServiceContext = {
  companyId: string;
  agencyId: string;
  userId?: string | null;
  actorName?: string;
};

type ContractTemplateCreateData = Omit<Parameters<typeof createContractTemplate>[0], "id" | "companyId" | "agencyId">;
type ContractTemplateVersionCreateData = Omit<Parameters<typeof createContractTemplateVersion>[0], "id" | "companyId" | "templateId" | "createdBy">;
type ContractCreateData = Omit<Parameters<typeof createContract>[0], "id" | "companyId" | "agencyId">;
type MileageLogCreateData = Omit<Parameters<typeof createVehicleMileageLog>[0], "id" | "companyId" | "recordedBy" | "source" | "referenceId">;
type SignatureCreateData = Omit<Parameters<typeof createContractSignature>[0], "id" | "companyId" | "contractId" | "signedBy">;
type InspectionItemCreateData = Omit<Parameters<typeof createContractInspectionItem>[0], "id" | "companyId">;

export async function getContractService(input: {
  companyId: string;
  agencyId: string;
  contractId: string;
}) {
  const contract = await findContractById(input);
  if (!contract) throw createNotFoundError("Contract", input);
  return contract;
}

export async function getContractByReservationService(input: {
  companyId: string;
  agencyId: string;
  reservationId: string;
}) {
  const contract = await findContractByReservation(input);
  if (!contract) throw createNotFoundError("Contract", input);
  return contract;
}

export async function getDefaultContractTemplateService(input: {
  companyId: string;
  agencyId?: string | null;
}) {
  const template = await findDefaultContractTemplate(input);
  if (!template) throw createNotFoundError("Default contract template", input);
  return template;
}

export async function createContractTemplateService(input: {
  context: ContractServiceContext;
  template: ContractTemplateCreateData;
  version: ContractTemplateVersionCreateData;
}) {
  return runInTransaction(async (tx) => {
    const templateId = createId();
    const template = await createContractTemplate(
      {
        ...input.template,
        id: templateId,
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
      },
      tx,
    );
    const version = await createContractTemplateVersion(
      {
        ...input.version,
        id: createId(),
        companyId: input.context.companyId,
        templateId,
        createdBy: input.context.userId ?? null,
      },
      tx,
    );
    return { template, version };
  });
}

export async function updateContractTemplateService(input: {
  companyId: string;
  templateId: string;
  data: Parameters<typeof updateContractTemplate>[0]["data"];
}) {
  return updateContractTemplate(input);
}

export async function getCurrentContractTemplateVersionService(input: {
  companyId: string;
  templateId: string;
}) {
  const version = await findCurrentContractTemplateVersion(input);
  if (!version) throw createNotFoundError("Contract template version", input);
  return version;
}

export async function createContractService(input: {
  context: ContractServiceContext;
  data: ContractCreateData;
}) {
  const existing = await findContractByReservation({
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    reservationId: input.data.reservationId,
  });
  if (existing) throw createValidationError("Reservation already has a contract");
  const contract = await createContract({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
  });
  await publishDomainEvent({
    name: "ContractGenerated",
    companyId: contract.companyId,
    agencyId: contract.agencyId,
    entityType: "contract",
    entityId: contract.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return contract;
}

export async function activateContractAtPickupService(input: {
  context: ContractServiceContext;
  contractId: string;
  reservationId: string;
  mileageLog: MileageLogCreateData;
  signature?: SignatureCreateData;
}) {
  const scope = {
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    contractId: input.contractId,
  };
  const contract = await getContractService(scope);
  if (contract.status !== "draft") {
    throw createValidationError("Only draft contracts can be activated");
  }
  await runInTransaction(async (tx) => {
    await createVehicleMileageLog(
      {
        ...input.mileageLog,
        id: createId(),
        companyId: input.context.companyId,
        recordedBy: input.context.userId ?? null,
        source: "contract_pickup",
        referenceId: input.contractId,
      },
      tx,
    );
    if (input.signature) {
      await createContractSignature(
        {
          ...input.signature,
          id: createId(),
          companyId: input.context.companyId,
          contractId: input.contractId,
          signedBy: input.context.userId ?? null,
        },
        tx,
      );
    }
    await updateContract(
      {
        ...scope,
        data: { status: "active", signedAt: input.signature?.signedAt ?? new Date() },
      },
      tx,
    );
    await updateReservation(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        reservationId: input.reservationId,
        data: { status: "active", activatedAt: new Date() },
      },
      tx,
    );
  });
  await publishDomainEvent({
    name: "ReservationPickedUp",
    companyId: input.context.companyId,
    agencyId: input.context.agencyId,
    entityType: "reservation",
    entityId: input.reservationId,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return getContractService(scope);
}

export async function completeContractAtReturnService(input: ContractServiceContext & {
  contractId: string;
  returnMileage: number;
  returnFuelLevel?: number | null;
  reservationId?: string;
  mileageLog?: MileageLogCreateData;
  signature?: SignatureCreateData;
}) {
  const contract = await getContractService(input);
  if (contract.status !== "active" && contract.status !== "disputed") {
    throw createValidationError("Only active or disputed contracts can be completed");
  }
  if (input.returnMileage < contract.pickupMileage) {
    throw createValidationError("Return mileage cannot be lower than pickup mileage");
  }
  await runInTransaction(async (tx) => {
    if (input.mileageLog) {
      await createVehicleMileageLog(
        {
          ...input.mileageLog,
          id: createId(),
          companyId: input.companyId,
          recordedBy: input.userId ?? null,
          source: "contract_return",
          referenceId: input.contractId,
        },
        tx,
      );
    }
    if (input.signature) {
      await createContractSignature(
        {
          ...input.signature,
          id: createId(),
          companyId: input.companyId,
          contractId: input.contractId,
          signedBy: input.userId ?? null,
        },
        tx,
      );
    }
    await updateContract(
      {
        companyId: input.companyId,
        agencyId: input.agencyId,
        contractId: input.contractId,
        data: {
          status: "completed",
          returnMileage: input.returnMileage,
          returnFuelLevel: input.returnFuelLevel,
          returnedAt: new Date(),
        },
      },
      tx,
    );
    if (input.reservationId) {
      await updateReservation(
        {
          companyId: input.companyId,
          agencyId: input.agencyId,
          reservationId: input.reservationId,
          data: { status: "completed", completedAt: new Date() },
        },
        tx,
      );
    }
  });
  await publishDomainEvent({
    name: "ContractCompleted",
    companyId: input.companyId,
    agencyId: input.agencyId,
    entityType: "contract",
    entityId: input.contractId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return getContractService(input);
}

export async function createInspectionItemService(input: {
  context: Pick<ContractServiceContext, "companyId" | "userId" | "actorName">;
  data: InspectionItemCreateData;
}) {
  const item = await createContractInspectionItem({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
  });
  if (item.event === "return" && item.condition !== "ok") {
    await publishDomainEvent({
      name: "DamageRecordedAtReturn",
      companyId: item.companyId,
      entityType: "contract_inspection_item",
      entityId: item.id,
      userId: input.context.userId,
      actorName: input.context.actorName,
      occurredAt: new Date(),
    });
  }
  return item;
}

export async function updateInspectionItemService(input: {
  companyId: string;
  itemId: string;
  data: Parameters<typeof updateContractInspectionItem>[0]["data"];
}) {
  return updateContractInspectionItem(input);
}

export async function listInspectionItemsService(input: {
  companyId: string;
  contractId: string;
  includeDeleted?: boolean;
}) {
  return listContractInspectionItems(input);
}

export async function createContractSignatureService(input: {
  context: Pick<ContractServiceContext, "companyId" | "userId" | "actorName">;
  contractId: string;
  data: SignatureCreateData;
}) {
  const signature = await createContractSignature({
    ...input.data,
    id: createId(),
    companyId: input.context.companyId,
    contractId: input.contractId,
    signedBy: input.context.userId ?? null,
  });
  await publishDomainEvent({
    name: signature.signerType === "agent" ? "ContractSignedByAgent" : "ContractSignedByCustomer",
    companyId: signature.companyId,
    entityType: "contract_signature",
    entityId: signature.id,
    userId: input.context.userId,
    actorName: input.context.actorName,
    occurredAt: new Date(),
  });
  return signature;
}

export async function listContractSignaturesService(input: {
  companyId: string;
  contractId: string;
}) {
  return listContractSignatures(input);
}

export async function deleteContractService(input: ContractServiceContext & { contractId: string }) {
  await getContractService(input);
  return softDeleteContract({ ...input, deletedBy: input.userId ?? null });
}

export const contractsService = {
  getContractService,
  getContractByReservationService,
  getDefaultContractTemplateService,
  createContractTemplateService,
  updateContractTemplateService,
  getCurrentContractTemplateVersionService,
  createContractService,
  activateContractAtPickupService,
  completeContractAtReturnService,
  createInspectionItemService,
  updateInspectionItemService,
  listInspectionItemsService,
  createContractSignatureService,
  listContractSignaturesService,
  deleteContractService,
};
