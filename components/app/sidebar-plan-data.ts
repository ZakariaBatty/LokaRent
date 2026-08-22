import type { CurrentCompanyContext } from "@/shared/auth"
import {
  getCompanyService,
  getCompanyUsageCountsService,
} from "@/modules/workspace/agencies/services/agencies.service"
import { getPlanService } from "@/modules/workspace/billing/services/billing.service"
import { PERMISSIONS, can } from "@/shared/permissions"

export type SidebarPlanUsageData = {
  planName: string
  vehicles: {
    used: number
    limit: number | null
  }
  agencies: {
    used: number
    limit: number | null
  }
  canManageBilling: boolean
}

function getLimit(limits: Array<{ limitKey: string; limitValue: number }>, limitKey: string) {
  return limits.find((limit) => limit.limitKey === limitKey)?.limitValue ?? null
}

export async function getSidebarPlanUsageData(
  context: CurrentCompanyContext,
): Promise<SidebarPlanUsageData> {
  const [company, usage, canManageBilling] = await Promise.all([
    getCompanyService({ companyId: context.companyId }),
    getCompanyUsageCountsService(context.companyId),
    can(PERMISSIONS.WORKSPACE_BILLING_MANAGE, context),
  ])
  const plan = await getPlanService(company.planId)

  return {
    planName: plan.displayName,
    vehicles: {
      used: usage.vehicles,
      limit: getLimit(plan.limits, "max_vehicles"),
    },
    agencies: {
      used: usage.agencies,
      limit: getLimit(plan.limits, "max_agencies"),
    },
    canManageBilling,
  }
}
