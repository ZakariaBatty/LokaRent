"use server";

import { headers } from "next/headers";
import { auth } from "@/shared/auth";
import { touchLastLoginService } from "../services/auth.service";
import { signInSchema } from "../validators/sign-in.schema";

export type AuthActionResult = {
  success: boolean;
  message?: string;
  redirectTo?: string;
};

export async function signInAction(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Email ou mot de passe invalide." };
  }

  try {
    const result = await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        rememberMe: parsed.data.rememberMe,
      },
      headers: await headers(),
    });
    if (result?.user?.id) {
      await touchLastLoginService(result.user.id);
    }
    return { success: true, redirectTo: "/dashboard" };
  } catch {
    return { success: false, message: "Email ou mot de passe invalide." };
  }
}

export async function signOutAction(): Promise<AuthActionResult> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    return { success: false, message: "Déconnexion impossible pour le moment." };
  }
  return { success: true, redirectTo: "/login" };
}
