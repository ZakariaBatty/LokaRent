import { Prisma, prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function findInvitationById(
  input: { companyId: string; invitationId: string },
  db: DatabaseClient = prisma,
) {
  return db.invitation.findFirst({
    where: { id: input.invitationId, companyId: input.companyId },
    include: { role: true, agency: true, invitedByUser: true },
  });
}

export async function findInvitationByTokenHash(
  input: { companyId: string; tokenHash: string },
  db: DatabaseClient = prisma,
) {
  return db.invitation.findFirst({
    where: { companyId: input.companyId, tokenHash: input.tokenHash },
    include: { company: true, agency: true, role: true },
  });
}

export async function findInvitationByTokenHashOnly(tokenHash: string, db: DatabaseClient = prisma) {
  return db.invitation.findUnique({
    where: { tokenHash },
    include: { company: true, agency: true, role: true },
  });
}

export async function listInvitations(
  input: { companyId: string; agencyId?: string | null },
  db: DatabaseClient = prisma,
) {
  return db.invitation.findMany({
    where: { companyId: input.companyId, agencyId: input.agencyId },
    include: { role: true, agency: true, invitedByUser: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createInvitation(
  data: Prisma.InvitationUncheckedCreateInput,
  db: DatabaseClient = prisma,
) {
  return db.invitation.create({ data });
}

export async function updateInvitation(
  input: { companyId: string; invitationId: string; data: Prisma.InvitationUncheckedUpdateInput },
  db: DatabaseClient = prisma,
) {
  return db.invitation.updateMany({
    where: { id: input.invitationId, companyId: input.companyId },
    data: input.data,
  });
}

export async function acceptPendingInvitation(
  input: { companyId: string; invitationId: string; acceptedAt: Date },
  db: DatabaseClient = prisma,
) {
  return db.invitation.updateMany({
    where: { id: input.invitationId, companyId: input.companyId, status: "pending" },
    data: { status: "accepted", acceptedAt: input.acceptedAt },
  });
}

export const invitationsRepository = {
  findInvitationById,
  findInvitationByTokenHash,
  findInvitationByTokenHashOnly,
  listInvitations,
  createInvitation,
  updateInvitation,
  acceptPendingInvitation,
};
