"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import { invoices as initialInvoices, type Invoice, type InvoiceStatus } from "@/lib/invoices-data"
import { InvoicesKpiBar } from "@/components/invoices/invoices-kpi-bar"
import {
  InvoicesFilters,
  type InvoicesFiltersState,
} from "@/components/invoices/invoices-filters"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { InvoiceDetailPanel } from "@/components/invoices/invoice-detail-panel"
import { InvoiceFormPanel } from "@/components/invoices/invoice-form-panel"

type PanelMode = { kind: "detail"; invoice: Invoice } | { kind: "form"; invoice: Invoice | null } | null

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [panel, setPanel] = useState<PanelMode>(null)
  const [filters, setFilters] = useState<InvoicesFiltersState>({
    search:       "",
    status:       "all",
    type:         "all",
    customerType: "all",
    dateRange:    "all",
    sort:         "recent",
  })

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    let list = invoices.filter((inv) => {
      if (filters.status !== "all" && inv.status !== filters.status) return false
      if (filters.type !== "all" && inv.type !== filters.type) return false
      if (filters.customerType !== "all" && inv.customerType !== filters.customerType) return false

      // Date range (based on issueDate)
      if (filters.dateRange !== "all") {
        const d = new Date(inv.issueDate)
        const now = new Date()
        if (filters.dateRange === "this_month") {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false
        } else if (filters.dateRange === "last_month") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
          if (d.getMonth() !== lastMonth.getMonth() || d.getFullYear() !== lastMonth.getFullYear()) return false
        } else if (filters.dateRange === "quarter") {
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          if (d < quarterStart) return false
        }
      }

      if (q) {
        const hay = `${inv.number} ${inv.customerName} ${inv.reservationCode ?? ""} ${inv.carLabel ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (filters.sort === "amount_desc") return b.total - a.total
      if (filters.sort === "due_asc") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [invoices, filters])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openDetail = (inv: Invoice) => setPanel({ kind: "detail", invoice: inv })
  const openForm   = (inv: Invoice | null = null) => setPanel({ kind: "form", invoice: inv })
  const closePanel = () => setPanel(null)

  const handleDelete = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id))
    closePanel()
  }

  const handleSave = (data: Partial<Invoice>) => {
    if (panel?.kind !== "form") return
    const existing = panel.invoice

    if (existing) {
      // Edit
      setInvoices((prev) =>
        prev.map((i) => (i.id === existing.id ? { ...i, ...data } : i)),
      )
      toast.success(`Facture ${existing.number} mise à jour`)
    } else {
      // Create
      const newInv: Invoice = {
        id:           `inv-${Date.now()}`,
        number:       `FAC-2026-${String(invoices.length + 43).padStart(4, "0")}`,
        status:       "draft",
        type:         data.type ?? "manual",
        customerId:   `client-new-${Date.now()}`,
        customerName: data.customerName ?? "",
        customerType: data.customerType ?? "individual",
        customerPhone: data.customerPhone ?? "",
        customerEmail: data.customerEmail,
        reservationId: data.reservationId,
        reservationCode: data.reservationId
          ? invoices.find((i) => i.reservationId === data.reservationId)?.reservationCode
          : undefined,
        carLabel: data.carLabel,
        issueDate:  data.issueDate ?? new Date().toISOString().split("T")[0],
        dueDate:    data.dueDate ?? "",
        lineItems:  data.lineItems ?? [],
        subtotal:   data.subtotal ?? 0,
        taxTotal:   data.taxTotal ?? 0,
        total:      data.total ?? 0,
        paid:       0,
        remaining:  data.total ?? 0,
        payments:   [],
        notes:      data.notes,
        createdAt:  new Date().toISOString(),
        timeline: [
          {
            id:        `t-new-1`,
            type:      "created",
            label:     "Facture créée",
            timestamp: new Date().toISOString(),
            author:    "Vous",
          },
        ],
      }
      setInvoices((prev) => [newInv, ...prev])
      toast.success("Facture créée avec succès")
    }
    closePanel()
  }

  const selectedDetailId =
    panel?.kind === "detail" ? panel.invoice.id : null

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
            Factures
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi de facturation · locations et prestations manuelles
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Données temps réel · auto-rafraîchissement
        </div>
      </motion.div>

      {/* KPI bar */}
      <InvoicesKpiBar invoices={invoices} />

      {/* Filters */}
      <InvoicesFilters
        state={filters}
        onChange={setFilters}
        count={filtered.length}
        onNew={() => openForm(null)}
      />

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <InvoicesTable
          invoices={filtered}
          selectedId={selectedDetailId}
          onOpen={openDetail}
          onEdit={openForm}
          onDelete={handleDelete}
          onNew={() => openForm(null)}
        />
      </motion.div>

      {/* ── Detail panel (slide-over from right) ──────────────────────────── */}
      <AnimatePresence>
        {panel?.kind === "detail" && (
          <>
            <motion.div
              key="detail-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePanel}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="detail-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 w-full p-3 md:w-[85%] lg:w-[80%]"
            >
              <InvoiceDetailPanel
                invoice={panel.invoice}
                onClose={closePanel}
                onEdit={(inv) => openForm(inv)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Form panel (slide-over from left) ─────────────────────────────── */}
      <AnimatePresence>
        {panel?.kind === "form" && (
          <>
            <motion.div
              key="form-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePanel}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
            />
            <motion.div
              key="form-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-full p-3 md:w-[85%] lg:w-[80%]"
            >
              <InvoiceFormPanel
                initial={panel.invoice}
                onClose={closePanel}
                onSave={handleSave}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
