"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@lokarent/db";
import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  createAvailabilityBlockService,
  createVehicleCategoryService,
  createVehicleInspectionService,
  createVehicleInsuranceService,
  createVehicleMaintenanceService,
  createVehicleMileageLogService,
  createCurrentVehiclePricingRuleService,
  createVehicleRegistrationService,
  createVehicleService,
  createVehicleVignetteService,
  deactivateVehicleService,
  getVehicleService,
  listVehicleCategoriesService,
  replaceVehiclePhotosService,
  restoreVehicleService,
  updateAvailabilityBlockService,
  updateVehicleInspectionService,
  updateVehicleInsuranceService,
  updateVehicleMaintenanceService,
  updateVehicleVignetteService,
  updateVehicleService,
  type FleetServiceContext,
} from "../services/cars.service";
import {
  createAvailabilityBlockSchema,
  createVehicleCategorySchema,
  createVehicleInspectionSchema,
  createVehicleInsuranceSchema,
  createVehicleMaintenanceSchema,
  createVehicleMileageLogSchema,
  createVehiclePricingRuleSchema,
  createVehicleRegistrationSchema,
  createVehicleSchema,
  createVehicleVignetteSchema,
} from "../validators/create-car.schema";
import {
  updateAvailabilityBlockSchema,
  updateVehicleInspectionSchema,
  updateVehicleInsuranceSchema,
  updateVehicleMaintenanceSchema,
  updateVehicleSchema,
  vehicleIdSchema,
} from "../validators/update-car.schema";

export type CarActionResult =
  | { success: true; vehicleId?: string }
  | { success: false; messageKey: string; code?: string };

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "fleet.errors.generic";
  if (error.code === "FORBIDDEN") return "fleet.errors.forbidden";
  if (error.code === "PLAN_LIMIT_EXCEEDED") return "fleet.errors.planLimitExceeded";
  if (error.code === "NOT_FOUND") return "fleet.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "FLEET_DUPLICATE_PLATE") return "fleet.errors.duplicatePlate";
    if (error.message === "FLEET_DUPLICATE_CODE") return "fleet.errors.duplicateCode";
    if (error.message === "FLEET_INVALID_STATUS_TRANSITION") return "fleet.errors.invalidStatusTransition";
    if (error.message === "FLEET_MILEAGE_CANNOT_DECREASE") return "fleet.errors.mileageCannotDecrease";
    if (error.message === "FLEET_DELETE_BLOCKED_BY_ACTIVE_RECORDS") return "fleet.errors.deleteBlocked";
    if (error.message === "FLEET_CATEGORY_IN_USE") return "fleet.errors.categoryInUse";
    if (error.message === "FLEET_INVALID_AVAILABILITY_BLOCK_DATES") return "fleet.errors.invalidAvailabilityDates";
    if (error.message === "FLEET_PRICING_INVALID_TARGET") return "fleet.errors.invalidPricingTarget";
    if (error.message === "FLEET_PRICING_INVALID_DATES") return "fleet.errors.invalidPricingDates";
    if (error.message === "FLEET_PRICING_EMPTY") return "fleet.errors.emptyPricingRule";
    if (error.message === "FLEET_PHOTOS_LIMIT_EXCEEDED") return "fleet.errors.photoLimitExceeded";
    return "fleet.errors.validation";
  }
  return "fleet.errors.generic";
}

async function getActionContext(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(permission, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies FleetServiceContext;
}

function decimal(value?: number) {
  return value === undefined ? undefined : new Prisma.Decimal(value);
}

function hasPricingInput(input: {
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  depositAmount?: number;
  mileageLimit?: number;
  extraMileageRate?: number;
}) {
  return [
    input.dailyRate,
    input.weeklyRate,
    input.monthlyRate,
    input.depositAmount,
    input.mileageLimit,
    input.extraMileageRate,
  ].some((value) => value !== undefined);
}

function sameDate(left?: Date | string | null, right?: Date | string | null) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return new Date(left).toISOString().slice(0, 10) === new Date(right).toISOString().slice(0, 10);
}

