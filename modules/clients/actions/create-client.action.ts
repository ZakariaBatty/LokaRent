"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  blacklistCustomerService,
  createBusinessCustomerService,
  createCustomerContactService,
  createCustomerDocumentService,
  createIndividualCustomerService,
  deleteCustomerContactService,
  deleteCustomerDocumentService,
  deleteCustomerService,
  liftCustomerBlacklistService,
  restoreCustomerService,
  updateBusinessCustomerService,
  updateCustomerContactService,
  updateCustomerDocumentService,
  updateIndividualCustomerService,
  type CustomerServiceContext,
} from "../services/clients.service";
import { createClientSchema } from "../validators/create-client.schema";
import {
  blacklistClientSchema,
  clientIdSchema,
  customerContactSchema,
  customerDocumentSchema,
  liftBlacklistClientSchema,
  updateClientSchema,
} from "../validators/update-client.schema";

export type ClientActionResult =
  | { success: true; customerId?: string }
  | { success: false; messageKey: string; code?: string };

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "clients.errors.generic";
  if (error.code === "FORBIDDEN") return "clients.errors.forbidden";
  if (error.code === "PLAN_LIMIT_EXCEEDED") return "clients.errors.planLimitExceeded";
  if (error.code === "NOT_FOUND") return "clients.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "CLIENT_DUPLICATE_CONTACT") return "clients.errors.duplicateContact";
    if (error.message === "CLIENT_TYPE_CHANGE_NOT_ALLOWED") return "clients.errors.typeChangeNotAllowed";
    if (error.message === "CLIENT_DELETE_BLOCKED_BY_ACTIVE_RECORDS") {
      return "clients.errors.deleteBlockedByActiveRecords";
    }
    if (error.message === "CLIENT_ALREADY_BLACKLISTED") return "clients.errors.alreadyBlacklisted";
    if (error.message === "CLIENT_INDIVIDUAL_NAME_REQUIRED") return "clients.errors.individualNameRequired";
    return "clients.errors.validation";
  }
  return "clients.errors.generic";
}

async function getActionContext(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(permission, context);
  const serviceContext: CustomerServiceContext = {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  };
  return serviceContext;
}

export async function createClientAction(input: unknown): Promise<ClientActionResult> {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_CREATE);
    const customer =
      parsed.data.type === "individual"
        ? await createIndividualCustomerService({ context, ...parsed.data })
        : await createBusinessCustomerService({ context, ...parsed.data });
    revalidatePath("/clients");
    return { success: true, customerId: customer.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateClientAction(input: unknown): Promise<ClientActionResult> {
  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_EDIT);
    if (parsed.data.type === "individual") {
      await updateIndividualCustomerService({ context, ...parsed.data });
    } else {
      await updateBusinessCustomerService({ context, ...parsed.data });
    }
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteClientAction(input: unknown): Promise<ClientActionResult> {
  const parsed = clientIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_DELETE);
    await deleteCustomerService({ ...context, customerId: parsed.data.customerId });
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function restoreClientAction(input: unknown): Promise<ClientActionResult> {
  const parsed = clientIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_DELETE);
    await restoreCustomerService({ ...context, customerId: parsed.data.customerId });
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function upsertClientContactAction(input: unknown): Promise<ClientActionResult> {
  const parsed = customerContactSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_EDIT);
    const { contactId, customerId, ...data } = parsed.data;
    if (parsed.data.contactId) {
      await updateCustomerContactService({
        context,
        customerId,
        contactId: parsed.data.contactId,
        data,
      });
    } else {
      await createCustomerContactService({
        context,
        customerId,
        data,
      });
    }
    revalidatePath("/clients");
    return { success: true, customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteClientContactAction(input: unknown): Promise<ClientActionResult> {
  const parsed = customerContactSchema.pick({ customerId: true, contactId: true }).required({ contactId: true }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_EDIT);
    await deleteCustomerContactService({
      context,
      customerId: parsed.data.customerId,
      contactId: parsed.data.contactId,
    });
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function upsertClientDocumentAction(input: unknown): Promise<ClientActionResult> {
  const parsed = customerDocumentSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_EDIT);
    const { documentId, customerId, ...data } = parsed.data;
    if (parsed.data.documentId) {
      await updateCustomerDocumentService({
        context,
        customerId,
        documentId: parsed.data.documentId,
        data,
      });
    } else {
      await createCustomerDocumentService({
        context,
        customerId,
        data,
      });
    }
    revalidatePath("/clients");
    return { success: true, customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteClientDocumentAction(input: unknown): Promise<ClientActionResult> {
  const parsed = customerDocumentSchema.pick({ customerId: true, documentId: true }).required({ documentId: true }).safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_EDIT);
    await deleteCustomerDocumentService({
      context,
      customerId: parsed.data.customerId,
      documentId: parsed.data.documentId,
    });
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function blacklistClientAction(input: unknown): Promise<ClientActionResult> {
  const parsed = blacklistClientSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_BLACKLIST);
    await blacklistCustomerService({
      context,
      customerId: parsed.data.customerId,
      data: { reason: parsed.data.reason, severity: parsed.data.severity },
    });
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function liftClientBlacklistAction(input: unknown): Promise<ClientActionResult> {
  const parsed = liftBlacklistClientSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "clients.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.CLIENTS_BLACKLIST);
    await liftCustomerBlacklistService({
      context,
      customerId: parsed.data.customerId,
      blacklistId: parsed.data.blacklistId,
      liftReason: parsed.data.liftReason,
    });
    revalidatePath("/clients");
    return { success: true, customerId: parsed.data.customerId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}
