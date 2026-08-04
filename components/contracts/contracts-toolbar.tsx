"use client"

import { motion } from "motion/react"
import {
  CalendarRange,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  PenLine,
  Search,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { contractStatuses, statusConfig, type ContractStatus } from "@/lib/contracts-data"

export type ContractsPeriod = "all" | "today" | "week" | "month"
export type SignatureFilter = "all" | "signed" | "unsigned"

const periodLabels: Record<ContractsPeriod, string> = {
  all: "Toutes périodes",
  today: "Aujourd'hui",
  week: "7 derniers jours",
  month: "30 derniers jours",
}

const signatureLabels: Record<SignatureFilter, string> = {
  all: "Toutes signatures",
  signed: "Entièrement signés",
  unsigned: "À signer",
}

export function ContractsToolbar({
  search,
  onSearch,
  status,
  onStatus,
  period,
  onPeriod,
  signedFilter,
  onSignedFilter,
  total,
}: {
  search: string
  onSearch: (v: string) => void
  status: ContractStatus | "all"
  onStatus: (v: ContractStatus | "all") => void
  period: ContractsPeriod
  onPeriod: (v: ContractsPeriod) => void
  signedFilter: SignatureFilter
  onSignedFilter: (v: SignatureFilter) => void
  total: number
}) {
  const currentStatusLabel =
    status === "all" ? "Tous les statuts" : statusConfig[status]?.label ?? "Tous les statuts"

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 -mx-6 -mt-6 mb-2 border-b border-slate-200/70 bg-white/85 px-6 py-4 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
            <FileText className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                Contrats de Location
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {total} contrat{total > 1 ? "s" : ""}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Gestion légale et opérationnelle des contrats actifs et clos
            </p>
          </div>
        </div>

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <Download className="h-4 w-4" />
              Exporter
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => toast.success("Export PDF en cours…")}
              className="cursor-pointer gap-2"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              Liste PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast.success("Export Excel en cours…")}
              className="cursor-pointer gap-2"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[280px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Client, immatriculation, N° contrat…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {search && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Statut
              </span>
              {status !== "all" && statusConfig[status] && (
                <span className={cn("h-2 w-2 rounded-full", statusConfig[status].dot)} />
              )}
              <span>{currentStatusLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onStatus("all")}
              className={cn("cursor-pointer", status === "all" && "bg-indigo-50 text-indigo-700")}
            >
              Tous les statuts
            </DropdownMenuItem>
            {contractStatuses.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => onStatus(s)}
                className={cn(
                  "cursor-pointer gap-2",
                  status === s && "bg-indigo-50 text-indigo-700",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", statusConfig[s].dot)} />
                {statusConfig[s].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Period */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Période
              </span>
              <span>{periodLabels[period]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Période</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(periodLabels) as ContractsPeriod[]).map((k) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onPeriod(k)}
                className={cn("cursor-pointer", period === k && "bg-indigo-50 text-indigo-700")}
              >
                {periodLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Signature */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              <PenLine className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Signature
              </span>
              <span>{signatureLabels[signedFilter]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filtrer par signature</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(signatureLabels) as SignatureFilter[]).map((k) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onSignedFilter(k)}
                className={cn("cursor-pointer", signedFilter === k && "bg-indigo-50 text-indigo-700")}
              >
                {signatureLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}
