"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, getCurrentSession } from "@/shared/auth";
import { CURRENT_AGENCY_COOKIE } from "@/shared/auth/current-agency-context";
import { isAppError } from "@/shared/errors";
import { touchLastLoginService } from "@/modules/auth/services/auth.service";
import {
  acceptInvitationService,
  createInvitedAccountAndAcceptInvitationService,
} from "../services/invitations.service";

export type InviteAcceptanceActionResult =
  | { success: true; redirectTo: string }
  | { success: false; message: string; code?: string };

const tokenSchema = z.string().trim().min(24).max(256);

const createAccountSchema = z
  .object({
    token: tokenSchema,
    fullName: z.string().trim().min(2).max(120),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "INVITATION_PASSWORD_MISMATCH",
  });

const signInSchema = z.object({
  token: tokenSchema,
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().default(true),
});

const acceptCurrentSchema = z.object({
  token: tokenSchema,
});

function resultForError(error: unknown): InviteAcceptanceActionResult {
  if (!isAppError(error)) return { success: false, message: "invite.messages.generic" };
  if (error.code === "PLAN_LIMIT_EXCEEDED") return { success: false, message: "invite.messages.planLimit", code: error.code };

  const messageMap: Record<string, string> = {
    INVITATION_ALREADY_ACCEPTED: "invite.messages.alreadyAccepted",
    INVITATION_REVOKED: "invite.messages.revoked",
    INVITATION_EXPIRED: "invite.messages.expired",
    INVITATION_NOT_PENDING: "invite.messages.invalid",
    INVITATION_AGENCY_REQUIRED: "invite.messages.invalidConfiguration",
    INVITATION_AGENCY_INVALID: "invite.messages.invalidConfiguration",
    INVITATION_ROLE_INVALID: "invite.messages.invalidConfiguration",
    INVITATION_MEMBER_ROLE_MISSING: "invite.messages.invalidConfiguration",
    INVITATION_MEMBER_ROLE_INVALID: "invite.messages.invalidConfiguration",
    INVITATION_EMAIL_MISMATCH: "invite.messages.emailMismatch",
    INVITATION_COMPANY_MISMATCH: "invite.messages.companyMismatch",
    INVITATION_ACCOUNT_EXISTS: "invite.messages.accountExists",
  };

  if (error.code === "NOT_FOUND") return { success: false, message: "invite.messages.invalid", code: error.code };
  return { success: false, message: messageMap[error.message] ?? "invite.messages.validation", code: error.code };
}

async function setAcceptedAgency(agencyId: string) {
  (await cookies()).set(CURRENT_AGENCY_COOKIE, agencyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

async function signInAcceptedUser(input: { email: string; password: string; rememberMe?: boolean }) {
  const result = await auth.api.signInEmail({
    body: {
      email: input.email,
      password: input.password,
      rememberMe: input.rememberMe ?? true,
    },
    headers: await headers(),
  });
  if (result?.user?.id) {
    await touchLastLoginService(result.user.id);
    return result.user.id;
  }
  return null;
}

export async function createInvitedAccountAction(input: unknown): Promise<InviteAcceptanceActionResult> {
  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "invite.messages.validation" };

  try {
    const acceptance = await createInvitedAccountAndAcceptInvitationService({
      rawToken: parsed.data.token,
      fullName: parsed.data.fullName,
      password: parsed.data.password,
    });
    await signInAcceptedUser({ email: acceptance.email, password: parsed.data.password, rememberMe: true });
    await setAcceptedAgency(acceptance.agencyId);
    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    return resultForError(error);
  }
}

export async function signInAndAcceptInvitationAction(input: unknown): Promise<InviteAcceptanceActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "invite.messages.validation" };

  try {
    const authUserId = await signInAcceptedUser({
      email: parsed.data.email,
      password: parsed.data.password,
      rememberMe: parsed.data.rememberMe,
    });
    if (!authUserId) return { success: false, message: "invite.messages.signInFailed" };
    const acceptance = await acceptInvitationService({
      rawToken: parsed.data.token,
      userId: authUserId,
    });
    await setAcceptedAgency(acceptance.agencyId);
    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    return resultForError(error);
  }
}

export async function acceptInvitationForCurrentSessionAction(input: unknown): Promise<InviteAcceptanceActionResult> {
  const parsed = acceptCurrentSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "invite.messages.validation" };

  try {
    const current = await getCurrentSession();
    if (!current) return { success: false, message: "invite.messages.signInRequired" };
    const acceptance = await acceptInvitationService({
      rawToken: parsed.data.token,
      userId: current.authUser.id,
    });
    await setAcceptedAgency(acceptance.agencyId);
    return { success: true, redirectTo: "/dashboard" };
  } catch (error) {
    return resultForError(error);
  }
}
