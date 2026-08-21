import { AgencyStatus, Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findCompanyById(
  input: { companyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.company.findFirst({
    where: {
      id: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findCompanyBySlug(
  input: { slug: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.company.findFirst({
    where: {
      slug: input.slug,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function createCompany(
  data: Prisma.CompanyUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.company.create({ data });
}

export async function updateCompany(
  input: { companyId: string; data: Prisma.CompanyUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.company.updateMany({
    where: { id: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteCompany(
  input: { companyId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.company.updateMany({
    where: { id: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreCompany(companyId: string, db: DatabaseClient = prisma) {
  return db.company.updateMany({
    where: { id: companyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function findAgencyById(
  input: { companyId: string; agencyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.agency.findFirst({
    where: {
      id: input.agencyId,
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function findAgencyByCode(
  input: { companyId: string; code: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.agency.findFirst({
    where: {
      companyId: input.companyId,
      code: input.code,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
  });
}

export async function listActiveAgencies(companyId: string, db: DatabaseClient = prisma) {
  return db.agency.findMany({
    where: { companyId, status: AgencyStatus.active, deletedAt: null },
    orderBy: { name: "asc" },
  });
}

export async function listWorkspaceAgencies(companyId: string, db: DatabaseClient = prisma) {
  return db.agency.findMany({
    where: { companyId, deletedAt: null },
    include: {
      _count: {
        select: {
          agencyMemberships: { where: { status: "active", deletedAt: null } },
          vehicles: { where: { deletedAt: null } },
          reservations: true,
          customers: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createAgency(
  data: Prisma.AgencyUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.agency.create({ data });
}

export async function updateAgency(
  input: { companyId: string; agencyId: string; data: Prisma.AgencyUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.agency.updateMany({
    where: { id: input.agencyId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function softDeleteAgency(
  input: { companyId: string; agencyId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.agency.updateMany({
    where: { id: input.agencyId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function restoreAgency(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  return db.agency.updateMany({
    where: { id: input.agencyId, companyId: input.companyId },
    data: { deletedAt: null, deletedBy: null },
  });
}

export async function hasActiveAgencyMembership(
  input: { companyId: string; agencyId: string; userId: string },
  db: DatabaseClient = prisma,
) {
  const count = await db.agencyMembership.count({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      userId: input.userId,
      status: "active",
      deletedAt: null,
    },
  });

  return count > 0;
}

export async function getCompanyUsageCounts(companyId: string, db: DatabaseClient = prisma) {
  const [agencies, users, vehicles, reservations, customers] = await Promise.all([
    db.agency.count({ where: { companyId, deletedAt: null } }),
    db.user.count({ where: { companyId, deletedAt: null } }),
    db.vehicle.count({ where: { companyId, deletedAt: null } }),
    db.reservation.count({ where: { companyId, deletedAt: null } }),
    db.customer.count({ where: { companyId, deletedAt: null } }),
  ]);

  return { agencies, users, vehicles, reservations, customers };
}

export const agenciesRepository = {
  findCompanyById,
  findCompanyBySlug,
  createCompany,
  updateCompany,
  softDeleteCompany,
  restoreCompany,
  findAgencyById,
  findAgencyByCode,
  listActiveAgencies,
  listWorkspaceAgencies,
  createAgency,
  updateAgency,
  softDeleteAgency,
  restoreAgency,
  hasActiveAgencyMembership,
  getCompanyUsageCounts,
};
