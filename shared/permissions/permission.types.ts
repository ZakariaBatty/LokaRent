export const PERMISSIONS = {
  WORKSPACE_VIEW: "workspace.view",
  WORKSPACE_MEMBERS_MANAGE: "workspace.members.manage",
  WORKSPACE_AGENCIES_CREATE: "workspace.agencies.create",
  WORKSPACE_BILLING_MANAGE: "workspace.billing.manage",
  WORKSPACE_ACTIVITY_VIEW: "workspace.activity.view",

  RESERVATIONS_VIEW: "reservations.view",
  RESERVATIONS_CREATE: "reservations.create",
  RESERVATIONS_EDIT: "reservations.edit",
  RESERVATIONS_CANCEL: "reservations.cancel",
  RESERVATIONS_DELETE: "reservations.delete",

  FLEET_VIEW: "fleet.view",
  FLEET_CREATE: "fleet.create",
  FLEET_EDIT: "fleet.edit",
  FLEET_DELETE: "fleet.delete",
  FLEET_MAINTENANCE_CREATE: "fleet.maintenance.create",

  CLIENTS_VIEW: "clients.view",
  CLIENTS_CREATE: "clients.create",
  CLIENTS_EDIT: "clients.edit",
  CLIENTS_DELETE: "clients.delete",
  CLIENTS_BLACKLIST: "clients.blacklist",

  CONTRACTS_VIEW: "contracts.view",
  CONTRACTS_CREATE: "contracts.create",
  CONTRACTS_EXPORT_PDF: "contracts.export_pdf",

  FINANCE_INVOICES_VIEW: "finance.invoices.view",
  FINANCE_PAYMENTS_RECORD: "finance.payments.record",
  FINANCE_DEPOSITS_MANAGE: "finance.deposits.manage",
  FINANCE_EXPENSES_VIEW: "finance.expenses.view",
  FINANCE_EXPENSES_CREATE: "finance.expenses.create",
  FINANCE_EXPENSES_EDIT: "finance.expenses.edit",
  FINANCE_EXPENSES_DELETE: "finance.expenses.delete",
  FINANCE_REPORTS_VIEW: "finance.reports.view",
  FINANCE_REPORTS_EXPORT: "finance.reports.export",

  SETTINGS_AGENCY_MANAGE: "settings.agency.manage",
  SETTINGS_PRICING_MANAGE: "settings.pricing.manage",
  SETTINGS_CONTRACT_TEMPLATE_MANAGE: "settings.contract_template.manage",
  SETTINGS_USERS_INVITE: "settings.users.invite",
  SETTINGS_ROLES_MANAGE: "settings.roles.manage",

  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type PermissionScope = "company" | "agency";

export type PermissionDecisionSource = "owner" | "role" | "override_grant" | "override_deny" | "none";

export type PermissionDecision = {
  allowed: boolean;
  permissionKey: PermissionKey;
  scope: PermissionScope;
  source: PermissionDecisionSource;
};

export type PermissionCheckInput = {
  permissionKey: PermissionKey;
};
