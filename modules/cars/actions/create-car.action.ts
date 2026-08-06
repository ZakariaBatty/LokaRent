"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@lokarent/db";
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
  createVehicleRegistrationService,
  createVehicleService,
  createVehicleVignetteService,
  deactivateVehicleService,
  listVehicleCategoriesService,
  restoreVehicleService,
  updateAvailabilityBlockService,
  updateVehicleInspectionService,
  updateVehicleInsuranceService,
  updateVehicleMaintenanceService,
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

export async function createCarAction(input: unknown): Promise<CarActionResult> {
  const parsed = createVehicleSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "fleet.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.FLEET_CREATE);
    const { mileage, categoryName, ...data } = parsed.data;
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
    const { vehicleId, mileage, categoryName, ...data } = parsed.data;
    const category = await resolveCategoryId({
      companyId: context.companyId,
      categoryId: data.categoryId,
      categoryName,
    });
    if (!category) return { success: false, messageKey: "fleet.errors.validation" };

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
