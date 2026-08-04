"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  Receipt,
  Building2,
  User,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import {
  type Invoice,
  statusConfig,
  invoiceTypeConfig,
  formatMAD,
  formatDate,
} from "@/lib/invoices-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

export function InvoicesTable({
  invoices,
  selectedId,
  onOpen,
  onEdit,
  onDelete,
  onNew,
}: {
  invoices: Invoice[]
  selectedId: string | null
  onOpen: (inv: Invoice) => void
  onEdit: (inv: Invoice) => void
  onDelete: (id: string) => void
  onNew: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null)

  if (invoices.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
          <Receipt className="h-6 w-6 text-slate-400" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">Aucune facture trouvée</p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          Aucun résultat ne correspond à vos filtres. Modifiez les filtres ou créez une nouvelle facture.
        </p>
        <button
          type="button"
          onClick={onNew}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-blue-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)]"
        >
          <Plus className="h-4 w-4" />
          Créer une facture
        </button>
      </motion.div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="max-h-[680px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3">N° Facture</th>
              <th className="px-4 py-3">Client</th>
              <th className="hidden px-4 py-3 md:table-cell">Type client</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Statut</th>
              <th className="hidden px-4 py-3 lg:table-cell">Émission</th>
              <th className="hidden px-4 py-3 lg:table-cell">Échéance</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="hidden px-4 py-3 text-right xl:table-cell">Payé</th>
              <th className="hidden px-4 py-3 text-right xl:table-cell">Restant</th>
              <th className="w-14 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {invoices.map((inv) => {
                const sc = statusConfig[inv.status]
                const tc = invoiceTypeConfig[inv.type]
                const isSelected = selectedId === inv.id
                const isOverdue = inv.status === "overdue"
                return (
                  <motion.tr
                    key={inv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpen(inv)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors last:border-b-0",
                      isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/60",
                    )}
                  >
                    {/* N° Facture */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                        )}
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {inv.number}
                        </span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-semibold text-white">
                          {inv.customerName
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{inv.customerName}</p>
                          <p className="truncate text-[11px] text-slate-500">{inv.customerPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type client */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        {inv.customerType === "company" ? (
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <User className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {inv.customerType === "company" ? "Entreprise" : "Particulier"}
                      </span>
                    </td>

                    {/* Type facture */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          tc.pillBg,
                          tc.pillText,
                        )}
                      >
                        {tc.label}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          sc.pillBg,
                          sc.pillText,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="hidden px-4 py-3 text-slate-700 lg:table-cell">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td
                      className={cn(
                        "hidden px-4 py-3 lg:table-cell",
                        isOverdue ? "font-semibold text-rose-600" : "text-slate-700",
                      )}
                    >
                      {formatDate(inv.dueDate)}
                    </td>

                    {/* Amounts */}
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatMAD(inv.total)}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-emerald-700 xl:table-cell">
                      {formatMAD(inv.paid)}
                    </td>
                    <td
                      className={cn(
                        "hidden px-4 py-3 text-right xl:table-cell",
                        inv.remaining > 0 ? "font-medium text-amber-700" : "text-slate-400",
                      )}
                    >
                      {formatMAD(inv.remaining)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem
                            onClick={() => onOpen(inv)}
                            className="gap-2"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(inv)}
                            className="gap-2"
                            disabled={inv.status === "cancelled"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Éditer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmDelete(inv)}
                            className="gap-2 text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <Trash2 className="h-5 w-5 text-rose-600" />
            </div>
            <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture {confirmDelete?.number} sera définitivement
              supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  onDelete(confirmDelete.id)
                  toast.success("Facture supprimée")
                }
                setConfirmDelete(null)
              }}
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
