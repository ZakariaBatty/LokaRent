import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const requiredText = z.string().trim().min(1);
const optionalDate = z.coerce.date().optional();
const optionalAmount = z.coerce.number().nonnegative().optional();
const optionalEmail = z
  .string()
  .trim()
  .email()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional()
  .or(z.literal("").transform(() => undefined));

export const driverStatusSchema = z.enum(["active", "inactive", "suspended"]);
export const driverPricingTypeSchema = z.enum(["monthly", "hourly", "mission"]);
export const driverDocumentTypeSchema = z.enum(["driving_license", "national_id", "contract", "other"]);

export const driverDocumentInputSchema = z.object({
  type: driverDocumentTypeSchema,
  documentNumber: optionalText,
  issuedAt: optionalDate,
  expiresAt: optionalDate,
  documentUrl: optionalText,
});

export const createDriverSchema = z.object({
  reference: optionalText,
  firstName: requiredText,
  lastName: requiredText,
  phone: optionalText,
  email: optionalEmail,
  status: driverStatusSchema.default("active"),
  notes: optionalText,
  pricingType: driverPricingTypeSchema.default("monthly"),
  monthlyRate: optionalAmount,
  hourlyRate: optionalAmount,
  missionRate: optionalAmount,
  pricingCurrency: optionalText,
  pricingValidFrom: optionalDate,
  documents: z.array(driverDocumentInputSchema).max(10).optional(),
});

export const createDriverPricingRuleSchema = z.object({
  driverId: z.string().uuid(),
  pricingType: driverPricingTypeSchema,
  monthlyRate: optionalAmount,
  hourlyRate: optionalAmount,
  missionRate: optionalAmount,
  currency: requiredText.length(3),
  validFrom: z.coerce.date(),
});

export const createDriverDocumentSchema = driverDocumentInputSchema.extend({
  driverId: z.string().uuid(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
