import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAgencyService } from "@/modules/workspace/agencies/services/agencies.service";
import { listUserAgencyMembershipsService } from "@/modules/workspace/members/services/members.service";
import { createForbiddenError } from "@/shared/errors";
import { getCurrentCompanyContext } from "./current-company-context";

export const CURRENT_AGENCY_COOKIE = "lokarent_current_agency_id";

export type CurrentAgencyContext = {
  authUserId: string;
  userId: string;
  companyId: string;
  agencyId: string;
  agencyMembershipId: string;
  agencyRoleId: string;
  companyRoleId: string;
  isOwner: boolean;
  isPrimaryAgency: boolean;
};

export type CurrentAgencyOption = {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
  logo?: string;
  plan: "STARTER" | "PRO" | "BUSINESS";
  status: "active" | "suspended" | "cancelled" | "inactive";
  currency: string;
  vehicleCount: number;
  carCount: number;
  memberCount: number;
  reservationCount: number;
  customerCount: number;
  revenue: number;
  expenses: number;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  roleId: string;
  roleName: string;
  isPrimary: boolean;
};

function getAddressField(address: unknown, key: string) {
  if (!address || typeof address !== "object" || Array.isArray(address)) return "";
  const value = (address as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function getAgencyCity(agency: { address?: unknown; name: string; code: string }) {
  const city = getAddressField(agency.address, "city");
  if (city) return city;
  return agency.name || agency.code;
}

function getAgencyAddress(address: unknown) {
  return (
    getAddressField(address, "line1") ||
    getAddressField(address, "address") ||
    getAddressField(address, "street")
  );
}

function toAgencyOption(
  membership: Awaited<ReturnType<typeof listUserAgencyMembershipsService>>[number],
): CurrentAgencyOption {
  return {
    id: membership.agencyId,
    name: membership.agency.name,
    code: membership.agency.code,
    city: getAgencyCity(membership.agency),
    address: getAgencyAddress(membership.agency.address),
    email: membership.agency.email ?? "",
    phone: membership.agency.phone ?? "",
    plan: "PRO",
    status: membership.agency.status,
    currency: membership.agency.currency ?? "MAD",
    vehicleCount: membership.agency._count?.vehicles ?? 0,
    carCount: membership.agency._count?.vehicles ?? 0,
    memberCount: 0,
    reservationCount: 0,
    customerCount: 0,
    revenue: 0,
    expenses: 0,
    createdAt: membership.agency.createdAt.toISOString(),
    updatedAt: membership.agency.updatedAt.toISOString(),
    ownerId: membership.userId,
    roleId: membership.roleId,
    roleName: membership.role.name,
    isPrimary: membership.isPrimary,
  };
}

export async function listCurrentAgencyOptions(): Promise<CurrentAgencyOption[]> {
  const companyContext = await getCurrentCompanyContext();
  if (!companyContext) return [];

  const memberships = await listUserAgencyMembershipsService({
    companyId: companyContext.companyId,
    userId: companyContext.userId,
  });

  return memberships
    .filter((membership) => membership.status === "active" && membership.agency.status === "active")
    .map(toAgencyOption);
}

export async function getCurrentAgencyContext(): Promise<CurrentAgencyContext | null> {
  const companyContext = await getCurrentCompanyContext();
  if (!companyContext) return null;

  const memberships = await listUserAgencyMembershipsService({
    companyId: companyContext.companyId,
    userId: companyContext.userId,
  });
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active" && membership.agency.status === "active",
  );
  const selectedAgencyId = (await cookies()).get(CURRENT_AGENCY_COOKIE)?.value;
  const agencyMembership =
    activeMemberships.find((membership) => membership.agencyId === selectedAgencyId) ??
    activeMemberships.find((membership) => membership.isPrimary) ??
    activeMemberships[0];

  if (!agencyMembership) {
    throw createForbiddenError("Active agency membership required", {
      companyId: companyContext.companyId,
      userId: companyContext.userId,
    });
  }

  await getAgencyService({
    companyId: companyContext.companyId,
    agencyId: agencyMembership.agencyId,
  });

  return {
    authUserId: companyContext.authUserId,
    userId: companyContext.userId,
    companyId: companyContext.companyId,
    agencyId: agencyMembership.agencyId,
    agencyMembershipId: agencyMembership.id,
    agencyRoleId: agencyMembership.roleId,
    companyRoleId: companyContext.companyRoleId,
    isOwner: companyContext.isOwner,
    isPrimaryAgency: agencyMembership.isPrimary,
  };
}

export async function requireCurrentAgencyContext() {
  const context = await getCurrentAgencyContext();
  if (!context) redirect("/login");
  return context;
}
