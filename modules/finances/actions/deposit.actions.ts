"use server";

import { revalidatePath } from "next/cache";
import { DepositMethod } from "@lokarent/db";
import { z } from "zod";
import { requireCurrentAgencyContext } from "@/shared/auth";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { getReservationService } from "@/modules/reservations/services/reservations.service";
import { mapReservationToUi } from "@/modules/reservations/mappers/reservation.mapper";
import {
  collectDepositService,
  forfeitDepositService,
  releaseDepositService,
  type FinanceServiceContext,
} from "../services/finances.service";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

const collectDepositSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.preprocess(emptyToUndefined, z.coerce.number().positive()),
  method: z.nativeEnum(DepositMethod),
  collectedAt: z.preprocess(emptyToUndefined, z.coerce.date().optional().nullable()),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const releaseDepositSchema = z.object({
  depositId: z.string().uuid(),
  amount: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional().nullable()),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const forfeitDepositSchema = z.object({
  depositId: z.string().uuid(),
  reason: z.string().trim().min(1).max(1000),
});

function messageKeyForError(error: unknown) {
  if (!isAppError(error)) return "deposits.errors.generic";
  if (error.code === "FORBIDDEN") return "deposits.errors.forbidden";
  if (error.code === "NOT_FOUND") return "deposits.errors.notFound";
  if (error.code === "VALIDATION_ERROR") {
    const keys: Record<string, string> = {
      DEPOSIT_ACTOR_REQUIRED: "deposits.errors.actorRequired",
      DEPOSIT_AMOUNT_INVALID: "deposits.errors.amountInvalid",
      DEPOSIT_DATE_INVALID: "deposits.errors.dateInvalid",
      DEPOSIT_NOT_REQUIRED: "deposits.errors.notRequired",
      DEPOSIT_EXCEEDS_REQUIRED: "deposits.errors.exceedsRequired",
      DEPOSIT_ALREADY_COLLECTED: "deposits.errors.alreadyCollected",
      DEPOSIT_ALREADY_RELEASED: "deposits.errors.alreadyReleased",
      DEPOSIT_ALREADY_FORFEITED: "deposits.errors.alreadyForfeited",
      DEPOSIT_RELEASE_NOT_ALLOWED: "deposits.errors.releaseNotAllowed",
      DEPOSIT_RELEASE_AMOUNT_INVALID: "deposits.errors.releaseAmountInvalid",
      DEPOSIT_RELEASE_EXCEEDS_HELD: "deposits.errors.releaseExceedsHeld",
      DEPOSIT_FORFEIT_REASON_REQUIRED: "deposits.errors.forfeitReasonRequired",
      DEPOSIT_FORFEIT_NOT_ALLOWED: "deposits.errors.forfeitNotAllowed",
      DEPOSIT_NOTHING_HELD: "deposits.errors.nothingHeld",
    };
    return keys[error.message] ?? "deposits.errors.validation";
  }
  return "deposits.errors.generic";
}

async function getActionContext() {
  const context = await requireCurrentAgencyContext();
  await requirePermission(PERMISSIONS.FINANCE_DEPOSITS_MANAGE, context);
  return {
    companyId: context.companyId,
    agencyId: context.agencyId,
    userId: context.userId,
  } satisfies FinanceServiceContext;
}

function revalidateDepositPaths() {
  revalidatePath("/reservations");
  revalidatePath("/finances");
  revalidatePath("/clients");
}

async function updatedReservation(context: FinanceServiceContext, reservationId: string) {
  const reservation = await getReservationService({ ...context, reservationId });
  return mapReservationToUi(reservation);
}

export async function collectDepositAction(input: unknown) {
  const parsed = collectDepositSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, messageKey: "deposits.errors.validation", issues: parsed.error.flatten().fieldErrors };
  }
  try {
    const context = await getActionContext();
    const deposit = await collectDepositService({ context, deposit: parsed.data });
    revalidateDepositPaths();
    return { success: true as const, depositId: deposit.id, reservation: await updatedReservation(context, deposit.reservationId) };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function releaseDepositAction(input: unknown) {
  const parsed = releaseDepositSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, messageKey: "deposits.errors.validation", issues: parsed.error.flatten().fieldErrors };
  }
  try {
    const context = await getActionContext();
    const deposit = await releaseDepositService({ ...context, ...parsed.data });
    revalidateDepositPaths();
    return { success: true as const, depositId: deposit.id, reservation: await updatedReservation(context, deposit.reservationId) };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}

export async function forfeitDepositAction(input: unknown) {
  const parsed = forfeitDepositSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, messageKey: "deposits.errors.validation", issues: parsed.error.flatten().fieldErrors };
  }
  try {
    const context = await getActionContext();
    const deposit = await forfeitDepositService({ ...context, ...parsed.data });
    revalidateDepositPaths();
    return { success: true as const, depositId: deposit.id, reservation: await updatedReservation(context, deposit.reservationId) };
  } catch (error) {
    return { success: false as const, messageKey: messageKeyForError(error), code: isAppError(error) ? error.code : undefined };
  }
}
