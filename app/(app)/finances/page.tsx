import { FinancesPageClient } from "@/components/finances/finances-page-client"
import { getFinanceOverviewReportAction } from "@/modules/finances/actions/reporting.actions"
import type { FinanceReportingRange } from "@/modules/finances/services/finances.service"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseRange(value: string | undefined): FinanceReportingRange {
  if (value === "last_month" || value === "quarter" || value === "year" || value === "custom") return value
  return "this_month"
}

function parseDate(value: string | undefined) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default async function FinancesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const range = parseRange(first(params.range))
  const result = await getFinanceOverviewReportAction({
    range,
    customFrom: parseDate(first(params.from)),
    customTo: parseDate(first(params.to)),
    currency: first(params.currency),
  })

  if (!result.success) {
    throw new Error(result.messageKey)
  }

  return <FinancesPageClient report={result.report} />
}
