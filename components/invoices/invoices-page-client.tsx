"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import type { Invoice } from "@/lib/invoices-data";
import type { InvoiceCustomerOption, InvoiceableReservationOption } from "@/modules/finances/mappers/invoice.mapper";
import { deleteInvoiceAction, generateInvoiceAction, updateInvoiceAction } from "@/modules/finances/actions/invoice.actions";
import { createClientAction } from "@/modules/clients/actions/create-client.action";
import { useI18n } from "@/contexts/i18n-context";
import { ClientFormDialog, type ClientFormValues } from "@/components/clients/client-form-dialog";
import { InvoicesKpiBar } from "@/components/invoices/invoices-kpi-bar";
import {
  InvoicesFilters,
  type InvoicesFiltersState,
} from "@/components/invoices/invoices-filters";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { InvoiceDetailPanel } from "@/components/invoices/invoice-detail-panel";
import { InvoiceFormPanel } from "@/components/invoices/invoice-form-panel";

type PanelMode = { kind: "detail"; invoice: Invoice } | { kind: "form"; invoice: Invoice | null } | null;
type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

function buildQueryString(input: {
  currentQueryString: string;
  filters: InvoicesFiltersState;
}) {
  const params = new URLSearchParams(input.currentQueryString);
  const search = input.filters.search.trim();
  if (search) params.set("search", search);
  else params.delete("search");
  if (input.filters.status !== "all") params.set("status", input.filters.status);
  else params.delete("status");
  if (input.filters.type !== "all") params.set("type", input.filters.type);
  else params.delete("type");
  if (input.filters.customerType !== "all") params.set("customerType", input.filters.customerType);
  else params.delete("customerType");
  if (input.filters.dateRange !== "all") params.set("dateRange", input.filters.dateRange);
  else params.delete("dateRange");
  if (input.filters.sort !== "recent") params.set("sort", input.filters.sort);
  else params.delete("sort");
  params.delete("page");
  return params.toString();
}

