import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findContractTemplateById(
  input: { companyId: string; templateId: string; agencyId?: string | null; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplate.findFirst({
    where: {
      id: input.templateId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
}

export async function findDefaultContractTemplate(
  input: { companyId: string; agencyId?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplate.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      isDefault: true,
      isActive: true,
      deletedAt: null,
    },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
}

export async function createContractTemplate(
  data: Prisma.ContractTemplateUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.contractTemplate.create({ data });
}

export async function updateContractTemplate(
  input: {
    companyId: string;
    templateId: string;
    data: Prisma.ContractTemplateUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplate.updateMany({
    where: { id: input.templateId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function createContractTemplateVersion(
  data: Prisma.ContractTemplateVersionUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.contractTemplateVersion.create({ data });
}

export async function findContractTemplateVersion(
  input: { companyId: string; templateVersionId: string },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplateVersion.findFirst({
    where: { id: input.templateVersionId, companyId: input.companyId },
  });
}

export async function findCurrentContractTemplateVersion(
  input: { companyId: string; templateId: string },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplateVersion.findFirst({
    where: { companyId: input.companyId, templateId: input.templateId },
    orderBy: { versionNumber: "desc" },
  });
}

export async function findContractById(
  input: { companyId: string; agencyId: string; contractId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.contract.findFirst({
    where: {
      id: input.contractId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: {
      reservation: true,
      customer: { include: { individual: true, business: true } },
      vehicle: true,
      inspectionItems: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      signatures: { orderBy: { createdAt: "asc" } },
      templateVersion: true,
    },
  });
}

export async function findContractByReservation(
  input: { companyId: string; agencyId: string; reservationId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.contract.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      reservationId: input.reservationId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { inspectionItems: { where: { deletedAt: null } }, signatures: true },
  });
}

export async function createContract(data: Prisma.ContractUncheckedCreateInput, db: DatabaseClient = prisma) {
  return db.contract.create({ data });
}

export async function updateContract(
  input: {
    companyId: string;
    agencyId: string;
    contractId: string;
    data: Prisma.ContractUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.contract.updateMany({
    where: {
      id: input.contractId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function softDeleteContract(
  input: { companyId: string; agencyId: string; contractId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.contract.updateMany({
    where: {
      id: input.contractId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function listContractInspectionItems(
  input: { companyId: string; contractId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.contractInspectionItem.findMany({
    where: {
      companyId: input.companyId,
      contractId: input.contractId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createContractInspectionItem(
  data: Prisma.ContractInspectionItemUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.contractInspectionItem.create({ data });
}

export async function updateContractInspectionItem(
  input: {
    companyId: string;
    itemId: string;
    data: Prisma.ContractInspectionItemUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.contractInspectionItem.updateMany({
    where: { id: input.itemId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteContractInspectionItem(
  input: { companyId: string; itemId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.contractInspectionItem.updateMany({
    where: { id: input.itemId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function createContractSignature(
  data: Prisma.ContractSignatureUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.contractSignature.create({ data });
}

export async function listContractSignatures(
  input: { companyId: string; contractId: string },
  db: DatabaseClient = prisma,
) {
  return db.contractSignature.findMany({
    where: { companyId: input.companyId, contractId: input.contractId },
    orderBy: { createdAt: "asc" },
  });
}

export const contractsRepository = {
  findContractTemplateById,
  findDefaultContractTemplate,
  createContractTemplate,
  updateContractTemplate,
  createContractTemplateVersion,
  findContractTemplateVersion,
  findCurrentContractTemplateVersion,
  findContractById,
  findContractByReservation,
  createContract,
  updateContract,
  softDeleteContract,
  listContractInspectionItems,
  createContractInspectionItem,
  updateContractInspectionItem,
  softDeleteContractInspectionItem,
  createContractSignature,
  listContractSignatures,
};
