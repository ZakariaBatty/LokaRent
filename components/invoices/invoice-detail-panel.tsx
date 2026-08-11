"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  X,
  Info,
  List,
  Wallet,
  History,
  MessageSquare,
  Building2,
  User,
  Pencil,
  Printer,
  CalendarDays,
  Link2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  type Invoice,
  type InvoiceStatus,
  statusConfig,
  invoiceTypeConfig,
  invoiceStatuses,
  formatMAD,
  formatDate,
} from "@/lib/invoices-data"
import { WhatsAppShareButton } from "@/components/communication/whatsapp-share-button"
import { cn } from "@/lib/utils"

type TabId = "overview" | "items" | "payments" | "history" | "notes"

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "overview",  label: "Aperçu",      icon: Info },
  { id: "items",     label: "Lignes",       icon: List },
  { id: "payments",  label: "Paiements",    icon: Wallet },
  { id: "history",   label: "Historique",   icon: History },
  { id: "notes",     label: "Notes",        icon: MessageSquare },
]

const methodLabels: Record<string, string> = {
  cash:          "Espèces",
  card:          "Carte",
  bank_transfer: "Virement",
  cheque:        "Chèque",
  other:         "Autre",
}

const timelineIcons: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  created:   { icon: Info,     bg: "bg-blue-50",    color: "text-blue-600" },
  issued:    { icon: Wallet,   bg: "bg-indigo-50",  color: "text-indigo-600" },
  payment:   { icon: Wallet,   bg: "bg-emerald-50", color: "text-emerald-600" },
  cancelled: { icon: X,        bg: "bg-rose-50",    color: "text-rose-600" },
  edited:    { icon: Pencil,   bg: "bg-slate-100",  color: "text-slate-600" },
  reminder:  { icon: CalendarDays, bg: "bg-amber-50", color: "text-amber-600" },
}

// ─── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab({ invoice }: { invoice: Invoice }) {
  const sc = statusConfig[invoice.status]
  const tc = invoiceTypeConfig[invoice.type]

  return (
    <div className="space-y-4 p-5">
      {/* Customer card */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Client
        </p>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
            {invoice.customerName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{invoice.customerName}</p>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {invoice.customerType === "company" ? (
                  <><Building2 className="h-3 w-3" />Entreprise</>
                ) : (
                  <><User className="h-3 w-3" />Particulier</>
                )}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{invoice.customerPhone}</p>
            {invoice.customerEmail && (
              <p className="text-xs text-slate-400">{invoice.customerEmail}</p>
            )}
            {invoice.customerAddress && (
              <p className="mt-1 text-xs text-slate-400">{invoice.customerAddress}</p>
            )}
            {invoice.customerPhone && (
              <div className="mt-2 flex items-center gap-1">
                <WhatsAppShareButton
                  template="invoice_summary"
                  phoneNumber={invoice.customerPhone}
                  templateData={{
                    invoiceNumber: invoice.number,
                    customerName: invoice.customerName,
                    total: invoice.total,
                    dueDate: invoice.dueDate,
                    status: invoice.status,
                  }}
                  title={`Facture #${invoice.number}`}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice meta row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Type</p>
          <span className={cn("mt-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tc.pillBg, tc.pillText)}>
            {tc.label}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Statut</p>
          <span className={cn("mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", sc.pillBg, sc.pillText)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
            {sc.label}
          </span>
        </div>
        {invoice.reservationCode && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Réservation
            </p>
            <p className="mt-1 font-mono text-xs font-semibold text-indigo-600">
              {invoice.reservationCode}
            </p>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Date d&apos;émission
          </p>
          <p className="mt-1 font-medium text-slate-900">{formatDate(invoice.issueDate)}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Échéance
          </p>
          <p className={cn("mt-1 font-medium", invoice.status === "overdue" ? "text-rose-600" : "text-slate-900")}>
            {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>

      {/* Totals */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <div className="divide-y divide-slate-100">
          {[
            { label: "Sous-total HT", value: invoice.subtotal, muted: true },
            { label: "TVA",            value: invoice.taxTotal,  muted: true },
            { label: "Total TTC",      value: invoice.total,     muted: false },
            { label: "Payé",           value: invoice.paid,      muted: true, emerald: true },
            { label: "Reste dû",       value: invoice.remaining, muted: false, amber: true },
          ].map(({ label, value, muted, emerald, amber }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className={cn("text-sm", muted ? "text-slate-500" : "font-semibold text-slate-900")}>
                {label}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  emerald ? "text-emerald-700" : amber && value > 0 ? "text-amber-700" : muted ? "text-slate-700" : "text-slate-900",
                )}
              >
                {formatMAD(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Linked car */}
      {invoice.carLabel && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm">
          <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="text-slate-500">Véhicule :</span>
          <span className="font-medium text-slate-900">{invoice.carLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── Line Items Tab ──────────────────────────────────────────────────────────
function LineItemsTab({ invoice }: { invoice: Invoice }) {
  return (
    <div className="p-5">
      <div className="overflow-hidden rounded-xl border border-slate-200/80">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5 text-center">Qté</th>
              <th className="px-4 py-2.5 text-right">P.U.</th>
              <th className="px-4 py-2.5 text-center">TVA</th>
              <th className="px-4 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-900">{li.description}</td>
                <td className="px-4 py-3 text-center text-slate-600">{li.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-700">{formatMAD(li.unitPrice)}</td>
                <td className="px-4 py-3 text-center text-slate-500">{li.taxRate}%</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMAD(li.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200/80 bg-slate-50/60">
            <tr>
              <td colSpan={4} className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total TTC
              </td>
              <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatMAD(invoice.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Payments Tab ────────────────────────────────────────────────────────────
function PaymentsTab({ invoice }: { invoice: Invoice }) {
  const pct = invoice.total > 0 ? Math.min(100, Math.round((invoice.paid / invoice.total) * 100)) : 0

  return (
    <div className="space-y-4 p-5">
      {/* Progress bar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Avancement du paiement</span>
          <span className="font-semibold text-slate-900">{pct}%</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className={cn(
              "h-full rounded-full",
              pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-slate-200",
            )}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Payé : {formatMAD(invoice.paid)}</span>
          <span>Restant : {formatMAD(invoice.remaining)}</span>
        </div>
      </div>

      {/* Payment list */}
      {invoice.payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-sm text-slate-400">
          Aucun paiement enregistré
        </div>
      ) : (
        <div className="space-y-2">
          {invoice.payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{formatDate(p.date)}</p>
                <p className="text-xs text-slate-500">
                  {methodLabels[p.method] ?? p.method}
                  {p.reference && ` · ${p.reference}`}
                </p>
                {p.note && <p className="mt-0.5 text-xs text-slate-400">{p.note}</p>}
              </div>
              <span className="text-sm font-semibold text-emerald-700">{formatMAD(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── History Tab ─────────────────────────────────────────────────────────────
function HistoryTab({ invoice }: { invoice: Invoice }) {
  return (
    <div className="p-5">
      <div className="relative space-y-1 pl-5">
        <div className="pointer-events-none absolute inset-y-0 left-[9px] w-px bg-slate-200" />
        {invoice.timeline.map((ev, idx) => {
          const cfg = timelineIcons[ev.type] ?? timelineIcons.created
          const Icon = cfg.icon
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative flex gap-3 pb-4"
            >
              <div
                className={cn(
                  "relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                  cfg.bg,
                )}
              >
                <Icon className={cn("h-2.5 w-2.5", cfg.color)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{ev.label}</p>
                {ev.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{ev.description}</p>
                )}
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {new Date(ev.timestamp).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}{ev.author}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Notes Tab ───────────────────────────────────────────────────────────────
function NotesTab({ invoice }: { invoice: Invoice }) {
  return (
    <div className="p-5">
      {invoice.notes ? (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700">
          {invoice.notes}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-sm text-slate-400">
          Aucune note pour cette facture
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function InvoiceDetailPanel({
  invoice,
  onClose,
  onEdit,
}: {
  invoice: Invoice
  onClose: () => void
  onEdit: (inv: Invoice) => void
}) {
  const [tab, setTab] = useState<TabId>("overview")
  const sc = statusConfig[invoice.status]
  const tc = invoiceTypeConfig[invoice.type]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {invoice.number}
              </span>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", sc.pillBg, sc.pillText)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                {sc.label}
              </span>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", tc.pillBg, tc.pillText)}>
                {tc.label}
              </span>
            </div>
            <h2 className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-900">
              {invoice.customerName}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>Émis le {formatDate(invoice.issueDate)}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Échéance {formatDate(invoice.dueDate)}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="font-semibold text-slate-800">{formatMAD(invoice.total)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <button
              onClick={() => onEdit(invoice)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              aria-label="Éditer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
              aria-label="Imprimer"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Status quick-change */}
        <div className="mt-3 flex items-center gap-1 overflow-x-auto px-5 pb-0.5">
          {invoiceStatuses.map((s) => {
            const cfg = statusConfig[s]
            const isActive = invoice.status === s
            return (
              <button
                key={s}
                type="button"
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                  isActive
                    ? cn(cfg.pillBg, cfg.pillText, "ring-1 ring-inset ring-current/20")
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? cfg.dot : "bg-slate-400")} />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-0.5 overflow-x-auto px-4 pb-px">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === id
                  ? "text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              {tab === id && (
                <motion.div
                  layoutId="invoice-panel-tab"
                  className="absolute inset-0 rounded-t-lg bg-blue-50"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "overview"  && <OverviewTab  invoice={invoice} />}
        {tab === "items"     && <LineItemsTab invoice={invoice} />}
        {tab === "payments"  && <PaymentsTab  invoice={invoice} />}
        {tab === "history"   && <HistoryTab   invoice={invoice} />}
        {tab === "notes"     && <NotesTab     invoice={invoice} />}
      </div>
    </div>
  )
}
