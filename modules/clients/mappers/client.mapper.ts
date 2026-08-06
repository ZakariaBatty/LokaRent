import type { CustomerStatus, CustomerType, Prisma } from "@lokarent/db";
import type { Client, ClientStatus, ClientTier, Nationality, Reservation } from "@/lib/clients-data";
import type { ClientBlacklistDto, ClientDetailDto, ClientDocumentDto } from "../dto/client-response.dto";

type CustomerWithProfile = Prisma.CustomerGetPayload<{
  include: {
    individual: true;
    business: true;
    contacts: true;
    documents: true;
    blacklist: true;
  };
}>;

const NATIONALITIES = new Set<Nationality>([
  "Marocain",
  "Français",
  "Espagnol",
  "Anglais",
  "Allemand",
]);

function toIso(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNullableIso(value: Date | string | null | undefined) {
  return toIso(value) ?? null;
}

function mapStatus(status: CustomerStatus): ClientStatus {
  if (status === "blacklisted") return "blacklist";
  if (status === "inactive") return "inactif";
  return "actif";
}

function mapTier(customer: CustomerWithProfile): ClientTier {
  if (customer.status === "inactive") return "regular";
  return "new";
}

function displayNationality(value?: string | null): Nationality {
  if (value && NATIONALITIES.has(value as Nationality)) return value as Nationality;
  if (value === "MA") return "Marocain";
  if (value === "FR") return "Français";
  if (value === "ES") return "Espagnol";
  if (value === "GB") return "Anglais";
  if (value === "DE") return "Allemand";
  return "Marocain";
}

function fullName(customer: CustomerWithProfile) {
  if (customer.type === "company") {
    return customer.business?.companyName ?? customer.email ?? customer.phone ?? customer.code;
  }
  return [customer.individual?.firstName, customer.individual?.lastName].filter(Boolean).join(" ") || customer.code;
}

function idType(customer: CustomerWithProfile): "CIN" | "Passeport" | undefined {
  if (!customer.individual) return undefined;
  if (customer.individual.cinNumber) return "CIN";
  return undefined;
}

function idNumber(customer: CustomerWithProfile) {
  return customer.individual?.cinNumber ?? "";
}

function activeBlacklist(customer: CustomerWithProfile) {
  return customer.blacklist
    .filter((entry) => entry.liftedAt === null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

export function mapCustomerToClient(customer: CustomerWithProfile): Client {
  const activeBlacklistEntry = activeBlacklist(customer);
  const createdAt = toIso(customer.createdAt) ?? new Date(0).toISOString();
  const displayName = fullName(customer);

  return {
    id: customer.id,
    type: customer.type,
    fullName: displayName,
    phone: customer.phone ?? customer.business?.contactPersonPhone ?? "",
    email: customer.email ?? "",
    city: "—",
    nationality: displayNationality(customer.individual?.nationality),
    status: mapStatus(customer.status),
    tier: mapTier(customer),
    idType: idType(customer),
    idNumber: idNumber(customer),
    idExpiry: toIso(customer.individual?.cinExpiresAt) ?? createdAt,
    idScanned: customer.documents.some((document) => document.type === "national_id"),
    licenseNumber: customer.individual?.drivingLicenseNumber ?? "",
    licenseExpiry: toIso(customer.individual?.drivingLicenseExpiresAt) ?? createdAt,
    licenseCategory: "B",
    licenseScanned: customer.documents.some((document) => document.type === "driving_license"),
    companyName: customer.business?.companyName,
    registrationNumber: customer.business?.registrationNumber ?? undefined,
    taxId: customer.business?.taxId ?? undefined,
    companyEmail: customer.type === "company" ? customer.email ?? undefined : undefined,
    companyPhone: customer.type === "company" ? customer.phone ?? undefined : undefined,
    contactPersonName: customer.business?.contactPersonName ?? undefined,
    contactPersonPhone: customer.business?.contactPersonPhone ?? undefined,
    totalRentals: 0,
    totalSpent: 0,
    lastRentalDate: createdAt,
    monthly: [0, 0, 0, 0, 0, 0],
    createdAt,
    blacklistReason: activeBlacklistEntry?.reason,
    reservations: [] satisfies Reservation[],
    notes: customer.notes
      ? [
          {
            id: `${customer.id}-note`,
            date: createdAt,
            author: "System",
            body: customer.notes,
          },
        ]
      : [],
  };
}

export function mapCustomerToDetail(customer: CustomerWithProfile): ClientDetailDto {
  const client = mapCustomerToClient(customer);
  const documents: ClientDocumentDto[] = customer.documents.map((document) => ({
    id: document.id,
    type: document.type,
    documentNumber: document.documentNumber,
    issuedAt: toNullableIso(document.issuedAt),
    expiresAt: toNullableIso(document.expiresAt),
    issuingCountry: document.issuingCountry,
    documentUrl: document.documentUrl,
  }));
  const blacklistEntries: ClientBlacklistDto[] = customer.blacklist.map((entry) => ({
    id: entry.id,
    reason: entry.reason,
    severity: entry.severity,
    createdAt: entry.createdAt.toISOString(),
    liftedAt: toNullableIso(entry.liftedAt),
  }));

  return {
    ...client,
    dbType: customer.type as CustomerType,
    dbStatus: customer.status as CustomerStatus,
    contacts: customer.contacts.map((contact) => ({
      id: contact.id,
      type: contact.type,
      value: contact.value,
      isPrimary: contact.isPrimary,
    })),
    documents,
    blacklistEntries,
  };
}
