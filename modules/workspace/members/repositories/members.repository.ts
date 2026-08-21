import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findCompanyMembership(
  input: { companyId: string; userId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.companyMembership.findUnique({
    where: { userId_companyId: { userId: input.userId, companyId: input.companyId } },
    include: { role: true, user: true },
  }).then((membership) => {
    if (!membership || input.includeDeleted || !membership.deletedAt) return membership;
    return null;
  });
}

export async function listCompanyMemberships(
  input: { companyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.companyMembership.findMany({
    where: {
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { role: true, user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCompanyMembership(
  data: Prisma.CompanyMembershipUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.companyMembership.create({ data });
}

export async function updateCompanyMembership(
  input: {
    companyId: string;
    membershipId: string;
    data: Prisma.CompanyMembershipUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.companyMembership.updateMany({
    where: { id: input.membershipId, companyId: input.companyId, deletedAt: null },
    data: input.data,
  });
}

export async function restoreCompanyMembershipAsActive(
  input: {
    companyId: string;
    membershipId: string;
    roleId: string;
    roleScope: "company";
  },
  db: DatabaseClient = prisma,
) {
  return db.companyMembership.update({
    where: { id: input.membershipId },
    data: {
      roleId: input.roleId,
      roleScope: input.roleScope,
      status: "active",
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function softDeleteCompanyMembership(
  input: { companyId: string; membershipId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.companyMembership.updateMany({
    where: { id: input.membershipId, companyId: input.companyId, deletedAt: null },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export async function findAgencyMembership(
  input: { companyId: string; agencyId: string; userId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.findUnique({
    where: { userId_agencyId: { userId: input.userId, agencyId: input.agencyId } },
    include: { role: true, user: true, agency: true },
  }).then((membership) => {
    if (
      !membership ||
      membership.companyId !== input.companyId ||
      (!input.includeDeleted && membership.deletedAt)
    ) {
      return null;
    }
    return membership;
  });
}

export async function listAgencyMemberships(
  input: { companyId: string; agencyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.findMany({
    where: {
      companyId: input.companyId,
      agencyId: input.agencyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { role: true, user: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

export async function listCompanyAgencyMemberships(
  input: { companyId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.findMany({
    where: {
      companyId: input.companyId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: { role: true, user: true, agency: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

export async function listUserAgencyMemberships(
  input: { companyId: string; userId: string; includeDeleted?: boolean },
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.findMany({
    where: {
      companyId: input.companyId,
      userId: input.userId,
      ...(input.includeDeleted ? {} : { deletedAt: null }),
    },
    include: {
      role: true,
      agency: {
        include: {
          _count: {
            select: {
              vehicles: { where: { deletedAt: null } },
            },
          },
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAgencyMembership(
  data: Prisma.AgencyMembershipUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.create({ data });
}

export async function upsertAgencyMembership(
  data: Prisma.AgencyMembershipUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.upsert({
    where: { userId_agencyId: { userId: data.userId, agencyId: data.agencyId } },
    create: data,
    update: {
      roleId: data.roleId,
      roleScope: data.roleScope,
      status: data.status,
      joinedAt: data.joinedAt,
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function updateAgencyMembership(
  input: {
    companyId: string;
    agencyId: string;
    membershipId: string;
    data: Prisma.AgencyMembershipUncheckedUpdateInput;
  },
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.updateMany({
    where: {
      id: input.membershipId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: input.data,
  });
}

export async function softDeleteAgencyMembership(
  input: { companyId: string; agencyId: string; membershipId: string; deletedBy?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.agencyMembership.updateMany({
    where: {
      id: input.membershipId,
      companyId: input.companyId,
      agencyId: input.agencyId,
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: input.deletedBy ?? null },
  });
}

export const membersRepository = {
  findCompanyMembership,
  listCompanyMemberships,
  createCompanyMembership,
  updateCompanyMembership,
  restoreCompanyMembershipAsActive,
  softDeleteCompanyMembership,
  findAgencyMembership,
  listAgencyMemberships,
  listCompanyAgencyMemberships,
  listUserAgencyMemberships,
  createAgencyMembership,
  upsertAgencyMembership,
  updateAgencyMembership,
  softDeleteAgencyMembership,
};
