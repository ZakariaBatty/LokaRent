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
import {
  countVehicles,
  createVehicle,
  findVehicleByPlate,
  findVehicleCategoryByName,
} from "@/modules/cars/repositories/cars.repository";
import {
  countCustomers,
  createCustomer,
  createCustomerBusiness,
  createCustomerIndividual,
  findCustomerByContact,
} from "@/modules/clients/repositories/clients.repository";
import { findPlanLimit, upsertSetting } from "@/modules/workspace/billing/repositories/billing.repository";
import { assertPlanLimit } from "@/modules/workspace/billing/services/billing.service";
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

const CATEGORY_NAME_BY_ONBOARDING_VALUE: Record<string, string> = {
  Citadine: "Economy",
  Berline: "Sedan",
  SUV: "SUV",
  "4x4": "SUV",
  Utilitaire: "Van",
};

function nonEmpty(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function getCompletedStarterVehicles(data: CompleteOnboardingInput) {
  return data.optionalData.vehicles.filter((vehicle) =>
    [
      vehicle.brand,
      vehicle.model,
      vehicle.plate,
      vehicle.category,
      vehicle.fuelType,
      vehicle.transmission,
      vehicle.dailyPrice,
    ].some((value) => nonEmpty(value) || typeof value === "number"),
  );
}

function assertStarterVehicleComplete(vehicle: ReturnType<typeof getCompletedStarterVehicles>[number]) {
  if (
    !nonEmpty(vehicle.brand) ||
    !nonEmpty(vehicle.model) ||
    !vehicle.year ||
    !nonEmpty(vehicle.plate) ||
    !nonEmpty(vehicle.category) ||
    !nonEmpty(vehicle.fuelType) ||
    !nonEmpty(vehicle.transmission)
  ) {
    throw createValidationError("Starter vehicle is incomplete", {
      requiredFields: ["brand", "model", "year", "plate", "category", "fuelType", "transmission"],
    });
  }
}

function getStarterCustomer(data: CompleteOnboardingInput) {
  const customer = data.optionalData.customer;
  const hasData = [customer.fullName, customer.phone, customer.email].some(nonEmpty);
  return hasData ? customer : null;
}

function assertStarterCustomerComplete(customer: NonNullable<ReturnType<typeof getStarterCustomer>>) {
  if (!nonEmpty(customer.fullName) || (!nonEmpty(customer.phone) && !nonEmpty(customer.email))) {
    throw createValidationError("Starter customer is incomplete", {
      requiredFields: ["fullName", "phone or email"],
    });
  }
  if (customer.type === "individual" && customer.fullName.trim().split(/\s+/).length < 2) {
    throw createValidationError("Individual starter customer requires first and last name", {
      requiredFields: ["firstName", "lastName"],
    });
  }
}

function splitCustomerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

export async function completeOnboardingService(input: {
  context: OnboardingContext;
  data: CompleteOnboardingInput;
}) {
  assertOwnerContext(input.context);
  assertOnboardingStatus(String(input.context.companyStatus));
  const starterVehicles = getCompletedStarterVehicles(input.data);
  starterVehicles.forEach(assertStarterVehicleComplete);
  const starterCustomer = getStarterCustomer(input.data);
  if (starterCustomer) assertStarterCustomerComplete(starterCustomer);

  return runInTransaction(async (tx) => {
    const company = await findCompanyById({ companyId: input.context.companyId }, tx);
    if (!company) {
      throw createValidationError("Company context is invalid", {
        companyId: input.context.companyId,
      });
    }
    assertOnboardingStatus(String(company.status));

    const vehiclesToCreate: typeof starterVehicles = [];
    for (const vehicle of starterVehicles) {
      const existing = await findVehicleByPlate(
        {
          companyId: input.context.companyId,
          plate: vehicle.plate,
        },
        tx,
      );
      if (!existing) vehiclesToCreate.push(vehicle);
    }
    const existingStarterCustomer = starterCustomer
      ? await findCustomerByContact(
          {
            companyId: input.context.companyId,
            agencyId: input.context.agencyId,
            email: starterCustomer.email,
            phone: starterCustomer.phone,
          },
          tx,
        )
      : null;

    const [vehicleLimit, customerLimit, currentVehicleCount, currentCustomerCount] =
      await Promise.all([
        findPlanLimit({ planId: company.planId, limitKey: "max_vehicles" }, tx),
        findPlanLimit({ planId: company.planId, limitKey: "max_customers" }, tx),
        countVehicles({ companyId: input.context.companyId }, tx),
        countCustomers({ companyId: input.context.companyId }, tx),
      ]);

    assertPlanLimit({
      planId: company.planId,
      limitKey: "max_vehicles",
      limitValue: vehicleLimit?.limitValue,
      currentUsage: currentVehicleCount,
      requestedIncrement: vehiclesToCreate.length,
    });
    assertPlanLimit({
      planId: company.planId,
      limitKey: "max_customers",
      limitValue: customerLimit?.limitValue,
      currentUsage: currentCustomerCount,
      requestedIncrement: starterCustomer && !existingStarterCustomer ? 1 : 0,
    });

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

    for (const [index, vehicle] of vehiclesToCreate.entries()) {
      const { year, fuelType, transmission } = vehicle;
      if (!year || !fuelType || !transmission) {
        throw createValidationError("Starter vehicle is incomplete", {
          requiredFields: ["year", "fuelType", "transmission"],
        });
      }
      const categoryName = CATEGORY_NAME_BY_ONBOARDING_VALUE[vehicle.category] ?? vehicle.category;
      const category = await findVehicleCategoryByName(
        { companyId: input.context.companyId, name: categoryName },
        tx,
      );
      if (!category) {
        throw createValidationError("Starter vehicle category is invalid", {
          category: vehicle.category,
          resolvedCategory: categoryName,
        });
      }

      await createVehicle(
        {
          id: createId(),
          companyId: input.context.companyId,
          agencyId: input.context.agencyId,
          categoryId: category.id,
          code: `VEH-ONB-${index + 1}`,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year,
          fuelType,
          transmission,
          status: "available",
          notes:
            vehicle.dailyPrice !== undefined
              ? `Onboarding daily price: ${vehicle.dailyPrice}`
              : null,
        },
        tx,
      );
    }

    if (starterCustomer && !existingStarterCustomer) {
      const customerId = createId();
      await createCustomer(
        {
          id: customerId,
          companyId: input.context.companyId,
          agencyId: input.context.agencyId,
          code: "CUS-ONB-1",
          type: starterCustomer.type,
          email: starterCustomer.email ?? null,
          phone: starterCustomer.phone || null,
          status: "active",
        },
        tx,
      );

      if (starterCustomer.type === "individual") {
        const name = splitCustomerName(starterCustomer.fullName);
        await createCustomerIndividual(
          {
            id: createId(),
            customerId,
            companyId: input.context.companyId,
            firstName: name.firstName,
            lastName: name.lastName,
          },
          tx,
        );
      } else {
        await createCustomerBusiness(
          {
            id: createId(),
            customerId,
            companyId: input.context.companyId,
            companyName: starterCustomer.fullName,
          },
          tx,
        );
      }
    }

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
