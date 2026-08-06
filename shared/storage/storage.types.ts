export type UploadKind = "image" | "document";

export type UploadInput = {
  file: File;
  kind: UploadKind;
  folder: string;
};

export type UploadResult = {
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
};

export type UploadProvider = {
  name: string;
  upload: (input: UploadInput & { filename: string; publicId: string }) => Promise<UploadResult>;
};
