import { InvoicesPageClient } from "@/components/invoices/invoices-page-client";
import { listInvoiceCustomersAction, listInvoiceableReservationsAction, listInvoicesAction } from "@/modules/finances/actions/invoice.actions";
import type { InvoiceStatus, InvoiceType } from "@/lib/invoices-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>
type InvoiceDateRange = "all" | "this_month" | "last_month" | "quarter"

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parsePage(value: string | undefined) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | undefined): InvoiceStatus | "all" {
  if (value === "draft" || value === "issued" || value === "partial" || value === "paid" || value === "overdue" || value === "cancelled") return value
  return "all"
}

function toDatabaseStatus(status: InvoiceStatus | "all") {
  if (status === "all") return undefined
  if (status === "partial") return "partially_paid"
  if (status === "cancelled") return "voided"
  return status
}

function parseType(value: string | undefined): InvoiceType | "all" {
  return value === "rental" || value === "manual" ? value : "all"
}

function parseCustomerType(value: string | undefined) {
  return value === "individual" || value === "company" ? value : "all"
}

function parseSort(value: string | undefined) {
  return value === "amount_desc" || value === "due_asc" ? value : "recent"
}

function parseDateRange(value: string | undefined): InvoiceDateRange {
  if (value === "this_month" || value === "last_month" || value === "quarter") return value
  return "all"
}

function dateRange(value: InvoiceDateRange) {
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  if (value === "this_month") return { from: startOfMonth }
  if (value === "last_month") {
    return {
      from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
      to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)),
    }
  }
  if (value === "quarter") {
    const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3
    return { from: new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1)) }
  }
  return {}
}

export default async function InvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const search = first(params.search)?.trim() ?? ""
  const status = parseStatus(first(params.status))
  const type = parseType(first(params.type))
  const customerType = parseCustomerType(first(params.customerType))
  const currentDateRange = parseDateRange(first(params.dateRange))
  const sort = parseSort(first(params.sort))
  const page = parsePage(first(params.page))
  const [invoiceResult, reservationResult, customerResult] = await Promise.all([
    listInvoicesAction({
      page,
      pageSize: 25,
      search,
      status: toDatabaseStatus(status),
      type: type === "all" ? undefined : type,
      customerType: customerType === "all" ? undefined : customerType,
      sort,
      ...dateRange(currentDateRange),
    }),
    listInvoiceableReservationsAction({ take: 100 }),
    listInvoiceCustomersAction({ take: 100 }),
  ]);

  return (
    <InvoicesPageClient
      initialInvoices={invoiceResult.success ? invoiceResult.invoices : []}
      initialPagination={invoiceResult.success ? invoiceResult.pagination : undefined}
      initialFilters={{ search, status, type, customerType, dateRange: currentDateRange, sort }}
      invoiceableReservations={reservationResult.success ? reservationResult.reservations : []}
      customerOptions={customerResult.success ? customerResult.customers : []}
    />
  );
}
