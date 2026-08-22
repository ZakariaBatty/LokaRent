"use client"

import { motion } from "motion/react"
import { FileImage, FileText, Paperclip, Pencil, Trash2 } from "lucide-react"
import {
  formatMoney,
  type ExpenseRecord,
} from "@/lib/expenses-data"
import { useI18n } from "@/contexts/i18n-context"
import { categoryAccent, formatDate } from "@/lib/cars-data"
import { cn } from "@/lib/utils"
import { ExpenseTypeBadge } from "./expense-type-badge"

export function ExpensesTable({
  rows,
  selectedId,
  totalAmount,
  totalCurrency,
  onSelect,
  onEdit,
  onDelete,
}: {
  rows: ExpenseRecord[]
  selectedId: string | null
  totalAmount: number
  totalCurrency: string
  onSelect: (e: ExpenseRecord) => void
  onEdit: (e: ExpenseRecord) => void
  onDelete: (e: ExpenseRecord) => void
}) {
  const { t } = useI18n()
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("expenses.table.title")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("expenses.table.subtitle").replace("{count}", String(rows.length))}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <Th className="pl-6">{t("expenses.table.date")}</Th>
              <Th>{t("expenses.table.vehicle")}</Th>
              <Th>{t("expenses.table.type")}</Th>
              <Th>{t("expenses.table.description")}</Th>
              <Th className="text-right">{t("expenses.table.amount")}</Th>
              <Th className="text-center">{t("expenses.table.document")}</Th>
              <Th className="pr-6 text-right">{t("expenses.table.actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-sm font-medium text-slate-700">{t("expenses.table.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("expenses.table.emptySubtitle")}</p>
                </td>
              </tr>
            ) : (
              rows.map((exp) => {
                const car = exp.carLabel ?? null
                const selected = exp.id === selectedId
                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelect(exp)}
                    className={cn(
                      "group cursor-pointer border-b border-slate-100 transition-colors last:border-b-0",
                      selected ? "bg-indigo-50/40" : "hover:bg-slate-50/60",
                    )}
                  >
                    <td className="py-3.5 pl-6 pr-3">
                      <p className="text-sm font-medium text-slate-900">{formatDate(exp.date)}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      {car ? (
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold",
                              categoryAccent[car.category as keyof typeof categoryAccent] ?? "bg-slate-100 text-slate-700",
                            )}
                          >
                            {car.brand.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {car.brand} {car.model}
                            </p>
                            <p className="text-[11px] text-slate-400">{car.plate}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                          {t("expenses.form.generalAgency")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <ExpenseTypeBadge type={exp.type} />
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="max-w-[280px] truncate text-sm text-slate-700">
                        {exp.description}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-rose-700">
                        -{formatMoney(exp.amount, exp.currency)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex justify-center">
                        {exp.attachment ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">
                            {exp.attachment.kind === "image" ? (
                              <FileImage className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span className="max-w-[120px] truncate">{exp.attachment.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
                            <Paperclip className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(exp)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          aria-label={t("expenses.actions.edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(exp)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={t("expenses.actions.delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/70">
                <td colSpan={4} className="py-3 pl-6 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("expenses.table.filteredTotal")}
                </td>
                <td className="py-3 pr-3 text-right">
                  <span className="text-sm font-bold tabular-nums text-slate-900">
                    -{formatMoney(totalAmount, totalCurrency)}
                  </span>
                </td>
                <td colSpan={2} className="py-3 pr-6 text-right text-xs font-medium text-slate-500">
                  {t("expenses.table.count").replace("{count}", String(rows.length))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </motion.div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500",
        className,
      )}
    >
      {children}
    </th>
  )
}
