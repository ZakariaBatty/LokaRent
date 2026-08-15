"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Receipt, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import { formatMoney, type ExpenseRecord } from "@/lib/expenses-data"
import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
  uploadExpenseDocumentAction,
} from "@/modules/finances/actions/expense.actions"
import {
  ExpensesFilters,
  type DateRange,
  type ExpensesSortKey,
} from "@/components/finances/expenses/expenses-filters"
import { ExpensesTable } from "@/components/finances/expenses/expenses-table"
import { ExpenseTypeDonut } from "@/components/finances/expenses/expense-type-donut"
import { ExpensesByWeekChart } from "@/components/finances/expenses/expenses-by-week-chart"
import {
  ExpenseFormPanel,
  type ExpenseCategoryOption,
  type ExpenseFormDraft,
  type ExpenseReservationOption,
  type ExpenseVehicleOption,
} from "@/components/finances/expenses/expense-form-panel"

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

type ExpenseTotal = {
  currency: string
  amount: number
  count: number
}

type ExpenseFiltersState = {
  search: string
  categoryFilter: string | "all"
  carFilter: string | "all"
  dateRange: DateRange
  sort: ExpensesSortKey
}

function buildQueryString(input: {
  currentQueryString: string
  filters: ExpenseFiltersState
}) {
  const params = new URLSearchParams(input.currentQueryString)
  const search = input.filters.search.trim()
  if (search) params.set("search", search)
  else params.delete("search")

  if (input.filters.categoryFilter !== "all") params.set("categoryId", input.filters.categoryFilter)
  else params.delete("categoryId")

  if (input.filters.carFilter !== "all") params.set("vehicleId", input.filters.carFilter)
  else params.delete("vehicleId")
  if (input.filters.dateRange !== "this_month") params.set("dateRange", input.filters.dateRange)
  else params.delete("dateRange")
  if (input.filters.sort !== "date") params.set("sort", input.filters.sort)
  else params.delete("sort")
  params.delete("page")
  return params.toString()
}

function primaryTotal(totals: ExpenseTotal[], defaultCurrency: string) {
  const normalizedDefault = defaultCurrency.trim().toUpperCase()
  return totals.find((item) => item.currency === normalizedDefault) ?? totals[0] ?? { currency: normalizedDefault, amount: 0, count: 0 }
}

