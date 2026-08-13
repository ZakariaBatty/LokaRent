# LokaRent — Prisma Implementation Plan

> **Status:** Pre-schema plan. No Prisma code yet. Architecture documentation is the single source of truth.
> **Scope:** Phase 1 — 57 Prisma models = 57 database tables (`NumberSequence`, `ContractTemplateVersion`, `ReservationExtraDefinition`, and `ReservationAuthorizedDriver` included). See § 10.5 for reconciliation.
> **Purpose:** Bridge document between architecture and schema generation. Every decision here is traceable to `DATABASE_DOMAIN_DESIGN.md`, `DATABASE_PHASE1.md`, and `DATABASE_SPECIFICATION.md`.

---

## Table of Contents

1. [Complete Model List](#1-complete-model-list)
2. [All Enums](#2-all-enums)
3. [All Relations with Cardinality](#3-all-relations-with-cardinality)
4. [Foreign Keys and Delete Behavior](#4-foreign-keys-and-delete-behavior)
5. [Index Strategy](#5-index-strategy)
6. [UUID v7 Strategy](#6-uuid-v7-strategy)
7. [Soft Delete Fields Strategy](#7-soft-delete-fields-strategy)
8. [Audit Fields Strategy](#8-audit-fields-strategy)
9. [Migration Order](#9-migration-order)
10. [Ambiguities and Pre-Generation Decisions](#10-ambiguities-and-pre-generation-decisions)

---

## 1. Complete Model List

57 Prisma models. Listed by domain in declaration order. Every model maps to exactly one database table. See § 10.5 for the authoritative count reconciliation.

### Domain 1 — Multi-Tenant (2 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 1 | `Company` | `companies` | Tenant root. `company_id` on every other table. |
| 2 | `Agency` | `agencies` | Operational branch. `agency_id` on operational tables. |

### Domain 2 — Identity (8 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 3 | `User` | `users` | Platform-level identity. One record per human. |
| 4 | `CompanyMembership` | `company_memberships` | Links user to company with company-level role. |
| 5 | `AgencyMembership` | `agency_memberships` | Links user to agency with agency-level role. |
| 6 | `Role` | `roles` | Named permission presets, scoped to a company. |
| 7 | `Permission` | `permissions` | Flat registry. Seeded at deploy. Never user-created. |
| 8 | `RolePermission` | `role_permissions` | M:N join between `roles` and `permissions`. |
| 9 | `UserPermissionOverride` | `user_permission_overrides` | Exception table — not the normal auth path. |
| 10 | `Invitation` | `invitations` | Pending invitations before user accepts. |

### Domain 3 — Subscription (3 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 11 | `Plan` | `plans` | Platform-managed plan catalog. |
| 12 | `PlanLimit` | `plan_limits` | Integer limits per plan per key. `-1` = unlimited. |
| 13 | `PlanFeature` | `plan_features` | Boolean feature flags per plan per key. |

### Domain 4 — Fleet (9 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 14 | `VehicleCategory` | `vehicle_categories` | Seeded per company at signup. Tenant-customizable. |
| 15 | `Vehicle` | `vehicles` | Core vehicle identity only. Rarely mutated. |
| 16 | `VehicleRegistration` | `vehicle_registrations` | Registration document history. |
| 17 | `VehicleInsurance` | `vehicle_insurances` | Insurance policy history. |
| 18 | `VehicleInspection` | `vehicle_inspections` | Technical inspection history. |
| 19 | `VehicleVignette` | `vehicle_vignettes` | Annual road tax history. |
| 20 | `VehicleMaintenance` | `vehicle_maintenances` | Maintenance and repair records. Tracks lifecycle: `scheduled` → `in_progress` → `completed`/`cancelled`. |
| 21 | `VehicleMileageLog` | `vehicle_mileage_logs` | Immutable odometer readings. |
| 22 | `VehicleAvailabilityBlock` | `vehicle_availability_blocks` | Manual unavailability windows. |

### Domain 5 — Customers (6 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 23 | `Customer` | `customers` | Core customer record. Type determines sub-table. |
| 24 | `CustomerIndividual` | `customer_individuals` | Personal details for `type = individual`. |
| 25 | `CustomerBusiness` | `customer_businesses` | Legal entity details for `type = company`. Also the billing entity on invoices. |
| 26 | `CustomerContact` | `customer_contacts` | Multiple contact methods per customer. |
| 27 | `CustomerDocument` | `customer_documents` | Identity documents with expiry tracking. |
| 28 | `CustomerBlacklist` | `customer_blacklist` | Auditable blacklist entries. Not a boolean flag. |

### Domain 6 — Reservations (7 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 29 | `ReservationSource` | `reservation_sources` | Lookup table. Seeded at deploy. |
| 30 | `Reservation` | `reservations` | The central business entity. |
| 31 | `ReservationPricingSnapshot` | `reservation_pricing_snapshots` | Each row immutable. Supersession chain per reservation; one `is_current = true`. |
| 32 | `ReservationExtraDefinition` | `reservation_extra_definitions` | Mutable company/agency-scoped catalog for selectable extras. |
| 33 | `ReservationExtra` | `reservation_extras` | Immutable add-on snapshots per reservation, copied from the catalog at write time. |
| 34 | `ReservationAuthorizedDriver` | `reservation_authorized_drivers` | Renter/customer authorized drivers; distinct from internal chauffeur assignments. |
| 35 | `ReservationTimelineEvent` | `reservation_timeline_events` | Append-only status log. |

### Domain 7 — Contracts (5 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 34 | `ContractTemplate` | `contract_templates` | Reusable templates per agency. |
| 35 | `ContractTemplateVersion` | `contract_template_versions` | Immutable versioned snapshot of a template's body. A contract references the exact version in force at signing (legal integrity). Phase 1 per `DATABASE_FINAL_REVIEW.md`. |
| 36 | `Contract` | `contracts` | Versioned contract/amendment rows per reservation. Each row references `template_version_id` and the exact `pricing_snapshot_id`; one non-deleted row is current. |
| 37 | `ContractInspectionItem` | `contract_inspection_items` | Vehicle condition checklist at pickup and return. |
| 38 | `ContractSignature` | `contract_signatures` | One row per signer per event. Legal record. |

### Domain 8 — Finance (8 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 39 | `Invoice` | `invoices` | One active rental invoice per reservation. Draft invoices may be soft-deleted; issued financial history is preserved through credit notes. |
| 40 | `InvoiceLineItem` | `invoice_line_items` | Auto-generated from snapshot and extras. |
| 41 | `Payment` | `payments` | Method-agnostic payment records. |
| 42 | `Deposit` | `deposits` | Caution deposits with full release tracking. |
| 43 | `CreditNote` | `credit_notes` | Corrections that reference the original invoice. |
| 44 | `ExpenseCategory` | `expense_categories` | Lookup table per agency. |
| 45 | `Expense` | `expenses` | Operational costs. Optionally linked to vehicle/reservation. |
| 46 | `DriverPayment` | `driver_payments` | Driver compensation. Scoped to driver + rule + optional reservation. |

### Domain 9 — Drivers (4 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 47 | `Driver` | `drivers` | Core driver record. Owned by an agency. |
| 48 | `DriverPricingRule` | `driver_pricing_rules` | Pricing model history. `is_current = true` for active rule. |
| 49 | `DriverDocument` | `driver_documents` | License, ID, contract docs with expiry. |
| 50 | `DriverReservationAssignment` | `driver_reservation_assignments` | Join table: driver ↔ reservation with `role`. |

### Domain 10 — Documents (1 model)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 51 | `Document` | `documents` | Polymorphic. Handles all file attachments via `entityType + entityId`. |

### Domain 11 — Audit (2 models)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 52 | `AuditLog` | `audit_logs` | Immutable compliance trail. Never updated or deleted. |
| 53 | `ActivityLog` | `activity_logs` | Human-readable feed. Denormalized for join-free render. |

### Domain 12 — Settings (1 model)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 54 | `Setting` | `settings` | Typed key/value at company-level (`agency_id IS NULL`) or agency-level. |

### Utility (1 model)

| # | Prisma Model | DB Table | Notes |
|---|---|---|---|
| 57 | `NumberSequence` | `number_sequences` | Row-level lock counter for gapless human-readable codes. |

**Total: 57 Prisma models mapping to 57 database tables.**

Domain breakdown (declaration order, matching the enumerated list above): Multi-Tenant 2 + Identity 8 + Subscription 3 + Fleet 9 + Customers 6 + Reservations 7 + Contracts 5 + Finance 8 (includes `DriverPayment`) + Drivers 4 + Documents 1 + Audit 2 + Settings 1 + Utility (`NumberSequence`) 1 = **57**.

> **Authoritative count:** `DriverPayment` belongs to Finance only (its primary domain per the Phase 1 decision) — one model, not double-counted. `ContractTemplateVersion` is included in Phase 1 (Contracts = 5) per the `DATABASE_FINAL_REVIEW.md` verdict that template versioning is a blocking legal-integrity dependency. Reservations now include `ReservationExtraDefinition` and `ReservationAuthorizedDriver`. The canonical figure is **57 models = 57 tables**. See § 10.5 for the full reconciliation.

---

## 2. All Enums

Every Prisma enum is declared here. No enum is invented — every value is pulled directly from the architecture documents.

---

### Multi-Tenant Enums

```prisma
enum CompanyStatus {
  active
  suspended
  trial
  cancelled
}

enum AgencyStatus {
  active
  inactive
  suspended
}
```

### Identity Enums

```prisma
enum UserStatus {
  active
  suspended
  deactivated
}

enum MembershipStatus {
  active
  suspended
  revoked
}
// Used on both company_memberships and agency_memberships

enum RoleScope {
  company
  agency
}

enum InvitationStatus {
  pending
  accepted
  expired
  revoked
}
```

### Fleet Enums

```prisma
enum VehicleStatus {
  available
  rented
  maintenance
  inactive
  retired
}

enum FuelType {
  petrol
  diesel
  electric
  hybrid
  lpg
}

enum Transmission {
  manual
  automatic
}

enum InsuranceCoverageType {
  third_party
  comprehensive
  fleet
}

enum InspectionResult {
  pass
  fail
  conditional
}

enum MileageSource {
  contract_pickup
  contract_return
  maintenance
  manual
}

enum AvailabilityBlockReason {
  maintenance
  personal_use
  hold
  other
}

enum VehicleMaintenanceStatus {
  scheduled
  in_progress
  completed
  cancelled
}
```

### Customer Enums

```prisma
enum CustomerType {
  individual
  company
}

enum CustomerStatus {
  active
  inactive
  blacklisted
}

enum CustomerDocumentType {
  passport
  national_id
  driving_license
  residence_permit
}

enum BlacklistSeverity {
  warning
  blocked
  permanent
}

enum ContactType {
  phone
  email
  whatsapp
}
// ContactType is used on customer_contacts — not in architecture as an explicit enum
// but necessary for the `type` column on customer_contacts. Confirm in Section 10.
```

### Reservation Enums

```prisma
enum ReservationStatus {
  enquiry
  confirmed
  active
  completed
  cancelled
  no_show
}
```

### Contract Enums

```prisma
enum ContractStatus {
  draft
  active
  completed
  cancelled
  disputed
}

enum InspectionEvent {
  pickup
  return
}

enum InspectionCondition {
  ok
  scratched
  dented
  broken
  missing
}

enum SignerType {
  customer
  agent
  witness
}

enum SignatureEvent {
  pickup
  return
}
```

### Finance Enums

```prisma
enum InvoiceStatus {
  draft
  issued
  paid
  partially_paid
  overdue
  voided
}

enum PaymentMethod {
  cash
  bank_transfer
  cheque
  card
  other
}

enum DepositStatus {
  held
  released
  forfeited
  partially_released
}

enum DepositMethod {
  cash
  cheque
  card
  other
}

// NOTE: There is NO separate ExpensePaymentMethod enum. Expenses reuse the shared
// PaymentMethod enum above (values: cash, bank_transfer, cheque, card, other).
// The Expense.payment_method column is simply `PaymentMethod?` (nullable).
// DepositMethod remains distinct only because deposits cannot be paid by bank_transfer.
```

### Driver Enums

```prisma
enum DriverStatus {
  active
  inactive
  suspended
}

enum DriverPricingType {
  monthly
  hourly
  mission
}

enum DriverDocumentType {
  driving_license
  national_id
  contract
  other
}

enum DriverRole {
  primary
  additional
}
// Used on driver_reservation_assignments.role
```

---

**Total: 33 enums.**

---

## 3. All Relations with Cardinality

Relations are listed by domain. Prisma relation names follow the convention `{ModelName}{FieldName}` where disambiguation is needed.

---

### 3.1 One-to-One (1:1) Relations

| Parent | Child | FK Column | Condition |
|---|---|---|---|
| `Reservation` | `Contract` | `reservation_id` on contract | One contract per reservation, enforced by `@unique` |
| `Customer` | `CustomerIndividual` | `customer_id` on individual | Only when `customer.type = individual` — enforced by `@unique` |
| `Customer` | `CustomerBusiness` | `customer_id` on business | Only when `customer.type = company` — enforced by `@unique` |

---

### 3.2 One-to-Many (1:N) Relations

#### Multi-Tenant
| Parent | Children | FK on Child |
|---|---|---|
| `Company` | `Agency[]` | `agency.company_id` |
| `Company` | `CompanyMembership[]` | `company_membership.company_id` |
| `Company` | `Role[]` | `role.company_id` |
| `Company` | `VehicleCategory[]` | `vehicle_category.company_id` |
| `Company` | `Setting[]` (company-level) | `setting.company_id` where `agency_id IS NULL` |
| `Company` | `NumberSequence[]` | `number_sequence.company_id` |
| `Agency` | `AgencyMembership[]` | `agency_membership.agency_id` |
| `Agency` | `Vehicle[]` | `vehicle.agency_id` |
| `Agency` | `Customer[]` | `customer.agency_id` |
| `Agency` | `Reservation[]` | `reservation.agency_id` |
| `Agency` | `ContractTemplate[]` | `contract_template.agency_id` |
| `Agency` | `ExpenseCategory[]` | `expense_category.agency_id` |
| `Agency` | `Invitation[]` | `invitation.agency_id` |
| `Agency` | `Setting[]` (agency-level) | `setting.agency_id IS NOT NULL` |
| `Agency` | `Driver[]` | `driver.agency_id` |
| `Agency` | `Invoice[]` | `invoice.agency_id` |
| `Agency` | `Payment[]` | `payment.agency_id` |
| `Agency` | `Deposit[]` | `deposit.agency_id` |
| `Agency` | `Expense[]` | `expense.agency_id` |

#### Identity
| Parent | Children | FK on Child |
|---|---|---|
| `User` | `CompanyMembership[]` | `company_membership.user_id` |
| `User` | `AgencyMembership[]` | `agency_membership.user_id` |
| `User` | `Invitation[]` (sent) | `invitation.invited_by` |
| `Role` | `RolePermission[]` | `role_permission.role_id` |
| `Role` | `CompanyMembership[]` | compound `company_membership.(role_id, role_scope)` → `roles.(id, scope)` (see §4) |
| `Role` | `AgencyMembership[]` | compound `agency_membership.(role_id, role_scope)` → `roles.(id, scope)` (see §4) |
| `Role` | `UserPermissionOverride[]` | `user_permission_override.role_id` |
| `Permission` | `RolePermission[]` | `role_permission.permission_key` |
| `Permission` | `UserPermissionOverride[]` | `user_permission_override.permission_key` |
| `AgencyMembership` | `UserPermissionOverride[]` | `user_permission_override.agency_membership_id` |

#### Subscription
| Parent | Children | FK on Child |
|---|---|---|
| `Plan` | `PlanLimit[]` | `plan_limit.plan_id` |
| `Plan` | `PlanFeature[]` | `plan_feature.plan_id` |
| `Plan` | `Company[]` | `company.plan_id` |

#### Fleet
| Parent | Children | FK on Child |
|---|---|---|
| `VehicleCategory` | `Vehicle[]` | `vehicle.category_id` |
| `Vehicle` | `VehicleRegistration[]` | `vehicle_registration.vehicle_id` |
| `Vehicle` | `VehicleInsurance[]` | `vehicle_insurance.vehicle_id` |
| `Vehicle` | `VehicleInspection[]` | `vehicle_inspection.vehicle_id` |
| `Vehicle` | `VehicleVignette[]` | `vehicle_vignette.vehicle_id` |
| `Vehicle` | `VehicleMaintenance[]` | `vehicle_maintenance.vehicle_id` |
| `Vehicle` | `VehicleMileageLog[]` | `vehicle_mileage_log.vehicle_id` |
| `Vehicle` | `VehicleAvailabilityBlock[]` | `vehicle_availability_block.vehicle_id` |
| `Vehicle` | `Reservation[]` | `reservation.vehicle_id` |
| `Vehicle` | `Expense[]` (nullable) | `expense.vehicle_id` |

#### Customers
| Parent | Children | FK on Child |
|---|---|---|
| `Customer` | `CustomerContact[]` | `customer_contact.customer_id` |
| `Customer` | `CustomerDocument[]` | `customer_document.customer_id` |
| `Customer` | `CustomerBlacklist[]` | `customer_blacklist.customer_id` |
| `Customer` | `Reservation[]` | `reservation.customer_id` |
| `Customer` | `Invoice[]` | `invoice.customer_id` |
| `CustomerBusiness` | `Invoice[]` (nullable) | `invoice.customer_business_id` |

#### Reservations
| Parent | Children | FK on Child |
|---|---|---|
| `ReservationSource` | `Reservation[]` | `reservation.source_id` |
| `Reservation` | `ReservationPricingSnapshot[]` | `reservation_pricing_snapshot.reservation_id` — chain of snapshots; one `is_current = true` |
| `Reservation` | `ReservationExtra[]` | `reservation_extra.reservation_id` |
| `Reservation` | `ReservationTimelineEvent[]` | `reservation_timeline_event.reservation_id` |
| `Reservation` | `Invoice[]` | `invoice.reservation_id` — active rental uniqueness enforced by a raw partial unique index where `deleted_at IS NULL` |
| `Reservation` | `Deposit[]` | `deposit.reservation_id` |
| `Reservation` | `Expense[]` (nullable) | `expense.reservation_id` |
| `Reservation` | `DriverReservationAssignment[]` | `driver_reservation_assignment.reservation_id` |
| `ReservationPricingSnapshot` | `ReservationPricingSnapshot[]` (self) | `supersedes_id` — self-referential for price adjustments |

#### Contracts
| Parent | Children | FK on Child |
|---|---|---|
| `ContractTemplate` | `ContractTemplateVersion[]` | `contract_template_version.template_id` |
| `ContractTemplate` | `Contract[]` (nullable FK) | `contract.template_id` |
| `ContractTemplateVersion` | `Contract[]` | `contract.template_version_id` (**nullable** provenance FK) — the version in force at signing; the contract also stores its own frozen `rendered_html` + `content_snapshot` + `hash`, so it does not hard-depend on this row |
| `Contract` | `ContractInspectionItem[]` | `contract_inspection_item.contract_id` |
| `Contract` | `ContractSignature[]` | `contract_signature.contract_id` |

#### Finance
| Parent | Children | FK on Child |
|---|---|---|
| `Invoice` | `InvoiceLineItem[]` | `invoice_line_item.invoice_id` |
| `Invoice` | `Payment[]` (nullable) | `payment.invoice_id` |
| `Invoice` | `CreditNote[]` (as original) | `credit_note.original_invoice_id` |
| `Invoice` | `CreditNote[]` (as replacement, nullable) | `credit_note.replacement_invoice_id` |
| `ExpenseCategory` | `Expense[]` | `expense.category_id` |

#### Drivers
| Parent | Children | FK on Child |
|---|---|---|
| `Driver` | `DriverPricingRule[]` | `driver_pricing_rule.driver_id` |
| `Driver` | `DriverDocument[]` | `driver_document.driver_id` |
| `Driver` | `DriverReservationAssignment[]` | `driver_reservation_assignment.driver_id` |
| `Driver` | `DriverPayment[]` | `driver_payment.driver_id` |
| `DriverPricingRule` | `DriverPayment[]` | `driver_payment.driver_pricing_rule_id` |

---

### 3.3 Many-to-Many (M:N) Relations

There are no implicit Prisma M:N relations in this schema. All M:N relationships are **explicit join models** because they carry business data (timestamps, roles, reasons):

| Relationship | Explicit Join Model | Business Fields on Join |
|---|---|---|
| `Role` ↔ `Permission` | `RolePermission` | `created_at` |
| `User` ↔ `Agency` (memberships) | `AgencyMembership` | `role_id`, `role_scope` (pinned `agency`), `is_primary`, `status`, `joined_at` |
| `User` ↔ `Company` (memberships) | `CompanyMembership` | `role_id`, `role_scope` (pinned `company`), `status` |
| `Driver` ↔ `Reservation` | `DriverReservationAssignment` | `role` (primary/additional), `created_at` |

---

## 4. Foreign Keys and Delete Behavior

Every FK is listed with its `onDelete` rule. The source of truth is `DATABASE_DOMAIN_DESIGN.md § 5. Cascade Rules`.

---

### RESTRICT (prevent parent deletion if children exist)

| FK | Relationship | Prisma `onDelete` |
|---|---|---|
| `agency.company_id → companies` | Company → Agency | `Restrict` |
| `company_membership.company_id → companies` | Company → CompanyMembership | `Restrict` |
| `vehicle.category_id → vehicle_categories` | Category → Vehicle | `Restrict` |
| `reservation.agency_id → agencies` | Agency → Reservation | `Restrict` |
| `vehicle.agency_id → agencies` | Agency → Vehicle | `Restrict` |
| `customer.agency_id → agencies` | Agency → Customer | `Restrict` |
| `contract.reservation_id → reservations` | Reservation → Contract | `Restrict` |
| `invoice.reservation_id → reservations` | Reservation → Invoice | `Restrict` |
| `contract_signature.contract_id → contracts` | Contract → Signature | `Restrict` |
| `payment.invoice_id → invoices` (when set) | Invoice → Payment | `Restrict` |
| `company.plan_id → plans` | Plan → Company | `Restrict` |
| `contract.template_id → contract_templates` (when set) | Template → Contract | `Restrict` |
| `contract.template_version_id → contract_template_versions` (nullable, when set) | TemplateVersion → Contract | `Restrict` (a version referenced by a signed contract must never be deleted) |
| `deposit.reservation_id → reservations` | Reservation → Deposit | `Restrict` |
| `driver_payment.driver_id → drivers` | Driver → Payment | `Restrict` |
| `driver_payment.driver_pricing_rule_id → driver_pricing_rules` | PricingRule → Payment | `Restrict` |

> **Note on Prisma + RESTRICT:** Prisma does not natively emit `ON DELETE RESTRICT` in `schema.prisma` — RESTRICT is the Postgres default when no `ON DELETE` is specified. In Prisma `schema.prisma`, omitting `onDelete` defaults to `NoAction` which maps to database-level RESTRICT. Use `@relation(onDelete: NoAction)` for these. The actual RESTRICT behavior is enforced by Postgres.

---

### CASCADE (delete children when parent is deleted)

| FK | Relationship | Prisma `onDelete` |
|---|---|---|
| `role_permission.role_id → roles` | Role → RolePermission | `Cascade` |
| `invoice_line_item.invoice_id → invoices` | Invoice → InvoiceLineItem | `Cascade` |
| `reservation_extra.reservation_id → reservations` | Reservation → ReservationExtra | `Cascade` |
| `contract_inspection_item.contract_id → contracts` | Contract → InspectionItem | `Cascade` |
| `contract_template_version.template_id → contract_templates` | Template → TemplateVersion | `Cascade` |
| `driver_reservation_assignment.driver_id → drivers` | Driver → Assignment | `Cascade` |
| `customer_individual.customer_id → customers` | Customer → CustomerIndividual | `Cascade` |
| `customer_business.customer_id → customers` | Customer → CustomerBusiness | `Cascade` |
| `customer_contact.customer_id → customers` | Customer → CustomerContact | `Cascade` |
| `customer_document.customer_id → customers` | Customer → CustomerDocument | `Cascade` |
| `customer_blacklist.customer_id → customers` | Customer → CustomerBlacklist | `Cascade` |
| `reservation_pricing_snapshot.reservation_id → reservations` | Reservation → PricingSnapshot (chain) | `Cascade` |
| `reservation_timeline_event.reservation_id → reservations` | Reservation → TimelineEvent | `Cascade` |
| `driver_pricing_rule.driver_id → drivers` | Driver → PricingRule | `Cascade` |
| `driver_document.driver_id → drivers` | Driver → Document | `Cascade` |

---

### SET NULL (nullify FK on child when parent is deleted)

| FK | Relationship | Prisma `onDelete` |
|---|---|---|
| `reservation_timeline_event.performed_by → users` | User (deleted) → TimelineEvent | `SetNull` |
| `activity_log.user_id → users` | User (deleted) → ActivityLog | `SetNull` |
| `audit_log.user_id → users` | User (deleted) → AuditLog | `SetNull` |
| `contract_signature.signed_by → users` (nullable) | User (deleted) → ContractSignature | `SetNull` |
| `expense.reservation_id → reservations` | Reservation (cancelled) → Expense | `SetNull` |
| `expense.vehicle_id → vehicles` | Vehicle (retired) → Expense | `SetNull` |
| `contract.template_id → contract_templates` | Template (soft-deleted) → Contract | `SetNull` |
| `driver_payment.reservation_id → reservations` (nullable) | Reservation (cancelled) → Payment (mission-based only) | `SetNull` |

---

### NO ACTION / Application-enforced

| FK | Relationship | Notes |
|---|---|---|
| `documents.(entity_type, entity_id)` | Polymorphic — no DB FK | Application validates `entity_type` via CHECK constraint. Orphan cleanup is a background job. |

---

### Composite (scope-pinned) FKs — mandated by `DATABASE_FINAL_REVIEW.md`

Role assignment must be enforced structurally, not by a trigger or application rule (the review explicitly rejects those as privilege-escalation risks). This requires three schema changes:

1. `roles` carries `@@unique([id, scope])` — the composite key that the memberships reference.
2. `company_memberships` and `agency_memberships` each add a `role_scope RoleScope` column with a **single-table CHECK** pinning it to the correct constant (`'company'` / `'agency'`).
3. Each membership uses a **compound relation** to `roles`, not a plain single-column FK.

| FK | Relationship | Prisma `onDelete` | Enforcement |
|---|---|---|---|
| `company_membership.(role_id, role_scope) → roles.(id, scope)` | Role ��� CompanyMembership | `Restrict` (`NoAction`) | Compound FK + `CHECK (role_scope = 'company')`. Makes attaching an agency-scoped role to a company membership structurally impossible. |
| `agency_membership.(role_id, role_scope) → roles.(id, scope)` | Role → AgencyMembership | `Restrict` (`NoAction`) | Compound FK + `CHECK (role_scope = 'agency')`. Same guarantee at the agency level. |

```prisma
model Role {
  id    String    @db.Uuid
  scope RoleScope
  // ...
  @@id([id])                 // primary key remains single-column id
  @@unique([id, scope])      // referenced target for the compound FKs below
}

model CompanyMembership {
  roleId    String    @db.Uuid
  roleScope RoleScope @default(company)
  role      Role      @relation(fields: [roleId, roleScope], references: [id, scope], onDelete: NoAction)
  // CHECK (role_scope = 'company') added via raw migration — Prisma cannot express single-table CHECK
}

model AgencyMembership {
  roleId    String    @db.Uuid
  roleScope RoleScope @default(agency)
  role      Role      @relation(fields: [roleId, roleScope], references: [id, scope], onDelete: NoAction)
  // CHECK (role_scope = 'agency') added via raw migration
}
```

> The `CHECK (role_scope = <constant>)` constraints are single-table and cannot be declared in `schema.prisma`; add them in the post-generation raw migration (see §5 raw-SQL block).

---

## 5. Index Strategy

The full index strategy is defined in `DATABASE_DOMAIN_DESIGN.md § 10`.

Prisma implements indexes via `@@index`, `@@unique`, and the `@unique` attribute on fields.

---

### Universal Indexes (applied to every business table)

Every business model receives the following indexes via `@@index`:

```
@@index([companyId])
@@index([agencyId])           -- only on models that have agency_id
@@index([createdAt])
// Partial index on deleted_at IS NULL cannot be expressed in Prisma schema.prisma
// Must be added via a raw migration file after Prisma generation.
```

> **Prisma limitation:** Partial indexes (`WHERE deleted_at IS NULL`) cannot be defined in `schema.prisma`. They must be added manually in the migration SQL file. Every soft-deletable model gets a follow-up raw migration adding `CREATE INDEX CONCURRENTLY ON {table} ({column}) WHERE deleted_at IS NULL`.

---

### Model-Specific Indexes

#### Identity

| Model | Prisma Declaration | Type |
|---|---|---|
| `User` | `@unique` on `email` | Unique B-tree |
| `User` | `@@index([phone])` | B-tree (sparse) |
| `Role` | `@@unique([id, scope])` — composite target for membership role-scope FKs (see §4) | Unique B-tree |
| `CompanyMembership` | `@@unique([userId, companyId])` | Unique B-tree |
| `CompanyMembership` | `@@index([roleId, roleScope])` — supports compound role FK | B-tree |
| `AgencyMembership` | `@@index([roleId, roleScope])` — supports compound role FK | B-tree |
| `AgencyMembership` | `@@unique([userId, agencyId])` | Unique B-tree |
| `AgencyMembership` | `@@index([isPrimary])` — partial unique via raw migration | Partial unique |
| `Invitation` | `@@index([email])` | B-tree |
| `Invitation` | `@unique` on `tokenHash` | Unique B-tree |
| `Invitation` | `@@index([expiresAt])` | B-tree |

#### Subscription

| Model | Prisma Declaration |
|---|---|
| `PlanLimit` | `@@unique([planId, limitKey])` |
| `PlanFeature` | `@@unique([planId, featureKey])` |

#### Fleet

| Model | Prisma Declaration |
|---|---|
| `Vehicle` | `@@unique([companyId, plate])` |
| `Vehicle` | `@@unique([companyId, code])` |
| `Vehicle` | `@@index([status])` |
| `Vehicle` | `@@index([categoryId])` |
| `VehicleInsurance` | `@@index([vehicleId, expiresAt])` |
| `VehicleRegistration` | `@@index([vehicleId, expiresAt])` |
| `VehicleInspection` | `@@index([vehicleId, expiresAt])` |
| `VehicleVignette` | `@@index([vehicleId, expiresAt])` |
| `VehicleVignette` | `@@unique([vehicleId, taxYear])` |
| `VehicleMaintenance` | `@@index([vehicleId, status])` |
| `VehicleMileageLog` | `@@index([vehicleId, recordedAt])` |
| `VehicleAvailabilityBlock` | `@@index([vehicleId, startsAt, endsAt])` |

#### Customers

| Model | Prisma Declaration |
|---|---|
| `Customer` | `@@unique([companyId, code])` |
| `Customer` | `@@index([agencyId, status])` |
| `Customer` | `@@index([type])` |
| `CustomerIndividual` | `@@index([fullName])` — GIN trigram via raw migration |
| `CustomerIndividual` | `@@index([phone])` |
| `CustomerIndividual` | `@@index([email])` |
| `CustomerBusiness` | `@@index([companyName])` — GIN trigram via raw migration |
| `CustomerBusiness` | `@@index([taxId])` |
| `CustomerContact` | `@@index([customerId, type])` |
| `CustomerBlacklist` | `@@index([agencyId, customerId, status])` |
| `CustomerDocument` | `@@index([customerId, type, expiresAt])` |

> **GIN trigram indexes** (for full-text name search) cannot be declared in `schema.prisma`. They require a raw migration: `CREATE INDEX ON customer_individuals USING GIN (full_name gin_trgm_ops)`. The `pg_trgm` extension must be enabled.

#### Reservations

| Model | Prisma Declaration |
|---|---|
| `Reservation` | `@@unique([companyId, code])` |
| `Reservation` | `@@index([agencyId, status])` |
| `Reservation` | `@@index([vehicleId, startsAt, endsAt])` |
| `Reservation` | `@@index([customerId, status])` |
| `Reservation` | `@@index([startsAt])` |
| `Reservation` | `@@index([endsAt])` |
| `Reservation` | `@@index([createdAt])` |
| `ReservationTimelineEvent` | `@@index([reservationId, createdAt])` |
| `ReservationPricingSnapshot` | `@@index([reservationId, createdAt])` — full chain / latest-by-created_at |
| `ReservationPricingSnapshot` | `@@index([pricingRuleId])` — resolved pricing rule used when snapshot was locked |
| `ReservationPricingSnapshot` | **Partial unique** `UNIQUE(reservation_id) WHERE is_current = true` — not expressible in Prisma schema; add via raw migration (see §5 raw-SQL block) |

#### Contracts

| Model | Prisma Declaration |
|---|---|
| `Contract` | `@@unique([companyId, code])` |
| `Contract` | `@unique` on `reservationId` |
| `Contract` | `@@index([status])` |
| `Contract` | `@@index([templateVersionId])` — supports version-usage lookups |
| `ContractTemplateVersion` | `@@unique([templateId, versionNumber])` — one row per version per template |
| `ContractTemplateVersion` | `@@index([templateId])` |
| `ContractTemplate` | **Partial unique** `UNIQUE(company_id, agency_id) WHERE is_default = true AND deleted_at IS NULL AND agency_id IS NOT NULL` — one active default template per agency; raw migration only |
| `ContractSignature` | `@@index([contractId, signerType])` |

#### Finance

| Model | Prisma Declaration |
|---|---|
| `Invoice` | `@@unique([companyId, code])` |
| `Invoice` | Raw partial unique index on `reservationId` where `type = 'rental' AND deleted_at IS NULL` |
| `Invoice` | `@@index([agencyId, status])` |
| `Invoice` | `@@index([dueAt])` |
| `Invoice` | `@@index([customerId])` |
| `Invoice` | `@@index([customerBusinessId])` |
| `Invoice` | `@@index([companyId, deletedAt])` |
| `Payment` | `@@index([invoiceId])` |
| `Payment` | `@@index([agencyId, createdAt])` |
| `Deposit` | `@@index([reservationId, status])` |
| `Expense` | `@@index([agencyId, occurredAt])` |
| `Expense` | `@@index([vehicleId, occurredAt])` |

#### Drivers

| Model | Prisma Declaration |
|---|---|
| `Driver` | `@@index([agencyId, status])` |
| `DriverPricingRule` | `@@index([driverId, isCurrent])` — partial unique via raw migration |
| `DriverPricingRule` | `@@index([driverId, validFrom])` |
| `DriverPayment` | `@@index([driverId, createdAt])` |
| `DriverPayment` | `@@index([reservationId])` |
| `DriverDocument` | `@@index([driverId, type, expiresAt])` |
| `DriverReservationAssignment` | `@@index([reservationId, role])` |
| `DriverReservationAssignment` | `@@index([driverId, createdAt])` |

#### Documents

| Model | Prisma Declaration |
|---|---|
| `Document` | `@@index([entityType, entityId])` |
| `Document` | `@@index([companyId, deletedAt])` |

#### Audit

| Model | Prisma Declaration |
|---|---|
| `AuditLog` | `@@index([companyId, createdAt])` |
| `AuditLog` | `@@index([entityType, entityId])` |
| `ActivityLog` | `@@index([agencyId, createdAt])` |
| `ActivityLog` | `@@index([entityType, entityId])` |

#### Settings

| Model | Prisma Declaration |
|---|---|
| `Setting` | `@@unique([companyId, agencyId, key])` |

---

### Post-Generation Raw Migration (indexes Prisma cannot express)

The following SQL must be applied in a post-generation migration:

```sql
-- 1. Partial index for soft delete on every business table
-- (Repeat for each table — shown once as template)
CREATE INDEX ON reservations (company_id) WHERE deleted_at IS NULL;
-- ... repeat for all soft-deletable tables

-- 2. Partial unique index for is_primary per user in agency_memberships
CREATE UNIQUE INDEX ON agency_memberships (user_id)
  WHERE is_primary = true AND deleted_at IS NULL;

-- 3. Partial unique index for is_current per driver in driver_pricing_rules
CREATE UNIQUE INDEX ON driver_pricing_rules (driver_id)
  WHERE is_current = true AND deleted_at IS NULL;

-- 4. Partial unique index for the current pricing snapshot per reservation
--    Guarantees exactly one is_current=true row while allowing the full chain.
CREATE UNIQUE INDEX ON reservation_pricing_snapshots (reservation_id)
  WHERE is_current = true;

-- 5. GIN trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX ON customer_individuals USING GIN (full_name gin_trgm_ops);
CREATE INDEX ON customer_businesses USING GIN (company_name gin_trgm_ops);

-- 6. Single-table CHECK constraints pinning membership role scope
--    (Prisma cannot express single-table CHECKs; enforces role-scope integrity
--     together with the composite FK role_(id, scope).)
ALTER TABLE company_memberships
  ADD CONSTRAINT company_membership_role_scope_chk CHECK (role_scope = 'company');
ALTER TABLE agency_memberships
  ADD CONSTRAINT agency_membership_role_scope_chk CHECK (role_scope = 'agency');
```

---

## 6. UUID v7 Strategy

### Why UUID v7

All primary keys use UUID v7 (time-ordered). The architecture mandates this over UUID v4 (random) or integer sequences for three reasons:
1. **Index efficiency** — New UUIDs are time-monotonic, so B-tree inserts go near the end, not random positions. This reduces page splits and write amplification.
2. **Client-side generation** — IDs can be generated in the application layer before the insert, enabling optimistic UI patterns without round-trips.
3. **Enumeration safety** — The 48-bit random suffix prevents sequential enumeration despite time-ordering.

### Prisma Implementation

Prisma does not natively generate UUID v7. The implementation approach:

```prisma
// In schema.prisma (datasource block):
generator client {
  provider = "prisma-client-js"
}

// On every model:
model Reservation {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  // ...
}
```

**Two options — choose one before generation:**

**Option A — Database-generated (simpler):**
- Use `@default(dbgenerated("gen_random_uuid()"))` in Prisma schema.
- In a follow-up migration, install the `uuid_generate_v7` Postgres extension or a PL/pgSQL function and change the default to call it.
- Downside: v4 UUIDs may be generated during the transition window.

**Option B — Application-generated (recommended):**
- Install `uuidv7` npm package (`npm install uuidv7`).
- Remove `@default(...)` from all `id` fields in the Prisma schema.
- Always generate the ID in the service layer before calling `prisma.model.create({ data: { id: uuidv7(), ... } })`.
- Prisma schema has `id String @id @db.Uuid` with no default.
- This guarantees UUID v7 from the first record.

**Decision required:** Option B is architecturally correct but requires every `create` call to supply an `id`. Option A is simpler but generates UUID v4 until the extension swap. **Recommendation: Option B.** See Section 10 for final decision.

### Human-Readable Codes

The following models also carry a `code` or `number` field for human-readable reference. These are **not** the primary key — they are separate string columns:

| Model | Field | Format | Generator |
|---|---|---|---|
| `Reservation` | `code` | `RES-{YEAR}-{SEQUENCE}` | `NumberSequence` row, `SELECT FOR UPDATE` |
| `Contract` | `code` | `CTR-{YEAR}-{SEQUENCE}` | `NumberSequence` row |
| `Invoice` | `code` | `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` | `NumberSequence` row |
| `CreditNote` | `code` | `CN-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` | `NumberSequence` row |
| `Driver` | `reference` | `DRV-{AGENCY_CODE}-{SEQUENCE}` (optional) | `NumberSequence` row |
| `Customer` | `code` | `CLT-{AGENCY_CODE}-{SEQUENCE}` (optional) | `NumberSequence` row |
| `Expense` | `reference` | `EXP-{YEAR}-{SEQUENCE}` (optional) | `NumberSequence` row |
| `Company` | `slug` | kebab-case, set once | Application layer |
| `Agency` | `code` | Uppercase short code, `UNIQUE(company_id, code)` | Manual on creation |
| `Vehicle` | `plate` | Registration authority format | Manual on creation |

The `NumberSequence` model holds the per-`(company_id, agency_id, sequence_key, period_key)` counter. Increments use a transaction-level `SELECT FOR UPDATE` to guarantee gapless sequential numbers.

---

## 7. Soft Delete Fields Strategy

### Which Models Have Soft Delete

Soft delete (`deleted_at` + `deleted_by`) is present on these models:

**Yes — `deletedAt` + `deletedBy`:**

`Company`, `Agency`, `User`, `CompanyMembership`, `AgencyMembership`, `Role`, `Invitation`, `VehicleCategory`, `Vehicle`, `VehicleAvailabilityBlock`, `VehicleRegistration`, `VehicleInsurance`, `VehicleInspection`, `VehicleVignette`, `VehicleMaintenance`, `Customer`, `CustomerDocument`, `CustomerContact`, `CustomerBlacklist`, `Driver`, `DriverPricingRule`, `DriverDocument`, `DriverReservationAssignment`, `ContractTemplate`, `Contract`, `ContractInspectionItem`, `Reservation`, `ReservationExtraDefinition`, `ReservationExtra`, `ReservationAuthorizedDriver`, `Invoice`, `Expense`, `Setting`, `Document`

**No soft delete — these records are immutable or never deleted:**

`AuditLog`, `ActivityLog`, `ReservationPricingSnapshot`, `ReservationTimelineEvent`, `ContractTemplateVersion`, `ContractSignature`, `InvoiceLineItem`, `CreditNote`, `Payment`, `Deposit`, `DriverPayment`, `Plan`, `PlanLimit`, `PlanFeature`, `ReservationSource`, `Permission`, `ExpenseCategory`, `VehicleMileageLog`, `NumberSequence`

> Invoice soft delete is draft-only. Issued, partially paid, paid, overdue, and voided invoices remain historical accounting records; corrections use `CreditNote`.

> `ContractTemplateVersion` is immutable and never soft-deleted: once a version has been used to sign a contract, its body must be preserved verbatim for legal integrity. New edits to a template create a **new** version row rather than mutating an existing one.

**No soft delete — hard-deleted by background jobs:**

`UserPermissionOverride` (when expired/revoked), `RolePermission` (when role is rebuilt)

---

### Prisma Field Declarations

Every soft-deletable model includes:

```prisma
deletedAt DateTime? @map("deleted_at") @db.Timestamptz()
deletedBy String?   @map("deleted_by") @db.Uuid
```

`deletedBy` is not a Prisma relation field — it stores the raw UUID of the deleting user without a FK constraint. This avoids the Prisma circular relation issue and matches the architecture decision to store the actor ID directly.

---

### Default Query Filter

All Prisma queries against soft-deletable models must include `where: { deletedAt: null }`. This is enforced at the service/repository layer, not in the Prisma schema itself.

**Implementation option:** Use a Prisma middleware or a `withSoftDelete` query extension that automatically appends `deletedAt: null` to every `findMany` and `findUnique` on soft-deletable models.

---

## 8. Audit Fields Strategy

### Standard Audit Columns

Every business model carries exactly these four audit fields:

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
updatedAt DateTime @updatedAt        @map("updated_at") @db.Timestamptz()
```

`createdAt` is immutable — set once on insert, never updated. Prisma's `@default(now())` handles this.

`updatedAt` is auto-updated on every mutation. Prisma's `@updatedAt` decorator handles this.

---

### `createdBy` and `updatedBy`

The architecture specifies `created_by` and `updated_by` in the audit fields strategy. However, examining the per-table column specifications in `DATABASE_PHASE1.md`, `created_by`/`updated_by` columns are **not listed on every table**. They appear only on specific models where actor tracking is explicitly required:

| Model | Has `createdBy` | Has `updatedBy` | Architecture Evidence |
|---|---|---|---|
| `VehicleAvailabilityBlock` | Yes (`created_by`) | No | Explicitly in spec |
| `VehicleMileageLog` | Yes (`recorded_by`) | No | Explicitly in spec |
| `CustomerBlacklist` | Yes (`added_by`) | No | `lifted_by` (separate) |
| `Payment` | Yes (`recorded_by`) | No | Explicitly in spec |
| `Deposit` | Yes (`collected_by`, `released_by`) | No | Explicitly in spec |
| `Expense` | Yes (`recorded_by`) | No | Explicitly in spec |
| `DriverPayment` | Yes (`recorded_by`) | No | Explicitly in spec |
| `ReservationPricingSnapshot` | Yes (`locked_by`) | No | Explicitly in spec |
| `Document` | Yes (`uploaded_by`) | No | Explicitly in spec |

**The universal `created_by`/`updated_by` pattern does NOT apply to all models.** The architecture's "Universal Column Contract" section in `DATABASE_PHASE1.md § 5` lists `created_at`, `updated_at`, `deleted_at`, `deleted_by` as universal — but not `created_by`/`updated_by`. Actor-specific fields (like `recorded_by`, `uploaded_by`, `locked_by`) are explicitly named per model.

**Conclusion:** Do NOT add generic `created_by`/`updated_by` to every model. Use the named actor fields as specified per model. The audit trail for who made each change is captured in `audit_logs`, not as columns on business tables.

---

### Append-Only Models (no `updatedAt`)

These models are write-once and should not carry `updatedAt`:

`AuditLog`, `ActivityLog`, `VehicleMileageLog`, `ReservationTimelineEvent`, `ContractSignature`, `RolePermission`, `InvoiceLineItem`

> **Note:** `ReservationPricingSnapshot` financial columns are immutable, but the `is_current` flag is flipped when a snapshot is superseded. It therefore carries `updatedAt` and is NOT in the append-only list above. It remains in the "no soft delete" list — snapshots are never deleted.

For these, declare `createdAt` only:

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
```

---

## 9. Migration Order

The migration must respect foreign key dependencies. Migrations are listed in the order they must be applied. Each group can be applied as a single migration file or split — but within a group, all tables must exist before the group's FK constraints are added.

---

### Wave 1 — No Dependencies (create first)

These models have no FKs pointing to other business tables. They are the roots.

| Order | Model | Reason |
|---|---|---|
| 1 | `Permission` | No FKs. Platform-seeded. Referenced by `RolePermission`. |
| 2 | `Plan` | No FKs. Platform-seeded. Referenced by `Company` and `PlanLimit`/`PlanFeature`. |
| 3 | `PlanLimit` | FK to `Plan` only. |
| 4 | `PlanFeature` | FK to `Plan` only. |
| 5 | `ReservationSource` | No FKs. Lookup table. Seeded at deploy. |

---

### Wave 2 — Tenant Roots

| Order | Model | Dependencies |
|---|---|---|
| 6 | `Company` | FK to `Plan`. |
| 7 | `Agency` | FK to `Company`. |

---

### Wave 3 — Identity Layer

| Order | Model | Dependencies |
|---|---|---|
| 8 | `User` | FK to `Company`. |
| 9 | `Role` | FK to `Company`. |
| 10 | `RolePermission` | FKs to `Role` and `Permission`. |
| 11 | `CompanyMembership` | FKs to `Company`, `User`, `Role`. |
| 12 | `AgencyMembership` | FKs to `Company`, `Agency`, `User`, `Role`. |
| 13 | `UserPermissionOverride` | FKs to `User`, `AgencyMembership`, `Permission`. |
| 14 | `Invitation` | FKs to `Company`, `Agency`, `Role`, `User` (invited_by). |

---

### Wave 4 — Fleet Foundation

| Order | Model | Dependencies |
|---|---|---|
| 15 | `VehicleCategory` | FK to `Company`. |
| 16 | `Vehicle` | FKs to `Company`, `Agency`, `VehicleCategory`. |

---

### Wave 5 — Vehicle History Tables

These all depend on `Vehicle`. They can be created in a single migration.

| Order | Model | Dependencies |
|---|---|---|
| 17 | `VehicleRegistration` | `Vehicle`, `Company`, `Agency` |
| 18 | `VehicleInsurance` | `Vehicle`, `Company`, `Agency` |
| 19 | `VehicleInspection` | `Vehicle`, `Company`, `Agency` |
| 20 | `VehicleVignette` | `Vehicle`, `Company`, `Agency` |
| 21 | `VehicleMaintenance` | `Vehicle`, `Company`, `Agency`, `User` (recorded_by) |
| 22 | `VehicleMileageLog` | `Vehicle`, `Company`, `User` (recorded_by) |

---

### Wave 6 — Customers

| Order | Model | Dependencies |
|---|---|---|
| 23 | `Customer` | `Company`, `Agency` |
| 24 | `CustomerIndividual` | `Customer`, `Company` |
| 25 | `CustomerBusiness` | `Customer`, `Company` |
| 26 | `CustomerContact` | `Customer`, `Company` |
| 27 | `CustomerDocument` | `Customer`, `Company` |
| 28 | `CustomerBlacklist` | `Customer`, `Company`, `User` (added_by, lifted_by) |

---

### Wave 7 — Drivers

| Order | Model | Dependencies |
|---|---|---|
| 29 | `Driver` | `Company`, `Agency` |
| 30 | `DriverPricingRule` | `Driver`, `Company` |
| 31 | `DriverDocument` | `Driver`, `Company` |

---

### Wave 8 — Reservations

`Reservation` has the most FKs of any table. All its dependencies must exist first.

| Order | Model | Dependencies |
|---|---|---|
| 32 | `Reservation` | `Company`, `Agency`, `Customer`, `Vehicle`, `ReservationSource`, `User` (assigned_agent_id, cancelled_by) |
| 33 | `VehicleAvailabilityBlock` | `Vehicle`, `Company`, `Agency`, `User`, `Reservation` — depends on Reservation for optional `reservation_id` FK |
| 34 | `ReservationPricingSnapshot` | `Reservation`, `Company`, `User` (locked_by) |
| 35 | `ReservationExtra` | `Reservation`, `Company` |
| 36 | `ReservationTimelineEvent` | `Reservation`, `Company`, `User` (performed_by) |

---

### Wave 9 — Contracts

| Order | Model | Dependencies |
|---|---|---|
| 37 | `ContractTemplate` | `Company`, `Agency` |
| 38 | `ContractTemplateVersion` | `ContractTemplate`, `Company`, `User` (created_by) |
| 39 | `Contract` | `Company`, `Agency`, `Reservation`, `Customer`, `Vehicle`, `ContractTemplate`, `ContractTemplateVersion` |
| 40 | `ContractInspectionItem` | `Contract`, `Company` |
| 41 | `ContractSignature` | `Contract`, `Company` |

---

### Wave 10 — Finance

`Invoice` has multiple FKs. `CreditNote` FKs to `Invoice` (self-referential category). All must follow `Contract`.

| Order | Model | Dependencies |
|---|---|---|
| 42 | `ExpenseCategory` | `Company`, `Agency` |
| 43 | `Invoice` | `Company`, `Agency`, `Reservation`, `Customer`, `CustomerBusiness` (nullable) |
| 44 | `InvoiceLineItem` | `Invoice`, `Company` |
| 45 | `Payment` | `Company`, `Agency`, `Reservation`, `Invoice` (nullable), `Customer`, `User` (recorded_by) |
| 46 | `Deposit` | `Company`, `Agency`, `Reservation`, `Customer`, `User` (collected_by, released_by) |
| 47 | `CreditNote` | `Company`, `Agency`, `Invoice` (original + nullable replacement), `User` (issued_by) |
| 48 | `Expense` | `Company`, `Agency`, `ExpenseCategory`, `Vehicle` (nullable), `Reservation` (nullable), `User` (recorded_by) |
| 49 | `DriverPayment` | `Company`, `Agency`, `Driver`, `DriverPricingRule`, `Reservation` (nullable), `User` (recorded_by) |

---

### Wave 11 — Driver Assignments

`DriverReservationAssignment` joins Driver and Reservation — both must exist.

| Order | Model | Dependencies |
|---|---|---|
| 50 | `DriverReservationAssignment` | `Driver`, `Reservation`, `Company` |

---

### Wave 12 — Documents, Audit, Settings

These have no dependencies on each other except `Document` and `AuditLog`/`ActivityLog` which reference `Company`, `Agency`, `User`.

| Order | Model | Dependencies |
|---|---|---|
| 51 | `Document` | `Company`, `Agency`, `User` (uploaded_by) |
| 52 | `AuditLog` | `Company`, `Agency`, `User` (nullable) |
| 53 | `ActivityLog` | `Company`, `Agency`, `User` (nullable) |
| 54 | `Setting` | `Company`, `Agency` (nullable) |
| 55 | `NumberSequence` | `Company`, `Agency` (nullable) |

---

### Wave Summary

| Wave | Models | Dependency Level |
|---|---|---|
| 1 | `Permission`, `Plan`, `PlanLimit`, `PlanFeature`, `ReservationSource` | Root — no dependencies |
| 2 | `Company`, `Agency` | Tenant roots |
| 3 | `User`, `Role`, `RolePermission`, `CompanyMembership`, `AgencyMembership`, `UserPermissionOverride`, `Invitation` | Identity |
| 4 | `VehicleCategory`, `Vehicle` | Fleet foundation |
| 5 | All 6 vehicle history tables | Fleet history |
| 6 | All 6 customer tables | Customers |
| 7 | `Driver`, `DriverPricingRule`, `DriverDocument` | Drivers (no reservation yet) |
| 8 | `Reservation` + 4 reservation children + `VehicleAvailabilityBlock` | Reservations |
| 9 | `ContractTemplate`, `ContractTemplateVersion`, `Contract`, `ContractInspectionItem`, `ContractSignature` | Contracts |
| 10 | All 8 finance tables | Finance |
| 11 | `DriverReservationAssignment` | Driver ↔ Reservation join |
| 12 | `Document`, `AuditLog`, `ActivityLog`, `Setting`, `NumberSequence` | Cross-cutting infrastructure |

---

## 9.5 MEDIUM-Severity Decisions — Naming & Type Standardization

These are not blocking but must be locked before generation to avoid post-launch renames:

### Invoice & Contract Numbering Field Name: `code` vs `number`

**Current state:** Inconsistent. `DATABASE_PHASE1.md` uses `code` everywhere; `DATABASE_DOMAIN_DESIGN.md` UUID table uses `number`.

**Decision:** Use **`code`** for consistency with other humanreadable references (reservations, customers). Align the Domain Design table if needed.

| Model | Field | Format |
|---|---|---|
| `Reservation` | `code` | `RES-{YEAR}-{SEQUENCE}` |
| `Contract` | `code` | `CTR-{YEAR}-{SEQUENCE}` |
| `Invoice` | `code` | `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` |
| `CreditNote` | `code` | `CN-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` |

### PaymentMethod Enum: Consolidate or Keep Separate?

**Current state:** Earlier drafts defined both `PaymentMethod` (for `payments`) and `ExpensePaymentMethod` (for `expenses`) with identical values.

**Decision:** Use a **single shared `PaymentMethod` enum** for both tables to prevent enum drift. Canonical values are **`cash, bank_transfer, cheque, card, other`** (not `transfer`/`check`). Both models use the field name **`method`** for consistency. `DepositMethod` stays distinct — deposits cannot use `bank_transfer`.

```prisma
enum PaymentMethod {
  cash
  bank_transfer
  cheque
  card
  other
}

model Payment { method PaymentMethod }   // non-nullable
model Expense { method PaymentMethod? }   // nullable
```

### Monetary Columns: Enforce `@db.Decimal(14, 4)` Across All Tables

**Current state:** Architecture mandates `NUMERIC(14,4)` for all money. Must be explicit in Prisma for all affected models.

**Affected columns:** `Reservation` (price_per_day, total, discount), `ReservationPricingSnapshot` (same), `Invoice` (amount, subtotal, tax, total), `InvoiceLineItem`, `Payment`, `Deposit`, `Expense`, `DriverPayment` (gross, withheld, net), `Driver`, `DriverPricingRule` (rates).

```prisma
model Invoice {
  amount Decimal @db.Decimal(14, 4)
  subtotal Decimal @db.Decimal(14, 4)
  tax Decimal @db.Decimal(14, 4)
  total Decimal @db.Decimal(14, 4)
}
```

---

## 10. Ambiguities and Pre-Generation Decisions

All architectural decisions have been finalized. Every item below is marked **RESOLVED** — there are no open decisions and nothing blocks schema generation. The architecture is locked for Prisma generation.

---

### AMBIGUITY A — UUID v7 Generation Strategy — RESOLVED

**Resolution:** **Option B (application-generated UUID v7)** is the canonical strategy. Use the `uuidv7` npm package, enforced via a `createId()` utility exported from a shared lib. No `@default(...)` on `id` fields — every `create()` call supplies an `id`. No open decision remains.

---

### AMBIGUITY B — `customer_contacts.type` Enum — RESOLVED

**Resolution:** `ContactType` is finalized as a Prisma enum and belongs to the canonical enum set (part of the 33 enums). Values `{ phone email whatsapp }` back `customer_contacts.type`, matching all other type columns in the schema and keeping queries type-safe. No open decision remains.

---

### AMBIGUITY C — `expenses` Payment Method vs Unified `PaymentMethod` Enum

**Question:** `expenses.method` and `payments.method` have identical values (`cash, bank_transfer, cheque, card, other`). Should they share one `PaymentMethod` enum or use separate enums?

**Impact:** In Prisma, all models sharing an enum share the same Postgres enum type. If `expenses.method` is nullable and `payments.method` is non-nullable, they can still share a type — nullability is at the column level.

**Resolution (from § 9.5):** **Share one `PaymentMethod` enum** for both `payments.method` and `expenses.method`. No separate `ExpensePaymentMethod`. Canonical values: `cash, bank_transfer, cheque, card, other`. Field name is `method` on both models (`Expense.method` nullable, `Payment.method` non-nullable). `DepositMethod` stays distinct.

**Status:** RESOLVED — shared `PaymentMethod`, field `method`.

---

### AMBIGUITY D — `vehicle_maintenances.status` Column — RESOLVED

**Resolution:** `FINAL_DATABASE_SOURCE_OF_TRUTH.md` now carries the single canonical `vehicle_maintenances` definition, which merges the two previously conflicting `DATABASE_PHASE1.md` blocks. `status` uses `VehicleMaintenanceStatus (scheduled, in_progress, completed, cancelled)` with `DEFAULT 'scheduled'`, and the `(vehicle_id, status)` index is retained. The canonical row keeps both the lifecycle field and the operational metadata (`type`, `mileage_at_service`, `provider`, `next_due_at`, `next_due_mileage`), plus `agency_id`, `recorded_by`, `cost numeric(14,4)`, `currency_code`, and `updated_at`. No open decision remains.

---

### AMBIGUITY E — `contracts` field named `code` vs `number`

**Question:** `DATABASE_PHASE1.md` uses `code` on `contracts` (`"CTR-2025-00142"`), but `DATABASE_DOMAIN_DESIGN.md § 6.UUID Strategy` calls it `number`.

**Impact:** Mixed naming across tables is inconsistent and hard to query.

**Resolution (from § 9.5):** **Use `code` everywhere** (Reservation.code, Contract.code, Invoice.code, CreditNote.code) for consistency. This aligns with the Phase 1 original intent and makes the human-readable reference semantic (a "code" is the customer-facing identifier).

**Status:** RESOLVED — use `contracts.code`.

---

### AMBIGUITY F — `invoices.code` vs `invoices.number`, and format `FAC-` vs `INV-`

**Question:** `DATABASE_PHASE1.md` calls the invoice reference `code` with format `FAC-2025-00142`. `DATABASE_DOMAIN_DESIGN.md` calls it `number` with format `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}`. Formats differ.

**Impact:** Column naming and invoice numbering format are immutable post-launch.

**Resolution (from § 9.5):** **Use `invoices.code`** (consistent with all other references) with the format **`INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}`** (the English prefix matching the system docs, not the French `FAC-`).

**Status:** RESOLVED — use `invoices.code` with `INV-` prefix format.

---

### AMBIGUITY G — `user_permission_overrides` — is it Phase 1? — RESOLVED

**Resolution:** `user_permission_overrides` **is included in Phase 1** and is counted in the canonical 57 models (Identity = 8 tables). It is the documented per-user permission exception path referenced throughout the architecture. This aligns the Identity domain count across `FINAL_DATABASE_SOURCE_OF_TRUTH.md`, this plan (§ 1, § 10.5), and the `DATABASE_PHASE1.md` Summary. No open decision remains.

---

### AMBIGUITY H — `credit_notes` — Phase 1 or Phase 2? — RESOLVED

**Resolution:** `credit_notes` **is included in Phase 1** and is counted in the canonical 57 models (Finance = 8 tables). It is the correction mechanism required by the `invoices.status = voided` path, so shipping without it would leave that status as orphaned logic. This aligns the Finance domain count across `FINAL_DATABASE_SOURCE_OF_TRUTH.md`, this plan (§ 1, § 10.5), and the `DATABASE_PHASE1.md` Summary. No open decision remains.

---

### RESOLVED — Table Count Reconciliation (§ 10.5 canonical)

Earlier drafts across the architecture documents disagreed on the total:
- `DATABASE_ARCHITECTURE.md` (v3.0): 14 full-system domains (superset, includes non-Phase-1)
- `DATABASE_DOMAIN_DESIGN.md`: "55 core tables + vehicle_categories = 56 tables"
- `DATABASE_PHASE1.md`: "59 tables" (double-counted `driver_payments`)
- Phase 1 summary table showed 52 tables

Every discrepancy traces to one of two causes: (1) `driver_payments` counted in **both** Finance and Drivers, or (2) `number_sequences` counted separately from the 53 business tables. `DriverPayment` is a single model whose primary domain is Finance.

**Canonical reconciliation — matches the § 1 enumerated model list exactly:**

| # | Domain | Tables | Count |
|---|---|---|---|
| 1 | Multi-Tenant | `companies`, `agencies` | 2 |
| 2 | Identity | `users`, `company_memberships`, `agency_memberships`, `roles`, `permissions`, `role_permissions`, `user_permission_overrides`, `invitations` | 8 |
| 3 | Subscription | `plans`, `plan_limits`, `plan_features` | 3 |
| 4 | Fleet | `vehicle_categories`, `vehicles`, `vehicle_registrations`, `vehicle_insurances`, `vehicle_inspections`, `vehicle_vignettes`, `vehicle_maintenances`, `vehicle_mileage_logs`, `vehicle_availability_blocks` | 9 |
| 5 | Customers | `customers`, `customer_individuals`, `customer_businesses`, `customer_contacts`, `customer_documents`, `customer_blacklist` | 6 |
| 6 | Reservations | `reservation_sources`, `reservations`, `reservation_pricing_snapshots`, `reservation_extra_definitions`, `reservation_extras`, `reservation_authorized_drivers`, `reservation_timeline_events` | 7 |
| 7 | Contracts | `contract_templates`, `contract_template_versions`, `contracts`, `contract_inspection_items`, `contract_signatures` | 5 |
| 8 | Finance | `invoices`, `invoice_line_items`, `payments`, `deposits`, `credit_notes`, `expense_categories`, `expenses`, **`driver_payments`** | 8 |
| 9 | Drivers | `drivers`, `driver_pricing_rules`, `driver_documents`, `driver_reservation_assignments` | 4 |
| 10 | Documents | `documents` | 1 |
| 11 | Audit | `audit_logs`, `activity_logs` | 2 |
| 12 | Settings | `settings` | 1 |
| 13 | Utility | `number_sequences` | 1 |
| | **Total** | | **57** |

**Status:** RESOLVED — final count is **57 Prisma models = 57 database tables**. `driver_payments` counted once (Finance); `contract_template_versions` included in Phase 1 (Contracts = 5) per `DATABASE_FINAL_REVIEW.md`; reservation extras catalog and authorized-driver rows included in Reservations.

---

*End of Prisma Implementation Plan. All ambiguities in Section 10 must receive a written decision before schema generation begins.*
