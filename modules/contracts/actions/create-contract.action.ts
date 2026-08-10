"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@lokarent/db";
import { createDocumentMetadataService, deleteDocumentService, listDocumentsByEntityService } from "@/modules/documents/services/documents.service";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { uploadFileService, type UploadResult } from "@/shared/storage";
import {
  createContractInspectionItemSchema,
  createContractSignatureSchema,
  generateContractSchema,
  contractByReservationSchema,
  contractIdSchema,
} from "../validators/create-contract.schema";
import {
  updateContractInspectionItemSchema,
  upsertContractTemplateSchema,
} from "../validators/update-contract.schema";
import {
  createContractSignatureService,
  createInspectionItemService,
  deleteContractService,
  generateContractFromReservationService,
  getContractByReservationService,
  getContractService,
  listContractTemplatesService,
  updateContractTemplateService,
  createContractTemplateService,
  updateInspectionItemService,
  type ContractServiceContext,
} from "../services/contracts.service";
import { mapContractToUi } from "../mappers/contract.mapper";

export type ContractActionResult =
  | { success: true; contractId?: string }
  | { success: false; messageKey: string; code?: string };

type ContractUploadResult =
  | { success: true; upload: UploadResult; documentId: string }
  | { success: false; messageKey: string; code?: string };

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "contracts.errors.generic";
  if (error.code === "FORBIDDEN") return "contracts.errors.forbidden";
  if (error.code === "NOT_FOUND") return "contracts.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "CONTRACT_ALREADY_EXISTS") return "contracts.errors.alreadyExists";
    if (error.message === "CONTRACT_PRICING_SNAPSHOT_REQUIRED") return "contracts.errors.pricingSnapshotRequired";
    if (error.message === "CONTRACT_PRICING_SNAPSHOT_MISSING") return "contracts.errors.pricingSnapshotRequired";
    if (error.message === "CONTRACT_TEMPLATE_REQUIRED") return "contracts.errors.templateRequired";
    if (error.message === "CONTRACT_DEFAULT_TEMPLATE_NOT_CONFIGURED") return "contracts.errors.defaultTemplateNotConfigured";
    if (error.message === "CONTRACT_TEMPLATE_NOT_FOUND") return "contracts.errors.templateNotFound";
    if (error.message === "CONTRACT_TEMPLATE_VERSION_REQUIRED") return "contracts.errors.templateVersionRequired";
    if (error.message === "CONTRACT_TEMPLATE_VERSION_NOT_FOUND") return "contracts.errors.templateVersionNotFound";
    if (error.message === "CONTRACT_RESERVATION_STATUS_NOT_ALLOWED") return "contracts.errors.reservationStatusNotAllowed";
    if (error.message === "CONTRACT_RESERVATION_NOT_CONFIRMED") return "contracts.errors.reservationNotConfirmed";
    if (error.message === "CONTRACT_GENERATION_NOT_ALLOWED") return "contracts.errors.generationNotAllowed";
    if (error.message === "CONTRACT_INVALID_PICKUP_MILEAGE") return "contracts.errors.invalidPickupMileage";
    if (error.message === "CONTRACT_INVALID_STATUS_TRANSITION") return "contracts.errors.invalidStatusTransition";
    if (error.message === "CONTRACT_LIFECYCLE_CONFLICT") return "contracts.errors.lifecycleConflict";
    if (error.message === "CONTRACT_RETURN_MILEAGE_TOO_LOW") return "contracts.errors.returnMileageTooLow";
    if (error.message === "CONTRACT_IMMUTABLE") return "contracts.errors.immutable";
    if (error.message === "CONTRACT_DELETE_BLOCKED") return "contracts.errors.deleteBlocked";
    return "contracts.errors.validation";
  }
  return "contracts.errors.generic";
}

function messageKeyForUploadError(error: unknown) {
  if (!isAppError(error)) return "contracts.upload.errors.generic";
  if (error.message === "UPLOAD_FILE_TOO_LARGE") return "contracts.upload.errors.fileTooLarge";
  if (error.message === "UPLOAD_UNSUPPORTED_FILE_TYPE") return "contracts.upload.errors.unsupportedFile";
  if (error.message === "UPLOAD_PROVIDER_NOT_CONFIGURED") return "contracts.upload.errors.providerNotConfigured";
  return "contracts.upload.errors.generic";
}

