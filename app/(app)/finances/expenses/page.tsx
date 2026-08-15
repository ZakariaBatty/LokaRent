import { ExpensesPageClient } from "@/components/finances/expenses/expenses-page-client"
import {
  getExpenseDefaultsAction,
  listExpenseCategoriesAction,
  listExpensesAction,
  listExpenseReservationsAction,
  listExpenseVehiclesAction,
} from "@/modules/finances/actions/expense.actions"
import type { DateRange, ExpensesSortKey } from "@/components/finances/expenses/expenses-filters"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseDateRange(value: string | undefined): DateRange {
  if (value === "last_month" || value === "last_30" || value === "all") return value
  return "this_month"
}

function parseSort(value: string | undefined): ExpensesSortKey {
  return value === "amount" ? "amount" : "date"
}

function dateRange(value: DateRange) {
  const now = new Date()
  if (value === "all") return {}
  if (value === "last_30") {
    const from = new Date(now)
    from.setDate(from.getDate() - 30)
    return { from }
  }
  if (value === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from, to }
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from, to }
}

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Number(first(params.page) ?? 1)
  const search = first(params.search)
  const categoryId = first(params.categoryId)
  const vehicleId = first(params.vehicleId)
  const selectedRange = parseDateRange(first(params.dateRange))
  const sort = parseSort(first(params.sort))
  const categoriesResult = await listExpenseCategoriesAction()
  const categories = categoriesResult.success ? categoriesResult.categories : []
  const categoryFilter = categoryId && categories.some((category) => category.id === categoryId) ? categoryId : "all"
  const [expensesResult, vehiclesResult, reservationsResult, defaultsResult] = await Promise.all([
    listExpensesAction({
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 25,
      search,
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      vehicleId,
      sort,
      ...dateRange(selectedRange),
    }),
    listExpenseVehiclesAction({ take: 100 }),
    listExpenseReservationsAction({ take: 100 }),
    getExpenseDefaultsAction(),
  ])

  return (
    <ExpensesPageClient
      initialExpenses={expensesResult.success ? expensesResult.expenses : []}
      initialPagination={expensesResult.success ? expensesResult.pagination : undefined}
      initialTotals={expensesResult.success ? expensesResult.totals : []}
      initialFilters={{
        search: search ?? "",
        categoryFilter,
        carFilter: vehicleId ?? "all",
        dateRange: selectedRange,
        sort,
      }}
      categories={categories}
      vehicles={vehiclesResult.success ? vehiclesResult.vehicles : []}
      reservations={reservationsResult.success ? reservationsResult.reservations : []}
      defaultCurrency={defaultsResult.success ? defaultsResult.defaults.currency : "MAD"}
    />
  )
}
