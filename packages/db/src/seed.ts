import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { PrismaClient, RoleScope } from "@prisma/client";

type PlanSeed = {
  id: string;
  name: string;
  displayName: string;
  limits: Record<string, number>;
  features: string[];
};

type PermissionSeed = {
  key: string;
  domain: string;
  description: string;
};

type ReservationSourceSeed = {
  key: string;
  label: string;
  isExternal: boolean;
};

export type CompanyRoleTemplate = {
  name: string;
  description: string;
  scope: RoleScope;
  isSystem: true;
  permissions: string[];
};

export type CompanyDefaultSeed = {
  roles: CompanyRoleTemplate[];
  vehicleCategories: string[];
  expenseCategories: string[];
  settings: Array<{
    key: string;
    value: string;
    valueType: string;
    agencyScoped: boolean;
  }>;
};

function loadSharedEnv() {
  for (const envPath of [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "shared/.env"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), "../../.env.local"),
    resolve(process.cwd(), "../../shared/.env"),
  ]) {
    if (!existsSync(envPath)) {
      continue;
    }

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

export function createId() {
  const now = Date.now();
  const bytes = randomBytes(16);

  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = Math.floor(now / 0x1000000) & 0xff;
  bytes[3] = Math.floor(now / 0x10000) & 0xff;
  bytes[4] = Math.floor(now / 0x100) & 0xff;
  bytes[5] = now & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const plans: PlanSeed[] = [
  {
    id: "018f0000-0000-7000-8000-000000000001",
    name: "starter",
    displayName: "Starter",
    limits: {
      max_agencies: 1,
      max_users: 3,
      max_vehicles: 15,
      max_customers: 200,
      max_reservations_per_month: 50,
      max_storage_gb: 10,
    },
    features: ["export_pdf"],
  },
  {
    id: "018f0000-0000-7000-8000-000000000002",
    name: "pro",
    displayName: "Pro",
    limits: {
      max_agencies: 5,
      max_users: 15,
      max_vehicles: 50,
      max_customers: 2000,
      max_reservations_per_month: 500,
      max_storage_gb: 100,
    },
    features: ["export_pdf", "multi_agency", "custom_roles", "activity_log"],
  },
  {
    id: "018f0000-0000-7000-8000-000000000003",
    name: "enterprise",
    displayName: "Enterprise",
    limits: {
      max_agencies: -1,
      max_users: -1,
      max_vehicles: -1,
      max_customers: -1,
      max_reservations_per_month: -1,
      max_storage_gb: -1,
    },
    features: [
      "export_pdf",
      "multi_agency",
      "custom_roles",
      "activity_log",
      "api_access",
    ],
  },
];

export const permissions: PermissionSeed[] = [
  {
    key: "workspace.view",
    domain: "workspace",
    description: "View company workspace",
  },
  {
    key: "workspace.members.manage",
    domain: "workspace",
    description: "Manage company members",
  },
  {
    key: "workspace.agencies.create",
    domain: "workspace",
    description: "Create agencies",
  },
  {
    key: "workspace.billing.manage",
    domain: "workspace",
    description: "Manage billing",
  },
  {
    key: "workspace.activity.view",
    domain: "workspace",
    description: "View activity log",
  },
  {
    key: "reservations.view",
    domain: "reservations",
    description: "View reservations",
  },
  {
    key: "reservations.create",
    domain: "reservations",
    description: "Create reservations",
  },
  {
    key: "reservations.edit",
    domain: "reservations",
    description: "Edit reservations",
  },
  {
    key: "reservations.cancel",
    domain: "reservations",
    description: "Cancel reservations",
  },
  {
    key: "reservations.delete",
    domain: "reservations",
    description: "Delete reservations",
  },
  { key: "fleet.view", domain: "fleet", description: "View vehicles" },
  { key: "fleet.create", domain: "fleet", description: "Add vehicles" },
  { key: "fleet.edit", domain: "fleet", description: "Edit vehicles" },
  { key: "fleet.delete", domain: "fleet", description: "Delete vehicles" },
  {
    key: "fleet.maintenance.create",
    domain: "fleet",
    description: "Add maintenance records",
  },
  { key: "clients.view", domain: "clients", description: "View clients" },
  { key: "clients.create", domain: "clients", description: "Create clients" },
  { key: "clients.edit", domain: "clients", description: "Edit clients" },
  { key: "clients.delete", domain: "clients", description: "Delete clients" },
  {
    key: "clients.blacklist",
    domain: "clients",
    description: "Blacklist clients",
  },
  { key: "contracts.view", domain: "contracts", description: "View contracts" },
  {
    key: "contracts.create",
    domain: "contracts",
    description: "Create and sign contracts",
  },
  {
    key: "contracts.export_pdf",
    domain: "contracts",
    description: "Export contract PDFs",
  },
  {
    key: "finance.invoices.view",
    domain: "finance",
    description: "View invoices",
  },
  {
    key: "finance.payments.record",
    domain: "finance",
    description: "Record payments",
  },
  {
    key: "finance.deposits.manage",
    domain: "finance",
    description: "Manage deposits",
  },
  {
    key: "finance.expenses.view",
    domain: "finance",
    description: "View expenses",
  },
  {
    key: "finance.expenses.create",
    domain: "finance",
    description: "Add expenses",
  },
  {
    key: "finance.expenses.edit",
    domain: "finance",
    description: "Edit expenses",
  },
  {
    key: "finance.expenses.delete",
    domain: "finance",
    description: "Delete expenses",
  },
  {
    key: "finance.reports.view",
    domain: "finance",
    description: "View financial reports",
  },
  {
    key: "finance.reports.export",
    domain: "finance",
    description: "Export financial reports",
  },
  {
    key: "settings.agency.manage",
    domain: "settings",
    description: "Manage agency profile",
  },
  {
    key: "settings.pricing.manage",
    domain: "settings",
    description: "Manage pricing rules",
  },
  {
    key: "settings.contract_template.manage",
    domain: "settings",
    description: "Manage contract templates",
  },
  {
    key: "settings.users.invite",
    domain: "settings",
    description: "Invite users",
  },
  {
    key: "settings.roles.manage",
    domain: "settings",
    description: "Manage roles",
  },
  { key: "reports.view", domain: "reports", description: "View reports" },
  { key: "reports.export", domain: "reports", description: "Export reports" },
];

export const reservationSources: ReservationSourceSeed[] = [
  { key: "dashboard", label: "Dashboard", isExternal: false },
  { key: "walk_in", label: "Walk-in", isExternal: false },
  { key: "phone", label: "Phone", isExternal: false },
  { key: "website", label: "Website", isExternal: true },
  { key: "booking_com", label: "Booking.com", isExternal: true },
  { key: "expedia", label: "Expedia", isExternal: true },
  { key: "public_api", label: "Public API", isExternal: true },
  { key: "other", label: "Other", isExternal: false },
];

const ownerPermissions = permissions.map((permission) => permission.key);
const adminPermissions = ownerPermissions.filter(
  (key) => !key.startsWith("workspace.billing"),
);
const accountantPermissions = [
  "reservations.view",
  "fleet.view",
  "clients.view",
  "contracts.view",
  "contracts.export_pdf",
  "finance.invoices.view",
  "finance.payments.record",
  "finance.deposits.manage",
  "finance.expenses.view",
  "finance.expenses.create",
  "finance.expenses.edit",
  "finance.expenses.delete",
  "finance.reports.view",
  "finance.reports.export",
  "reports.view",
  "reports.export",
];
const agentPermissions = [
  "reservations.view",
  "reservations.create",
  "reservations.edit",
  "reservations.cancel",
  "fleet.view",
  "fleet.maintenance.create",
  "clients.view",
  "clients.create",
  "clients.edit",
  "contracts.view",
  "contracts.create",
  "contracts.export_pdf",
];
const readonlyPermissions = [
  "reservations.view",
  "fleet.view",
  "clients.view",
  "contracts.view",
];

export const companyDefaultSeed: CompanyDefaultSeed = {
  roles: [
    {
      name: "member",
      description: "Internal company membership role without workspace administration access",
      scope: RoleScope.company,
      isSystem: true,
      permissions: [],
    },
    {
      name: "owner",
      description: "Company owner with workspace and all-agency access",
      scope: RoleScope.company,
      isSystem: true,
      permissions: ownerPermissions,
    },
    {
      name: "admin",
      description: "Agency administrator",
      scope: RoleScope.agency,
      isSystem: true,
      permissions: adminPermissions,
    },
    {
      name: "accountant",
      description: "Agency financial operator",
      scope: RoleScope.agency,
      isSystem: true,
      permissions: accountantPermissions,
    },
    {
      name: "agent",
      description: "Agency rental operations user",
      scope: RoleScope.agency,
      isSystem: true,
      permissions: agentPermissions,
    },
    {
      name: "readonly",
      description: "Read-only agency user",
      scope: RoleScope.agency,
      isSystem: true,
      permissions: readonlyPermissions,
    },
  ],
  vehicleCategories: ["Economy", "Compact", "Sedan", "SUV", "Van", "Luxury"],
  expenseCategories: [
    "Fuel",
    "Maintenance",
    "Insurance",
    "Cleaning",
    "Parking",
    "Other",
  ],
  settings: [
    { key: "tax_rate", value: "0", valueType: "number", agencyScoped: true },
    {
      key: "default_currency",
      value: "MAD",
      valueType: "string",
      agencyScoped: false,
    },
    {
      key: "contract_language",
      value: "fr",
      valueType: "string",
      agencyScoped: true,
    },
  ],
};

export async function seedCore(prisma: PrismaClient) {
  await prisma.$transaction([
    ...plans.flatMap((plan) => [
      prisma.plan.upsert({
        where: { id: plan.id },
        update: {
          name: plan.name,
          displayName: plan.displayName,
          isActive: true,
        },
        create: {
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          isActive: true,
        },
      }),
      ...Object.entries(plan.limits).map(([limitKey, limitValue]) =>
        prisma.planLimit.upsert({
          where: {
            planId_limitKey: {
              planId: plan.id,
              limitKey,
            },
          },
          update: { limitValue },
          create: {
            id: createId(),
            planId: plan.id,
            limitKey,
            limitValue,
          },
        }),
      ),
      ...plan.features.map((featureKey) =>
        prisma.planFeature.upsert({
          where: {
            planId_featureKey: {
              planId: plan.id,
              featureKey,
            },
          },
          update: {},
          create: {
            id: createId(),
            planId: plan.id,
            featureKey,
          },
        }),
      ),
    ]),
    ...permissions.map((permission) =>
      prisma.permission.upsert({
        where: { key: permission.key },
        update: {
          domain: permission.domain,
          description: permission.description,
        },
        create: {
          id: createId(),
          ...permission,
        },
      }),
    ),
    ...reservationSources.map((source) =>
      prisma.reservationSource.upsert({
        where: { key: source.key },
        update: {
          label: source.label,
          isExternal: source.isExternal,
        },
        create: {
          id: createId(),
          ...source,
        },
      }),
    ),
  ]);

  const expenseMutationPermissionKeys = [
    "finance.expenses.edit",
    "finance.expenses.delete",
  ];
  const expenseMutationRoles = await prisma.role.findMany({
    where: {
      isSystem: true,
      deletedAt: null,
      name: { in: ["owner", "admin", "accountant"] },
    },
    select: { id: true },
  });
  if (expenseMutationRoles.length > 0) {
    await prisma.rolePermission.createMany({
      data: expenseMutationRoles.flatMap((role) =>
        expenseMutationPermissionKeys.map((permissionKey) => ({
          id: createId(),
          roleId: role.id,
          permissionKey,
        })),
      ),
      skipDuplicates: true,
    });
  }

  const companies = await prisma.company.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  if (companies.length > 0) {
    await prisma.expenseCategory.createMany({
      data: companies.flatMap((company) =>
        companyDefaultSeed.expenseCategories.map((name) => ({
          id: createId(),
          companyId: company.id,
          name,
          isSystem: true,
        })),
      ),
      skipDuplicates: true,
    });
  }

  return {
    plans: await prisma.plan.count(),
    planLimits: await prisma.planLimit.count(),
    planFeatures: await prisma.planFeature.count(),
    permissions: await prisma.permission.count(),
    reservationSources: await prisma.reservationSource.count(),
    expenseCategories: await prisma.expenseCategory.count(),
  };
}

async function main() {
  loadSharedEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run the core seed.");
  }

  const prisma = new PrismaClient();
  try {
    const counts = await seedCore(prisma);
    console.log("Core seed complete:", counts);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