async function getActionContext(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(permission, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies ContractServiceContext;
}

function revalidateContractPaths() {
  revalidatePath("/contracts");
  revalidatePath("/reservations");
  revalidatePath("/settings/contract-template");
}

export async function generateContractAction(input: unknown): Promise<ContractActionResult> {
  const parsed = generateContractSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    const contract = await generateContractFromReservationService({
      context,
      ...parsed.data,
      inspectionItems: parsed.data.inspectionItems?.map((item) => ({
        contractId: item.contractId ?? "",
        event: item.event,
        zone: item.zone,
        condition: item.condition,
        notes: item.notes,
        photoUrl: item.photoUrl,
      })),
    });
    revalidateContractPaths();
    return { success: true, contractId: contract.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function getContractByReservationAction(input: unknown) {
  const parsed = contractByReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_VIEW);
    const contract = await getContractByReservationService({ ...context, reservationId: parsed.data.reservationId });
    return { success: true as const, contract: mapContractToUi(contract) };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function getContractAction(input: unknown) {
  const parsed = contractIdSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_VIEW);
    const contract = await getContractService({ ...context, contractId: parsed.data.contractId });
    return { success: true as const, contract: mapContractToUi(contract) };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function upsertContractTemplateAction(input: unknown): Promise<ContractActionResult> {
  const parsed = upsertContractTemplateSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.SETTINGS_CONTRACT_TEMPLATE_MANAGE);
    if (parsed.data.templateId) {
      await updateContractTemplateService({
        context,
        templateId: parsed.data.templateId,
        data: { ...parsed.data, body: parsed.data.body as Prisma.InputJsonValue },
      });
      revalidateContractPaths();
      return { success: true, contractId: parsed.data.templateId };
    }
    const result = await createContractTemplateService({
      context,
      template: {
        name: parsed.data.name,
        content: parsed.data.content,
        version: 1,
        isDefault: parsed.data.isDefault ?? true,
        isActive: parsed.data.isActive ?? true,
      },
      version: { versionNumber: 1, body: parsed.data.body as Prisma.InputJsonValue },
    });
    revalidateContractPaths();
    return { success: true, contractId: result.template.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function listContractTemplatesAction() {
  try {
    const context = await getActionContext(PERMISSIONS.SETTINGS_CONTRACT_TEMPLATE_MANAGE);
    const templates = await listContractTemplatesService({ ...context, includeInactive: true });
    return { success: true as const, templates };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createContractInspectionItemAction(input: unknown): Promise<ContractActionResult> {
  const parsed = createContractInspectionItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    await createInspectionItemService({ context, data: parsed.data });
    revalidateContractPaths();
    return { success: true, contractId: parsed.data.contractId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateContractInspectionItemAction(input: unknown): Promise<ContractActionResult> {
  const parsed = updateContractInspectionItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    await updateInspectionItemService({
      context,
      contractId: parsed.data.contractId,
      itemId: parsed.data.itemId,
      data: {
        zone: parsed.data.zone,
        notes: parsed.data.notes,
        photoUrl: parsed.data.photoUrl,
      },
    });
    revalidateContractPaths();
    return { success: true, contractId: parsed.data.contractId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createContractSignatureAction(input: unknown): Promise<ContractActionResult> {
  const parsed = createContractSignatureSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    await createContractSignatureService({
      context,
      contractId: parsed.data.contractId,
      data: {
        ...parsed.data,
        signedAt: parsed.data.signedAt ?? new Date(),
      },
    });
    revalidateContractPaths();
    return { success: true, contractId: parsed.data.contractId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteContractAction(input: unknown): Promise<ContractActionResult> {
  const parsed = contractIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    await deleteContractService({ ...context, contractId: parsed.data.contractId });
    revalidateContractPaths();
    return { success: true, contractId: parsed.data.contractId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function listContractDocumentsAction(input: unknown) {
  const parsed = contractIdSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, messageKey: "contracts.upload.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_VIEW);
    await getContractService({ ...context, contractId: parsed.data.contractId });
    const documents = await listDocumentsByEntityService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      entityType: "contract",
      entityId: parsed.data.contractId,
    });
    return {
      success: true as const,
      documents: documents.map((document) => ({
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        storageUrl: document.storageUrl,
        createdAt: document.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function uploadContractDocumentAction(formData: FormData): Promise<ContractUploadResult> {
  const contractId = String(formData.get("contractId") ?? "");
  const parsed = contractIdSchema.safeParse({ contractId });
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File)) return { success: false, messageKey: "contracts.upload.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    await getContractService({ ...context, contractId });
    const upload = await uploadFileService({
      file,
      kind: "document",
      folder: `contracts/${contractId}`,
    });
    const document = await createDocumentMetadataService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      userId: context.userId,
      data: {
        entityType: "contract",
        entityId: contractId,
        filename: file.name,
        mimeType: upload.mimeType,
        sizeBytes: upload.size,
        storageUrl: upload.url,
      },
    });
    revalidateContractPaths();
    return { success: true, upload, documentId: document.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForUploadError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteContractDocumentAction(input: unknown): Promise<ContractActionResult> {
  const parsed = contractIdSchema.extend({ documentId: contractIdSchema.shape.contractId }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "contracts.upload.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.CONTRACTS_CREATE);
    await getContractService({ ...context, contractId: parsed.data.contractId });
    await deleteDocumentService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      userId: context.userId,
      documentId: parsed.data.documentId,
    });
    revalidateContractPaths();
    return { success: true, contractId: parsed.data.contractId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForUploadError(error), code: isAppError(error) ? error.code : undefined };
  }
}
