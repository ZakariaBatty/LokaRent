"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Receipt, TrendingDown } from "lucide-react"
import {
  expenses as seedExpenses,
  formatMAD,
  type ExpenseRecord,
  type ExpenseType,
} from "@/lib/expenses-data"
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
  type ExpenseFormDraft,
} from "@/components/finances/expenses/expense-form-panel"

function withinRange(dateStr: string, range: DateRange) {
  const d = new Date(dateStr)
  const now = new Date()
  if (range === "all") return true
  if (range === "this_month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }
  if (range === "last_month") {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getFullYear() === last.getFullYear() && d.getMonth() === last.getMonth()
  }
  if (range === "last_30") {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return d >= cutoff
  }
  return true
}

export default function ExpensesPage() {
  const [records, setRecords] = useState<ExpenseRecord[]>(seedExpenses)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ExpenseType | "all">("all")
  const [carFilter, setCarFilter] = useState<string | "all">("all")
  const [dateRange, setDateRange] = useState<DateRange>("this_month")
  const [sort, setSort] = useState<ExpensesSortKey>("date")
  const [panelMode, setPanelMode] = useState<"add" | "edit" | null>(null)
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null)

  // Total for the month badge (independent of filters)
  const totalThisMonth = useMemo(
    () =>
      records
        .filter((r) => withinRange(r.date, "this_month"))
        .reduce((acc, r) => acc + r.amount, 0),
    [records],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let out = records.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false
      if (carFilter !== "all" && r.carId !== carFilter) return false
      if (!withinRange(r.date, dateRange)) return false
      if (q && !r.description.toLowerCase().includes(q)) return false
      return true
    })
    out.sort((a, b) => {
      if (sort === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
      return b.amount - a.amount
    })
    return out
  }, [records, search, typeFilter, carFilter, dateRange, sort])

  const filteredTotal = filtered.reduce((acc, r) => acc + r.amount, 0)

  function handleAdd() {
    setEditTarget(null)
    setPanelMode("add")
  }
  function handleEdit(e: ExpenseRecord) {
    setEditTarget(e)
    setPanelMode("edit")
  }
  function handleDelete(e: ExpenseRecord) {
    setRecords((rs) => rs.filter((r) => r.id !== e.id))
  }
  function handleSubmit(draft: ExpenseFormDraft) {
    if (panelMode === "add") {
      const id = `EXP-${String(Math.floor(Math.random() * 9000) + 1000)}`
      setRecords((rs) => [
        {
          id,
          date: draft.date,
          carId: draft.carId,
          type: draft.type,
          description: draft.description,
          amount: Number(draft.amount || 0),
          attachment: draft.attachment,
          internalNote: draft.internalNote,
        },
        ...rs,
      ])
    } else if (panelMode === "edit" && editTarget) {
      setRecords((rs) =>
        rs.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                date: draft.date,
                carId: draft.carId,
                type: draft.type,
                description: draft.description,
                amount: Number(draft.amount || 0),
                attachment: draft.attachment,
                internalNote: draft.internalNote,
              }
            : r,
        ),
      )
    }
    setPanelMode(null)
    setEditTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="text-xl font-semibold text-slate-900">Gestion des Dépenses</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Suivi de toutes les charges de la flotte et de l&apos;agence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-gradient-to-br from-rose-50/50 to-white px-4 py-2.5 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-rose-100">
            <TrendingDown className="h-4 w-4 text-rose-600" strokeWidth={2.25} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Total ce mois
            </p>
            <p className="text-base font-bold tabular-nums text-rose-700">
              -{formatMAD(totalThisMonth)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <ExpensesFilters
        search={search}
        onSearch={setSearch}
        typeFilter={typeFilter}
        onType={setTypeFilter}
        carFilter={carFilter}
        onCar={setCarFilter}
        dateRange={dateRange}
        onDateRange={setDateRange}
        sort={sort}
        onSort={setSort}
        resultCount={filtered.length}
        onAdd={handleAdd}
      />

      {/* Table */}
      <ExpensesTable
        rows={filtered}
        selectedId={editTarget?.id ?? null}
        totalAmount={filteredTotal}
        onSelect={handleEdit}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Mini analytics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ExpenseTypeDonut records={filtered} />
        <ExpensesByWeekChart records={filtered} />
      </div>

      {/* Right slide-over form */}
      <AnimatePresence>
        {panelMode && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setPanelMode(null)
                setEditTarget(null)
              }}
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
                onClose={() => {
                  setPanelMode(null)
                  setEditTarget(null)
                }}
                onSubmit={handleSubmit}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
