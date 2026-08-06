import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => value || undefined);

export const completeOnboardingSchema = z.object({
  company: z.object({
    legalName: z.string().trim().min(2).max(120),
    logoUrl: optionalUrl,
    phone: z.string().trim().min(8).max(30),
    address: z.string().trim().min(2).max(500),
    countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
    timezone: z.string().trim().min(2).max(80),
    currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  }),
  agency: z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(12).transform((value) => value.toUpperCase()),
    phone: z.string().trim().min(8).max(30),
    email: z.string().trim().email().optional().or(z.literal("")).transform((value) => value || undefined),
    address: z.string().trim().min(2).max(500),
    isPrimaryConfirmed: z.boolean(),
  }),
  preferences: z.object({
    invoicePrefix: z.string().trim().min(1).max(12),
    reservationPrefix: z.string().trim().min(1).max(12),
    contractPrefix: z.string().trim().min(1).max(12),
    taxRate: z.coerce.number().min(0).max(100),
    defaultLanguage: z.enum(["fr", "en"]),
    emailNotifications: z.boolean(),
    whatsappNotifications: z.boolean(),
  }),
  optionalData: z.object({
    vehicles: z
      .array(
        z.object({
          brand: z.string().trim().max(80),
          model: z.string().trim().max(80),
          year: z.coerce.number().int().min(1980).max(2100).optional(),
          plate: z.string().trim().max(40),
          category: z.string().trim().max(80),
          dailyPrice: z.coerce.number().min(0).optional(),
        }),
      )
      .max(3),
    customer: z.object({
      fullName: z.string().trim().max(160),
      phone: z.string().trim().max(30),
      email: z.string().trim().email().optional().or(z.literal("")).transform((value) => value || undefined),
    }),
  }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
