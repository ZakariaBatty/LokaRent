import { randomBytes, createHash } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@lokarent/db";
import {
  createId,
  createNotFoundError,
  createValidationError,
  publishDomainEvent,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import {
  createAuthAccount,
  createAuthUser,
  createUser,
  findAuthUserByEmail,
  findAuthUserById,
  findUserByEmail,
} from "@/modules/auth/repositories/auth.repository";
import { getCompanyService } from "@/modules/workspace/agencies/services/agencies.service";
import { assertPlanLimit } from "@/modules/workspace/billing/services/billing.service";
import { ensureCompanySystemRolesService } from "@/modules/workspace/permissions/services/permissions.service";
import {
  findAgencyMembership,
  findCompanyMembership,
  listCompanyMemberships,
  createCompanyMembership,
  restoreCompanyMembershipAsActive,
  upsertAgencyMembership,
} from "@/modules/workspace/members/repositories/members.repository";
import { findPlanLimit } from "@/modules/workspace/billing/repositories/billing.repository";
import type { DatabaseClient } from "@/shared/database";
import {
  createInvitation,
  acceptPendingInvitation,
  findInvitationById,
  findInvitationByTokenHash,
  findInvitationByTokenHashOnly,
  listInvitations,
  updateInvitation,
} from "../repositories/invitations.repository";

export type InvitationActor = {
  userId?: string | null;
  actorName?: string;
};

type InvitationCreateData = Omit<Parameters<typeof createInvitation>[0], "id" | "companyId" | "agencyId" | "invitedBy">;
type PublicInvitation = NonNullable<Awaited<ReturnType<typeof findInvitationByTokenHashOnly>>>;

function safeInvitationSnapshot(invitation: {
  id: string;
  companyId: string;
  agencyId?: string | null;
  email: string;
  roleId: string;
  invitedBy: string;
  status: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
}) {
  return {
    id: invitation.id,
    companyId: invitation.companyId,
    agencyId: invitation.agencyId ?? null,
    email: invitation.email,
    roleId: invitation.roleId,
    invitedBy: invitation.invitedBy,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
  } satisfies Prisma.InputJsonObject;
}

async function writeWorkspaceInvitationLogs(input: InvitationActor & {
  companyId: string;
  agencyId?: string | null;
  invitationId: string;
  action: "InvitationCreated" | "InvitationRevoked";
  changes: Prisma.InputJsonObject;
  db: Parameters<typeof writeAuditLog>[1];
}) {
  await writeAuditLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      userId: input.userId,
      action: input.action,
      entityType: "invitation",
      entityId: input.invitationId,
      changes: input.changes,
    },
    input.db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "invitation",
      entityId: input.invitationId,
      verb: input.action,
      metadata: input.changes,
    },
    input.db,
  );
}

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function assertPendingInvitation(invitation: PublicInvitation) {
  if (invitation.status === "accepted") throw createValidationError("INVITATION_ALREADY_ACCEPTED");
  if (invitation.status === "revoked") throw createValidationError("INVITATION_REVOKED");
  if (invitation.status === "expired") throw createValidationError("INVITATION_EXPIRED");
  if (invitation.status !== "pending") throw createValidationError("INVITATION_NOT_PENDING");
}

function assertNotExpired(invitation: PublicInvitation) {
  if (invitation.expiresAt > new Date()) return;
  throw createValidationError("INVITATION_EXPIRED");
}

async function expireInvitationIfNeeded(invitation: PublicInvitation, userId?: string | null) {
  if (invitation.status !== "pending" || invitation.expiresAt > new Date()) return invitation;
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
    userId,
    occurredAt: new Date(),
  });
  return { ...invitation, status: "expired" as const };
}

function assertInvitationRole(invitation: PublicInvitation) {
  if (!invitation.agencyId || !invitation.agency) {
    throw createValidationError("INVITATION_AGENCY_REQUIRED");
  }
  if (invitation.agency.companyId !== invitation.companyId || invitation.agency.status !== "active" || invitation.agency.deletedAt) {
    throw createValidationError("INVITATION_AGENCY_INVALID");
  }
  if (
    invitation.role.companyId !== invitation.companyId ||
    invitation.role.scope !== "agency" ||
    invitation.role.deletedAt ||
    ["owner", "member"].includes(invitation.role.name.toLowerCase())
  ) {
    throw createValidationError("INVITATION_ROLE_INVALID");
  }
}

async function getInvitationByRawToken(rawToken: string) {
  if (!rawToken || rawToken.length < 24 || rawToken.length > 256) {
    throw createNotFoundError("Invitation", { token: "invalid" });
  }
  const invitation = await findInvitationByTokenHashOnly(hashInvitationToken(rawToken));
  if (!invitation) throw createNotFoundError("Invitation", { token: "invalid" });
  return invitation;
}

