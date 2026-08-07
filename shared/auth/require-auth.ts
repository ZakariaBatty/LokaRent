import { redirect } from "next/navigation";
import { getCurrentSession } from "./get-session";

export async function requireAuth() {
  const current = await getCurrentSession();
  if (!current) redirect("/login");
  return current;
}

export async function redirectAuthenticatedUser(to = "/dashboard") {
  const current = await getCurrentSession();
  if (current) redirect(to);
}
