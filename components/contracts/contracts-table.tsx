"use client"

import { motion } from "motion/react"
import { Download, Eye, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  cautionStatusConfig,
  formatDate,
  formatMAD,
  statusConfig,
  type Contract,
} from "@/lib/contracts-data"
import { cn } from "@/lib/utils"

const contractCategoryAccent: Record<Contract["car"]["category"], string> = {
  economique: "bg-emerald-50 text-emerald-700",
  compacte: "bg-blue-50 text-blue-700",
  berline: "bg-indigo-50 text-indigo-700",
  suv: "bg-violet-50 text-violet-700",
  premium: "bg-amber-50 text-amber-700",
  utilitaire: "bg-slate-100 text-slate-700",
}

export function ContractsTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: Contract[]
  selectedId: string | null
  onSelect: (c: Contract) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Tous les contrats</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {rows.length} contrat{rows.length > 1 ? "s" : ""} · cliquez sur une ligne pour ouvrir
            le détail
          </p>
        </div>
      </div>

      <div className="max-h-[640px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
            <tr className="border-b border-slate-100">
              <Th className="pl-6">N° Contrat</Th>
              <Th>Client</Th>
              <Th>Véhicule</Th>
              <Th>Période</Th>
              <Th>Durée</Th>
              <Th className="text-right">Montant</Th>
              <Th>Caution</Th>
              <Th>Statut</Th>
              <Th className="pr-6 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-20 text-center">
                  <p className="text-sm font-medium text-slate-700">Aucun contrat trouvé</p>
                  <p className="mt-1 text-xs text-slate-500">Essayez de modifier vos filtres</p>
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const sc = statusConfig[c.status]
                const cc = cautionStatusConfig[c.caution.status]
                const selected = c.id === selectedId
                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className={cn(
                      "group cursor-pointer border-b border-slate-100 transition-colors last:border-b-0",
                      selected ? "bg-indigo-50/40" : "hover:bg-slate-50/60",
                    )}
                  >
                    {/* N° Contrat */}
                    <td className="py-3.5 pl-6 pr-3">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        {c.code}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-3 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {c.client.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400">{c.client.phone}</p>
                      </div>
                    </td>

                    {/* Véhicule */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold",
                            contractCategoryAccent[c.car.category],
                          )}
                        >
                          {c.car.brand.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {c.car.brand} {c.car.model}
                          </p>
                          <p className="text-[11px] text-slate-400">{c.car.plate}</p>
                        </div>
                      </div>
                    </td>

                    {/* Période */}
                    <td className="px-3 py-3.5 text-xs text-slate-600">
                      <p>{formatDate(c.period.start)}</p>
                      <p className="text-slate-400">→ {formatDate(c.period.end)}</p>
                    </td>

                    {/* Durée */}
                    <td className="px-3 py-3.5 text-sm font-medium tabular-nums text-slate-700">
                      {c.period.days} j
                    </td>

                    {/* Montant */}
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        {formatMAD(c.pricing.total)}
                      </span>
                    </td>

                    {/* Caution */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-semibold tabular-nums text-slate-700">
                          {formatMAD(c.caution.amount)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            cc.pillBg,
                            cc.pillText,
                          )}
                        >
                          {cc.label}
                        </span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                          sc.pillBg,
                          sc.pillText,
                          sc.ring,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect(c)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          aria-label="Voir"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toast.success(`PDF ${c.code} téléchargé`)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Télécharger"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400">
                              {c.code}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                toast.info("Édition activée")
                              }}
                            >
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                toast.success("Contrat dupliqué")
                              }}
                            >
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                toast.success("Lien copié")
                              }}
                            >
                              Copier le lien
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                toast.error("Contrat annulé")
                              }}
                              className="text-rose-600 focus:text-rose-700"
                            >
                              Annuler le contrat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
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
