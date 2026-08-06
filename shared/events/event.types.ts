import type { Prisma } from "@lokarent/db";

export type DomainEventName =
  | "AgencyCreated"
  | "AgencyDeactivated"
  | "CompanyCreated"
  | "CompanyDeactivated"
  | "ContractGenerated"
  | "ContractCompleted"
  | "ContractSignedByAgent"
  | "ContractSignedByCustomer"
  | "CustomerBlacklisted"
  | "CustomerBlacklistLifted"
  | "CustomerCreated"
  | "DocumentUploaded"
  | "DocumentDeleted"
  | "DamageRecordedAtReturn"
  | "DriverAssignedToReservation"
  | "DriverCreated"
  | "DriverDeactivated"
  | "DriverPaymentRecorded"
  | "DriverPricingModelUpdated"
  | "ExpenseRecorded"
  | "InvitationAccepted"
  | "InvitationExpired"
  | "InvitationSent"
  | "InvoiceGenerated"
  | "InvoiceIssued"
  | "InvoicePaid"
  | "MemberAdded"
  | "MemberAssignedToAgency"
  | "MemberRemovedFromAgency"
  | "PaymentRecorded"
  | "CreditNoteIssued"
  | "DepositCollected"
  | "DepositReleased"
  | "DepositForfeited"
  | "PricingSnapshotLocked"
  | "ReservationCancelled"
  | "ReservationCompleted"
  | "ReservationConfirmed"
  | "ReservationCreated"
  | "ReservationPickedUp"
  | "RoleCreated"
  | "RolePermissionsUpdated"
  | "SettingsUpdated"
  | "VehicleAdded"
  | "VehicleBlockedManually"
  | "VehicleDeactivated"
  | "VehicleMaintenanceStarted"
  | "VehiclePricingRuleChanged";

export type DomainEvent = {
  name: DomainEventName;
  companyId: string;
  agencyId?: string | null;
  entityType: string;
  entityId: string;
  userId?: string | null;
  actorName?: string;
  metadata?: Prisma.InputJsonValue;
  occurredAt: Date;
};

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;
