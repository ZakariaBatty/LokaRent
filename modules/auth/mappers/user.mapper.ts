import type { User } from "@lokarent/db";
import type { AuthenticatedUserDto } from "../dto/auth-response.dto";

export function toAuthenticatedUserDto(user: User): AuthenticatedUserDto {
  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    timezone: user.timezone,
    status: user.status,
  };
}