async function getMemberCompanyRole(companyId: string, db: DatabaseClient) {
  const roles = await db?.role.findMany({
    where: { companyId, name: "member", scope: "company", deletedAt: null },
    include: { rolePermissions: { include: { permission: true } } },
  });
  const memberRole = roles?.[0] ?? null;
  if (!memberRole) throw createValidationError("INVITATION_MEMBER_ROLE_MISSING");
  if (memberRole.rolePermissions.some((item) => item.permissionKey.startsWith("workspace."))) {
    throw createValidationError("INVITATION_MEMBER_ROLE_INVALID");
  }
  return memberRole;
}

async function lockCompany(companyId: string, db: DatabaseClient) {
  await db.$queryRaw`SELECT id FROM companies WHERE id = ${companyId}::uuid FOR UPDATE`;
}

async function assertMemberLimitForAcceptance(input: {
  invitation: PublicInvitation;
  userId: string;
  db: DatabaseClient;
}) {
  const existingMembership = await findCompanyMembership({
    companyId: input.invitation.companyId,
    userId: input.userId,
    includeDeleted: true,
  }, input.db);
  if (existingMembership && !existingMembership.deletedAt) return;

  const [company, activeMembers] = await Promise.all([
    getCompanyService({ companyId: input.invitation.companyId }),
    listCompanyMemberships({ companyId: input.invitation.companyId }, input.db),
  ]);
  const limit = await findPlanLimit({ planId: company.planId, limitKey: "max_users" }, input.db);
  assertPlanLimit({
    planId: company.planId,
    limitKey: "max_users",
    limitValue: limit?.limitValue,
    currentUsage: activeMembers.length,
    requestedIncrement: 1,
  });
}

async function provisionInvitationAcceptance(input: {
  invitation: PublicInvitation;
  userId: string;
  actorName: string;
  db: DatabaseClient;
}) {
  assertPendingInvitation(input.invitation);
  assertNotExpired(input.invitation);
  assertInvitationRole(input.invitation);
  await lockCompany(input.invitation.companyId, input.db);
  await assertMemberLimitForAcceptance(input);

  const memberRole = await getMemberCompanyRole(input.invitation.companyId, input.db);
  const now = new Date();
  const existingAgencyMembership = await findAgencyMembership({
    companyId: input.invitation.companyId,
    agencyId: input.invitation.agencyId!,
    userId: input.userId,
    includeDeleted: true,
  }, input.db);

  const existingCompanyMembership = await findCompanyMembership({
    companyId: input.invitation.companyId,
    userId: input.userId,
    includeDeleted: true,
  }, input.db);
  const companyMembership =
    existingCompanyMembership && !existingCompanyMembership.deletedAt
      ? existingCompanyMembership
      : existingCompanyMembership
        ? await restoreCompanyMembershipAsActive(
            {
              companyId: input.invitation.companyId,
              membershipId: existingCompanyMembership.id,
              roleId: memberRole.id,
              roleScope: "company",
            },
            input.db,
          )
        : await createCompanyMembership(
            {
              id: createId(),
              companyId: input.invitation.companyId,
              userId: input.userId,
              roleId: memberRole.id,
              roleScope: "company",
              status: "active",
            },
            input.db,
          );
  const agencyMembership = await upsertAgencyMembership(
    {
      id: createId(),
      companyId: input.invitation.companyId,
      agencyId: input.invitation.agencyId!,
      userId: input.userId,
      roleId: input.invitation.roleId,
      roleScope: "agency",
      isPrimary: !existingAgencyMembership,
      status: "active",
      joinedAt: now,
    },
    input.db,
  );
  const accepted = await acceptPendingInvitation(
    {
      companyId: input.invitation.companyId,
      invitationId: input.invitation.id,
      acceptedAt: now,
    },
    input.db,
  );
  if (accepted.count !== 1) throw createValidationError("INVITATION_ALREADY_ACCEPTED");

  const changes = {
    after: {
      companyMembershipId: companyMembership.id,
      agencyMembershipId: agencyMembership.id,
      agencyId: agencyMembership.agencyId,
      agencyRoleId: agencyMembership.roleId,
    },
  } satisfies Prisma.InputJsonObject;

  await writeAuditLog(
    {
      id: createId(),
      companyId: input.invitation.companyId,
      agencyId: input.invitation.agencyId,
      userId: input.userId,
      action: "InvitationAccepted",
      entityType: "invitation",
      entityId: input.invitation.id,
      changes,
    },
    input.db,
  );
  await writeActivityLog(
    {
      id: createId(),
      companyId: input.invitation.companyId,
      agencyId: input.invitation.agencyId,
      userId: input.userId,
      actorName: input.actorName,
      entityType: "invitation",
      entityId: input.invitation.id,
      verb: "InvitationAccepted",
      metadata: changes,
    },
    input.db,
  );

  return { invitationId: input.invitation.id, companyId: input.invitation.companyId, agencyId: input.invitation.agencyId! };
}

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
  const normalizedEmail = normalizeInvitationEmail(input.data.email);
  const existingUser = await findUserByEmail({
    companyId: input.companyId,
    email: normalizedEmail,
    includeDeleted: true,
  });
  if (existingUser) {
    throw createValidationError("Email already belongs to this company");
  }
  const invitation = await runInTransaction(async (db) => {
    const created = await createInvitation({
      ...input.data,
      email: normalizedEmail,
      id: createId(),
      companyId: input.companyId,
      agencyId: input.agencyId ?? null,
      invitedBy: input.userId ?? "",
    }, db);
    await writeWorkspaceInvitationLogs({
      companyId: created.companyId,
      agencyId: created.agencyId,
      invitationId: created.id,
      userId: input.userId,
      actorName: input.actorName,
      action: "InvitationCreated",
      changes: { after: safeInvitationSnapshot(created) },
      db,
    });
    return created;
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
  rawToken: string;
  userId: string;
}) {
  const initialInvitation = await expireInvitationIfNeeded(await getInvitationByRawToken(input.rawToken), input.userId);
  const authUser = await findAuthUserById(input.userId);
  if (!authUser) throw createNotFoundError("Auth user", { userId: input.userId });
  if (normalizeInvitationEmail(authUser.email) !== normalizeInvitationEmail(initialInvitation.email)) {
    throw createValidationError("INVITATION_EMAIL_MISMATCH");
  }
  if (authUser.lokaRentUser.companyId !== initialInvitation.companyId) {
    throw createValidationError("INVITATION_COMPANY_MISMATCH");
  }
  await ensureCompanySystemRolesService({ companyId: initialInvitation.companyId });
  return runInTransaction(async (tx) => {
    const invitation = await findInvitationByTokenHashOnly(hashInvitationToken(input.rawToken), tx);
    if (!invitation) throw createNotFoundError("Invitation", { token: "invalid" });
    return provisionInvitationAcceptance({
      invitation,
      userId: authUser.id,
      actorName: authUser.name,
      db: tx,
    });
  });
}

