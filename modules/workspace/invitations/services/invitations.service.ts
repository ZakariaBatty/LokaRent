import { createId, createNotFoundError, createValidationError, publishDomainEvent, runInTransaction } from "@/shared";
import { findUserByEmail } from "@/modules/auth/repositories/auth.repository";
import { createAgencyMembership } from "@/modules/workspace/members/repositories/members.repository";
import {
  createInvitation,
  findInvitationById,
  findInvitationByTokenHash,
  listInvitations,
  updateInvitation,
} from "../repositories/invitations.repository";

export type InvitationActor = {
  userId?: string | null;
  actorName?: string;
};

type InvitationCreateData = Omit<Parameters<typeof createInvitation>[0], "id" | "companyId" | "agencyId" | "invitedBy">;

export async function getInvitationService(input: {
  companyId: string;
  invitationId: string;
}) {
  const invitation = await findInvitationById(input);
  if (!invitation) throw createNotFoundError("Invitation", input);
  return invitation;
}

export async function listInvitationsService(input: {
  companyId: string;
  agencyId?: string | null;
}) {
  return listInvitations(input);
}

export async function createInvitationService(
  input: InvitationActor & {
    companyId: string;
    agencyId?: string | null;
    data: InvitationCreateData;
    maxUsers?: number;
    currentUserCount?: number;
  },
) {
  if (
    input.maxUsers !== undefined &&
    input.maxUsers >= 0 &&
    input.currentUserCount !== undefined &&
    input.currentUserCount >= input.maxUsers
  ) {
    throw createValidationError("Company user limit reached");
  }
  const existingUser = await findUserByEmail({
    companyId: input.companyId,
    email: input.data.email,
    includeDeleted: true,
  });
  if (existingUser) {
    throw createValidationError("Email already belongs to this company");
  }
  const invitation = await createInvitation({
    ...input.data,
    id: createId(),
    companyId: input.companyId,
    agencyId: input.agencyId ?? null,
    invitedBy: input.userId ?? "",
  });
  await publishDomainEvent({
    name: "InvitationSent",
    companyId: invitation.companyId,
    agencyId: invitation.agencyId,
    entityType: "invitation",
    entityId: invitation.id,
    userId: input.userId,
    actorName: input.actorName,
    occurredAt: new Date(),
  });
  return invitation;
}

export async function acceptInvitationService(input: {
  companyId: string;
  tokenHash: string;
  userId: string;
  agencyMembershipId?: string;
}) {
  const invitation = await findInvitationByTokenHash(input);
  if (!invitation) throw createNotFoundError("Invitation", { tokenHash: input.tokenHash });
  if (invitation.status !== "pending") {
    throw createValidationError("Invitation is not pending");
  }
  if (invitation.expiresAt <= new Date()) {
    await updateInvitation({
      companyId: invitation.companyId,
      invitationId: invitation.id,
      data: { status: "expired" },
    });
    await publishDomainEvent({
      name: "InvitationExpired",
      companyId: invitation.companyId,
      agencyId: invitation.agencyId,
      entityType: "invitation",
      entityId: invitation.id,
      userId: input.userId,
      occurredAt: new Date(),
    });
    throw createValidationError("Invitation has expired");
  }

  return runInTransaction(async (tx) => {
    if (invitation.agencyId) {
      await createAgencyMembership(
        {
          id: createId(),
          companyId: invitation.companyId,
          agencyId: invitation.agencyId,
          userId: input.userId,
          roleId: invitation.roleId,
          status: "active",
          joinedAt: new Date(),
        },
        tx,
      );
    }
    const result = await updateInvitation(
      {
        companyId: invitation.companyId,
        invitationId: invitation.id,
      data: { status: "accepted", acceptedAt: new Date() },
      },
      tx,
    );
    await publishDomainEvent({
      name: "InvitationAccepted",
      companyId: invitation.companyId,
      agencyId: invitation.agencyId,
      entityType: "invitation",
      entityId: invitation.id,
      userId: input.userId,
      occurredAt: new Date(),
    });
    return result;
  });
}

export async function revokeInvitationService(input: {
  companyId: string;
  invitationId: string;
}) {
  const invitation = await getInvitationService(input);
  if (invitation.status !== "pending") {
    throw createValidationError("Only pending invitations can be revoked");
  }
  return updateInvitation({
    ...input,
    data: { status: "revoked" },
  });
}

export const invitationsService = {
  getInvitationService,
  listInvitationsService,
  createInvitationService,
  acceptInvitationService,
  revokeInvitationService,
};
