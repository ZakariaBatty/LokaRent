"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/shared/auth";
import type { AuthActionResult } from "./sign-in.action";

const forgotPasswordSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

export async function requestPasswordResetAction(input: unknown): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Adresse email invalide." };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: parsed.data.email,
        redirectTo: "/reset-password",
      },
      headers: await headers(),
    });
  } catch {
    // Keep account-existence and delivery details private.
  }

  return {
    success: true,
    message: "Si un compte existe, un lien de réinitialisation sera envoyé.",
  };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export async function resetPasswordAction(input: unknown): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Le lien ou le mot de passe est invalide." };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token: parsed.data.token,
        newPassword: parsed.data.password,
      },
      headers: await headers(),
    });
    return { success: true, redirectTo: "/login" };
  } catch {
    return { success: false, message: "Le lien de réinitialisation est invalide ou expiré." };
  }
}
