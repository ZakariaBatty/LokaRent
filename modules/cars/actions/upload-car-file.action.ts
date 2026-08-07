"use server";

import { isAppError } from "@/shared/errors";
import { uploadFileService, type UploadResult } from "@/shared/storage";

type UploadActionResult =
  | { success: true; upload: UploadResult }
  | { success: false; messageKey: string; code?: string };

function messageKeyForUploadError(error: unknown) {
  if (!isAppError(error)) return "fleet.upload.errors.generic";
  if (error.message === "UPLOAD_FILE_TOO_LARGE") return "fleet.upload.errors.fileTooLarge";
  if (error.message === "UPLOAD_UNSUPPORTED_FILE_TYPE") return "fleet.upload.errors.unsupportedFile";
  if (error.message === "UPLOAD_PROVIDER_NOT_CONFIGURED") return "fleet.upload.errors.providerNotConfigured";
  return "fleet.upload.errors.generic";
}

export async function uploadCarDocumentAction(formData: FormData): Promise<UploadActionResult> {
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File) || typeof folder !== "string") {
    return { success: false, messageKey: "fleet.upload.errors.validation" };
  }

  try {
    const upload = await uploadFileService({
      file,
      kind: "document",
      folder,
    });
    return { success: true, upload };
  } catch (error) {
    return {
      success: false,
      messageKey: messageKeyForUploadError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}

export async function uploadCarImageAction(formData: FormData): Promise<UploadActionResult> {
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File) || typeof folder !== "string") {
    return { success: false, messageKey: "fleet.upload.errors.validation" };
  }

  try {
    const upload = await uploadFileService({
      file,
      kind: "image",
      folder,
    });
    return { success: true, upload };
  } catch (error) {
    return {
      success: false,
      messageKey: messageKeyForUploadError(error),
      code: isAppError(error) ? error.code : undefined,
    };
  }
}
