import { ContractStatus, Prisma, prisma } from "@lokarent/db";
import {
  createPaginationMeta,
  getPagination,
  type DatabaseClient,
  type PaginationInput,
} from "@/shared/database";

export type ContractListInput = PaginationInput & {
  companyId: string;
  agencyId: string;
  status?: ContractStatus;
  search?: string;
  orderBy?: "createdAt" | "pickupAt" | "code" | "status";
  direction?: "asc" | "desc";
  includeDeleted?: boolean;
};

function contractWhere(input: ContractListInput): Prisma.ContractWhereInput {
  return {
    companyId: input.companyId,
    agencyId: input.agencyId,
    status: input.status,
    ...(input.includeDeleted ? {} : { deletedAt: null }),
    ...(input.search
      ? {
          OR: [
            { code: { contains: input.search, mode: "insensitive" } },
            { reservation: { code: { contains: input.search, mode: "insensitive" } } },
            { customer: { email: { contains: input.search, mode: "insensitive" } } },
            { customer: { phone: { contains: input.search, mode: "insensitive" } } },
            { customer: { individual: { is: { firstName: { contains: input.search, mode: "insensitive" } } } } },
            { customer: { individual: { is: { lastName: { contains: input.search, mode: "insensitive" } } } } },
            { customer: { business: { is: { companyName: { contains: input.search, mode: "insensitive" } } } } },
            { vehicle: { plate: { contains: input.search, mode: "insensitive" } } },
            { vehicle: { brand: { contains: input.search, mode: "insensitive" } } },
            { vehicle: { model: { contains: input.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

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

export async function listContractTemplates(
  input: { companyId: string; agencyId?: string | null; includeInactive?: boolean; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplate.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      ...(input.includeInactive ? {} : { isActive: true }),
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
  });
}

export async function clearDefaultContractTemplates(
  input: { companyId: string; agencyId?: string | null; excludeTemplateId?: string },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplate.updateMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      id: input.excludeTemplateId ? { not: input.excludeTemplateId } : undefined,
      isDefault: true,
      deletedAt: null,
    },
    data: { isDefault: false },
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

export async function listContractTemplateVersions(
  input: { companyId: string; templateId: string },
  db: DatabaseClient = prisma,
) {
  return db.contractTemplateVersion.findMany({
    where: { companyId: input.companyId, templateId: input.templateId },
    orderBy: { versionNumber: "desc" },
  });
}

const contractInclude = {
  reservation: {
    include: {
      pricingSnapshots: { where: { isCurrent: true }, take: 1 },
      extras: { include: { definition: true }, orderBy: { createdAt: "asc" } },
      authorizedDrivers: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      driverAssignments: { where: { deletedAt: null }, include: { driver: true } },
      timelineEvents: { orderBy: { createdAt: "desc" } },
    },
  },
  customer: { include: { individual: true, business: true } },
  vehicle: { include: { category: true } },
  inspectionItems: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
  signatures: { orderBy: { createdAt: "asc" } },
  template: true,
  templateVersion: true,
} satisfies Prisma.ContractInclude;

export async function paginateContracts(input: ContractListInput, db: DatabaseClient = prisma) {
  const pagination = getPagination(input);
  const where = contractWhere(input);
  const orderField = input.orderBy ?? "createdAt";
  const direction = input.direction ?? "desc";
  const [data, total] = await Promise.all([
    db.contract.findMany({
      where,
      include: contractInclude,
      orderBy: [{ [orderField]: direction }, { id: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    db.contract.count({ where }),
  ]);
  return { data, pagination: createPaginationMeta(pagination, total) };
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
    include: contractInclude,
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
    include: contractInclude,
  });
}

export async function lockContractRow(
  input: { companyId: string; agencyId: string; contractId: string },
  db: DatabaseClient = prisma,
) {
  await db.$queryRaw`
    SELECT id
    FROM contracts
    WHERE id = ${input.contractId}::uuid
      AND company_id = ${input.companyId}::uuid
      AND agency_id = ${input.agencyId}::uuid
    FOR UPDATE
  `;
}

export async function updateContractStatusConditionally(
  input: {
    companyId: string;
    agencyId: string;
    contractId: string;
    expectedStatuses: ContractStatus[];
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
      status: { in: input.expectedStatuses },
    },
    data: input.data,
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
  listContractTemplates,
  clearDefaultContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  createContractTemplateVersion,
  findContractTemplateVersion,
  findCurrentContractTemplateVersion,
  listContractTemplateVersions,
  paginateContracts,
  findContractById,
  findContractByReservation,
  lockContractRow,
  createContract,
  updateContract,
  updateContractStatusConditionally,
  softDeleteContract,
  listContractInspectionItems,
  createContractInspectionItem,
  updateContractInspectionItem,
  softDeleteContractInspectionItem,
  createContractSignature,
  listContractSignatures,
};
