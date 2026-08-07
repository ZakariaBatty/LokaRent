import type {
  BlacklistSeverity,
  ContactType,
  CustomerDocumentType,
  CustomerStatus,
  CustomerType,
} from "@lokarent/db";
import type { Client } from "@/lib/clients-data";

export type ClientListDto = {
  data: Client[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type ClientContactDto = {
  id: string;
  type: ContactType;
  value: string;
  isPrimary: boolean;
};

export type ClientDocumentDto = {
  id: string;
  type: CustomerDocumentType;
  documentNumber: string;
  issuedAt: string | null;
  expiresAt: string | null;
  issuingCountry: string | null;
  documentUrl: string | null;
};

export type ClientBlacklistDto = {
  id: string;
  reason: string;
  severity: BlacklistSeverity;
  createdAt: string;
  liftedAt: string | null;
};

export type ClientDetailDto = Client & {
  dbType: CustomerType;
  dbStatus: CustomerStatus;
  contacts: ClientContactDto[];
  documents: ClientDocumentDto[];
  blacklistEntries: ClientBlacklistDto[];
};
