"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart2,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  Check,
  FileText,
  Minus,
  Save,
  Search,
  Settings,
  Shield,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  replaceRolePermissionsAction,
  revokeUserPermissionOverrideAction,
  setUserPermissionOverrideAction,
} from "@/modules/workspace/permissions/actions";
import { cn } from "@/lib/utils";

type RoleScope = "company" | "agency";
type MembershipStatus = "active" | "suspended" | "revoked";
type OverrideEffect = "grant" | "deny";
type ViewMode = "role" | "user" | "agency";

export type WorkspacePermissionsData = {
  currentUserId: string;
  permissions: { key: string; domain: string; description: string | null }[];
  roles: {
    id: string;
    name: string;
    scope: RoleScope;
    isSystem: boolean;
    permissionKeys: string[];
    memberCount: number;
  }[];
  users: {
    id: string;
    fullName: string;
    email: string;
    companyMembershipId: string;
    companyRoleId: string;
    companyRoleName: string;
  }[];
  agencies: { id: string; name: string; code: string }[];
  agencyMemberships: {
    id: string;
    userId: string;
    agencyId: string;
    agencyName: string;
    roleId: string;
    roleName: string;
    status: MembershipStatus;
  }[];
  overrides: {
    id: string;
    userId: string;
    agencyId: string;
    agencyMembershipId: string;
    permissionKey: string;
    effect: OverrideEffect;
    expiresAt: string | null;
  }[];
};

type Labels = typeof import("@/translations/fr").default.workspace.permissions;
type Permission = WorkspacePermissionsData["permissions"][number];
type Role = WorkspacePermissionsData["roles"][number];
type AgencyMembership = WorkspacePermissionsData["agencyMemberships"][number];

const moduleIcons: Record<string, LucideIcon> = {
  workspace: Briefcase,
  reservations: CalendarDays,
  fleet: Car,
  clients: UserRound,
  contracts: FileText,
  finance: TrendingUp,
  settings: Settings,
  reports: BarChart2,
};

function permissionScope(permissionKey: string): RoleScope {
  return permissionKey.startsWith("workspace.") ? "company" : "agency";
}

function rolePill(name: string) {
  const colors: Record<string, string> = {
    owner: "bg-violet-50 text-violet-700 ring-violet-100",
    admin: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    accountant: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    agent: "bg-sky-50 text-sky-700 ring-sky-100",
    readonly: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return colors[name] ?? "bg-slate-100 text-slate-600 ring-slate-200";
}

function capabilityLabel(permissionKey: string, labels: Labels) {
  const suffix = permissionKey.split(".").slice(1).join("_");
  return labels.capabilities[suffix as keyof typeof labels.capabilities] ?? suffix.replaceAll("_", " ");
}

function groupLabel(domain: string, labels: Labels) {
  return labels.groups[domain as keyof typeof labels.groups] ?? labels.groups.other;
}

function roleName(name: string, labels: Labels) {
  return labels.roles[name as keyof typeof labels.roles] ?? name;
}

function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const rows = groups.get(permission.domain) ?? [];
    rows.push(permission);
    groups.set(permission.domain, rows);
  }
  return [...groups.entries()].map(([domain, rows]) => ({
    domain,
    permissions: rows.sort((left, right) => left.key.localeCompare(right.key)),
  }));
}

