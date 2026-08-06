import type { CurrentAgencyContext, CurrentCompanyContext } from "@/shared/auth";
import {
  createForbiddenError,
  createId,
  createValidationError,
  runInTransaction,
  writeActivityLog,
  writeAuditLog,
} from "@/shared";
import {
  findCompanyById,
  updateAgency,
  updateCompany,
} from "@/modules/workspace/agencies/repositories/agencies.repository";
import { upsertSetting } from "@/modules/workspace/billing/repositories/billing.repository";
import type { CompleteOnboardingInput } from "../validators/complete-onboarding.schema";

type OnboardingContext = CurrentCompanyContext &
  CurrentAgencyContext & {
    actorName?: string;
  };

function assertOwnerContext(context: CurrentCompanyContext) {
  if (!context.isOwner) {
    throw createForbiddenError("Company owner access required", {
      companyId: context.companyId,
      userId: context.userId,
    });
  }
}

function assertOnboardingStatus(status: string) {
  if (status === "active") {
    throw createValidationError("Onboarding is already complete");
  }
  if (status !== "trial" && status !== "onboarding") {
    throw createForbiddenError("Company cannot complete onboarding from its current status", {
      status,
    });
  }
}

function setting(
  companyId: string,
  agencyId: string | null,
  key: string,
  value: string,
  valueType: string,
) {
  return {
    companyId,
    agencyId,
    key,
    create: {
      id: createId(),
      value,
      valueType,
      isEncrypted: false,
    },
    update: {
      value,
      valueType,
      isEncrypted: false,
      deletedAt: null,
      deletedBy: null,
    },
  };
}

export async function completeOnboardingService(input: {
  context: OnboardingContext;
  data: CompleteOnboardingInput;
}) {
  assertOwnerContext(input.context);
  assertOnboardingStatus(String(input.context.companyStatus));

  return runInTransaction(async (tx) => {
    const company = await findCompanyById({ companyId: input.context.companyId }, tx);
    if (!company) {
      throw createValidationError("Company context is invalid", {
        companyId: input.context.companyId,
      });
    }
    assertOnboardingStatus(String(company.status));

    await updateCompany(
      {
        companyId: input.context.companyId,
        data: {
          name: input.data.company.legalName,
          countryCode: input.data.company.countryCode,
          timezone: input.data.company.timezone,
          currency: input.data.company.currency,
          language: input.data.preferences.defaultLanguage,
          status: "active",
        },
      },
      tx,
    );

    await updateAgency(
      {
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        data: {
          name: input.data.agency.name,
          code: input.data.agency.code,
          countryCode: input.data.company.countryCode,
          timezone: input.data.company.timezone,
          currency: input.data.company.currency,
          phone: input.data.agency.phone,
          email: input.data.agency.email ?? null,
          address: {
            line: input.data.agency.address,
            companyAddress: input.data.company.address,
          },
          status: "active",
        },
      },
      tx,
    );

    const optionalData = {
      vehicles: input.data.optionalData.vehicles.filter(
        (vehicle) => vehicle.brand || vehicle.model || vehicle.plate || vehicle.category,
      ),
      customer: input.data.optionalData.customer,
    };
    const settings = [
      setting(input.context.companyId, null, "default_currency", input.data.company.currency, "string"),
      setting(input.context.companyId, null, "onboarding_completed", "true", "boolean"),
      setting(input.context.companyId, null, "company_logo_url", input.data.company.logoUrl ?? "", "url"),
      setting(input.context.companyId, null, "company_phone", input.data.company.phone, "string"),
      setting(input.context.companyId, null, "company_address", input.data.company.address, "string"),
      setting(input.context.companyId, null, "invoice_prefix", input.data.preferences.invoicePrefix, "string"),
      setting(
        input.context.companyId,
        null,
        "reservation_prefix",
        input.data.preferences.reservationPrefix,
        "string",
      ),
      setting(input.context.companyId, null, "contract_prefix", input.data.preferences.contractPrefix, "string"),
      setting(input.context.companyId, input.context.agencyId, "tax_rate", String(input.data.preferences.taxRate), "number"),
      setting(
        input.context.companyId,
        input.context.agencyId,
        "contract_language",
        input.data.preferences.defaultLanguage,
        "string",
      ),
      setting(
        input.context.companyId,
        input.context.agencyId,
        "email_notifications_enabled",
        String(input.data.preferences.emailNotifications),
        "boolean",
      ),
      setting(
        input.context.companyId,
        input.context.agencyId,
        "whatsapp_notifications_enabled",
        String(input.data.preferences.whatsappNotifications),
        "boolean",
      ),
      setting(
        input.context.companyId,
        input.context.agencyId,
        "onboarding_optional_initial_data",
        JSON.stringify(optionalData),
        "json",
      ),
    ];

    await Promise.all(settings.map((row) => upsertSetting(row, tx)));

    const changes = {
      before: {
        companyStatus: company.status,
      },
      after: {
        companyStatus: "active",
        companyName: input.data.company.legalName,
        agencyName: input.data.agency.name,
        agencyId: input.context.agencyId,
      },
    };

    await writeAuditLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        action: "OnboardingCompleted",
        entityType: "company",
        entityId: input.context.companyId,
        changes,
      },
      tx,
    );
    await writeActivityLog(
      {
        id: createId(),
        companyId: input.context.companyId,
        agencyId: input.context.agencyId,
        userId: input.context.userId,
        actorName: input.context.actorName,
        entityType: "company",
        entityId: input.context.companyId,
        verb: "OnboardingCompleted",
        metadata: changes,
      },
      tx,
    );

    return { success: true as const };
  });
}
