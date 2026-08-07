import {
  getAgencyDashboardCounts,
  getRevenueSummary,
} from "../repositories/reports.repository";

export async function getAgencyDashboardCountsService(input: {
  companyId: string;
  agencyId: string;
}) {
  return getAgencyDashboardCounts(input);
}

export async function getRevenueSummaryService(input: {
  companyId: string;
  agencyId: string;
  from?: Date;
  to?: Date;
}) {
  return getRevenueSummary(input);
}

export async function getDashboardSummaryService(input: {
  companyId: string;
  agencyId: string;
  from?: Date;
  to?: Date;
}) {
  const [counts, revenue] = await Promise.all([
    getAgencyDashboardCounts(input),
    getRevenueSummary(input),
  ]);
  return { counts, revenue };
}

export const reportsService = {
  getAgencyDashboardCountsService,
  getRevenueSummaryService,
  getDashboardSummaryService,
};