export async function getPublicInvitationService(rawToken: string) {
  const invitation = await expireInvitationIfNeeded(await getInvitationByRawToken(rawToken));
  const userExists = Boolean(await findAuthUserByEmail(normalizeInvitationEmail(invitation.email)));
  return {
    email: invitation.email,
    companyName: invitation.company.name,
    agencyName: invitation.agency?.name ?? null,
    roleName: invitation.role.name,
    expiresAt: invitation.expiresAt,
    status: invitation.status,
    userExists,
  };
}

export async function createInvitedAccountAndAcceptInvitationService(input: {
  rawToken: string;
  fullName: string;
  password: string;
}) {
  const initialInvitation = await expireInvitationIfNeeded(await getInvitationByRawToken(input.rawToken));
  const email = normalizeInvitationEmail(initialInvitation.email);
  const existingAuthUser = await findAuthUserByEmail(email);
  if (existingAuthUser) throw createValidationError("INVITATION_ACCOUNT_EXISTS");

  const password = await hashPassword(input.password);
  const userId = createId();
  await ensureCompanySystemRolesService({ companyId: initialInvitation.companyId });

  return runInTransaction(async (tx) => {
    const invitation = await findInvitationByTokenHashOnly(hashInvitationToken(input.rawToken), tx);
    if (!invitation) throw createNotFoundError("Invitation", { token: "invalid" });
    assertPendingInvitation(invitation);
    assertNotExpired(invitation);
    assertInvitationRole(invitation);

    await createUser(
      {
        id: userId,
        companyId: invitation.companyId,
        email,
        fullName: input.fullName.trim(),
        locale: "fr",
        timezone: invitation.company.timezone,
        status: "active",
      },
      tx,
    );
    await createAuthUser(
      {
        id: userId,
        name: input.fullName.trim(),
        email,
        emailVerified: false,
      },
      tx,
    );
    await createAuthAccount(
      {
        id: createId(),
        userId,
        accountId: userId,
        providerId: "credential",
        password,
      },
      tx,
    );

    const acceptance = await provisionInvitationAcceptance({
      invitation,
      userId,
      actorName: input.fullName.trim(),
      db: tx,
    });
    return { ...acceptance, email };
  });
}

export async function revokeInvitationService(input: {
  companyId: string;
  invitationId: string;
  userId?: string | null;
  actorName?: string;
}) {
  return runInTransaction(async (db) => {
    const invitation = await findInvitationById(input, db);
    if (!invitation) throw createNotFoundError("Invitation", input);
    if (invitation.status !== "pending") {
      throw createValidationError("Only pending invitations can be revoked");
    }
    const before = safeInvitationSnapshot(invitation);
    const result = await updateInvitation({
      ...input,
      data: { status: "revoked" },
    }, db);
    const updated = await findInvitationById(input, db);
    await writeWorkspaceInvitationLogs({
      companyId: input.companyId,
      agencyId: invitation.agencyId,
      invitationId: invitation.id,
      userId: input.userId,
      actorName: input.actorName,
      action: "InvitationRevoked",
      changes: {
        before,
        after: updated ? safeInvitationSnapshot(updated) : null,
      },
      db,
    });
    return result;
  });
}

export const invitationsService = {
  getInvitationService,
  listInvitationsService,
  createInvitationService,
  acceptInvitationService,
  getPublicInvitationService,
  createInvitedAccountAndAcceptInvitationService,
  revokeInvitationService,
};
