"use server";

import { headers } from "next/headers";
import { auth } from "@/shared/auth";
import { registerOwnerService } from "../services/auth.service";
import { registerSchema } from "../validators/register.schema";
import type { AuthActionResult } from "./sign-in.action";

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Veuillez vérifier les informations saisies." };
  }

  try {
    const registration = await registerOwnerService({
      agencyName: parsed.data.agencyName,
      city: parsed.data.city,
      vehicleCount: parsed.data.vehicleCount,
      managerName: parsed.data.managerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      password: parsed.data.password,
      planName: parsed.data.planName,
    });

    await auth.api.signInEmail({
      body: {
        email: registration.authUser.email,
        password: parsed.data.password,
        rememberMe: true,
      },
      headers: await headers(),
    });

    return { success: true, redirectTo: `/onboarding?plan=${parsed.data.planName ?? "starter"}` };
  } catch {
    return { success: false, message: "Impossible de créer ce compte." };
  }
}
