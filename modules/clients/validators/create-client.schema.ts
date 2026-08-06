import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const requiredText = z.string().trim().min(1);

export const customerStatusSchema = z.enum(["active", "inactive", "blacklisted"]).default("active");

export const createIndividualClientSchema = z.object({
  type: z.literal("individual"),
  fullName: requiredText,
  phone: requiredText,
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  notes: optionalText,
  status: customerStatusSchema,
  nationality: optionalText,
  idType: z.enum(["CIN", "Passeport"]).optional(),
  idNumber: optionalText,
  licenseNumber: optionalText,
  licenseExpiresAt: z.coerce.date().optional(),
});

export const createCompanyClientSchema = z.object({
  type: z.literal("company"),
  companyName: requiredText,
  phone: requiredText,
  email: z.string().trim().email().optional().or(z.literal("").transform(() => undefined)),
  notes: optionalText,
  status: customerStatusSchema,
  registrationNumber: optionalText,
  taxId: optionalText,
  contactPersonName: optionalText,
  contactPersonPhone: optionalText,
});

export const createClientSchema = z.discriminatedUnion("type", [
  createIndividualClientSchema,
  createCompanyClientSchema,
]);

export type CreateClientInput = z.infer<typeof createClientSchema>;
