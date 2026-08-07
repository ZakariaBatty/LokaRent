import { z } from "zod";
import {
  availabilityBlockReasonSchema,
  createAvailabilityBlockSchema,
  createVehicleInspectionSchema,
  createVehicleInsuranceSchema,
  createVehicleMaintenanceSchema,
  fuelTypeSchema,
  insuranceCoverageTypeSchema,
  inspectionResultSchema,
  maintenanceStatusSchema,
  transmissionSchema,
  vehicleStatusSchema,
} from "./create-car.schema";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const requiredText = z.string().trim().min(1);
const optionalAmount = z.coerce.number().nonnegative().optional();
const optionalDate = z.coerce.date().optional();
const vehiclePhotoSchema = z.object({
  url: requiredText,
  publicId: optionalText,
  mimeType: optionalText,
  sizeBytes: z.coerce.number().int().nonnegative().optional(),
});

export const vehicleIdSchema = z.object({
  vehicleId: z.string().uuid(),
});

export const updateVehicleSchema = z.object({
  vehicleId: z.string().uuid(),
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
  status: vehicleStatusSchema,
  notes: optionalText,
  mileage: z.coerce.number().int().nonnegative().optional(),
  dailyRate: optionalAmount,
  weeklyRate: optionalAmount,
  monthlyRate: optionalAmount,
  depositAmount: optionalAmount,
  mileageLimit: z.coerce.number().int().nonnegative().optional(),
  extraMileageRate: optionalAmount,
  pricingCurrency: optionalText,
  pricingValidFrom: optionalDate,
  pricingValidTo: optionalDate,
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
  photos: z.array(vehiclePhotoSchema).max(6).optional(),
});

export const updateVehicleCategorySchema = z.object({
  categoryId: z.string().uuid(),
  name: requiredText,
});

export const updateVehicleInsuranceSchema = createVehicleInsuranceSchema
  .omit({ vehicleId: true })
  .extend({
    insuranceId: z.string().uuid(),
    coverageType: insuranceCoverageTypeSchema.optional(),
  });

export const updateVehicleInspectionSchema = createVehicleInspectionSchema
  .omit({ vehicleId: true })
  .extend({
    inspectionId: z.string().uuid(),
    result: inspectionResultSchema,
  });

export const updateVehicleMaintenanceSchema = createVehicleMaintenanceSchema
  .omit({ vehicleId: true })
  .extend({
    maintenanceId: z.string().uuid(),
    status: maintenanceStatusSchema,
  });

export const updateAvailabilityBlockSchema = createAvailabilityBlockSchema
  .omit({ vehicleId: true })
  .extend({
    blockId: z.string().uuid(),
    reason: availabilityBlockReasonSchema,
  });

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
