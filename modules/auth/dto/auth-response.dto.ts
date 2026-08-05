import type { UserStatus } from "@lokarent/db";

export type AuthenticatedUserDto = {
  id: string;
  companyId: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  locale: string | null;
  timezone: string | null;
  status: UserStatus;
};

export type AuthResponseResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };
