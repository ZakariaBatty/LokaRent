"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { FileText } from "lucide-react"
import { type Contract, type ContractStatus } from "@/lib/contracts-data"
import { useAgency } from "@/contexts/agency-context"
import { ContractsDateRange, ContractsToolbar } from "@/components/contracts/contracts-toolbar"
import { ContractsKpiCards } from "@/components/contracts/contracts-kpi-cards"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { ContractDetailPanel } from "@/components/contracts/contract-detail-panel"

export default function ContractsPage() {
  const { agencyData } = useAgency()
  const [contracts, setContracts] = useState<Contract[]>(agencyData.contracts)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ContractStatus | "all">("all")
  const [dateRange, setDateRange] = useState<ContractsDateRange>("all")
  const [selected, setSelected] = useState<Contract | null>(null)

  // Reset when agency switches
  useEffect(() => {
    setContracts(agencyData.contracts)
    setSelected(null)
  }, [agencyData])

  const active = contracts.filter(c => c.status === "en_cours").length
  const completed = contracts.filter(c => c.status === "termine").length
  const cancelled = contracts.filter(c => c.status === "annule").length
  const revenue = contracts
    .filter(c => c.status === "termine")
    .reduce((acc, c) => acc + c.pricing.total, 0)
  const pendingCautions = contracts.filter(c => c.caution.status === "en_attente").length

  const filtered = useMemo(() => {
    const now = new Date()
    return contracts.filter((c) => {
      if (status !== "all" && c.status !== status) return false

      if (dateRange !== "all") {
        const created = new Date(c.createdAt)
        const diffDays = Math.floor((now.getTime() - created.getTime()) / 86_400_000)
        if (dateRange === "last_30" && diffDays > 30) return false
        if (dateRange === "this_month") {
          if (created.getMonth() !== now.getMonth() || created.getFullYear() !== now.getFullYear()) return false
        }
        if (dateRange === "last_month") {
          const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          if (created.getMonth() !== lm.getMonth() || created.getFullYear() !== lm.getFullYear()) return false
        }
        if (dateRange === "this_year" && created.getFullYear() !== now.getFullYear()) return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = [c.code, c.client.fullName, c.client.phone, c.car.brand, c.car.model, c.car.plate]
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, status, dateRange])

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Contrats
          </h1>
          <p className="text-sm text-slate-500">
            Tous les contrats générés à partir de vos réservations.
          </p>
        </div>
      </motion.div>

      <ContractsKpiCards
        active={active}
        completed={completed}
        cancelled={cancelled}
        revenue={revenue}
        pendingCautions={pendingCautions}
      />

      <ContractsToolbar
        search={search}
        onSearch={setSearch}
        statusFilter={status}
        onStatus={setStatus}
        dateRange={dateRange}        // ← wla rename state l dateRange
        onDateRange={setDateRange}
        total={filtered.length}
      />


      <ContractsTable
        rows={filtered}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
      />

      {/* Right slide-over panel — same pattern as reservations/finances */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 md:w-[85%] lg:w-[80%]"
            >
              <ContractDetailPanel contract={selected} onClose={() => setSelected(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
