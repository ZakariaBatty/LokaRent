"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Download, Mail, Plus, Save, Search, Shield, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceInvitationAction } from "@/modules/workspace/invitations/actions";
import {
  assignWorkspaceMemberAgencyAction,
  removeWorkspaceMemberAction,
  removeWorkspaceMemberAgencyAction,
  updateWorkspaceMemberAgencyRoleAction,
} from "@/modules/workspace/members/actions";
import { cn } from "@/lib/utils";

type MembershipStatus = "active" | "suspended" | "revoked";
type UserStatus = "active" | "suspended" | "deactivated";
type RoleScope = "company" | "agency";

export type WorkspaceMembersData = {
  currentUserId: string;
  agencies: { id: string; name: string; city: string }[];
  roles: { id: string; name: string; scope: RoleScope; isSystem: boolean }[];
  companyMemberships: {
    id: string;
    userId: string;
    roleId: string;
    roleName: string;
    status: MembershipStatus;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      status: UserStatus;
      lastLoginAt: string | null;
      createdAt: string;
    };
  }[];
  agencyMemberships: {
    id: string;
    userId: string;
    agencyId: string;
    agencyName: string;
    agencyCode: string;
    roleId: string;
    roleName: string;
    status: MembershipStatus;
    isPrimary: boolean;
    joinedAt: string;
  }[];
};

type MemberRow = WorkspaceMembersData["companyMemberships"][number] & {
  agencies: WorkspaceMembersData["agencyMemberships"];
  primaryAgencyName: string;
};

const roleColor: Record<string, string> = {
  owner: "bg-violet-50 text-violet-700 ring-violet-100",
  admin: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  accountant: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  agent: "bg-sky-50 text-sky-700 ring-sky-100",
  readonly: "bg-slate-100 text-slate-600 ring-slate-200",
};

const roleLabel: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  accountant: "Comptable",
  agent: "Agent",
  readonly: "Lecture seule",
};

const statusLabel: Record<MembershipStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
  revoked: "Révoqué",
};

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function roleName(name: string) {
  return roleLabel[name] ?? name;
}

function rolePill(name: string) {
  return roleColor[name] ?? "bg-slate-100 text-slate-600 ring-slate-200";
}

