import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const requiredText = z.string().trim().min(1);

export const updateIndividualClientSchema = z.object({
  customerId: z.string().uuid(),
  type: z.literal("individual"),
  fullName: requiredText,
  phone: requiredText,
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  city: optionalText,
  notes: optionalText,
  status: z.enum(["active", "inactive", "blacklisted"]).optional(),
  nationality: optionalText,
  idType: z.enum(["CIN", "Passeport"]).optional(),
  idNumber: optionalText,
  licenseNumber: optionalText,
  licenseExpiresAt: z.coerce.date().optional(),
});

export const updateCompanyClientSchema = z.object({
  customerId: z.string().uuid(),
  type: z.literal("company"),
  companyName: requiredText,
  phone: requiredText,
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  city: optionalText,
  notes: optionalText,
  status: z.enum(["active", "inactive", "blacklisted"]).optional(),
  registrationNumber: optionalText,
  taxId: optionalText,
  contactPersonName: optionalText,
  contactPersonPhone: optionalText,
});

export const updateClientSchema = z.discriminatedUnion("type", [
  updateIndividualClientSchema,
  updateCompanyClientSchema,
]);

export const clientIdSchema = z.object({
  customerId: z.string().uuid(),
});

export const customerContactSchema = z.object({
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  type: z.enum(["phone", "email", "whatsapp"]),
  value: requiredText,
  isPrimary: z.boolean().default(false),
});

export const customerDocumentSchema = z.object({
  customerId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  type: z.enum(["passport", "national_id", "driving_license", "residence_permit"]),
  documentNumber: requiredText,
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  issuingCountry: optionalText,
  documentUrl: optionalText,
});

export const blacklistClientSchema = z.object({
  customerId: z.string().uuid(),
  reason: requiredText,
  severity: z.enum(["warning", "blocked", "permanent"]).default("blocked"),
});

export const liftBlacklistClientSchema = z.object({
  customerId: z.string().uuid(),
  blacklistId: z.string().uuid(),
  liftReason: optionalText,
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CustomerContactInput = z.infer<typeof customerContactSchema>;
export type CustomerDocumentInput = z.infer<typeof customerDocumentSchema>;
