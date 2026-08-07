"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@lokarent/db";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import {
  createDriverPricingRuleService,
  createDriverService,
  deactivateDriverService,
  restoreDriverService,
  updateDriverService,
  upsertDriverDocumentByTypeService,
  type DriverActor,
} from "../services/drivers.service";
import {
  createDriverDocumentSchema,
  createDriverPricingRuleSchema,
  createDriverSchema,
  type CreateDriverInput,
} from "../validators/create-driver.schema";
import { driverIdSchema, updateDriverSchema } from "../validators/update-driver.schema";

export type DriverActionResult =
  | { success: true; driverId?: string }
  | { success: false; messageKey: string; code?: string };

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "drivers.errors.generic";
  if (error.code === "FORBIDDEN") return "drivers.errors.forbidden";
  if (error.code === "NOT_FOUND") return "drivers.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    if (error.message === "DRIVERS_INVALID_STATUS_TRANSITION") return "drivers.errors.invalidStatusTransition";
    if (error.message === "DRIVERS_PRICING_AMOUNT_REQUIRED") return "drivers.errors.pricingAmountRequired";
    if (error.message === "DRIVERS_DOCUMENT_INVALID_DATES") return "drivers.errors.invalidDocumentDates";
    if (error.message === "DRIVERS_DELETE_BLOCKED_BY_ACTIVE_ASSIGNMENTS") return "drivers.errors.deleteBlocked";
    return "drivers.errors.validation";
  }
  return "drivers.errors.generic";
}

async function getActionContext(permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) {
  const context = await requireCurrentAgencyContext();
  await requirePermission(permission, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies DriverActor & { companyId: string; agencyId: string };
}

function decimal(value?: number) {
  return value === undefined ? undefined : new Prisma.Decimal(value);
}

function hasPricingInput(input: { monthlyRate?: number; hourlyRate?: number; missionRate?: number }) {
  return [input.monthlyRate, input.hourlyRate, input.missionRate].some((value) => value !== undefined);
}

async function syncDriverDocuments(
  context: DriverActor & { companyId: string; agencyId: string },
  driverId: string,
  documents: NonNullable<CreateDriverInput["documents"]> = [],
) {
  await Promise.all(
    documents
      .filter((document) => document.documentNumber || document.expiresAt || document.issuedAt || document.documentUrl)
      .map((document) =>
        upsertDriverDocumentByTypeService({
          ...context,
          driverId,
          data: document,
        }),
      ),
  );
}

export async function createDriverAction(input: unknown): Promise<DriverActionResult> {
  const parsed = createDriverSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "drivers.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.FLEET_CREATE);
    const {
      pricingType,
      monthlyRate,
      hourlyRate,
      missionRate,
      pricingCurrency,
      pricingValidFrom,
      documents,
      ...data
    } = parsed.data;
    const driver = await createDriverService({ ...context, data });
    if (hasPricingInput({ monthlyRate, hourlyRate, missionRate })) {
      await createDriverPricingRuleService({
        ...context,
        driverId: driver.id,
        data: {
          pricingType,
          monthlyRate: decimal(pricingType === "monthly" ? monthlyRate : undefined),
          hourlyRate: decimal(pricingType === "hourly" ? hourlyRate : undefined),
          missionRate: decimal(pricingType === "mission" ? missionRate : undefined),
          currency: pricingCurrency ?? "MAD",
          validFrom: pricingValidFrom ?? new Date(),
        },
      });
    }
    await syncDriverDocuments(context, driver.id, documents);
    revalidatePath("/drivers");
    return { success: true, driverId: driver.id };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function updateDriverAction(input: unknown): Promise<DriverActionResult> {
  const parsed = updateDriverSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "drivers.errors.validation" };

  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    const {
      driverId,
      pricingType,
      monthlyRate,
      hourlyRate,
      missionRate,
      pricingCurrency,
      pricingValidFrom,
      documents,
      ...data
    } = parsed.data;
    await updateDriverService({ ...context, driverId, data });
    if (hasPricingInput({ monthlyRate, hourlyRate, missionRate })) {
      await createDriverPricingRuleService({
        ...context,
        driverId,
        data: {
          pricingType,
          monthlyRate: decimal(pricingType === "monthly" ? monthlyRate : undefined),
          hourlyRate: decimal(pricingType === "hourly" ? hourlyRate : undefined),
          missionRate: decimal(pricingType === "mission" ? missionRate : undefined),
          currency: pricingCurrency ?? "MAD",
          validFrom: pricingValidFrom ?? new Date(),
        },
      });
    }
    await syncDriverDocuments(context, driverId, documents);
    revalidatePath("/drivers");
    return { success: true, driverId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function deleteDriverAction(input: unknown): Promise<DriverActionResult> {
  const parsed = driverIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "drivers.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_DELETE);
    await deactivateDriverService({ ...context, driverId: parsed.data.driverId });
    revalidatePath("/drivers");
    return { success: true, driverId: parsed.data.driverId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function restoreDriverAction(input: unknown): Promise<DriverActionResult> {
  const parsed = driverIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "drivers.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_DELETE);
    await restoreDriverService({ ...context, driverId: parsed.data.driverId });
    revalidatePath("/drivers");
    return { success: true, driverId: parsed.data.driverId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createDriverPricingRuleAction(input: unknown): Promise<DriverActionResult> {
  const parsed = createDriverPricingRuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "drivers.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    await createDriverPricingRuleService({
      ...context,
      driverId: parsed.data.driverId,
      data: {
        pricingType: parsed.data.pricingType,
        monthlyRate: decimal(parsed.data.monthlyRate),
        hourlyRate: decimal(parsed.data.hourlyRate),
        missionRate: decimal(parsed.data.missionRate),
        currency: parsed.data.currency,
        validFrom: parsed.data.validFrom,
      },
    });
    revalidatePath("/drivers");
    return { success: true, driverId: parsed.data.driverId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function createDriverDocumentAction(input: unknown): Promise<DriverActionResult> {
  const parsed = createDriverDocumentSchema.safeParse(input);
  if (!parsed.success) return { success: false, messageKey: "drivers.errors.validation" };
  try {
    const context = await getActionContext(PERMISSIONS.FLEET_EDIT);
    const { driverId, ...data } = parsed.data;
    await upsertDriverDocumentByTypeService({ ...context, driverId, data });
    revalidatePath("/drivers");
    return { success: true, driverId };
  } catch (error) {
    return { success: false, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}
