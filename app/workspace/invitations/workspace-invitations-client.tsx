"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Clock, Mail, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceInvitationAction, revokeWorkspaceInvitationAction } from "@/modules/workspace/invitations/actions";
import { cn } from "@/lib/utils";

type RoleScope = "company" | "agency";
type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
type StatusFilter = InvitationStatus | "all";
type Labels = typeof import("@/translations/fr").default.workspace.invitations;

export type WorkspaceInvitationsData = {
  agencies: { id: string; name: string }[];
  roles: { id: string; name: string; scope: RoleScope }[];
  invitations: {
    id: string;
    email: string;
    agencyId: string | null;
    agencyName: string | null;
    roleId: string;
    roleName: string;
    invitedByName: string;
    status: InvitationStatus;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
  }[];
};

const roleLabel: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  accountant: "Comptable",
  agent: "Agent",
  readonly: "Lecture seule",
};

const roleColor: Record<string, string> = {
  owner: "bg-violet-50 text-violet-700 ring-violet-100",
  admin: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  accountant: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  agent: "bg-sky-50 text-sky-700 ring-sky-100",
  readonly: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusConfig: Record<InvitationStatus, { label: string; dot: string; bg: string }> = {
  pending: { label: "En attente", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  accepted: { label: "Acceptée", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  expired: { label: "Expirée", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500" },
  revoked: { label: "Révoquée", dot: "bg-rose-400", bg: "bg-rose-50 text-rose-700" },
};

function roleName(name: string) {
  return roleLabel[name] ?? name;
}

function rolePill(name: string) {
  return roleColor[name] ?? "bg-slate-100 text-slate-600 ring-slate-200";
}

function effectiveStatus(invitation: WorkspaceInvitationsData["invitations"][number]): InvitationStatus {
  if (invitation.status === "pending" && new Date(invitation.expiresAt).getTime() <= Date.now()) {
    return "expired";
  }
  return invitation.status;
}

function daysLeft(expiresAt: string) {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function errorMessage(message: string, labels: Labels) {
  const key = message.split(".").at(-1);
  return labels.messages[key as keyof typeof labels.messages] ?? labels.messages.generic;
}

export function WorkspaceInvitationsClient({ data, labels }: { data: WorkspaceInvitationsData; labels: Labels }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const invitations = useMemo(
    () => data.invitations.map((invitation) => ({ ...invitation, effectiveStatus: effectiveStatus(invitation) })),
    [data.invitations],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return invitations;
    return invitations.filter((invitation) => invitation.effectiveStatus === statusFilter);
  }, [invitations, statusFilter]);

  const counts: Record<StatusFilter, number> = {
    all: invitations.length,
    pending: invitations.filter((invitation) => invitation.effectiveStatus === "pending").length,
    accepted: invitations.filter((invitation) => invitation.effectiveStatus === "accepted").length,
    expired: invitations.filter((invitation) => invitation.effectiveStatus === "expired").length,
    revoked: invitations.filter((invitation) => invitation.effectiveStatus === "revoked").length,
  };

  const filterTabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Toutes" },
    { value: "pending", label: "En attente" },
    { value: "accepted", label: "Acceptées" },
    { value: "expired", label: "Expirées" },
    { value: "revoked", label: "Révoquées" },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-fit gap-1 overflow-x-auto rounded-xl border border-slate-200/60 bg-white p-1 shadow-sm">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                statusFilter === tab.value ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {tab.label}
              <span className={cn("inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums", statusFilter === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          Nouvelle invitation
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
          <Mail className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Aucune invitation</p>
          <p className="mt-1 text-xs text-slate-500">Aucune invitation pour ce filtre.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <p className="text-xs font-semibold text-slate-500">{filtered.length} invitation{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Destinataire</th>
                  <th className="px-4 py-3">Agence</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Invité par</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((invitation, idx) => (
                    <InvitationRow key={invitation.id} invitation={invitation} idx={idx} labels={labels} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <InvitationPanel
        open={panelOpen}
        agencies={data.agencies}
        roles={data.roles}
        labels={labels}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
}

function InvitationRow({
  invitation,
  idx,
  labels,
}: {
  invitation: WorkspaceInvitationsData["invitations"][number] & { effectiveStatus: InvitationStatus };
  idx: number;
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sc = statusConfig[invitation.effectiveStatus];
  const days = daysLeft(invitation.expiresAt);

  const revoke = () => {
    startTransition(async () => {
      const result = await revokeWorkspaceInvitationAction({ invitationId: invitation.id });
      if (result.success) {
        toast.success(labels.messages.revoked);
        router.refresh();
      } else {
        toast.error(errorMessage(result.message, labels));
      }
    });
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.02 }}
      className="group border-b border-slate-100/50 transition hover:bg-slate-50/40"
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold uppercase text-slate-500">{invitation.email[0]?.toUpperCase()}</span>
          <span className="font-medium text-slate-900">{invitation.email}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {invitation.agencyName ?? "Workspace"}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", rolePill(invitation.roleName))}>
          {roleName(invitation.roleName)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500">{invitation.invitedByName}</td>
      <td className="px-4 py-3.5">
        {invitation.effectiveStatus === "accepted" && invitation.acceptedAt ? (
          <span className="text-xs text-slate-400">Acceptée le {new Date(invitation.acceptedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
        ) : invitation.effectiveStatus === "expired" ? (
          <span className="text-xs text-slate-400">Expirée</span>
        ) : invitation.effectiveStatus === "revoked" ? (
          <span className="text-xs text-slate-400">Révoquée</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            <span className={cn("text-xs font-medium", days <= 3 ? "text-amber-600" : "text-slate-500")}>{days} jour{days !== 1 ? "s" : ""}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3.5">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", sc.bg)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
          {sc.label}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
          {invitation.effectiveStatus === "pending" && (
            <button
              type="button"
              disabled={pending}
              onClick={revoke}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Révoquer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function InvitationPanel({
  open,
  agencies,
  roles,
  labels,
  onClose,
}: {
  open: boolean;
  agencies: WorkspaceInvitationsData["agencies"];
  roles: WorkspaceInvitationsData["roles"];
  labels: Labels;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? "");
  const agencyRoles = roles.filter((role) => role.scope === "agency");
  const [roleId, setRoleId] = useState(agencyRoles[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const hasConfiguration = agencies.length > 0 && agencyRoles.length > 0;

  const submit = () => {
    if (!hasConfiguration) return;
    startTransition(async () => {
      const result = await createWorkspaceInvitationAction({ email, agencyId, roleId });
      if (result.success) {
        toast.success(labels.messages.created, { description: labels.messages.noEmailSent });
        setEmail("");
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm" onClick={onClose} />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                  <Send className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Nouvelle invitation</h2>
                  <p className="text-xs text-slate-500">Persistance sans envoi email automatique</p>
                </div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field label="Adresse email">
                <input type="email" placeholder="nom@exemple.ma" value={email} onChange={(event) => setEmail(event.target.value)} className="input-base" />
              </Field>
              <Field label="Agence">
                <select value={agencyId} onChange={(event) => setAgencyId(event.target.value)} className="input-base">
                  {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
                </select>
              </Field>
              <Field label="Rôle">
                <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="input-base">
                  {agencyRoles.map((role) => <option key={role.id} value={role.id}>{roleName(role.name)}</option>)}
                </select>
              </Field>
              {!hasConfiguration ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 text-xs leading-relaxed text-rose-700">
                  {agencies.length === 0 ? labels.messages.noAgencies : labels.messages.noAgencyRoles}
                </p>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs leading-relaxed text-amber-700">
                  L'invitation sera valide 7 jours. L'envoi email réel reste à connecter dans une phase ultérieure.
                </p>
              )}
            </div>
            <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
              <button type="button" disabled={pending || !email || !agencyId || !roleId || !hasConfiguration} onClick={submit} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-4 w-4" />
                Enregistrer l'invitation
              </button>
              <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Annuler</button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
