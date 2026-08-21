import type { ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Gauge,
  Lock,
  ReceiptText,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WorkspacePageHeader } from "@/components/workspace/workspace-page-header";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import {
  getCompanyService,
  getCompanyUsageCountsService,
} from "@/modules/workspace/agencies/services/agencies.service";
import { getPlanService } from "@/modules/workspace/billing/services/billing.service";
import { requireCurrentCompanyContext } from "@/shared/auth";
import { PERMISSIONS, requirePermission } from "@/shared/permissions";
import { cn } from "@/lib/utils";
import fr from "@/translations/fr";

type UsageCounts = Awaited<ReturnType<typeof getCompanyUsageCountsService>>;
type UsageKey = keyof UsageCounts;
type LimitState = "normal" | "near" | "reached" | "unlimited" | "notTracked";

const usageLimitMap: Record<string, { usageKey: UsageKey; icon: LucideIcon }> = {
  max_agencies: { usageKey: "agencies", icon: Building2 },
  max_users: { usageKey: "users", icon: Users },
  max_vehicles: { usageKey: "vehicles", icon: Gauge },
  max_customers: { usageKey: "customers", icon: Users },
  max_reservations_per_month: { usageKey: "reservationsThisMonth", icon: ReceiptText },
};

const fallbackLimitIcon: LucideIcon = Gauge;

function formatNumber(value: number) {
  return value.toLocaleString("fr-FR");
}

function formatLimit(value: number, labels: typeof fr.workspace.billing) {
  return value === -1 ? labels.states.unlimited : formatNumber(value);
}

function limitPercent(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function getLimitState(input: { used?: number; limitValue: number }): LimitState {
  if (input.limitValue === -1) return "unlimited";
  if (input.used === undefined) return "notTracked";
  const percent = limitPercent(input.used, input.limitValue);
  if (percent >= 100) return "reached";
  if (percent >= 80) return "near";
  return "normal";
}

function stateClass(state: LimitState) {
  if (state === "reached") return "bg-rose-50 text-rose-700";
  if (state === "near") return "bg-amber-50 text-amber-700";
  if (state === "unlimited") return "bg-emerald-50 text-emerald-700";
  if (state === "notTracked") return "bg-slate-100 text-slate-600";
  return "bg-indigo-50 text-indigo-700";
}

function progressClass(state: LimitState) {
  if (state === "reached") return "bg-rose-500";
  if (state === "near") return "bg-amber-500";
  return "bg-indigo-600";
}

function limitLabel(key: string, labels: typeof fr.workspace.billing) {
  return labels.limits[key as keyof typeof labels.limits] ?? key.replaceAll("_", " ");
}

function featureLabel(key: string, labels: typeof fr.workspace.billing) {
  return labels.features[key as keyof typeof labels.features] ?? key.replaceAll("_", " ");
}

export default async function WorkspaceBillingPage() {
  const labels = fr.workspace.billing;
  const context = await requireCurrentCompanyContext();
  await requirePermission(PERMISSIONS.WORKSPACE_BILLING_MANAGE, context);

  const [company, usage] = await Promise.all([
    getCompanyService({ companyId: context.companyId }),
    getCompanyUsageCountsService(context.companyId),
  ]);
  const plan = await getPlanService(company.planId);
  const sortedLimits = [...plan.limits].sort((left, right) => left.limitKey.localeCompare(right.limitKey));
  const sortedFeatures = [...plan.features].sort((left, right) => left.featureKey.localeCompare(right.featureKey));

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div>
        <WorkspacePageHeader
          icon="creditCard"
          breadcrumb={labels.breadcrumb}
          title={labels.title}
          description={labels.description}
        />
        <div className="mt-6">
          <WorkspaceTabs />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.currentPlan.eyebrow}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{plan.displayName}</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                {plan.isActive ? labels.currentPlan.active : labels.currentPlan.inactive}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{company.name}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <PlanMeta label={labels.currentPlan.price} value={labels.currentPlan.priceUnavailable} />
            <PlanMeta label={labels.currentPlan.interval} value={labels.currentPlan.intervalUnavailable} />
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
            <p className="text-xs leading-relaxed text-slate-500">{labels.currentPlan.companyLevelNotice}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <UsageSummaryCard icon={Building2} label={labels.limits.max_agencies} value={usage.agencies} />
          <UsageSummaryCard icon={Users} label={labels.limits.max_users} value={usage.users} />
          <UsageSummaryCard icon={Gauge} label={labels.limits.max_vehicles} value={usage.vehicles} />
          <UsageSummaryCard icon={Users} label={labels.limits.max_customers} value={usage.customers} />
          <UsageSummaryCard icon={ReceiptText} label={labels.usage.reservationsTotal} value={usage.reservations} />
          <UsageSummaryCard icon={ReceiptText} label={labels.limits.max_reservations_per_month} value={usage.reservationsThisMonth} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-900">{labels.sections.limits}</p>
            <p className="mt-1 text-xs text-slate-500">{labels.sections.limitsDescription}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {sortedLimits.map((limit) => {
              const mapped = usageLimitMap[limit.limitKey];
              const Icon = mapped?.icon ?? fallbackLimitIcon;
              const used = mapped ? usage[mapped.usageKey] : undefined;
              const limitValue = Number(limit.limitValue);
              const state = getLimitState({ used, limitValue });
              const percent = used === undefined || limitValue === -1 ? 0 : limitPercent(used, limitValue);

              return (
                <div key={limit.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{limitLabel(limit.limitKey, labels)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {used === undefined
                            ? labels.states.notTracked
                            : `${formatNumber(used)} ${labels.usage.used} / ${formatLimit(limitValue, labels)}`}
                        </p>
                      </div>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold", stateClass(state))}>
                      {labels.states[state]}
                    </span>
                  </div>
                  {used !== undefined && limitValue !== -1 && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full", progressClass(state))} style={{ width: `${percent}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title={labels.sections.features} description={labels.sections.featuresDescription}>
            {sortedFeatures.length > 0 ? (
              <div className="space-y-2">
                {sortedFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-2 rounded-xl border border-slate-200/70 px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">{featureLabel(feature.featureKey, labels)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-400">
                {labels.empty.noFeatures}
              </p>
            )}
          </Panel>

          <Panel title={labels.sections.actions} description={labels.sections.actionsDescription}>
            <div className="grid gap-2">
              <UnavailableButton icon={RefreshCw}>{labels.actions.changePlan}</UnavailableButton>
              <UnavailableButton icon={CreditCard}>{labels.actions.paymentMethod}</UnavailableButton>
              <UnavailableButton icon={ReceiptText}>{labels.actions.invoices}</UnavailableButton>
            </div>
            <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{labels.unavailable.billing}</span>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function PlanMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function UsageSummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{formatNumber(value)}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function UnavailableButton({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex cursor-not-allowed items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-400"
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {children}
      </span>
      <Lock className="h-3.5 w-3.5" />
    </button>
  );
}
