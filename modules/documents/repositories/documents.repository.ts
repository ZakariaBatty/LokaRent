import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findDocumentById(
  input: { companyId: string; documentId: string; agencyId?: string | null; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.document.findFirst({
    where: {
      id: input.documentId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function listDocumentsByEntity(
  input: {
    companyId: string;
    agencyId?: string | null;
    entityType: string;
    entityId: string;
    includeDeleted?: boolean;
  },
  db: DatabaseClient = prisma,
) {
  return db.document.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      entityType: input.entityType,
      entityId: input.entityId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDocumentMetadata(
  data: Prisma.DocumentUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.document.create({ data });
}

export async function softDeleteDocument(
  input: { companyId: string; documentId: string; agencyId?: string | null; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.document.updateMany({
    where: {
      id: input.documentId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreDocument(
  input: { companyId: string; documentId: string; agencyId?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.document.updateMany({
    where: { id: input.documentId, companyId: input.companyId, agencyId: input.agencyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export const documentsRepository = {
  findDocumentById,
  listDocumentsByEntity,
  createDocumentMetadata,
  softDeleteDocument,
  restoreDocument,
};
