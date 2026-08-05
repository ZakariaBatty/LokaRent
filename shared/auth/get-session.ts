import { headers } from "next/headers";
import { auth } from "./better-auth.config";
import { getBusinessUserForAuthUserService } from "@/modules/auth/services/auth.service";

export type CurrentSession = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["session"];
  authUser: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"];
  user: Awaited<ReturnType<typeof getBusinessUserForAuthUserService>>;
};

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await getBusinessUserForAuthUserService(session.user.id);
  return {
    session: session.session,
    authUser: session.user,
    user,
  };
}

export async function getCurrentUser() {
  const current = await getCurrentSession();
  return current?.user ?? null;
}
