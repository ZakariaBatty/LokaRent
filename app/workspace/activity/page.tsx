import Link from "next/link";
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSignature,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { listActiveAgenciesService } from "@/modules/workspace/agencies/services/agencies.service";
import {
  listWorkspaceActivityFeedService,
  listWorkspaceActivityFilterOptionsService,
} from "@/modules/workspace/activity/services/activity.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { cn } from "@/lib/utils";
import fr from "@/translations/fr";

type ActivitySearchParams = Promise<{
  q?: string;
  agencyId?: string;
  verb?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
  selected?: string;
}>;

type ActivityRow = Awaited<ReturnType<typeof listWorkspaceActivityFeedService>>["items"][number];

const actionStyles: Record<string, { icon: typeof Plus; dot: string; bg: string }> = {
  create: { icon: Plus, dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  created: { icon: Plus, dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700" },
  update: { icon: Pencil, dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  updated: { icon: Pencil, dot: "bg-sky-400", bg: "bg-sky-50 text-sky-700" },
  delete: { icon: Trash2, dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700" },
  deleted: { icon: Trash2, dot: "bg-rose-500", bg: "bg-rose-50 text-rose-700" },
  export: { icon: Download, dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  sign: { icon: FileSignature, dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-700" },
  default: { icon: Activity, dot: "bg-slate-400", bg: "bg-slate-100 text-slate-600" },
};

const entityColors: Record<string, string> = {
  agency: "bg-indigo-50 text-indigo-700",
  company: "bg-slate-100 text-slate-600",
  user_permission_override: "bg-violet-50 text-violet-700",
  vehicle: "bg-sky-50 text-sky-700",
  customer: "bg-violet-50 text-violet-700",
  reservation: "bg-indigo-50 text-indigo-700",
  contract: "bg-amber-50 text-amber-700",
  payment: "bg-emerald-50 text-emerald-700",
  expense: "bg-rose-50 text-rose-700",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseDate(value: string | undefined, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

function actionKey(verb: string) {
  const normalized = verb.toLowerCase();
  if (normalized.includes("created")) return "created";
  if (normalized.includes("updated")) return "updated";
  if (normalized.includes("deleted") || normalized.includes("deactivated") || normalized.includes("revoked")) return "deleted";
  if (normalized.includes("export")) return "export";
  if (normalized.includes("sign")) return "sign";
  return "default";
}

function actionLabel(verb: string, labels: typeof fr.workspace.activity) {
  return labels.actions[verb as keyof typeof labels.actions] ?? verb;
}

function entityLabel(entityType: string, labels: typeof fr.workspace.activity) {
  return labels.entities[entityType as keyof typeof labels.entities] ?? entityType.replaceAll("_", " ");
}

function fmt(date: Date) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  next.delete("selected");
  return `/workspace/activity?${next.toString()}`;
}

function selectedHref(params: URLSearchParams, id: string, active: boolean) {
  const next = new URLSearchParams(params);
  if (active) next.delete("selected");
  else next.set("selected", id);
  return `/workspace/activity?${next.toString()}`;
}

function metadataSummary(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const after = (metadata as Record<string, unknown>).after;
  if (after && typeof after === "object" && !Array.isArray(after)) {
    return Object.entries(after as Record<string, unknown>)
      .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  }
  return "";
}

export default async function WorkspaceActivityPage({
  searchParams,
}: {
  searchParams: ActivitySearchParams;
}) {
  const labels = fr.workspace.activity;
  const params = await searchParams;
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_ACTIVITY_VIEW, context);

  const query = firstValue(params.q)?.trim() ?? "";
  const agencyId = firstValue(params.agencyId);
  const verb = firstValue(params.verb);
  const entityType = firstValue(params.entityType);
  const page = parsePage(firstValue(params.page));
  const pageSize = Math.min(100, Math.max(1, Number(firstValue(params.pageSize)) || 20));
  const selectedId = firstValue(params.selected) ?? null;
  const from = parseDate(firstValue(params.from));
  const to = parseDate(firstValue(params.to), true);

  const [agencies, filterOptions, feed] = await Promise.all([
    listActiveAgenciesService(context.companyId),
    listWorkspaceActivityFilterOptionsService({ companyId: context.companyId }),
    listWorkspaceActivityFeedService({
      companyId: context.companyId,
      agencyId: agencyId && agencyId !== "all" ? agencyId : undefined,
      verb: verb && verb !== "all" ? verb : undefined,
      entityType: entityType && entityType !== "all" ? entityType : undefined,
      search: query || undefined,
      from,
      to,
      page,
      pageSize,
    }),
  ]);

  const selectedLog = feed.items.find((item) => item.id === selectedId) ?? null;
  const hasSelection = Boolean(selectedLog);
  const currentParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalized = firstValue(value);
    if (normalized) currentParams.set(key, normalized);
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="activity"
          breadcrumb={labels.breadcrumb}
          title={labels.title}
          description={labels.description}
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      <form action="/workspace/activity" className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={labels.filters.searchPlaceholder}
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
        <select name="agencyId" defaultValue={agencyId ?? "all"} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15">
          <option value="all">{labels.filters.allAgencies}</option>
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.id}>{agency.name}</option>
          ))}
        </select>
        <select name="verb" defaultValue={verb ?? "all"} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15">
          <option value="all">{labels.filters.allActions}</option>
          {filterOptions.verbs.map((item) => (
            <option key={item} value={item}>{actionLabel(item, labels)}</option>
          ))}
        </select>
        <select name="entityType" defaultValue={entityType ?? "all"} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15">
          <option value="all">{labels.filters.allEntities}</option>
          {filterOptions.entityTypes.map((item) => (
            <option key={item} value={item}>{entityLabel(item, labels)}</option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={firstValue(params.from) ?? ""} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
        <input type="date" name="to" defaultValue={firstValue(params.to) ?? ""} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15" />
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
          {labels.filters.apply}
        </button>
      </form>

      <div className="flex gap-5">
        <div className={cn("min-w-0 shrink-0", hasSelection ? "w-[40%]" : "w-full")}>
          {feed.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Activity className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">{labels.empty.title}</p>
              <p className="mt-1 text-xs text-slate-500">{labels.empty.description}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <p className="text-xs font-semibold text-slate-500">
                  {feed.total} {labels.table.entries}
                </p>
                <p className="text-xs text-slate-400">
                  {labels.pagination.page} {feed.page} / {feed.totalPages}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">{labels.columns.action}</th>
                      {!hasSelection && (
                        <>
                          <th className="px-4 py-3">{labels.columns.detail}</th>
                          <th className="px-4 py-3">{labels.columns.entity}</th>
                          <th className="px-4 py-3">{labels.columns.actor}</th>
                          <th className="px-4 py-3">{labels.columns.agency}</th>
                        </>
                      )}
                      <th className="px-4 py-3">{labels.columns.date}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {feed.items.map((log) => {
                      const active = selectedId === log.id;
                      const style = actionStyles[actionKey(log.verb)] ?? actionStyles.default;
                      const ActionIcon = style.icon;
                      return (
                        <tr key={log.id} className={cn("border-b border-slate-100/50 transition", active ? "bg-indigo-50/60" : "hover:bg-slate-50/60")}>
                          <td className="px-5 py-3.5">
                            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", style.bg)}>
                              <ActionIcon className="h-3 w-3 shrink-0" />
                              {actionLabel(log.verb, labels)}
                            </span>
                          </td>
                          {!hasSelection && (
                            <>
                              <td className="max-w-[240px] px-4 py-3.5">
                                <p className="truncate text-xs text-slate-700">{metadataSummary(log.metadata) || log.entityId}</p>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", entityColors[log.entityType] ?? "bg-slate-100 text-slate-600")}>
                                  {entityLabel(log.entityType, labels)}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs font-medium text-slate-700">{log.user?.fullName ?? log.actorName}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                  <span className="truncate">{log.agency?.name ?? labels.table.companyWide}</span>
                                </div>
                              </td>
                            </>
                          )}
                          <td className="whitespace-nowrap px-4 py-3.5 text-[11px] tabular-nums text-slate-400">
                            {fmt(log.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link href={selectedHref(currentParams, log.id, active)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-100 hover:text-indigo-500">
                              <ChevronRight className={cn("h-4 w-4 transition", active && "rotate-90 text-indigo-500")} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-5 py-3">
                <Link
                  href={pageHref(currentParams, Math.max(1, feed.page - 1))}
                  aria-disabled={feed.page <= 1}
                  className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold", feed.page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-white")}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {labels.pagination.previous}
                </Link>
                <Link
                  href={pageHref(currentParams, Math.min(feed.totalPages, feed.page + 1))}
                  aria-disabled={feed.page >= feed.totalPages}
                  className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold", feed.page >= feed.totalPages ? "pointer-events-none text-slate-300" : "text-slate-600 hover:bg-white")}
                >
                  {labels.pagination.next}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {selectedLog && (
          <div className="min-w-0 w-[60%] shrink-0">
            <LogDetailPanel log={selectedLog} labels={labels} params={currentParams} />
          </div>
        )}
      </div>
    </div>
  );
}

function LogDetailPanel({
  log,
  labels,
  params,
}: {
  log: ActivityRow;
  labels: typeof fr.workspace.activity;
  params: URLSearchParams;
}) {
  const style = actionStyles[actionKey(log.verb)] ?? actionStyles.default;
  const ActionIcon = style.icon;
  const closeParams = new URLSearchParams(params);
  closeParams.delete("selected");

  return (
    <div className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset", style.bg)}>
            <ActionIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">{labels.detail.title}</h2>
            <span className={cn("mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold", style.bg)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
              {actionLabel(log.verb, labels)}
            </span>
          </div>
        </div>
        <Link href={`/workspace/activity?${closeParams.toString()}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Link>
      </div>

      <div className="space-y-5 px-5 py-5">
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.detail.description}</p>
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 px-4 py-3">
            <p className="text-sm leading-relaxed text-slate-800">{metadataSummary(log.metadata) || log.verb}</p>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.detail.information}</p>
          <div className="space-y-2">
            <MetaRow label={labels.columns.entity}>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", entityColors[log.entityType] ?? "bg-slate-100 text-slate-600")}>
                {entityLabel(log.entityType, labels)}
              </span>
            </MetaRow>
            <MetaRow label={labels.detail.entityId}>
              <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{log.entityId}</code>
            </MetaRow>
            <MetaRow label={labels.columns.actor}>
              <div className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-[9px] font-bold uppercase text-slate-600">
                  <User className="h-3 w-3" />
                </span>
                <span className="text-xs font-medium text-slate-800">{log.user?.fullName ?? log.actorName}</span>
              </div>
            </MetaRow>
            <MetaRow label={labels.columns.agency}>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">{log.agency?.name ?? labels.table.companyWide}</span>
              </div>
            </MetaRow>
            <MetaRow label={labels.columns.date}>
              <span className="text-xs font-medium tabular-nums text-slate-800">
                {log.createdAt.toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </MetaRow>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/60 px-3 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <div>{children}</div>
    </div>
  );
}
