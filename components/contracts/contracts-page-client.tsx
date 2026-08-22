"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { FileText } from "lucide-react"
import { type Contract, type ContractStatus } from "@/lib/contracts-data"
import { ContractsToolbar, type ContractsPeriod, type SignatureFilter } from "@/components/contracts/contracts-toolbar"
import { ContractsKpiCards } from "@/components/contracts/contracts-kpi-cards"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { ContractDetailPanel } from "@/components/contracts/contract-detail-panel"

export function ContractsPageClient({ contracts: initialContracts }: { contracts: Contract[] }) {
  const router = useRouter()
  const [contracts] = useState<Contract[]>(initialContracts)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ContractStatus | "all">("all")
  const [period, setPeriod] = useState<ContractsPeriod>("all")
  const [signedFilter, setSignedFilter] = useState<SignatureFilter>("all")
  const [selected, setSelected] = useState<Contract | null>(null)

  const active = contracts.filter((c) => c.status === "en_cours").length
  const completed = contracts.filter((c) => c.status === "termine").length
  const cancelled = contracts.filter((c) => c.status === "annule").length
  const revenue = contracts.filter((c) => c.status === "termine").reduce((acc, c) => acc + c.pricing.total, 0)
  const pendingCautions = contracts.filter((c) => c.caution.status === "en_attente").length

  const filtered = useMemo(() => {
    const now = new Date()
    return contracts.filter((c) => {
      if (status !== "all" && c.status !== status) return false
      if (signedFilter === "signed" && (!c.signedByAgency || !c.signedByClient)) return false
      if (signedFilter === "unsigned" && c.signedByAgency && c.signedByClient) return false
      if (period !== "all") {
        const created = new Date(c.createdAt)
        const diffDays = Math.floor((now.getTime() - created.getTime()) / 86_400_000)
        if (period === "today" && diffDays > 0) return false
        if (period === "week" && diffDays > 7) return false
        if (period === "month" && diffDays > 30) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = [c.code, c.client.fullName, c.client.phone, c.car.brand, c.car.model, c.car.plate].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [contracts, search, status, period, signedFilter])

  return (
    <div className="space-y-6">
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
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Contrats</h1>
          <p className="text-sm text-slate-500">Tous les contrats générés à partir de vos réservations.</p>
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
        status={status}
        onStatus={setStatus}
        period={period}
        onPeriod={setPeriod}
        signedFilter={signedFilter}
        onSignedFilter={setSignedFilter}
        total={filtered.length}
      />

      <ContractsTable rows={filtered} selectedId={selected?.id ?? null} onSelect={setSelected} />

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
              <ContractDetailPanel contract={selected} onClose={() => { setSelected(null); router.refresh() }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
