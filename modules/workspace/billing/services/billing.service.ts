import { createNotFoundError, createValidationError, publishDomainEvent } from "@/shared";
import {
  findActivePlans,
  findAgencySettings,
  findCompanySettings,
  findPlanById,
  findPlanFeature,
  findPlanLimit,
  findSettingResolutionRows,
  incrementNumberSequence,
  restoreSetting,
  softDeleteSetting,
  upsertSetting,
} from "../repositories/billing.repository";

export async function listPlansService() {
  return findActivePlans();
}

export async function getPlanService(planId: string) {
  const plan = await findPlanById(planId);
  if (!plan) throw createNotFoundError("Plan", { planId });
  return plan;
}

export async function getPlanLimitService(input: { planId: string; limitKey: string }) {
  return findPlanLimit(input);
}

export async function hasPlanFeatureService(input: { planId: string; featureKey: string }) {
  return Boolean(await findPlanFeature(input));
}

export async function listCompanySettingsService(input: {
  companyId: string;
  includeDeleted?: boolean;
}) {
  return findCompanySettings(input);
}

export async function listAgencySettingsService(input: {
  companyId: string;
  agencyId: string;
  includeDeleted?: boolean;
}) {
  return findAgencySettings(input);
}

export async function resolveSettingService(input: {
  companyId: string;
  agencyId: string;
  key: string;
  platformDefault?: string;
}) {
  const rows = await findSettingResolutionRows(input);
  return rows[0]?.value ?? input.platformDefault ?? null;
}

export async function upsertSettingService(input: {
  companyId: string;
  agencyId?: string | null;
  key: string;
  create: Parameters<typeof upsertSetting>[0]["create"];
  update: Parameters<typeof upsertSetting>[0]["update"];
  actorUserId?: string | null;
}) {
  const setting = await upsertSetting(input);
  await publishDomainEvent({
    name: "SettingsUpdated",
    companyId: input.companyId,
    agencyId: input.agencyId ?? null,
    entityType: "setting",
    entityId: setting?.id ?? input.key,
    userId: input.actorUserId ?? null,
    occurredAt: new Date(),
  });
  return setting;
}

export async function deleteSettingService(input: {
  companyId: string;
  settingId: string;
  deletedBy?: string | null;
}) {
  return softDeleteSetting(input);
}

export async function restoreSettingService(input: { companyId: string; settingId: string }) {
  return restoreSetting(input);
}

export async function nextNumberSequenceService(input: {
  id: string;
  companyId: string;
  agencyId?: string | null;
  sequenceKey: string;
  periodKey: string;
  prefix: string;
}) {
  if (!input.prefix) throw createValidationError("Number sequence prefix is required");
  return incrementNumberSequence(input);
}

export const billingService = {
  listPlansService,
  getPlanService,
  getPlanLimitService,
  hasPlanFeatureService,
  listCompanySettingsService,
  listAgencySettingsService,
  resolveSettingService,
  upsertSettingService,
  deleteSettingService,
  restoreSettingService,
  nextNumberSequenceService,
};
