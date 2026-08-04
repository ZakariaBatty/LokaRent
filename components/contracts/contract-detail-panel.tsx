"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  X,
  Info,
  FileText,
  ClipboardCheck,
  History,
  Download,
  Printer,
  Send,
  FileSignature,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { type Contract, statusConfig } from "@/lib/contracts-data"
import { WhatsAppShareButton } from "@/components/communication/whatsapp-share-button"
import { ContractOverviewTab } from "./tabs/contract-overview-tab"
import { ContractPdfTab } from "./tabs/contract-pdf-tab"
import { ContractStateTab } from "./tabs/contract-state-tab"
import { ContractHistoryTab } from "./tabs/contract-history-tab"

type TabId = "overview" | "pdf" | "state" | "history"

const tabs: Array<{ id: TabId; label: string; icon: typeof Info }> = [
  { id: "overview", label: "Vue d'ensemble", icon: Info },
  { id: "pdf", label: "Aperçu PDF", icon: FileText },
  { id: "state", label: "État du véhicule", icon: ClipboardCheck },
  { id: "history", label: "Historique", icon: History },
]

export function ContractDetailPanel({
  contract,
  onClose,
}: {
  contract: Contract
  onClose: () => void
}) {
  const [tab, setTab] = useState<TabId>("overview")
  const cfg = statusConfig[contract.status]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
      {/* Sticky glass header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-mono text-sm font-bold text-slate-900">
                  {contract.code}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.pillBg} ${cfg.pillText}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                <span className="truncate font-medium">{contract.client.fullName}</span>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="truncate">
                  {contract.car.brand} {contract.car.model}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {contract.client.phone && (
              <WhatsAppShareButton
                template="contract_summary"
                phoneNumber={contract.client.phone}
                templateData={{
                  contractCode: contract.code,
                  clientName: contract.client.fullName,
                  carBrand: contract.car.brand,
                  carModel: contract.car.model,
                  carPlate: contract.car.plate,
                  status: contract.status,
                }}
                title={`Contrat #${contract.code}`}
                size="sm"
              />
            )}
            <button
              onClick={() => toast.success("Contrat envoyé au client")}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              <Send className="h-3.5 w-3.5" />
              Envoyer
            </button>
            <button
              onClick={() => toast.success("Impression lancée")}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </button>
            <button
              onClick={() => toast.success("Téléchargement PDF lancé")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            {contract.status !== "termine" && (
              <button
                onClick={() => toast.success("Demande de signature envoyée")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-blue-700"
              >
                <FileSignature className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Signer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${active
                  ? "text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {active && (
                  <motion.div
                    layoutId="contract-tab-underline"
                    className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-5 lg:p-6">
        {tab === "overview" && <ContractOverviewTab contract={contract} />}
        {tab === "pdf" && <ContractPdfTab contract={contract} />}
        {tab === "state" && <ContractStateTab contract={contract} />}
        {tab === "history" && <ContractHistoryTab contract={contract} />}
      </div>
    </div>
  )
}