export function ExpensesPageClient({
  initialExpenses,
  initialPagination,
  initialTotals,
  initialFilters,
  categories,
  vehicles,
  reservations,
  defaultCurrency,
}: {
  initialExpenses: ExpenseRecord[]
  initialPagination?: Pagination
  initialTotals: ExpenseTotal[]
  initialFilters: ExpenseFiltersState
  categories: ExpenseCategoryOption[]
  vehicles: ExpenseVehicleOption[]
  reservations: ExpenseReservationOption[]
  defaultCurrency: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQueryString = searchParams.toString()
  const lastRequestedQueryRef = useRef<string | null>(null)
  const [records, setRecords] = useState<ExpenseRecord[]>(initialExpenses)
  const [totals, setTotals] = useState<ExpenseTotal[]>(initialTotals)
  const [filters, setFilters] = useState<ExpenseFiltersState>(initialFilters)
  const [panelMode, setPanelMode] = useState<"add" | "edit" | null>(null)
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null)
  const [loadingRows, setLoadingRows] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (lastRequestedQueryRef.current === currentQueryString) {
      lastRequestedQueryRef.current = null
      setLoadingRows(false)
    }
  }, [currentQueryString])

  useEffect(() => {
    setRecords(initialExpenses)
    setTotals(initialTotals)
    setLoadingRows(false)
  }, [initialExpenses, initialTotals])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQueryString = buildQueryString({ currentQueryString, filters })
      if (nextQueryString === currentQueryString || nextQueryString === lastRequestedQueryRef.current) return
      lastRequestedQueryRef.current = nextQueryString
      setLoadingRows(true)
      startTransition(() => {
        router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false })
      })
    }, 250)
    return () => window.clearTimeout(handle)
  }, [currentQueryString, filters, pathname, router])

  const filteredTotal = useMemo(() => primaryTotal(totals, defaultCurrency).amount, [defaultCurrency, totals])

  function closePanel() {
    setPanelMode(null)
    setEditTarget(null)
  }

  function handleAdd() {
    setEditTarget(null)
    setPanelMode("add")
  }

  function handleEdit(expense: ExpenseRecord) {
    setEditTarget(expense)
    setPanelMode("edit")
  }

  function handleDelete(expense: ExpenseRecord) {
    if (!window.confirm(t("expenses.delete.confirmation").replace("{description}", expense.description))) return
    startTransition(async () => {
      const result = await deleteExpenseAction({ expenseId: expense.id })
      if (!result.success) {
        toast.error(t(result.messageKey))
        return
      }
      setRecords((current) => current.filter((item) => item.id !== result.expenseId))
      if (editTarget?.id === result.expenseId) closePanel()
      toast.success(t("expenses.actions.deleted"))
      router.refresh()
    })
  }

  async function handleUpload(file: File) {
    const formData = new FormData()
    formData.set("file", file)
    const result = await uploadExpenseDocumentAction(formData)
    if (!result.success) {
      toast.error(t(result.messageKey))
      return null
    }
    toast.success(t("expenses.upload.uploaded"))
    return result.upload.url
  }

  function handleSubmit(draft: ExpenseFormDraft) {
    startTransition(async () => {
      const payload = {
        categoryId: draft.categoryId,
        vehicleId: draft.carId,
        reservationId: draft.reservationId,
        description: draft.description,
        amount: draft.amount,
        currency: draft.currency,
        occurredAt: draft.date,
        method: draft.method,
        reference: draft.reference,
        provider: draft.provider,
        internalNote: draft.internalNote,
        documentUrl: draft.documentUrl,
      }
      const result = panelMode === "edit" && editTarget
        ? await updateExpenseAction({ expenseId: editTarget.id, ...payload })
        : await createExpenseAction(payload)
      if (!result.success) {
        toast.error(t(result.messageKey))
        return
      }
      setRecords((current) => [result.expense, ...current.filter((item) => item.id !== result.expense.id)])
      toast.success(t(panelMode === "edit" ? "expenses.actions.updated" : "expenses.actions.created"))
      closePanel()
      router.refresh()
    })
  }

  const selectedTotal = primaryTotal(totals, defaultCurrency)
  const selectedCurrency = selectedTotal.currency || defaultCurrency
  const chartRecords = records.filter((record) => record.currency === selectedCurrency)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
            <Receipt className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{t("expenses.title")}</h1>
            <p className="mt-0.5 text-xs text-slate-500">{t("expenses.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-rose-50/50 to-white px-4 py-2.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-rose-100">
            <TrendingDown className="h-4 w-4 text-rose-600" strokeWidth={2.25} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {t("expenses.totalPeriod")}
            </p>
            <p className="text-base font-bold tabular-nums text-rose-700">
              -{formatMoney(selectedTotal.amount, selectedTotal.currency || defaultCurrency)}
            </p>
          </div>
        </div>
      </motion.div>

      <ExpensesFilters
        search={filters.search}
        onSearch={(search) => setFilters((current) => ({ ...current, search }))}
        categoryFilter={filters.categoryFilter}
        onCategory={(categoryFilter) => setFilters((current) => ({ ...current, categoryFilter }))}
        carFilter={filters.carFilter}
        onCar={(carFilter) => setFilters((current) => ({ ...current, carFilter }))}
        dateRange={filters.dateRange}
        onDateRange={(dateRange) => setFilters((current) => ({ ...current, dateRange }))}
        sort={filters.sort}
        onSort={(sort) => setFilters((current) => ({ ...current, sort }))}
        resultCount={initialPagination?.total ?? records.length}
        categories={categories}
        vehicles={vehicles}
        onAdd={handleAdd}
      />

      <ExpensesTable
        rows={records}
        selectedId={editTarget?.id ?? null}
        totalAmount={filteredTotal}
        totalCurrency={selectedCurrency}
        onSelect={handleEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ExpenseTypeDonut records={chartRecords} currency={selectedCurrency} />
        <ExpensesByWeekChart records={chartRecords} currency={selectedCurrency} />
      </div>

      {initialPagination && initialPagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={!initialPagination.hasPreviousPage || loadingRows || isPending}
            onClick={() => {
              const params = new URLSearchParams(currentQueryString)
              const nextPage = initialPagination.page - 1
              if (nextPage <= 1) params.delete("page")
              else params.set("page", String(nextPage))
              const nextQueryString = params.toString()
              lastRequestedQueryRef.current = nextQueryString
              setLoadingRows(true)
              startTransition(() => router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false }))
            }}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t("expenses.pagination.previous")}
          </button>
          <span className="text-xs font-medium text-slate-500">
            {t("expenses.pagination.page")
              .replace("{page}", String(initialPagination.page))
              .replace("{totalPages}", String(initialPagination.totalPages))}
          </span>
          <button
            type="button"
            disabled={!initialPagination.hasNextPage || loadingRows || isPending}
            onClick={() => {
              const params = new URLSearchParams(currentQueryString)
              params.set("page", String(initialPagination.page + 1))
              const nextQueryString = params.toString()
              lastRequestedQueryRef.current = nextQueryString
              setLoadingRows(true)
              startTransition(() => router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false }))
            }}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t("expenses.pagination.next")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {panelMode && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePanel}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 sm:w-[520px] md:w-[580px]"
            >
              <ExpenseFormPanel
                mode={panelMode}
                initial={editTarget}
                categories={categories}
                vehicles={vehicles}
                reservations={reservations}
                defaultCurrency={defaultCurrency}
                onClose={closePanel}
                onSubmit={handleSubmit}
                onUpload={handleUpload}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
