"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  X,
  RefreshCw,
  Building2,
} from "lucide-react"
import {
  mockAgencies,
  mockSubscriptions,
  mockInvoices,
  planLabels,
  planPrices,
  formatMAD,
  getAgencyById,
  type Subscription,
  type Invoice,
} from "@/lib/mock-workspaces"
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header"
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ActiveTab = "subscriptions" | "invoices"

const cycleLabels: Record<Subscription["billingCycle"], string> = {
  monthly: "Mensuel",
  "6_months": "Semestriel",
  annual: "Annuel",
}

const subStatusConfig: Record<
  Subscription["status"],
  { label: string; dot: string; bg: string }
> = {
  trialing: { label: "Essai", dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  active: { label: "Actif", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  past_due: { label: "En retard", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  cancelled: { label: "Annulé", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500" },
}

const planColors: Record<Subscription["plan"], string> = {
  STARTER: "bg-sky-50 text-sky-700 ring-sky-100",
  PRO: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  BUSINESS: "bg-violet-50 text-violet-700 ring-violet-100",
}

const invoiceStatusConfig: Record<
  Invoice["status"],
  { label: string; icon: typeof CheckCircle2; dot: string; bg: string }
> = {
  paid: { label: "Payée", icon: CheckCircle2, dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  sent: { label: "Envoyée", icon: Clock, dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  pending: { label: "En attente", icon: Clock, dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  failed: { label: "Échouée", icon: XCircle, dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700" },
  refunded: { label: "Remboursée", icon: XCircle, dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500" },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

export default function WorkspaceBillingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("subscriptions")
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)

  const selectedSub = mockSubscriptions.find((s) => s.id === selectedSubId) ?? null

  const invoices = useMemo(
    () => [...mockInvoices].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()),
    [],
  )

  const totalMonthly = useMemo(
    () => mockSubscriptions.filter((s) => s.status !== "cancelled").reduce((acc, s) => acc + planPrices[s.plan], 0),
    [],
  )

  const hasSelection = !!selectedSub

  const tabs: { value: ActiveTab; label: string; count: number }[] = [
    { value: "subscriptions", label: "Abonnements", count: mockSubscriptions.length },
    { value: "invoices", label: "Factures", count: invoices.length },
  ]

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="creditCard"
          breadcrumb="Facturation"
          title="Facturation"
          description="Gérez les abonnements de vos agences et consultez vos factures."
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      {/* Tab bar + total */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-slate-200/60 bg-white p-1 shadow-sm w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => { setActiveTab(tab.value); setSelectedSubId(null) }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {tab.label}
              <span className={cn(
                "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                activeTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-1.5">
          <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">Total mensuel :</span>
          <span className="text-xs font-bold text-indigo-900 tabular-nums">{formatMAD(totalMonthly)}</span>
        </div>
      </div>

      <div className="flex gap-5">
        {/* LEFT */}
        <motion.div
          layout
          animate={{ width: hasSelection && activeTab === "subscriptions" ? "40%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
          {activeTab === "subscriptions" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <p className="text-xs font-semibold text-slate-500">
                  {mockSubscriptions.length} abonnement{mockSubscriptions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Agence</th>
                      <th className="px-4 py-3">Plan</th>
                      {!hasSelection && (
                        <>
                          <th className="px-4 py-3">Cycle</th>
                          <th className="px-4 py-3">Montant</th>
                          <th className="px-4 py-3">Prochaine fact.</th>
                        </>
                      )}
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {mockSubscriptions.map((sub, idx) => {
                      const agency = getAgencyById(sub.agencyId)
                      const sc = subStatusConfig[sub.status]
                      const active = selectedSubId === sub.id
                      return (
                        <motion.tr
                          key={sub.id}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          onClick={() => setSelectedSubId(active ? null : sub.id)}
                          className={cn(
                            "cursor-pointer border-b border-slate-100/50 transition",
                            active ? "bg-indigo-50/60" : "hover:bg-slate-50/60",
                          )}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900 leading-tight">{agency?.name ?? "—"}</p>
                            <p className="text-[11px] text-slate-400">{agency?.city}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", planColors[sub.plan])}>
                              {planLabels[sub.plan]}
                            </span>
                          </td>
                          {!hasSelection && (
                            <>
                              <td className="px-4 py-3.5 text-xs text-slate-500">{cycleLabels[sub.billingCycle]}</td>
                              <td className="px-4 py-3.5 font-semibold text-slate-900 tabular-nums">{formatMAD(planPrices[sub.plan])}</td>
                              <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">{fmt(sub.nextBillingDate)}</td>
                            </>
                          )}
                          <td className="px-4 py-3.5">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", sc.bg)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <ChevronRight className={cn("h-4 w-4 transition", active ? "text-indigo-500 rotate-90" : "text-slate-300")} />
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <p className="text-xs font-semibold text-slate-500">
                  {invoices.length} facture{invoices.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Référence</th>
                      <th className="px-4 py-3">Agence</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Émission</th>
                      <th className="px-4 py-3">Échéance</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {invoices.map((inv, idx) => {
                        const agency = getAgencyById(inv.agencyId)
                        const sc = invoiceStatusConfig[inv.status]
                        const StatusIcon = sc.icon
                        return (
                          <motion.tr
                            key={inv.id}
                            layout
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="group border-b border-slate-100/50 hover:bg-slate-50/40 transition"
                          >
                            <td className="px-5 py-3.5 font-mono text-sm font-medium text-slate-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                {agency?.name ?? "—"}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900 tabular-nums">{formatMAD(inv.amount)}</td>
                            <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">{fmt(inv.issuedAt)}</td>
                            <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">{fmt(inv.dueAt)}</td>
                            <td className="px-4 py-3.5">
                              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", sc.bg)}>
                                <StatusIcon className="h-3 w-3 shrink-0" />
                                {sc.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => toast.success("Téléchargement PDF", { description: inv.invoiceNumber })}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition hover:bg-slate-50"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* RIGHT — subscription detail */}
        <AnimatePresence>
          {selectedSub && activeTab === "subscriptions" && (
            <motion.div
              key="sub-detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "60%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="min-w-0 shrink-0"
              style={{ alignSelf: "flex-start" }}
            >
              <SubscriptionDetailPanel
                sub={selectedSub}
                onClose={() => setSelectedSubId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SubscriptionDetailPanel({ sub, onClose }: { sub: Subscription; onClose: () => void }) {
  const agency = getAgencyById(sub.agencyId)
  const sc = subStatusConfig[sub.status]
  const agencyInvoices = mockInvoices.filter((i) => i.agencyId === sub.agencyId)

  return (
    <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{agency?.name ?? "—"}</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", planColors[sub.plan])}>
              {planLabels[sub.plan]}
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", sc.bg)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
              {sc.label}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Details */}
      <div className="px-5 py-5 space-y-5">
        {/* Pricing */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Montant</p>
          <p className="mt-1 text-3xl font-bold text-indigo-700 tabular-nums">
            {formatMAD(planPrices[sub.plan])}
            <span className="ml-1 text-sm font-medium text-indigo-400">/mois</span>
          </p>
          <p className="mt-1 text-xs text-indigo-600">{cycleLabels[sub.billingCycle]}</p>
        </div>

        {/* Key dates */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dates clés</p>
          <DateRow label="Début de période" value={new Date(sub.currentPeriodStart).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
          <DateRow label="Fin de période" value={new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
          <DateRow label="Prochaine facturation" value={new Date(sub.nextBillingDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} highlight />
          {sub.trialEndDate && (
            <DateRow label="Fin d&apos;essai" value={new Date(sub.trialEndDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} />
          )}
        </div>

        {/* Settings */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paramètres</p>
          <div className="flex items-center justify-between rounded-lg border border-slate-200/60 px-3 py-2.5">
            <span className="text-xs font-medium text-slate-700">Renouvellement automatique</span>
            <span className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
              sub.autoRenew ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}>
              {sub.autoRenew ? "Activé" : "Désactivé"}
            </span>
          </div>
        </div>

        {/* Associated invoices */}
        {agencyInvoices.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Factures associées ({agencyInvoices.length})
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200/60">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-2">Réf.</th>
                    <th className="px-4 py-2">Montant</th>
                    <th className="px-4 py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyInvoices.map((inv) => {
                    const isc = invoiceStatusConfig[inv.status]
                    const IIcon = isc.icon
                    return (
                      <tr key={inv.id} className="border-b border-slate-100/60 last:border-0">
                        <td className="px-4 py-2 font-mono font-medium text-slate-800">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2 font-semibold text-slate-900 tabular-nums">{formatMAD(inv.amount)}</td>
                        <td className="px-4 py-2">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", isc.bg)}>
                            <IIcon className="h-2.5 w-2.5" />
                            {isc.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-slate-100 pt-4 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => toast.success("Plan modifié", { description: "Fonctionnalité bientôt disponible." })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Changer de plan
          </button>
          <button
            type="button"
            onClick={() => toast.success("Factures téléchargées")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger les factures
          </button>
        </div>
      </div>
    </div>
  )
}

function DateRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/60 px-3 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn("text-xs font-semibold tabular-nums", highlight ? "text-indigo-600" : "text-slate-700")}>
        {value}
      </span>
    </div>
  )
}
