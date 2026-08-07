import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findActivePlans(db: DatabaseClient = prisma) {
  return db.plan.findMany({
    where: { isActive: true },
    include: { limits: true, features: true },
    orderBy: { displayName: "asc" },
  });
}

export async function findPlanById(planId: string, db: DatabaseClient = prisma) {
  return db.plan.findUnique({
    where: { id: planId },
    include: { limits: true, features: true },
  });
}

export async function findPlanLimit(
  input: { planId: string; limitKey: string },
  db: DatabaseClient = prisma,
) {
  return db.planLimit.findUnique({
    where: { planId_limitKey: input },
  });
}

export async function findPlanFeature(
  input: { planId: string; featureKey: string },
  db: DatabaseClient = prisma,
) {
  return db.planFeature.findUnique({
    where: { planId_featureKey: input },
  });
}

export async function findCompanySettings(
  input: { companyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.setting.findMany({
    where: {
      companyId: input.companyId,
      agencyId: null,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { key: "asc" },
  });
}

export async function findAgencySettings(
  input: { companyId: string; agencyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.setting.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    orderBy: { key: "asc" },
  });
}

export async function findSettingByKey(
  input: { companyId: string; agencyId?: string | null; key: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.setting.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      key: input.key,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findSettingResolutionRows(
  input: { companyId: string; agencyId: string; key: string },
  db: DatabaseClient = prisma,
) {
  return db.setting.findMany({
    where: {
      companyId: input.companyId,
      key: input.key,
      deletedAt: null,
      OR: [{ agencyId: input.agencyId }, { agencyId: null }],
    },
    orderBy: [{ agencyId: "desc" }, { updatedAt: "desc" }],
  });
}

export async function upsertSetting(
  input: {
    companyId: string;
    agencyId?: string | null;
    key: string;
    create: Omit<Prisma.SettingUncheckedCreateInput, "companyId" | "agencyId" | "key">;
    update: Prisma.SettingUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  if (input.agencyId) {
    return db.setting.upsert({
      where: {
        companyId_agencyId_key: {
          companyId: input.companyId,
          agencyId: input.agencyId,
          key: input.key,
        },
      },
      create: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        key: input.key,
        ...input.create,
      },
      update: input.update,
    });
  }

  const existing = await findSettingByKey(
    {
      companyId: input.companyId,
      agencyId: null,
      key: input.key,
      includeDeleted: true,
    },
    db,
  );

  if (existing) {
    await db.setting.updateMany({
      where: {
        id: existing.id,
        companyId: input.companyId,
        agencyId: null,
      },
      data: input.update,
    });

    return findSettingByKey(
      {
        companyId: input.companyId,
        agencyId: null,
        key: input.key,
        includeDeleted: true,
      },
      db,
    );
  }

  return db.setting.create({
    data: {
      companyId: input.companyId,
      agencyId: null,
      key: input.key,
      ...input.create,
    },
  });
}

export async function softDeleteSetting(
  input: { companyId: string; settingId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.setting.updateMany({
    where: { id: input.settingId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreSetting(
  input: { companyId: string; settingId: string },
  db: DatabaseClient = prisma,
) {
  return db.setting.updateMany({
    where: { id: input.settingId, companyId: input.companyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

async function incrementNumberSequenceInClient(
  input: {
    id: string;
    companyId: string;
    agencyId?: string | null;
    sequenceKey: string;
    periodKey: string;
    prefix: string;
  },
  db: DatabaseClient,
) {
  const advisoryKey = [
    input.companyId,
    input.agencyId ?? "company",
    input.sequenceKey,
    input.periodKey,
  ].join(":");

  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${advisoryKey}))`;

  const existing = await db.numberSequence.findFirst({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      sequenceKey: input.sequenceKey,
      periodKey: input.periodKey,
    },
  });

  if (!existing) {
    await db.numberSequence.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        agencyId: input.agencyId ?? null,
        sequenceKey: input.sequenceKey,
        periodKey: input.periodKey,
        prefix: input.prefix,
      },
    });
  }

  const rows = await db.$queryRaw<{ last_value: bigint }[]>`
    SELECT last_value
    FROM number_sequences
    WHERE company_id = ${input.companyId}::uuid
      AND sequence_key = ${input.sequenceKey}
      AND period_key = ${input.periodKey}
      AND (
        (${input.agencyId ?? null}::uuid IS NULL AND agency_id IS NULL)
        OR agency_id = ${input.agencyId ?? null}::uuid
      )
    FOR UPDATE
  `;
  const nextValue = (rows[0]?.last_value ?? BigInt(0)) + BigInt(1);

  await db.numberSequence.updateMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      sequenceKey: input.sequenceKey,
      periodKey: input.periodKey,
    },
    data: { lastValue: nextValue },
  });

  return {
    prefix: input.prefix,
    value: nextValue,
    formatted: `${input.prefix}${nextValue.toString().padStart(5, "0")}`,
  };
}

export async function incrementNumberSequence(
  input: {
    id: string;
    companyId: string;
    agencyId?: string | null;
    sequenceKey: string;
    periodKey: string;
    prefix: string;
  },
  db: DatabaseClient = prisma,
) {
  if (db === prisma) {
    return prisma.$transaction((tx: Prisma.TransactionClient) =>
      incrementNumberSequenceInClient(input, tx),
    );
  }

  return incrementNumberSequenceInClient(input, db);
}

export const billingRepository = {
  findActivePlans,
  findPlanById,
  findPlanLimit,
  findPlanFeature,
  findCompanySettings,
  findAgencySettings,
  findSettingByKey,
  findSettingResolutionRows,
  upsertSetting,
  softDeleteSetting,
  restoreSetting,
  incrementNumberSequence,
};
