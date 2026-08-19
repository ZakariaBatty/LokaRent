import { ReportsPageClient } from "@/components/reports/reports-page-client"
import { getReportsOverviewAction } from "@/modules/reports/actions/generate-report.action"
import type { ReportsPeriod } from "@/modules/reports/services/reports.service"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseRange(value: string | undefined): ReportsPeriod {
  if (value === "last_month" || value === "quarter" || value === "year" || value === "custom") return value
  return "this_month"
}

function parseDate(value: string | undefined) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const range = parseRange(first(params.range))
  const result = await getReportsOverviewAction({
    range,
    customFrom: parseDate(first(params.from)),
    customTo: parseDate(first(params.to)),
    currency: first(params.currency),
  })

  if (!result.success) {
    throw new Error(result.messageKey)
  }

  return <ReportsPageClient report={result.report} />
}