function sameDecimal(left: unknown, right?: number) {
  if (left === null || left === undefined) return right === undefined;
  return Number(left) === Number(right ?? 0);
}

function sameText(left?: string | null, right?: string) {
  return (left ?? "") === (right ?? "");
}

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
const documentUrlValue = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url().optional().nullable(),
);
const updateVehicleDocumentSchema = z.discriminatedUnion("documentType", [
  z.object({
    vehicleId: z.string().uuid(),
    documentType: z.literal("insurance"),
    provider: z.string().trim().min(1),
    policyNumber: z.string().trim().min(1),
    startsAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    expiresAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    premiumAmount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    documentUrl: documentUrlValue,
  }),
  z.object({
    vehicleId: z.string().uuid(),
    documentType: z.literal("registration"),
    registrationNumber: z.string().trim().min(1),
    issuedAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    expiresAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    issuingAuthority: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    documentUrl: documentUrlValue,
  }),
  z.object({
    vehicleId: z.string().uuid(),
    documentType: z.literal("vignette"),
    taxYear: z.coerce.number().int().min(2000).max(2100),
    paidAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    expiresAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    amount: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    documentUrl: documentUrlValue,
  }),
  z.object({
    vehicleId: z.string().uuid(),
    documentType: z.literal("inspection"),
    inspectedAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    expiresAt: z.preprocess(emptyToUndefined, z.coerce.date()),
    result: z.enum(["pass", "fail", "conditional"]),
    center: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    cost: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
    documentUrl: documentUrlValue,
  }),
]);

async function resolveCategoryId(input: {
  companyId: string;
  categoryId?: string;
  categoryName?: string;
}) {
  if (input.categoryId) return input.categoryId;
  if (!input.categoryName) return undefined;
  const existing = (await listVehicleCategoriesService(input.companyId)).find(
    (category) => category.name === input.categoryName,
  );
  if (existing) return existing.id;
  return (await createVehicleCategoryService({ companyId: input.companyId, data: { name: input.categoryName } })).id;
}

