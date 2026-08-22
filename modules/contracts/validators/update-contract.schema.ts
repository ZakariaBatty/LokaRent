import { z } from "zod";

export const contractTemplateBodySchema = z.record(z.unknown());

export const upsertContractTemplateSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1),
  body: contractTemplateBodySchema,
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const updateContractInspectionItemSchema = z.object({
  contractId: z.string().uuid(),
  itemId: z.string().uuid(),
  zone: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});