function errorMessage(message: string, labels: Labels) {
  const key = message.split(".").at(-1);
  return labels.messages[key as keyof typeof labels.messages] ?? labels.messages.generic;
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function WorkspacePermissionsClient({
  data,
  labels,
}: {
  data: WorkspacePermissionsData;
  labels: Labels;
}) {
  const [view, setView] = useState<ViewMode>("role");
  const modes: { key: ViewMode; label: string; icon: LucideIcon }[] = [
    { key: "role", label: labels.modes.role, icon: Shield },
    { key: "user", label: labels.modes.user, icon: Users },
    { key: "agency", label: labels.modes.agency, icon: Building2 },
  ];

  return (
    <>
      <div className="flex w-fit items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {modes.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
              view === key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {view === "role" && <RoleView data={data} labels={labels} />}
          {view === "user" && <UserView data={data} labels={labels} />}
          {view === "agency" && <AgencyView data={data} labels={labels} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function RoleView({ data, labels }: { data: WorkspacePermissionsData; labels: Labels }) {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedRole = data.roles.find((role) => role.id === selectedRoleId) ?? null;
  const availablePermissions = data.permissions.filter((permission) => !selectedRole || permissionScope(permission.key) === selectedRole.scope);
  const grouped = groupPermissions(availablePermissions);
  const filteredRoles = data.roles.filter((role) => role.name.toLowerCase().includes(search.trim().toLowerCase()));
  const base = selectedRole ? new Set(selectedRole.permissionKeys) : new Set<string>();
  const isDirty = selectedRole && draft && (draft.size !== base.size || [...draft].some((key) => !base.has(key)));
  const readonly = Boolean(selectedRole?.isSystem || (selectedRole?.scope === "company" && selectedRole.name === "owner"));

  const selectRole = (role: Role) => {
    setSelectedRoleId(role.id === selectedRoleId ? null : role.id);
    setDraft(role.id === selectedRoleId ? null : new Set(role.permissionKeys));
  };

  const save = () => {
    if (!selectedRole || !draft) return;
    startTransition(async () => {
      const result = await replaceRolePermissionsAction({ roleId: selectedRole.id, permissionKeys: [...draft] });
      if (result.success) {
        toast.success(labels.messages.saved);
        router.refresh();
      } else {
        toast.error(errorMessage(result.message, labels));
      }
    });
  };

  return (
    <div className="flex gap-5">
      <motion.div layout animate={{ width: selectedRole ? "320px" : "100%" }} transition={{ type: "spring", stiffness: 260, damping: 32 }} className="shrink-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {!selectedRole && (
            <div className="border-b border-slate-100 px-4 py-3">
              <SearchBox value={search} onChange={setSearch} />
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">{labels.columns.role}</th>
                {!selectedRole && <th className="px-4 py-3">{labels.columns.description}</th>}
                <th className="px-4 py-3 text-right">{labels.columns.members}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id} onClick={() => selectRole(role)} className={cn("cursor-pointer border-b border-slate-100/50 transition", selectedRoleId === role.id ? "bg-indigo-50/60" : "hover:bg-slate-50/60")}>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", rolePill(role.name))}>{roleName(role.name, labels)}</span>
                  </td>
                  {!selectedRole && (
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {labels.scopes[role.scope]} {role.isSystem ? ` · ${labels.states.systemRole}` : ""}
                    </td>
                  )}
                  <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-700">{role.memberCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <AnimatePresence>
        {selectedRole && draft && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="min-w-0 flex-1">
            <MatrixPanel
              title={roleName(selectedRole.name, labels)}
              subtitle={readonly ? labels.states.systemRole : selectedRole.scope}
              grouped={grouped}
              granted={draft}
              readonly={readonly || pending}
              labels={labels}
              onClose={() => { setSelectedRoleId(null); setDraft(null); }}
              onToggle={(key) => setDraft((current) => toggleSet(current, key))}
              actions={isDirty && !readonly ? (
                <>
                  <button type="button" onClick={() => setDraft(new Set(selectedRole.permissionKeys))} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">{labels.actions.reset}</button>
                  <button type="button" onClick={save} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"><Save className="h-3.5 w-3.5" />{labels.actions.save}</button>
                </>
              ) : null}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserView({ data, labels }: { data: WorkspacePermissionsData; labels: Labels }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const selectedUser = data.users.find((user) => user.id === selectedUserId) ?? null;
  const memberships = data.agencyMemberships.filter((membership) => membership.userId === selectedUserId && membership.status === "active");
  const selectedMembership = memberships.find((membership) => membership.id === selectedMembershipId) ?? memberships[0] ?? null;
  const users = data.users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="flex gap-5">
      <motion.div layout animate={{ width: selectedUser ? "300px" : "100%" }} transition={{ type: "spring", stiffness: 260, damping: 32 }} className="shrink-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3"><SearchBox value={search} onChange={setSearch} /></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"><th className="px-5 py-3">{labels.columns.user}</th>{!selectedUser && <th className="px-4 py-3">{labels.columns.agencies}</th>}</tr></thead>
            <tbody>
              {users.map((user) => {
                const count = data.agencyMemberships.filter((membership) => membership.userId === user.id && membership.status === "active").length;
                return (
                  <tr key={user.id} onClick={() => { setSelectedUserId(user.id === selectedUserId ? null : user.id); setSelectedMembershipId(null); }} className={cn("cursor-pointer border-b border-slate-100/50 transition", selectedUserId === user.id ? "bg-indigo-50/60" : "hover:bg-slate-50/60")}>
                    <td className="px-5 py-3"><UserIdentity name={user.fullName} email={selectedUser ? undefined : user.email} /></td>
                    {!selectedUser && <td className="px-4 py-3 text-sm font-semibold tabular-nums text-slate-700">{count}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
      {selectedUser && selectedMembership && (
        <OverrideMatrix
          data={data}
          labels={labels}
          userId={selectedUser.id}
          userName={selectedUser.fullName}
          companyRoleId={selectedUser.companyRoleId}
          companyRoleName={selectedUser.companyRoleName}
          memberships={memberships}
          selectedMembership={selectedMembership}
          onSelectMembership={setSelectedMembershipId}
          onClose={() => { setSelectedUserId(null); setSelectedMembershipId(null); }}
        />
      )}
    </div>
  );
}

function AgencyView({ data, labels }: { data: WorkspacePermissionsData; labels: Labels }) {
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const selectedAgency = data.agencies.find((agency) => agency.id === selectedAgencyId) ?? null;
  const memberships = data.agencyMemberships.filter((membership) => membership.agencyId === selectedAgencyId && membership.status === "active");
  const selectedMembership = memberships.find((membership) => membership.id === selectedMembershipId) ?? null;
  const selectedUser = data.users.find((user) => user.id === selectedMembership?.userId) ?? null;

  return (
    <div className="flex gap-5">
      <div className="w-72 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"><th className="px-5 py-3">{labels.columns.agency}</th><th className="px-4 py-3 text-right">{labels.columns.members}</th></tr></thead>
          <tbody>
            {data.agencies.map((agency) => {
              const count = data.agencyMemberships.filter((membership) => membership.agencyId === agency.id && membership.status === "active").length;
              return (
                <tr key={agency.id} onClick={() => { setSelectedAgencyId(agency.id === selectedAgencyId ? null : agency.id); setSelectedMembershipId(null); }} className={cn("cursor-pointer border-b border-slate-100/50 transition", selectedAgencyId === agency.id ? "bg-indigo-50/60" : "hover:bg-slate-50/60")}>
                  <td className="px-5 py-3.5"><div className="font-semibold text-slate-800">{agency.name}</div><div className="text-xs text-slate-400">{agency.code}</div></td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-700">{count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedAgency && (
        <div className="w-72 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold text-slate-500">{selectedAgency.name}</div>
          <table className="w-full text-sm">
            <tbody>
              {memberships.map((membership) => {
                const user = data.users.find((item) => item.id === membership.userId);
                return (
                  <tr key={membership.id} onClick={() => setSelectedMembershipId(membership.id === selectedMembershipId ? null : membership.id)} className={cn("cursor-pointer border-b border-slate-100/50 transition", selectedMembershipId === membership.id ? "bg-indigo-50/60" : "hover:bg-slate-50/60")}>
                    <td className="px-5 py-3"><UserIdentity name={user?.fullName ?? membership.userId} /></td>
                    <td className="px-4 py-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", rolePill(membership.roleName))}>{roleName(membership.roleName, labels)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedMembership && selectedUser && (
        <OverrideMatrix
          data={data}
          labels={labels}
          userId={selectedUser.id}
          userName={selectedUser.fullName}
          companyRoleId={selectedUser.companyRoleId}
          companyRoleName={selectedUser.companyRoleName}
          memberships={memberships}
          selectedMembership={selectedMembership}
          onSelectMembership={setSelectedMembershipId}
          onClose={() => setSelectedMembershipId(null)}
        />
      )}
    </div>
  );
}

function OverrideMatrix({
  data,
  labels,
  userId,
  userName,
  companyRoleId,
  companyRoleName,
  memberships,
  selectedMembership,
  onSelectMembership,
  onClose,
}: {
  data: WorkspacePermissionsData;
  labels: Labels;
  userId: string;
  userName: string;
  companyRoleId: string;
  companyRoleName: string;
  memberships: AgencyMembership[];
  selectedMembership: AgencyMembership;
  onSelectMembership: (membershipId: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const agencyRole = data.roles.find((item) => item.id === selectedMembership.roleId);
  const companyRole = data.roles.find((item) => item.id === companyRoleId);
  const isOwner = companyRole?.scope === "company" && companyRole.name === "owner";
  const baseRole = isOwner ? companyRole : agencyRole;
  const granted = new Set(baseRole?.permissionKeys ?? []);
  const agencyPermissions = data.permissions.filter((permission) => permissionScope(permission.key) === "agency");
  const grouped = groupPermissions(agencyPermissions);
  const overrideByKey = new Map(data.overrides.filter((override) => override.agencyMembershipId === selectedMembership.id).map((override) => [override.permissionKey, override]));

  const run = (promise: Promise<{ success: boolean; message?: string }>, success: string) => {
    startTransition(async () => {
      const result = await promise;
      if (result.success) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(errorMessage(result.message ?? "", labels));
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="min-w-0 flex-1">
      <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="font-semibold text-slate-900">{userName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {labels.states.companyRole}: {roleName(companyRoleName, labels)} · {selectedMembership.agencyName} · {labels.states.agencyRole}: {roleName(selectedMembership.roleName, labels)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {labels.states.inheritedFromRole}: {roleName(baseRole?.name ?? selectedMembership.roleName, labels)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        {memberships.length > 1 && (
          <div className="flex gap-1 border-b border-slate-100 px-5 py-2.5">
            {memberships.map((membership) => (
              <button key={membership.id} type="button" onClick={() => onSelectMembership(membership.id)} className={cn("rounded-xl px-3 py-1.5 text-xs font-medium", membership.id === selectedMembership.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100")}>{membership.agencyName}</button>
            ))}
          </div>
        )}
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs text-slate-500">{labels.states.individualOverrides}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-left"><th className="w-44 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{labels.columns.module}</th><th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">{labels.states.authorized}</th><th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">{labels.columns.override}</th></tr></thead>
            <tbody>
              {grouped.flatMap((group) => group.permissions.map((permission) => {
                const override = overrideByKey.get(permission.key);
                const allowed = override?.effect === "grant" || (!override && granted.has(permission.key));
                return (
                  <tr key={permission.key} className="border-b border-slate-100/70 last:border-0">
                    <td className="px-5 py-3.5"><PermissionLabel permission={permission} labels={labels} /></td>
                    <td className="px-2 py-3 text-center"><StateDot allowed={allowed} denied={override?.effect === "deny"} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button disabled={pending} onClick={() => run(setUserPermissionOverrideAction({ agencyId: selectedMembership.agencyId, targetUserId: userId, permissionKey: permission.key, effect: "grant" }), labels.messages.overrideSaved)} className={cn("rounded-lg px-2 py-1 text-[11px] font-semibold", override?.effect === "grant" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{labels.actions.grant}</button>
                        <button disabled={pending} onClick={() => run(setUserPermissionOverrideAction({ agencyId: selectedMembership.agencyId, targetUserId: userId, permissionKey: permission.key, effect: "deny" }), labels.messages.overrideSaved)} className={cn("rounded-lg px-2 py-1 text-[11px] font-semibold", override?.effect === "deny" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500")}>{labels.actions.deny}</button>
                        {override && <button disabled={pending} onClick={() => run(revokeUserPermissionOverrideAction({ agencyId: selectedMembership.agencyId, targetUserId: userId, permissionKey: permission.key }), labels.messages.overrideRevoked)} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100">{labels.actions.revoke}</button>}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function MatrixPanel({
  title,
  subtitle,
  grouped,
  granted,
  readonly,
  labels,
  actions,
  onClose,
  onToggle,
}: {
  title: string;
  subtitle: string;
  grouped: { domain: string; permissions: Permission[] }[];
  granted: Set<string>;
  readonly: boolean;
  labels: Labels;
  actions?: React.ReactNode;
  onClose: () => void;
  onToggle: (permissionKey: string) => void;
}) {
  return (
    <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div><p className="font-semibold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div>
        <div className="flex items-center gap-2">{actions}<button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50/60 text-left"><th className="w-44 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{labels.columns.module}</th><th className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">{labels.states.authorized}</th><th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">{labels.columns.permissions}</th></tr></thead>
          <tbody>
            {grouped.flatMap((group) => group.permissions.map((permission) => (
              <tr key={permission.key} className="border-b border-slate-100/70 last:border-0">
                <td className="px-5 py-3.5"><PermissionLabel permission={permission} labels={labels} /></td>
                <td className="px-2 py-3 text-center">
                  <button type="button" disabled={readonly} onClick={() => onToggle(permission.key)} className={cn("mx-auto flex h-5 w-5 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed", granted.has(permission.key) ? "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-200 ring-offset-1" : "bg-slate-100 text-slate-300")}>{granted.has(permission.key) ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}</button>
                </td>
                <td className="px-4 py-3.5 text-right text-xs text-slate-400">{permission.key}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-5 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
        <LegendDot allowed label={labels.states.authorized} />
        <LegendDot label={labels.states.denied} />
        {readonly && <p className="ml-auto text-xs font-semibold text-slate-400">{labels.states.readonly}</p>}
      </div>
    </div>
  );
}

function PermissionLabel({ permission, labels }: { permission: Permission; labels: Labels }) {
  const Icon = moduleIcons[permission.domain] ?? Shield;
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-3.5 w-3.5" /></span>
      <div><p className="font-medium text-slate-800">{groupLabel(permission.domain, labels)} · {capabilityLabel(permission.key, labels)}</p><p className="text-[11px] text-slate-400">{permission.key}</p></div>
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <Search className="h-3.5 w-3.5 text-slate-400" />
      <input value={value} onChange={(event) => onChange(event.target.value)} className="flex-1 bg-transparent text-sm text-slate-700 outline-none" />
      {value && <button type="button" onClick={() => onChange("")}><X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" /></button>}
    </div>
  );
}

function UserIdentity({ name, email }: { name: string; email?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(name)}</span>
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{name}</p>{email && <p className="truncate text-xs text-slate-400">{email}</p>}</div>
    </div>
  );
}

function StateDot({ allowed, denied }: { allowed: boolean; denied?: boolean }) {
  return (
    <span className={cn("mx-auto flex h-5 w-5 items-center justify-center rounded-full", denied ? "bg-rose-100 text-rose-600" : allowed ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300")}>
      {allowed && !denied ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
    </span>
  );
}

function LegendDot({ allowed, label }: { allowed?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <StateDot allowed={Boolean(allowed)} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function toggleSet(current: Set<string> | null, key: string) {
  const next = new Set(current ?? []);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}