export async function updateVehicleDocumentAction(input: unknown): Promise<CarActionResult> {
  const parsed = updateVehicleDocumentSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    const vehicle = await getVehicleService({ ...context, vehicleId: parsed.data.vehicleId });

    if (parsed.data.documentType === "insurance") {
      const current = vehicle.vehicleInsurances[0];
      const payload = {
        provider: parsed.data.provider,
        policyNumber: parsed.data.policyNumber,
        startsAt: parsed.data.startsAt,
        expiresAt: parsed.data.expiresAt,
        premiumAmount: decimal(parsed.data.premiumAmount),
        currency: "MAD",
        documentUrl: parsed.data.documentUrl,
      };
      if (current) {
        await updateVehicleInsuranceService({
          companyId: context.companyId,
          agencyId: context.agencyId,
          insuranceId: current.id,
          data: payload,
        });
      } else {
        await createVehicleInsuranceService({
          context,
          data: { ...payload, vehicleId: parsed.data.vehicleId },
        });
      }
    }

    if (parsed.data.documentType === "registration") {
      await createVehicleRegistrationService({
        context,
        data: {
          vehicleId: parsed.data.vehicleId,
          registrationNumber: parsed.data.registrationNumber,
          issuedAt: parsed.data.issuedAt,
          expiresAt: parsed.data.expiresAt,
          issuingAuthority: parsed.data.issuingAuthority,
          documentUrl: parsed.data.documentUrl ?? undefined,
        },
      });
    }

    if (parsed.data.documentType === "vignette") {
      const current = vehicle.vehicleVignettes[0];
      const payload = {
        taxYear: parsed.data.taxYear,
        paidAt: parsed.data.paidAt,
        expiresAt: parsed.data.expiresAt,
        amount: decimal(parsed.data.amount),
        currency: "MAD",
        documentUrl: parsed.data.documentUrl ?? undefined,
      };
      if (current?.taxYear === parsed.data.taxYear) {
        await updateVehicleVignetteService({
          companyId: context.companyId,
          agencyId: context.agencyId,
          vignetteId: current.id,
          data: payload,
        });
      } else {
        await createVehicleVignetteService({
          context,
          data: { ...payload, vehicleId: parsed.data.vehicleId },
        });
      }
    }

    if (parsed.data.documentType === "inspection") {
      const current = vehicle.vehicleInspections[0];
      const payload = {
        inspectedAt: parsed.data.inspectedAt,
        expiresAt: parsed.data.expiresAt,
        result: parsed.data.result,
        center: parsed.data.center,
        cost: decimal(parsed.data.cost),
        currency: "MAD",
        documentUrl: parsed.data.documentUrl,
      };
      if (current) {
        await updateVehicleInspectionService({
          companyId: context.companyId,
          agencyId: context.agencyId,
          inspectionId: current.id,
          data: payload,
        });
      } else {
        await createVehicleInspectionService({
          context,
          data: { ...payload, vehicleId: parsed.data.vehicleId },
        });
      }
    }

    revalidatePath("/cars");
    revalidatePath("/finances");
    revalidatePath("/reports");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createCarAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.FLEET_CREATE);
    const {
      mileage,
      categoryName,
      dailyRate,
      weeklyRate,
      monthlyRate,
      depositAmount,
      mileageLimit,
      extraMileageRate,
      pricingCurrency,
      pricingValidFrom,
      pricingValidTo,
      photos,
      ...data
    } = parsed.data;
    const category = await resolveCategoryId({
      companyId: context.companyId,
      categoryId: data.categoryId,
      categoryName,
    });
    if (!category) return { success: false, messageKey: "fleet.errors.validation" };

    const vehicle = await createVehicleService({
      context,
      data: {
        ...(data.code ? { code: data.code } : {}),
        categoryId: category,
        plate: data.plate,
        vin: data.vin,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
        fuelType: data.fuelType,
        transmission: data.transmission,
        seats: data.seats,
        status: data.status,
        notes: data.notes,
      },
    });
    if (mileage !== undefined) {
      await createVehicleMileageLogService({
        context,
        data: { vehicleId: vehicle.id, mileage, recordedAt: new Date(), source: "manual" },
      });
    }
    if (photos !== undefined) {
      await replaceVehiclePhotosService({
        context,
        vehicleId: vehicle.id,
        photos,
      });
    }
    if (hasPricingInput({ dailyRate, weeklyRate, monthlyRate, depositAmount, mileageLimit, extraMileageRate })) {
      await createCurrentVehiclePricingRuleService({
        context,
        data: {
          vehicleId: vehicle.id,
          dailyRate: decimal(dailyRate),
          weeklyRate: decimal(weeklyRate),
          monthlyRate: decimal(monthlyRate),
          depositAmount: decimal(depositAmount),
          mileageLimit,
          extraMileageRate: decimal(extraMileageRate),
          currency: pricingCurrency ?? "MAD",
          validFrom: pricingValidFrom ?? new Date(),
          validTo: pricingValidTo,
        },
      });
    }
    if (data.insuranceProvider && data.insurancePolicyNumber && data.insuranceStartsAt && data.insuranceExpiresAt) {
      await createVehicleInsuranceService({
        context,
        data: {
          vehicleId: vehicle.id,
          provider: data.insuranceProvider,
          policyNumber: data.insurancePolicyNumber,
          coverageType: data.insuranceCoverageType,
          startsAt: data.insuranceStartsAt,
          expiresAt: data.insuranceExpiresAt,
          premiumAmount: decimal(data.insurancePremiumAmount),
          currency: data.insuranceCurrency ?? "MAD",
          documentUrl: data.insuranceDocumentUrl,
        },
      });
    }
    if (data.registrationNumber && data.registrationExpiresAt) {
      await createVehicleRegistrationService({
        context,
        data: {
          vehicleId: vehicle.id,
          registrationNumber: data.registrationNumber,
          issuedAt: data.registrationIssuedAt,
          expiresAt: data.registrationExpiresAt,
          issuingAuthority: data.registrationIssuingAuthority,
          documentUrl: data.registrationDocumentUrl,
        },
      });
    }
    if (data.vignetteTaxYear && data.vignettePaidAt && data.vignetteExpiresAt) {
      await createVehicleVignetteService({
        context,
        data: {
          vehicleId: vehicle.id,
          taxYear: data.vignetteTaxYear,
          paidAt: data.vignettePaidAt,
          expiresAt: data.vignetteExpiresAt,
          amount: decimal(data.vignetteAmount),
          currency: data.vignetteCurrency ?? "MAD",
          documentUrl: data.vignetteDocumentUrl,
        },
      });
    }
    if (data.inspectionInspectedAt && data.inspectionExpiresAt) {
      await createVehicleInspectionService({
        context,
        data: {
          vehicleId: vehicle.id,
          inspectedAt: data.inspectionInspectedAt,
          expiresAt: data.inspectionExpiresAt,
          result: data.inspectionResult ?? "pass",
          center: data.inspectionCenter,
          cost: decimal(data.inspectionCost),
          currency: data.inspectionCurrency ?? "MAD",
          documentUrl: data.inspectionDocumentUrl,
        },
      });
    }
    revalidatePath("/cars");
    return { success: true, vehicleId: vehicle.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateCarAction(input: unknown): Promise<CarActionResult> {
  const parsed = updateVehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    const {
      vehicleId,
      mileage,
      categoryName,
      dailyRate,
      weeklyRate,
      monthlyRate,
      depositAmount,
      mileageLimit,
      extraMileageRate,
      pricingCurrency,
      pricingValidFrom,
      pricingValidTo,
      photos,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceCoverageType,
      insuranceStartsAt,
      insuranceExpiresAt,
      insurancePremiumAmount,
      insuranceCurrency,
      insuranceDocumentUrl,
      registrationNumber,
      registrationIssuedAt,
      registrationExpiresAt,
      registrationIssuingAuthority,
      registrationDocumentUrl,
      vignetteTaxYear,
      vignettePaidAt,
      vignetteExpiresAt,
      vignetteAmount,
      vignetteCurrency,
      vignetteDocumentUrl,
      inspectionInspectedAt,
      inspectionExpiresAt,
      inspectionResult,
      inspectionCenter,
      inspectionCost,
      inspectionCurrency,
      inspectionDocumentUrl,
      ...data
    } = parsed.data;
    const category = await resolveCategoryId({
      companyId: context.companyId,
      categoryId: data.categoryId,
      categoryName,
    });
    if (!category) return { success: false, messageKey: "fleet.errors.validation" };
    const existing = await getVehicleService({ ...context, vehicleId });

    await updateVehicleService({
      context,
      vehicleId,
      data: { ...data, categoryId: category },
    });
    if (mileage !== undefined) {
      await createVehicleMileageLogService({
        context,
        data: { vehicleId, mileage, recordedAt: new Date(), source: "manual" },
      });
    }
    if (photos !== undefined) {
      await replaceVehiclePhotosService({
        context,
        vehicleId,
        photos,
      });
    }
    if (hasPricingInput({ dailyRate, weeklyRate, monthlyRate, depositAmount, mileageLimit, extraMileageRate })) {
      await createCurrentVehiclePricingRuleService({
        context,
        data: {
          vehicleId,
          dailyRate: decimal(dailyRate),
          weeklyRate: decimal(weeklyRate),
          monthlyRate: decimal(monthlyRate),
          depositAmount: decimal(depositAmount),
          mileageLimit,
          extraMileageRate: decimal(extraMileageRate),
          currency: pricingCurrency ?? "MAD",
          validFrom: pricingValidFrom ?? new Date(),
          validTo: pricingValidTo,
        },
      });
    }
    if (insuranceProvider && insurancePolicyNumber && insuranceStartsAt && insuranceExpiresAt) {
      const current = existing.vehicleInsurances[0];
      const changed =
        !current ||
        !sameText(current.provider, insuranceProvider) ||
        !sameText(current.policyNumber, insurancePolicyNumber) ||
        current.coverageType !== (insuranceCoverageType ?? null) ||
        !sameDate(current.startsAt, insuranceStartsAt) ||
        !sameDate(current.expiresAt, insuranceExpiresAt) ||
        !sameDecimal(current.premiumAmount, insurancePremiumAmount) ||
        !sameText(current.currency, insuranceCurrency ?? "MAD") ||
        !sameText(current.documentUrl, insuranceDocumentUrl);
      if (changed) {
        await createVehicleInsuranceService({
          context,
          data: {
            vehicleId,
            provider: insuranceProvider,
            policyNumber: insurancePolicyNumber,
            coverageType: insuranceCoverageType,
            startsAt: insuranceStartsAt,
            expiresAt: insuranceExpiresAt,
            premiumAmount: decimal(insurancePremiumAmount),
            currency: insuranceCurrency ?? "MAD",
            documentUrl: insuranceDocumentUrl,
          },
        });
      }
    }
    if (registrationNumber && registrationExpiresAt) {
      const current = existing.vehicleRegistrations[0];
      const changed =
        !current ||
        !sameText(current.registrationNumber, registrationNumber) ||
        !sameDate(current.issuedAt, registrationIssuedAt) ||
        !sameDate(current.expiresAt, registrationExpiresAt) ||
        !sameText(current.issuingAuthority, registrationIssuingAuthority) ||
        !sameText(current.documentUrl, registrationDocumentUrl);
      if (changed) {
        await createVehicleRegistrationService({
          context,
          data: {
            vehicleId,
            registrationNumber,
            issuedAt: registrationIssuedAt,
            expiresAt: registrationExpiresAt,
            issuingAuthority: registrationIssuingAuthority,
            documentUrl: registrationDocumentUrl,
          },
        });
      }
    }
    if (vignetteTaxYear && vignettePaidAt && vignetteExpiresAt) {
      const current = existing.vehicleVignettes[0];
      const changed =
        !current ||
        current.taxYear !== vignetteTaxYear ||
        !sameDate(current.paidAt, vignettePaidAt) ||
        !sameDate(current.expiresAt, vignetteExpiresAt) ||
        !sameDecimal(current.amount, vignetteAmount) ||
        !sameText(current.currency, vignetteCurrency ?? "MAD") ||
        !sameText(current.documentUrl, vignetteDocumentUrl);
      if (changed && current?.taxYear === vignetteTaxYear) {
        await updateVehicleVignetteService({
          companyId: context.companyId,
          agencyId: context.agencyId,
          vignetteId: current.id,
          data: {
            taxYear: vignetteTaxYear,
            paidAt: vignettePaidAt,
            expiresAt: vignetteExpiresAt,
            amount: decimal(vignetteAmount),
            currency: vignetteCurrency ?? "MAD",
            documentUrl: vignetteDocumentUrl,
          },
        });
      } else if (changed) {
        await createVehicleVignetteService({
          context,
          data: {
            vehicleId,
            taxYear: vignetteTaxYear,
            paidAt: vignettePaidAt,
            expiresAt: vignetteExpiresAt,
            amount: decimal(vignetteAmount),
            currency: vignetteCurrency ?? "MAD",
            documentUrl: vignetteDocumentUrl,
          },
        });
      }
    }
    if (inspectionInspectedAt && inspectionExpiresAt) {
      const current = existing.vehicleInspections[0];
      const nextResult = inspectionResult ?? "pass";
      const changed =
        !current ||
        !sameDate(current.inspectedAt, inspectionInspectedAt) ||
        !sameDate(current.expiresAt, inspectionExpiresAt) ||
        current.result !== nextResult ||
        !sameText(current.center, inspectionCenter) ||
        !sameDecimal(current.cost, inspectionCost) ||
        !sameText(current.currency, inspectionCurrency ?? "MAD") ||
        !sameText(current.documentUrl, inspectionDocumentUrl);
      if (changed) {
        await createVehicleInspectionService({
          context,
          data: {
            vehicleId,
            inspectedAt: inspectionInspectedAt,
            expiresAt: inspectionExpiresAt,
            result: nextResult,
            center: inspectionCenter,
            cost: decimal(inspectionCost),
            currency: inspectionCurrency ?? "MAD",
            documentUrl: inspectionDocumentUrl,
          },
        });
      }
    }
    revalidatePath("/cars");
    return { success: true, vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteCarAction(input: unknown): Promise<CarActionResult> {
  const parsed = vehicleIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_DELETE);
    await deactivateVehicleService({ ...context, vehicleId: parsed.data.vehicleId });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function restoreCarAction(input: unknown): Promise<CarActionResult> {
  const parsed = vehicleIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_DELETE);
    await restoreVehicleService({ ...context, vehicleId: parsed.data.vehicleId });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleCategoryAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleCategorySchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_CREATE);
    await createVehicleCategoryService({ companyId: context.companyId, data: parsed.data });
    revalidatePath("/cars");
    return { success: true };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehiclePricingRuleAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehiclePricingRuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createCurrentVehiclePricingRuleService({
      context,
      data: {
        vehicleId: parsed.data.vehicleId,
        vehicleCategoryId: parsed.data.vehicleCategoryId,
        dailyRate: decimal(parsed.data.dailyRate),
        weeklyRate: decimal(parsed.data.weeklyRate),
        monthlyRate: decimal(parsed.data.monthlyRate),
        depositAmount: decimal(parsed.data.depositAmount),
        mileageLimit: parsed.data.mileageLimit,
        extraMileageRate: decimal(parsed.data.extraMileageRate),
        currency: parsed.data.currency,
        validFrom: parsed.data.validFrom,
        validTo: parsed.data.validTo,
      },
    });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleInsuranceAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleInsuranceSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createVehicleInsuranceService({
      context,
      data: { ...parsed.data, premiumAmount: decimal(parsed.data.premiumAmount) },
    });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleRegistrationAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleRegistrationSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createVehicleRegistrationService({ context, data: parsed.data });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleVignetteAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleVignetteSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createVehicleVignetteService({
      context,
      data: { ...parsed.data, amount: decimal(parsed.data.amount) },
    });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleInspectionAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleInspectionSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createVehicleInspectionService({
      context,
      data: { ...parsed.data, cost: decimal(parsed.data.cost) },
    });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleMileageLogAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleMileageLogSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createVehicleMileageLogService({ context, data: parsed.data });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createVehicleMaintenanceAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleMaintenanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_MAINTENANCE_CREATE);
    await createVehicleMaintenanceService({
      context,
      data: { ...parsed.data, cost: decimal(parsed.data.cost) },
    });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createAvailabilityBlockAction(input: unknown): Promise<CarActionResult> {
  const parsed = createAvailabilityBlockSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_MAINTENANCE_CREATE);
    await createAvailabilityBlockService({ context, data: parsed.data });
    revalidatePath("/cars");
    return { success: true, vehicleId: parsed.data.vehicleId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateVehicleInsuranceAction(input: unknown): Promise<CarActionResult> {
  const parsed = updateVehicleInsuranceSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    const { insuranceId, ...data } = parsed.data;
    await updateVehicleInsuranceService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      insuranceId,
      data: { ...data, premiumAmount: decimal(data.premiumAmount) },
    });
    revalidatePath("/cars");
    return { success: true };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateVehicleInspectionAction(input: unknown): Promise<CarActionResult> {
  const parsed = updateVehicleInspectionSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    const { inspectionId, ...data } = parsed.data;
    await updateVehicleInspectionService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      inspectionId,
      data: { ...data, cost: decimal(data.cost) },
    });
    revalidatePath("/cars");
    return { success: true };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateVehicleMaintenanceAction(input: unknown): Promise<CarActionResult> {
  const parsed = updateVehicleMaintenanceSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_MAINTENANCE_CREATE);
    const { maintenanceId, ...data } = parsed.data;
    await updateVehicleMaintenanceService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      maintenanceId,
      data: { ...data, cost: decimal(data.cost) },
    });
    revalidatePath("/cars");
    return { success: true };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateAvailabilityBlockAction(input: unknown): Promise<CarActionResult> {
  const parsed = updateAvailabilityBlockSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_MAINTENANCE_CREATE);
    const { blockId, ...data } = parsed.data;
    await updateAvailabilityBlockService({
      companyId: context.companyId,
      agencyId: context.agencyId,
      blockId,
      data,
    });
    revalidatePath("/cars");
    return { success: true };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}