export function WorkspaceMembersClient({ data }: { data: WorkspaceMembersData }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteMember, setDeleteMember] = useState<MemberRow | null>(null);

  const agencyRoles = data.roles.filter((role) => role.scope === "agency");
  const companyRoles = data.roles.filter((role) => role.scope === "company");

  const rows = useMemo<MemberRow[]>(() => {
    return data.companyMemberships.map((membership) => {
      const agencies = data.agencyMemberships.filter((agencyMembership) => agencyMembership.userId === membership.userId);
      const primary = agencies.find((agency) => agency.isPrimary) ?? agencies[0];
      return {
        ...membership,
        agencies,
        primaryAgencyName: primary?.agencyName ?? "—",
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (roleFilter !== "all" && !row.agencies.some((agency) => agency.roleId === roleFilter) && row.roleId !== roleFilter) return false;
      if (agencyFilter !== "all" && !row.agencies.some((agency) => agency.agencyId === agencyFilter)) return false;
      if (!q) return true;
      const hay = `${row.user.fullName} ${row.user.email} ${row.primaryAgencyName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [agencyFilter, roleFilter, rows, search, statusFilter]);

  const selected = rows.find((row) => row.userId === selectedUserId) ?? null;

  return (
    <>
      <div className="flex gap-5">
        <motion.div
          layout
          animate={{ width: selected ? "28%" : "100%" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
          className="min-w-0 shrink-0"
        >
          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <select value={agencyFilter} onChange={(event) => setAgencyFilter(event.target.value)} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <option value="all">Toutes les agences</option>
                {data.agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
              </select>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <option value="all">Tous les rôles</option>
                {[...companyRoles, ...agencyRoles].map((role) => <option key={role.id} value={role.id}>{roleName(role.name)}</option>)}
              </select>
              <div className="flex items-center rounded-xl border border-slate-200/80 bg-white p-0.5 shadow-sm">
                {(["all", "active", "suspended", "revoked"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      statusFilter === status ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {status === "all" ? "Tous" : statusLabel[status]}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast.info("Export indisponible", { description: "Aucune architecture d'export workspace n'est active pour le moment." })}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Exporter
                </button>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un membre
                </button>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Aucun membre trouvé</p>
              <p className="mt-1 text-xs text-slate-500">Modifiez vos filtres ou invitez un nouveau membre.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-b from-slate-50/80 to-white">
                    <Th>Membre</Th>
                    {!selected && <Th>Agence principale</Th>}
                    {!selected && <Th>Rôle</Th>}
                    {!selected && <Th>Membre depuis</Th>}
                    {!selected && <Th>Dernière connexion</Th>}
                    {!selected && <Th>Statut</Th>}
                    {!selected && <th className="py-3 pl-3 pr-5" />}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((row) => (
                      <MemberTableRow
                        key={row.userId}
                        row={row}
                        compact={Boolean(selected)}
                        selected={selectedUserId === row.userId}
                        currentUserId={data.currentUserId}
                        onSelect={() => setSelectedUserId(selectedUserId === row.userId ? null : row.userId)}
                        onDelete={() => setDeleteMember(row)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {selected && (
            <motion.div
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "72%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="sticky top-4 h-[calc(100vh-7rem)] min-w-0 shrink-0"
              style={{ alignSelf: "flex-start" }}
            >
              <MemberDetail
                row={selected}
                agencies={data.agencies}
                agencyRoles={agencyRoles}
                currentUserId={data.currentUserId}
                onClose={() => setSelectedUserId(null)}
                onDelete={() => setDeleteMember(selected)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InviteMemberPanel
        open={inviteOpen}
        agencies={data.agencies}
        agencyRoles={agencyRoles}
        onClose={() => setInviteOpen(false)}
      />
      <DeleteMemberDialog
        member={deleteMember}
        currentUserId={data.currentUserId}
        onClose={() => setDeleteMember(null)}
      />
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 first:pl-5">{children}</th>;
}

function MemberTableRow({
  row,
  compact,
  selected,
  currentUserId,
  onSelect,
  onDelete,
}: {
  row: MemberRow;
  compact: boolean;
  selected: boolean;
  currentUserId: string;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const primaryRole = row.agencies[0]?.roleName ?? row.roleName;
  const canDelete = row.userId !== currentUserId;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onSelect}
      className={cn("group cursor-pointer border-b border-slate-100 transition", selected ? "bg-indigo-50/50" : "hover:bg-slate-50/80")}
    >
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold uppercase text-white shadow-sm">
            {initials(row.user.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{row.user.fullName}</p>
            <p className="truncate text-xs text-slate-400">{row.user.email}</p>
          </div>
        </div>
      </td>
      {!compact && (
        <>
          <td className="py-3.5 px-3">
            <p className="text-sm text-slate-700">{row.primaryAgencyName}</p>
            {row.agencies.length > 1 && <p className="text-[11px] text-slate-400">+{row.agencies.length - 1} autre{row.agencies.length > 2 ? "s" : ""}</p>}
          </td>
          <td className="py-3.5 px-3">
            <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset", rolePill(primaryRole))}>
              {roleName(primaryRole)}
            </span>
          </td>
          <td className="py-3.5 px-3 text-xs tabular-nums text-slate-500">{fmt(row.createdAt)}</td>
          <td className="py-3.5 px-3 text-xs text-slate-500">{fmt(row.user.lastLoginAt)}</td>
          <td className="py-3.5 px-3">
            <StatusPill status={row.status} />
          </td>
          <td className="py-3.5 pl-3 pr-5">
            <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                disabled={!canDelete}
                onClick={(event) => { event.stopPropagation(); onDelete(); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </>
      )}
    </motion.tr>
  );
}

function StatusPill({ status }: { status: MembershipStatus }) {
  const bg = status === "active" ? "bg-emerald-50 text-emerald-700" : status === "suspended" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500";
  const dot = status === "active" ? "bg-emerald-500" : status === "suspended" ? "bg-amber-400" : "bg-slate-400";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold", bg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {statusLabel[status]}
    </span>
  );
}

function MemberDetail({
  row,
  agencies,
  agencyRoles,
  currentUserId,
  onClose,
  onDelete,
}: {
  row: MemberRow;
  agencies: WorkspaceMembersData["agencies"];
  agencyRoles: WorkspaceMembersData["roles"];
  currentUserId: string;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? "");
  const [roleId, setRoleId] = useState(agencyRoles[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const assignedAgencyIds = new Set(row.agencies.map((membership) => membership.agencyId));
  const availableAgencies = agencies.filter((agency) => !assignedAgencyIds.has(agency.id));

  const run = (promiseFactory: () => Promise<{ success: boolean; message?: string }>, success: string) => {
    startTransition(async () => {
      const result = await promiseFactory();
      if (result.success) toast.success(success);
      else toast.error(result.message ?? "Action impossible.");
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-5 py-5 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold uppercase text-white shadow-sm">
              {initials(row.user.fullName)}
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{row.user.fullName}</h2>
              <p className="mt-0.5 text-xs text-slate-500">{row.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={row.userId === currentUserId}
              onClick={onDelete}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Agences" value={row.agencies.length} />
          <MiniStat label="Statut" value={statusLabel[row.status]} />
          <MiniStat label="Dernière connexion" value={row.user.lastLoginAt ? fmt(row.user.lastLoginAt) : "Indisponible"} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/40 p-5">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700">Accès agences</p>
            </div>
            <div className="divide-y divide-slate-100">
              {row.agencies.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Aucune agence assignée.</p>
              ) : row.agencies.map((membership) => (
                <div key={membership.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-48 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{membership.agencyName}</p>
                    <p className="text-[11px] text-slate-400">{membership.agencyCode} · Rejoint le {fmt(membership.joinedAt)}</p>
                  </div>
                  <select
                    value={membership.roleId}
                    disabled={pending}
                    onChange={(event) => run(
                      () => updateWorkspaceMemberAgencyRoleAction({ membershipId: membership.id, agencyId: membership.agencyId, roleId: event.target.value }),
                      "Rôle mis à jour",
                    )}
                    className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                  >
                    {agencyRoles.map((role) => <option key={role.id} value={role.id}>{roleName(role.name)}</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={pending || row.userId === currentUserId}
                    onClick={() => run(
                      () => removeWorkspaceMemberAgencyAction({ membershipId: membership.id, agencyId: membership.agencyId, userId: row.userId }),
                      "Accès agence retiré",
                    )}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Retirer l'accès agence"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
            <p className="text-xs font-semibold text-slate-700">Ajouter un accès agence</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={agencyId} onChange={(event) => setAgencyId(event.target.value)} className="min-w-56 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                {availableAgencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
              </select>
              <select value={roleId} onChange={(event) => setRoleId(event.target.value)} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                {agencyRoles.map((role) => <option key={role.id} value={role.id}>{roleName(role.name)}</option>)}
              </select>
              <button
                type="button"
                disabled={pending || !agencyId || !roleId || availableAgencies.length === 0}
                onClick={() => run(
                  () => assignWorkspaceMemberAgencyAction({ userId: row.userId, agencyId, roleId }),
                  "Accès agence ajouté",
                )}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Building2 className="h-4 w-4" />
                Ajouter
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InviteMemberPanel({
  open,
  agencies,
  agencyRoles,
  onClose,
}: {
  open: boolean;
  agencies: WorkspaceMembersData["agencies"];
  agencyRoles: WorkspaceMembersData["roles"];
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? "");
  const [roleId, setRoleId] = useState(agencyRoles[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await createWorkspaceInvitationAction({ email, agencyId, roleId });
      if (result.success) {
        toast.success("Invitation enregistrée", { description: "Aucun email n'a été envoyé automatiquement." });
        setEmail("");
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100"><UserPlus className="h-4 w-4" /></span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Ajouter un membre</h2>
                  <p className="text-xs text-slate-500">Crée une invitation persistée</p>
                </div>
              </div>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <Field label="Adresse email">
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="nom@exemple.ma" className="input-base" />
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
              <p className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs leading-relaxed text-amber-700">
                L'invitation est enregistrée en base et valide 7 jours. L'envoi email reste désactivé dans ce passage.
              </p>
            </div>
            <div className="flex gap-2.5 border-t border-slate-100 px-6 py-4">
              <button type="button" disabled={pending || !email || !agencyId || !roleId} onClick={submit} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                <Mail className="h-4 w-4" />
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

function DeleteMemberDialog({ member, currentUserId, onClose }: { member: MemberRow | null; currentUserId: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  if (!member) return null;
  const blocked = member.userId === currentUserId;
  const confirm = () => {
    startTransition(async () => {
      const result = await removeWorkspaceMemberAction({ membershipId: member.id, userId: member.userId });
      if (result.success) {
        toast.success("Membre retiré");
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div onClick={(event) => event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.16)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Retirer le membre</h3>
            <p className="mt-1 text-xs text-slate-500">{member.user.fullName}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-700">
              Tous ses accès agence et son appartenance workspace seront révoqués.
            </p>
            {blocked && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">Vous ne pouvez pas retirer votre propre compte.</p>}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
            <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Annuler</button>
            <button disabled={blocked || pending} onClick={confirm} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
              Retirer
            </button>
          </div>
        </div>
      </motion.div>
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
