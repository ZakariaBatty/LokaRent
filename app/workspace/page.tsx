import { Activity, Building2, Gauge, Users } from "lucide-react";
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { listActivityLogsService } from "@/modules/workspace/activity/services/activity.service";
import { getCompanyService, getCompanyUsageCountsService } from "@/modules/workspace/agencies/services/agencies.service";
import { getPlanService } from "@/modules/workspace/billing/services/billing.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { cn } from "@/lib/utils";

const usageCards = [
  { key: "max_agencies", label: "Agences", usageKey: "agencies", icon: Building2 },
  { key: "max_users", label: "Utilisateurs", usageKey: "users", icon: Users },
  { key: "max_vehicles", label: "Véhicules", usageKey: "vehicles", icon: Gauge },
  { key: "max_customers", label: "Clients", usageKey: "customers", icon: Users },
] as const;

function formatLimit(value?: number) {
  if (value === undefined) return "—";
  return value === -1 ? "Illimité" : value.toLocaleString("fr-FR");
}

function pct(used: number, limit?: number) {
  if (!limit || limit < 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export default async function WorkspaceIndexPage() {
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_VIEW, context);

  const [company, usage, plan, activityLogs] = await Promise.all([
    getCompanyService({ companyId: context.companyId }),
    getCompanyUsageCountsService(context.companyId),
    getCompanyService({ companyId: context.companyId }).then((resolvedCompany) => getPlanService(resolvedCompany.planId)),
    listActivityLogsService({ companyId: context.companyId }),
  ]);

  const limits = new Map(plan.limits.map((limit) => [limit.limitKey, Number(limit.limitValue)]));
  const recentActivity = activityLogs.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="crown"
          breadcrumb="Aperçu"
          title="Aperçu workspace"
          description="Administration société, plan et usage global."
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Société</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{company.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{company.slug}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{plan.displayName}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statut</p>
              <p className="mt-1 text-sm font-semibold capitalize text-emerald-700">{company.status}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {usageCards.map((card) => {
            const Icon = card.icon;
            const used = usage[card.usageKey];
            const limit = limits.get(card.key);
            const percent = pct(used, limit);
            return (
              <div key={card.key} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-slate-400">
                    {formatLimit(limit)}
                  </span>
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                  {used.toLocaleString("fr-FR")}
                  {limit !== undefined && limit >= 0 && (
                    <span className="text-sm font-semibold text-slate-400"> / {limit.toLocaleString("fr-FR")}</span>
                  )}
                </p>
                {limit !== undefined && limit >= 0 && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", percent >= 90 ? "bg-amber-500" : "bg-indigo-600")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">Usage administratif</p>
          </div>
          <div className="divide-y divide-slate-100">
            <UsageLine label="Réservations" value={usage.reservations} />
            <UsageLine label="Plan actif" value={plan.displayName} />
            <UsageLine label="Fonctionnalités plan" value={plan.features.length} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Activity className="h-4 w-4 text-indigo-600" />
            <p className="text-sm font-semibold text-slate-900">Activité récente</p>
          </div>
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-800">{log.verb}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {log.actorName} · {new Date(log.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Aucune activité administrative récente.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function UsageLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </span>
    </div>
  );
}
