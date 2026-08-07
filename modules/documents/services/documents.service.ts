import { createId, createNotFoundError, publishDomainEvent } from "@/shared";
import {
  createDocumentMetadata,
  findDocumentById,
  listDocumentsByEntity,
  restoreDocument,
  softDeleteDocument,
} from "../repositories/documents.repository";

export type DocumentActor = {
  userId?: string | null;
  actorName?: string;
};

type DocumentCreateData = Omit<
  Parameters<typeof createDocumentMetadata>[0],
  "id" | "companyId" | "agencyId" | "uploadedBy"
>;

export async function getDocumentService(input: {
  companyId: string;
  documentId: string;
  agencyId?: string | null;
}) {
  const document = await findDocumentById(input);
  if (!document) throw createNotFoundError("Document", input);
  return document;
}

export async function listDocumentsByEntityService(input: {
  companyId: string;
  agencyId?: string | null;
  entityType: string;
  entityId: string;
  includeDeleted?: boolean;
}) {
  return listDocumentsByEntity(input);
}

export async function createDocumentMetadataService(
  input: DocumentActor & {
    companyId: string;
    agencyId?: string | null;
    data: DocumentCreateData;
  },
) {
  const document = await createDocumentMetadata({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    agencyId: input.agencyId ?? null,
    uploadedBy: input.userId ?? "",
  });
  await publishDomainEvent({
    name: "DocumentUploaded",
    companyId: document.companyId,
    agencyId: document.agencyId,
    entityType: "document",
    entityId: document.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return document;
}

export async function deleteDocumentService(
  input: DocumentActor & {
    companyId: string;
    documentId: string;
    agencyId?: string | null;
  },
) {
  await getDocumentService(input);
  const result = await softDeleteDocument({ ...input, deletedBy: input.userId ?? null });
  await publishDomainEvent({
    name: "DocumentDeleted",
    companyId: input.companyId,
    agencyId: input.agencyId ?? null,
    entityType: "document",
    entityId: input.documentId,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return result;
}

export async function restoreDocumentService(input: {
  companyId: string;
  documentId: string;
  agencyId?: string | null;
}) {
  return restoreDocument(input);
}

export const documentsService = {
  getDocumentService,
  listDocumentsByEntityService,
  createDocumentMetadataService,
  deleteDocumentService,
  restoreDocumentService,
};
