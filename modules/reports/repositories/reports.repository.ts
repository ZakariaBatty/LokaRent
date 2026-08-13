import { prisma } from "@lokarent/db";
import type { DatabaseClient } from "@/shared/database";

export async function getAgencyDashboardCounts(
  input: { companyId: string; agencyId: string },
  db: DatabaseClient = prisma,
) {
  const [vehicles, customers, activeReservations, overdueInvoices, openExpenses] = await Promise.all([
    db.vehicle.count({ where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null } }),
    db.customer.count({ where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null } }),
    db.reservation.count({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        status: { in: ["confirmed", "active"] },
      },
    }),
    db.invoice.count({
      where: { companyId: input.companyId, agencyId: input.agencyId, status: "overdue", deletedAt: null },
    }),
    db.expense.count({
      where: { companyId: input.companyId, agencyId: input.agencyId, deletedAt: null },
    }),
  ]);

  return { vehicles, customers, activeReservations, overdueInvoices, openExpenses };
}

export async function getRevenueSummary(
  input: { companyId: string; agencyId: string; from?: Date; to?: Date },
  db: DatabaseClient = prisma,
) {
  const [invoices, payments, expenses] = await Promise.all([
    db.invoice.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.payment.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        ...(input.from || input.to ? { paidAt: { gte: input.from, lte: input.to } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.expense.aggregate({
      where: {
        companyId: input.companyId,
        agencyId: input.agencyId,
        deletedAt: null,
        ...(input.from || input.to ? { occurredAt: { gte: input.from, lte: input.to } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return { invoices, payments, expenses };
}

export const reportsRepository = {
  getAgencyDashboardCounts,
  getRevenueSummary,
};
