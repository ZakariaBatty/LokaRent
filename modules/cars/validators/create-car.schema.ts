import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const requiredText = z.string().trim().min(1);
const optionalDate = z.coerce.date().optional();
const optionalAmount = z.coerce.number().nonnegative().optional();

export const vehicleStatusSchema = z.enum(["available", "rented", "maintenance", "inactive", "retired"]);
export const fuelTypeSchema = z.enum(["petrol", "diesel", "electric", "hybrid", "lpg"]);
export const transmissionSchema = z.enum(["manual", "automatic"]);
export const insuranceCoverageTypeSchema = z.enum(["third_party", "comprehensive", "fleet"]);
export const inspectionResultSchema = z.enum(["pass", "fail", "conditional"]);
export const mileageSourceSchema = z.enum(["contract_pickup", "contract_return", "maintenance", "manual"]);
export const maintenanceStatusSchema = z.enum(["scheduled", "in_progress", "completed", "cancelled"]);
export const availabilityBlockReasonSchema = z.enum(["maintenance", "personal_use", "hold", "other"]);

export const createVehicleSchema = z.object({
  code: optionalText,
  categoryId: z.string().uuid().optional(),
  categoryName: optionalText,
  brand: requiredText,
  model: requiredText,
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
  plate: requiredText.transform((value) => value.toUpperCase()),
  vin: optionalText,
  color: optionalText,
  fuelType: fuelTypeSchema,
  transmission: transmissionSchema.default("manual"),
  seats: z.coerce.number().int().min(1).max(99).optional(),
  status: vehicleStatusSchema.default("available"),
  notes: optionalText,
  mileage: z.coerce.number().int().nonnegative().optional(),
  insuranceProvider: optionalText,
  insurancePolicyNumber: optionalText,
  insuranceCoverageType: insuranceCoverageTypeSchema.optional(),
  insuranceStartsAt: optionalDate,
  insuranceExpiresAt: optionalDate,
  insurancePremiumAmount: optionalAmount,
  insuranceCurrency: optionalText,
  insuranceDocumentUrl: optionalText,
  registrationNumber: optionalText,
  registrationIssuedAt: optionalDate,
  registrationExpiresAt: optionalDate,
  registrationIssuingAuthority: optionalText,
  registrationDocumentUrl: optionalText,
  vignetteTaxYear: z.coerce.number().int().min(2000).max(2100).optional(),
  vignettePaidAt: optionalDate,
  vignetteExpiresAt: optionalDate,
  vignetteAmount: optionalAmount,
  vignetteCurrency: optionalText,
  vignetteDocumentUrl: optionalText,
  inspectionInspectedAt: optionalDate,
  inspectionExpiresAt: optionalDate,
  inspectionResult: inspectionResultSchema.optional(),
  inspectionCenter: optionalText,
  inspectionCost: optionalAmount,
  inspectionCurrency: optionalText,
  inspectionDocumentUrl: optionalText,
});

export const createVehicleCategorySchema = z.object({
  name: requiredText,
});

export const createVehicleInsuranceSchema = z.object({
  vehicleId: z.string().uuid(),
  provider: requiredText,
  policyNumber: requiredText,
  coverageType: insuranceCoverageTypeSchema.optional(),
  startsAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  premiumAmount: optionalAmount,
  currency: optionalText,
  documentUrl: optionalText,
});

export const createVehicleRegistrationSchema = z.object({
  vehicleId: z.string().uuid(),
  registrationNumber: requiredText,
  issuedAt: optionalDate,
  expiresAt: z.coerce.date(),
  issuingAuthority: optionalText,
  documentUrl: optionalText,
});

export const createVehicleVignetteSchema = z.object({
  vehicleId: z.string().uuid(),
  taxYear: z.coerce.number().int().min(2000).max(2100),
  paidAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  amount: optionalAmount,
  currency: optionalText,
  documentUrl: optionalText,
});

export const createVehicleInspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  inspectedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  result: inspectionResultSchema,
  center: optionalText,
  cost: optionalAmount,
  currency: optionalText,
  documentUrl: optionalText,
});

export const createVehicleMileageLogSchema = z.object({
  vehicleId: z.string().uuid(),
  mileage: z.coerce.number().int().nonnegative(),
  recordedAt: z.coerce.date().default(() => new Date()),
  source: mileageSourceSchema.default("manual"),
  referenceId: z.string().uuid().optional(),
});

export const createVehicleMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  status: maintenanceStatusSchema.default("scheduled"),
  type: requiredText,
  performedAt: z.coerce.date(),
  mileageAtService: z.coerce.number().int().nonnegative().optional(),
  description: optionalText,
  cost: optionalAmount,
  currencyCode: optionalText,
  provider: optionalText,
  nextDueAt: optionalDate,
  nextDueMileage: z.coerce.number().int().nonnegative().optional(),
});

export const createAvailabilityBlockSchema = z.object({
  vehicleId: z.string().uuid(),
  reason: availabilityBlockReasonSchema,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reservationId: z.string().uuid().optional(),
  notes: optionalText,
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
