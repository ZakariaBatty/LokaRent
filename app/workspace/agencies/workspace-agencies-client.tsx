"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Check, Mail, MapPin, Phone, Plus, Save, Search, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkspaceAgencyAction,
  deactivateWorkspaceAgencyAction,
  updateWorkspaceAgencyAction,
} from "@/modules/workspace/agencies/actions";
import { cn } from "@/lib/utils";

type AgencyStatus = "active" | "inactive" | "suspended";
type Labels = typeof import("@/translations/fr").default.workspace.agencies;

export type WorkspaceAgenciesData = {
  agencies: {
    id: string;
    name: string;
    code: string;
    status: AgencyStatus;
    phone: string;
    email: string;
    addressLine1: string;
    city: string;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    vehicleCount: number;
    reservationCount: number;
    customerCount: number;
  }[];
};

type AgencyRow = WorkspaceAgenciesData["agencies"][number];
type PanelMode = "create" | "edit";

const emptyDraft = {
  name: "",
  code: "",
  phone: "",
  email: "",
  addressLine1: "",
  city: "",
  status: "active" as AgencyStatus,
};

function statusClass(status: AgencyStatus) {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "suspended") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function errorMessage(message: string, labels: Labels) {
  const key = message.split(".").at(-1);
  return labels.messages[key as keyof typeof labels.messages] ?? labels.messages.generic;
}

export function WorkspaceAgenciesClient({ data, labels }: { data: WorkspaceAgenciesData; labels: Labels }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AgencyStatus | "all">("all");
  const [selected, setSelected] = useState<AgencyRow | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.agencies.filter((agency) => {
      if (status !== "all" && agency.status !== status) return false;
      if (!q) return true;
      return `${agency.name} ${agency.code} ${agency.city} ${agency.email} ${agency.phone}`.toLowerCase().includes(q);
    });
  }, [data.agencies, search, status]);

  const openCreate = () => {
    setSelected(null);
    setPanelMode("create");
  };

  const openEdit = (agency: AgencyRow) => {
    setSelected(agency);
    setPanelMode("edit");
  };

  const deactivate = (agency: AgencyRow) => {
    startTransition(async () => {
      const result = await deactivateWorkspaceAgencyAction({ agencyId: agency.id });
      if (result.success) {
        toast.success(labels.messages.deactivated);
        setSelected(null);
        setPanelMode(null);
        router.refresh();
      } else {
        toast.error(errorMessage(result.message, labels));
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm">
          {(["all", "active", "suspended", "inactive"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", status === value ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800")}
            >
              {value === "all" ? labels.filters.all : labels.status[value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          {labels.actions.create}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-14 text-center">
          <Building2 className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">{labels.empty.title}</p>
          <p className="mt-1 text-xs text-slate-400">{labels.empty.description}</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">{labels.columns.agency}</th>
                  <th className="px-4 py-3">{labels.columns.members}</th>
                  <th className="px-4 py-3">{labels.columns.vehicles}</th>
                  <th className="px-4 py-3">{labels.columns.reservations}</th>
                  <th className="px-4 py-3">{labels.columns.status}</th>
                  <th className="px-4 py-3 text-right">{labels.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((agency) => (
                  <tr key={agency.id} className="border-b border-slate-100/60 transition-colors last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-sm">
                          {initials(agency.name)}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight text-slate-900">{agency.name}</p>
                          <p className="text-[11px] text-slate-400">{agency.city} · {agency.email || agency.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">{agency.memberCount}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">{agency.vehicleCount}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">{agency.reservationCount.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold", statusClass(agency.status))}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {labels.status[agency.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(agency)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                          {labels.actions.details}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3">
            <p className="text-[11px] text-slate-400">{filtered.length} {labels.footer.visible}</p>
            <p className="text-[11px] font-semibold text-slate-600">{filtered.reduce((sum, agency) => sum + agency.vehicleCount, 0)} {labels.footer.vehicles}</p>
          </div>
        </motion.div>
      )}

      <AgencyPanel
        key={panelMode === "edit" ? selected?.id : "create"}
        open={Boolean(panelMode)}
        mode={panelMode ?? "create"}
        agency={selected}
        labels={labels}
        pending={pending}
        onClose={() => { setPanelMode(null); setSelected(null); }}
        onDeactivate={selected ? () => deactivate(selected) : undefined}
      />
    </>
  );
}

function AgencyPanel({
  open,
  mode,
  agency,
  labels,
  pending,
  onClose,
  onDeactivate,
}: {
  open: boolean;
  mode: PanelMode;
  agency: AgencyRow | null;
  labels: Labels;
  pending: boolean;
  onClose: () => void;
  onDeactivate?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(() => agency ? {
    name: agency.name,
    code: agency.code,
    phone: agency.phone,
    email: agency.email,
    addressLine1: agency.addressLine1,
    city: agency.city,
    status: agency.status,
  } : emptyDraft);
  const submitting = pending || isPending;

  const submit = () => {
    const payload = {
      name: draft.name,
      code: draft.code,
      phone: draft.phone || null,
      email: draft.email || null,
      address: { line1: draft.addressLine1, city: draft.city },
      status: draft.status,
    };
    startTransition(async () => {
      const result = mode === "create"
        ? await createWorkspaceAgencyAction(payload)
        : await updateWorkspaceAgencyAction({ ...payload, agencyId: agency?.id });
      if (result.success) {
        toast.success(mode === "create" ? labels.messages.created : labels.messages.updated);
        onClose();
        router.refresh();
      } else {
        toast.error(errorMessage(result.message, labels));
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 32 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{mode === "create" ? labels.panel.createEyebrow : agency?.code}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{mode === "create" ? labels.panel.createTitle : agency?.name}</h2>
              </div>
              <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            {agency && (
              <div className="grid grid-cols-4 gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                <Kpi label={labels.columns.members} value={agency.memberCount} />
                <Kpi label={labels.columns.vehicles} value={agency.vehicleCount} />
                <Kpi label={labels.columns.reservations} value={agency.reservationCount} />
                <Kpi label={labels.columns.customers} value={agency.customerCount} />
              </div>
            )}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field label={labels.fields.name} icon={Building2}>
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="input-base" />
              </Field>
              <Field label={labels.fields.code} icon={Check}>
                <input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} className="input-base uppercase" />
              </Field>
              <Field label={labels.fields.email} icon={Mail}>
                <input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="input-base" />
              </Field>
              <Field label={labels.fields.phone} icon={Phone}>
                <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="input-base" />
              </Field>
              <Field label={labels.fields.address} icon={MapPin}>
                <input value={draft.addressLine1} onChange={(event) => setDraft({ ...draft, addressLine1: event.target.value })} className="input-base" />
              </Field>
              <Field label={labels.fields.city} icon={MapPin}>
                <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} className="input-base" />
              </Field>
              <Field label={labels.fields.status} icon={Check}>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as AgencyStatus })} className="input-base">
                  {(["active", "suspended", "inactive"] as const).map((value) => <option key={value} value={value}>{labels.status[value]}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
              <button type="button" disabled={submitting || !draft.name || !draft.code} onClick={submit} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                <Save className="h-4 w-4" />
                {mode === "create" ? labels.actions.create : labels.actions.save}
              </button>
              {agency && (
                <button type="button" disabled={submitting} onClick={onDeactivate} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" />
                  {labels.actions.deactivate}
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240 / 0.8);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }
      `}</style>
    </AnimatePresence>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </label>
      {children}
    </div>
  );
}
