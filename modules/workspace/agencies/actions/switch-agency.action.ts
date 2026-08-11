"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireCurrentCompanyContext } from "@/shared/auth/current-company-context";
import { CURRENT_AGENCY_COOKIE } from "@/shared/auth/current-agency-context";
import { createForbiddenError } from "@/shared/errors";
import { listUserAgencyMembershipsService } from "@/modules/workspace/members/services/members.service";

export type SwitchAgencyActionResult =
  | { ok: true; agencyId: string }
  | { ok: false; error: "AGENCY_ACCESS_DENIED" };

export async function switchCurrentAgencyAction(
  agencyId: string,
): Promise<SwitchAgencyActionResult> {
  const context = await requireCurrentCompanyContext();
  const memberships = await listUserAgencyMembershipsService({
    companyId: context.companyId,
    userId: context.userId,
  });
  const membership = memberships.find(
    (item) =>
      item.agencyId === agencyId &&
      item.status === "active" &&
      item.agency.status === "active",
  );

  if (!membership) {
    throw createForbiddenError("Agency access denied", {
      companyId: context.companyId,
      userId: context.userId,
      agencyId,
    });
  }

  (await cookies()).set(CURRENT_AGENCY_COOKIE, agencyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { ok: true, agencyId };
}
