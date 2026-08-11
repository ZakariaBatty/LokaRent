"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { Invoice } from "@/lib/invoices-data";
import type { InvoiceableReservationOption } from "@/modules/finances/mappers/invoice.mapper";
import { generateInvoiceAction } from "@/modules/finances/actions/invoice.actions";
import { useI18n } from "@/contexts/i18n-context";
import { InvoicesKpiBar } from "@/components/invoices/invoices-kpi-bar";
import {
  InvoicesFilters,
  type InvoicesFiltersState,
} from "@/components/invoices/invoices-filters";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { InvoiceDetailPanel } from "@/components/invoices/invoice-detail-panel";
import { InvoiceFormPanel } from "@/components/invoices/invoice-form-panel";

type PanelMode = { kind: "detail"; invoice: Invoice } | { kind: "form"; invoice: Invoice | null } | null;

export function InvoicesPageClient({
  initialInvoices,
  invoiceableReservations,
}: {
  initialInvoices: Invoice[];
  invoiceableReservations: InvoiceableReservationOption[];
}) {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [panel, setPanel] = useState<PanelMode>(null);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<InvoicesFiltersState>({
    search: "",
    status: "all",
    type: "all",
    customerType: "all",
    dateRange: "all",
    sort: "recent",
  });

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = invoices.filter((inv) => {
      if (filters.status !== "all" && inv.status !== filters.status) return false;
      if (filters.type !== "all" && inv.type !== filters.type) return false;
      if (filters.customerType !== "all" && inv.customerType !== filters.customerType) return false;
      if (q) {
        const hay = `${inv.number} ${inv.customerName} ${inv.reservationCode ?? ""} ${inv.carLabel ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (filters.sort === "amount_desc") return b.total - a.total;
      if (filters.sort === "due_asc") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [invoices, filters]);

  const openDetail = (invoice: Invoice) => setPanel({ kind: "detail", invoice });
  const openForm = (invoice: Invoice | null = null) => setPanel({ kind: "form", invoice });
  const closePanel = () => setPanel(null);

  const handleDelete = () => {
    toast.error(t("invoices.actions.deleteBlocked"));
  };

  const handleSave = (data: Partial<Invoice>) => {
    if (!data.reservationId) {
      toast.error(t("invoices.actions.reservationRequired"));
      return;
    }
    startTransition(async () => {
      const result = await generateInvoiceAction({
        reservationId: data.reservationId,
        dueAt: data.dueDate || undefined,
        notes: data.notes,
      });
      if (!result.success) {
        toast.error(t(result.messageKey));
        return;
      }
      setInvoices((current) => [result.invoice, ...current.filter((invoice) => invoice.id !== result.invoice.id)]);
      closePanel();
      toast.success(t("invoices.actions.generated"));
    });
  };

  const selectedDetailId = panel?.kind === "detail" ? panel.invoice.id : null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
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

      <InvoicesKpiBar invoices={invoices} />
      <InvoicesFilters state={filters} onChange={setFilters} count={filtered.length} onNew={() => openForm(null)} />

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <InvoicesTable
          invoices={filtered}
          selectedId={selectedDetailId}
          onOpen={openDetail}
          onEdit={openForm}
          onDelete={handleDelete}
          onNew={() => openForm(null)}
        />
      </motion.div>

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
              <InvoiceDetailPanel invoice={panel.invoice} onClose={closePanel} onEdit={(invoice) => openForm(invoice)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                reservationOptions={invoiceableReservations}
                saving={isPending}
                onClose={closePanel}
                onSave={handleSave}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
