"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpDown, ArrowUpRight, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { formatMAD, type CarFinance } from "@/lib/finances-data"
import { categoryAccent } from "@/lib/cars-data"
import { cn } from "@/lib/utils"

type SortKey = "revenue" | "expenses" | "profit" | "occupancyRate" | "roi"

export function FinancesPerCarTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: CarFinance[]
  selectedId: string | null
  onSelect: (car: CarFinance) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>("profit")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      return sortDir === "asc" ? va - vb : vb - va
    })
    return copy
  }, [rows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Détails par véhicule</h3>
          <p className="mt-0.5 text-xs text-slate-500">{rows.length} véhicules · cliquez pour analyser</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <Th className="pl-6">Voiture</Th>
              <ThSort active={sortKey === "revenue"} dir={sortDir} onClick={() => toggleSort("revenue")}>
                Revenus
              </ThSort>
              <ThSort active={sortKey === "expenses"} dir={sortDir} onClick={() => toggleSort("expenses")}>
                Charges
              </ThSort>
              <ThSort active={sortKey === "profit"} dir={sortDir} onClick={() => toggleSort("profit")}>
                Profit
              </ThSort>
              <ThSort
                active={sortKey === "occupancyRate"}
                dir={sortDir}
                onClick={() => toggleSort("occupancyRate")}
              >
                Occupation
              </ThSort>
              <ThSort active={sortKey === "roi"} dir={sortDir} onClick={() => toggleSort("roi")}>
                ROI
              </ThSort>
              <Th className="pr-6"></Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((car) => {
              const profitable = car.profit >= 0
              const selected = car.id === selectedId
              return (
                <tr
                  key={car.id}
                  onClick={() => onSelect(car)}
                  className={cn(
                    "group cursor-pointer border-b border-slate-100 transition-colors last:border-b-0",
                    selected ? "bg-indigo-50/40" : "hover:bg-slate-50/60",
                  )}
                >
                  <td className="py-3.5 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-semibold",
                          categoryAccent[car.category],
                        )}
                      >
                        {car.brand.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {car.brand} {car.model}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400">{car.plate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-slate-700">
                    {formatMAD(car.revenue)}
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-slate-500">
                    {formatMAD(car.expenses)}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                        profitable
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"
                          : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
                      )}
                    >
                      {profitable ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {profitable ? "+" : ""}
                      {formatMAD(car.profit)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${car.occupancyRate}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs font-medium tabular-nums text-slate-600">
                        {car.occupancyRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        car.roi >= 100
                          ? "text-emerald-700"
                          : car.roi >= 0
                            ? "text-slate-700"
                            : "text-rose-700",
                      )}
                    >
                      {car.roi >= 0 ? "+" : ""}
                      {car.roi}%
                    </span>
                  </td>
                  <td className="py-3.5 pl-3 pr-6 text-right">
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-colors",
                        selected ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-500",
                      )}
                    />
                  </td>
                </tr>
              )
            })}
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

function ThSort({
  children,
  active,
  dir,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-slate-900",
          active && "text-slate-900",
        )}
      >
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3 transition-transform",
            active && dir === "asc" && "rotate-180",
            active ? "text-indigo-500" : "text-slate-300",
          )}
        />
      </button>
    </th>
  )
}
