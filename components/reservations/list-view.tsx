"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Eye, Pencil, X, Trash2, AlertTriangle, MoreHorizontal, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/contexts/i18n-context"
import { type Reservation, statusConfig, formatMAD, formatDate } from "@/lib/reservations-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

export function ListView({
  reservations,
  onOpen,
  onEdit,
  selectedId,
  onCancel,
  onDelete,
  compact = false,
}: {
  reservations: Reservation[]
  onOpen: (r: Reservation) => void
  onEdit: (r: Reservation) => void
  selectedId: string | null
  onCancel: (id: string) => void
  onDelete: (id: string) => Promise<boolean>
  compact?: boolean
}) {
  const { t } = useI18n()
  const [confirmDelete, setConfirmDelete] = useState<Reservation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDeleteReservation = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const deleted = await onDelete(confirmDelete.id)
      if (deleted) {
        toast.success(t("reservations.form.deleted"))
        setConfirmDelete(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="max-h-[680px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Client</th>
              {!compact && <th className="px-4 py-3">Voiture</th>}
              {!compact && <th className="px-4 py-3">Début</th>}
              {!compact && <th className="px-4 py-3">Fin</th>}
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {reservations.map((r) => {
                const cfg = statusConfig[r.status]
                const isSelected = selectedId === r.id
                return (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpen(r)}
                    className={cn(
                      "cursor-pointer border-b border-slate-100 transition-colors last:border-b-0",
                      isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/60",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.overdue && (
                          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                        )}
                        <span className="font-mono text-[11px] font-semibold text-slate-500">{r.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-semibold text-white">
                          {r.client.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{r.client.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{r.client.phone}</p>
                        </div>
                      </div>
                    </td>
                    {!compact && (
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-slate-800">
                            {r.car.brand} {r.car.model}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">{r.car.plate}</p>
                        </div>
                      </td>
                    )}
                    {!compact && (
                      <td className="px-4 py-3 text-slate-700">{formatDate(r.startDate)}</td>
                    )}
                    {!compact && (
                      <td className="px-4 py-3 text-slate-700">{formatDate(r.endDate)}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {r.days}j
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMAD(r.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          cfg.pillBg,
                          cfg.pillText,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </td>
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
                          <DropdownMenuItem onClick={() => onOpen(r)} className="gap-2">
                            <Eye className="h-3.5 w-3.5" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(r)}
                            className="gap-2"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Éditer
                          </DropdownMenuItem>
                          {r.status !== "annulee" && r.status !== "terminee" && (
                            <DropdownMenuItem
                              onClick={() => {
                                onCancel(r.id)
                                toast.success("Réservation annulée")
                              }}
                              className="gap-2 text-amber-700"
                            >
                              <X className="h-3.5 w-3.5" />
                              Annuler
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setConfirmDelete(r)}
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
            {reservations.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Aucune réservation</p>
                    <p className="text-xs">Aucun résultat avec ces filtres.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <Trash2 className="h-5 w-5 text-rose-600" />
            </div>
            <AlertDialogTitle>{t("reservations.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reservations.delete.description").replace("{code}", confirmDelete?.code ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-lg">{t("reservations.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDeleteReservation()
              }}
              disabled={deleting}
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {t("reservations.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
