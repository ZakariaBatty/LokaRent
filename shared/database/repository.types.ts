import type { Prisma, PrismaClient } from "@lokarent/db";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export type CompanyScope = {
  companyId: string;
};

export type AgencyScope = CompanyScope & {
  agencyId: string;
};

export type SoftDeleteOptions = {
  includeDeleted?: boolean;
};

export type SortDirection = "asc" | "desc";

export type DateRangeFilter = {
  from?: Date;
  to?: Date;
};

export type EntityScope = CompanyScope & {
  agencyId?: string;
};