export function InvoicesPageClient({
  initialInvoices,
  initialPagination,
  initialFilters,
  invoiceableReservations,
  customerOptions,
}: {
  initialInvoices: Invoice[];
  initialPagination?: Pagination;
  initialFilters: InvoicesFiltersState;
  invoiceableReservations: InvoiceableReservationOption[];
  customerOptions: InvoiceCustomerOption[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const lastRequestedQueryRef = useRef<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [customers, setCustomers] = useState<InvoiceCustomerOption[]>(customerOptions);
  const [createdCustomer, setCreatedCustomer] = useState<InvoiceCustomerOption | null>(null);
  const [panel, setPanel] = useState<PanelMode>(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<InvoicesFiltersState>(initialFilters);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    if (lastRequestedQueryRef.current === currentQueryString) {
      lastRequestedQueryRef.current = null;
      setLoadingRows(false);
    }
  }, [currentQueryString]);

  useEffect(() => {
    setInvoices(initialInvoices);
    setLoadingRows(false);
  }, [initialInvoices]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQueryString = buildQueryString({ currentQueryString, filters });
      if (nextQueryString === currentQueryString || nextQueryString === lastRequestedQueryRef.current) return;
      lastRequestedQueryRef.current = nextQueryString;
      setLoadingRows(true);
      startTransition(() => {
        router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false });
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [currentQueryString, filters, pathname, router]);

  const openDetail = (invoice: Invoice) => setPanel({ kind: "detail", invoice });
  const openForm = (invoice: Invoice | null = null) => setPanel({ kind: "form", invoice });
  const closePanel = () => setPanel(null);
  const openClientForm = () => setClientFormOpen(true);

  const submitClientForm = async (values: ClientFormValues) => {
    const result = await createClientAction(values);
    if (!result.success || !result.customerId) {
      toast.error(t(result.success ? "clients.errors.generic" : result.messageKey));
      return false;
    }
    const customer: InvoiceCustomerOption = {
      id: result.customerId,
      name: values.type === "company" ? values.companyName ?? "" : values.fullName ?? "",
      type: values.type,
      phone: values.phone,
      email: values.email,
    };
    setCustomers((current) => [customer, ...current.filter((item) => item.id !== customer.id)]);
    setCreatedCustomer(customer);
    toast.success(t("invoices.actions.customerCreated"));
    return true;
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteInvoiceAction({ invoiceId: id });
      if (!result.success) {
        toast.error(t(result.messageKey));
        return;
      }
      setInvoices((current) => current.filter((invoice) => invoice.id !== result.invoiceId));
      if (panel?.kind === "detail" && panel.invoice.id === result.invoiceId) closePanel();
      toast.success(t("invoices.actions.deleted"));
      router.refresh();
    });
  };

  const handleInvoiceUpdated = (invoice: Invoice) => {
    setInvoices((current) => [invoice, ...current.filter((item) => item.id !== invoice.id)]);
    setPanel((current) => current?.kind === "detail" && current.invoice.id === invoice.id ? { kind: "detail", invoice } : current);
    router.refresh();
  };

  const changePage = (page: number) => {
    const params = new URLSearchParams(currentQueryString);
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const nextQueryString = params.toString();
    lastRequestedQueryRef.current = nextQueryString;
    setLoadingRows(true);
    startTransition(() => {
      router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ""}`, { scroll: false });
    });
  };

  const handleSave = (data: Partial<Invoice>) => {
    if (data.type === "rental" && !data.reservationId) {
      toast.error(t("invoices.actions.reservationRequired"));
      return;
    }
    startTransition(async () => {
      const payload = {
        type: data.type,
        reservationId: data.reservationId,
        customerId: data.customerId,
        taxRate: data.lineItems?.[0]?.taxRate,
        manualLines: data.lineItems?.filter((line) => data.type === "manual" || line.source === "manual"),
        issueAt: data.issueDate || undefined,
        dueAt: data.dueDate || undefined,
        notes: data.notes,
      };
      const result = data.id
        ? await updateInvoiceAction({ invoiceId: data.id, ...payload })
        : await generateInvoiceAction(payload);
      if (!result.success) {
        toast.error(t(result.messageKey));
        return;
      }
      setInvoices((current) => [result.invoice, ...current.filter((invoice) => invoice.id !== result.invoice.id)]);
      closePanel();
      toast.success(t(data.id ? "invoices.actions.updated" : "invoices.actions.generated"));
      router.refresh();
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
      <InvoicesFilters state={filters} onChange={setFilters} count={initialPagination?.total ?? invoices.length} onNew={() => openForm(null)} />

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <InvoicesTable
          invoices={invoices}
          selectedId={selectedDetailId}
          onOpen={openDetail}
          onEdit={openForm}
          onDelete={handleDelete}
          onNew={() => openForm(null)}
          loading={loadingRows || isPending}
        />
      </motion.div>

      {initialPagination && initialPagination.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => changePage(initialPagination.page - 1)}
            disabled={!initialPagination.hasPreviousPage || loadingRows || isPending}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t("invoices.pagination.previous")}
          </button>
          <span className="text-xs font-medium text-slate-500">
            {t("invoices.pagination.page")
              .replace("{page}", String(initialPagination.page))
              .replace("{totalPages}", String(initialPagination.totalPages))}
          </span>
          <button
            type="button"
            onClick={() => changePage(initialPagination.page + 1)}
            disabled={!initialPagination.hasNextPage || loadingRows || isPending}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t("invoices.pagination.next")}
          </button>
        </div>
      )}

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
                onEdit={(invoice) => openForm(invoice)}
                onUpdated={handleInvoiceUpdated}
              />
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
                customerOptions={customers}
                selectedCustomer={createdCustomer}
                onAddCustomer={openClientForm}
                saving={isPending}
                onClose={closePanel}
                onSave={handleSave}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ClientFormDialog
        open={clientFormOpen}
        mode="create"
        onClose={() => setClientFormOpen(false)}
        onSubmit={submitClientForm}
      />
    </div>
  );
}
