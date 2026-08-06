import { createValidationError } from "@/shared/errors";
import { createId } from "@/shared/utils";
import type { UploadInput, UploadProvider, UploadResult } from "./storage.types";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOCUMENT_MIME_TYPES = new Set([...IMAGE_MIME_TYPES, "application/pdf"]);

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "application/pdf") return "pdf";
  return "bin";
}

function assertAllowedFile(input: UploadInput) {
  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw createValidationError("UPLOAD_FILE_TOO_LARGE", { maxBytes: MAX_UPLOAD_BYTES });
  }
  const allowed = input.kind === "image" ? IMAGE_MIME_TYPES : DOCUMENT_MIME_TYPES;
  if (!allowed.has(input.file.type)) {
    throw createValidationError("UPLOAD_UNSUPPORTED_FILE_TYPE", { mimeType: input.file.type });
  }
}

function safeFolder(folder: string) {
  return folder
    .split("/")
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"))
    .filter(Boolean)
    .join("/");
}

function developmentFakeUploadProvider(): UploadProvider {
  return {
    name: "development-fake",
    async upload(input) {
      return {
        url: `/uploads/dev/${input.publicId}.${extensionForMimeType(input.file.type)}`,
        publicId: input.publicId,
        mimeType: input.file.type,
        size: input.file.size,
      };
    },
  };
}

function cloudinaryUploadProvider(): UploadProvider {
  return {
    name: "cloudinary",
    async upload() {
      throw createValidationError("UPLOAD_PROVIDER_NOT_CONFIGURED");
    },
  };
}

function getUploadProvider() {
  return process.env.UPLOAD_PROVIDER === "cloudinary"
    ? cloudinaryUploadProvider()
    : developmentFakeUploadProvider();
}

export async function uploadFileService(input: UploadInput): Promise<UploadResult> {
  assertAllowedFile(input);
  const folder = safeFolder(input.folder);
  const id = createId().replace(/-/g, "");
  const extension = extensionForMimeType(input.file.type);
  const filename = `${id}.${extension}`;
  const publicId = [folder, id].filter(Boolean).join("/");

  return getUploadProvider().upload({ ...input, filename, publicId });
}
