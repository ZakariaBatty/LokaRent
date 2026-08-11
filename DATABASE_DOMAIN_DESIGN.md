# LokaRent — Database Domain Design

> This document is the final validation gate before Prisma schema generation begins.
> It is not a description of what exists. It is a prescription of what must be built, challenged at every step.
> No SQL. No Prisma. No code. Architecture only.

---

## Table of Contents

1. [Domain Breakdown](#1-domain-breakdown)
2. [Entity Relationship Design](#2-entity-relationship-design)
3. [Ownership Rules](#3-ownership-rules)
4. [Delete Rules](#4-delete-rules)
5. [Cascade Rules](#5-cascade-rules)
6. [UUID Strategy](#6-uuid-strategy)
7. [Global Settings Ownership](#7-global-settings-ownership)
8. [Event Sources](#8-event-sources)
9. [File Ownership](#9-file-ownership)
10. [Index Strategy](#10-index-strategy)
11. [Future Compatibility Review](#11-future-compatibility-review)

---

## 1. Domain Breakdown

### Domain Map

| # | Domain | Table Count | Short Description |
|---|--------|-------------|-------------------|
| 1 | Multi-Tenant | 2 | Tenant root. Everything else references it. |
| 2 | Identity | 8 | Users, roles, permissions, invitations. |
| 3 | Subscription | 3 | Plan catalog, limits, feature flags. |
| 4 | Fleet | 9 | Vehicles and all operational history. |
| 5 | Customers | 6 | Renters (individual & company), documents, blacklist. |
| 6 | Reservations | 5 | Full rental lifecycle. |
| 7 | Contracts | 5 | Templates, template versions, agreements, inspections, signatures. |
| 8 | Finance | 8 | Invoices, payments, deposits, expenses, driver compensation. |
| 9 | Drivers | 4 | Agency-owned drivers with pricing models and documents (`driver_payments` counted under Finance). |
| 10 | Documents | 1 | Generic file attachment system. |
| 11 | Audit | 2 | Compliance trail and activity feed. |
| 12 | Settings | 1 | Typed key/value configuration at every scope. |
| 13 | Utility | 1 | Gapless number sequence counters (`number_sequences`). |

**Total: 55 tables (canonical).** `vehicle_categories` is included in the Fleet domain count, and `contract_template_versions` is included in Contracts (Phase 1 blocking dependency per `DATABASE_FINAL_REVIEW.md`). Earlier "56" figures counted `vehicle_categories` separately and/or double-counted `driver_payments`; the "54" figure omitted template versions. The authoritative count is **55 models = 55 tables** — see `PRISMA_IMPLEMENTATION_PLAN.md` § 10.5.

---

### Domain 1 — Multi-Tenant

**Responsibility:** Define the isolation boundary. Every single table in the system carries `company_id`. Agency scoping narrows that boundary further for operational data.

**Why it exists:** Without explicit tenant scoping at the DB level, a single query bug exposes one tenant's data to another. This domain is the foundation everything else rests on.

**Which modules use it:** Every module. `company_id` is on every table. `agency_id` is on all operational tables.

**Tables:** `companies`, `agencies`

**Design invariant:** `company_id` is never nullable on any business table. `agency_id` is nullable only for company-level records (settings, subscriptions, roles, members).

---

### Domain 2 — Identity

**Responsibility:** Who can log in, what company/agency they belong to, and what they are allowed to do.

**Why it exists:** Authentication (who are you) and authorization (what can you do) are separated by design. `users` handles identity. `memberships` handle belonging. `roles` and `permissions` handle authorization. Keeping these as separate tables lets you change any one layer without touching the others.

**Which modules use it:** All modules check permissions. Reservations, Contracts, Finance record `created_by` and `updated_by`. Audit records every actor. Invitations gate onboarding.

**Tables:** `users`, `company_memberships`, `agency_memberships`, `roles`, `role_permissions`, `permissions`, `user_permission_overrides`, `invitations`

**Key design decision:** `user_permission_overrides` is the exception table — not the normal path. Every override requires a `reason` and an optional `expires_at`. If a team is abusing overrides, the data makes the audit visible.

---

### Domain 3 — Subscription

**Responsibility:** What is the company allowed to do and how much of it.

**Why it exists:** Feature gating and usage limits must be enforced at the data layer, not just the UI. A company on the Starter plan must not be able to create a 6th agency just because someone disabled a frontend check.

**Which modules use it:** Every module that creates a resource checks the relevant plan limit before inserting. The subscription domain never reads from other domains — other domains read from it.

**Tables:** `plans`, `plan_limits`, `plan_features`

**Key design decision:** Limits are rows, not columns. Adding a new limit (`max_vehicles`) is an `INSERT`, not an `ALTER TABLE`. `plan_features` uses string feature keys that can be checked at runtime without any schema change.

---

### Domain 4 — Fleet

**Responsibility:** The physical assets the agency rents out. Vehicles are the revenue-generating entity and have the most complex operational lifecycle of any entity in the system.

**Why it exists:** Vehicles accumulate history — insurance renewals, registration changes, maintenance records, mileage readings, annual inspections. Storing all of this on the `vehicles` row would create a wide mutable table that becomes impossible to query historically. Each history type gets its own append-only table.

**Which modules use it:** Reservations read `vehicles` to check availability. Finance links expenses to vehicles. Documents attach to vehicles. Alerts watch vehicle document expiry dates. Reports aggregate vehicle utilization.

**Tables:** `vehicles`, `vehicle_categories`, `vehicle_registrations`, `vehicle_insurances`, `vehicle_inspections`, `vehicle_vignettes`, `vehicle_maintenances`, `vehicle_mileage_logs`, `vehicle_availability_blocks`

**Key design decision:** `vehicles` is identity-only. It never changes its core fields (make, model, year, VIN, plate) except in genuinely rare corrections. All operational history is in dedicated tables so queries like "what was this vehicle's insurance status on date X" are trivial joins, not complex column archaeology.

---

### Domain 5 — Customers

**Responsibility:** The people and businesses who rent vehicles.

**Why it exists:** A customer's relationship with an agency is persistent across many reservations. Their documents expire and must be tracked. Some must be flagged and prevented from renting again. All of this is richer than a simple "renter" field on a reservation.

**Which modules use it:** Reservations reference `customers`. Contracts list the customer. Invoices are addressed to the customer (and to the `customer_businesses` record when the customer type is `business`). Alerts watch document expiry. Blacklist checks gate new reservation creation.

**Tables:** `customers`, `customer_individuals`, `customer_businesses`, `customer_contacts`, `customer_documents`, `customer_blacklist`

**Customer types:**
- `individual` — A natural person renting for personal use. Sub-record in `customer_individuals`.
- `company` — A legal entity (business, corporation). Sub-record in `customer_businesses`. Invoices are issued to the company name and registration number.

**Key design decision:** `customers` is the neutral parent row. Shared fields such as contact details and city live on `customers`. Type-specific fields go into `customer_individuals` or `customer_businesses`. This avoids nullable columns for the wrong type (e.g., `company_registration_number` being nullable for individuals). The type sub-table is created at the same time as the parent row in a single transaction.

**Ownership rules:**
- `customers` is owned by the agency that first onboarded the customer (`primary_agency_id`).
- `customer_businesses` is owned by its parent `customers` row; the company may have its own billing address and tax registration number used for invoice generation.
- Invoices reference both `customer_id` (always) and optionally `customer_business_id` when the type is `company`.

**Invoice relations:**
- When `customers.type = 'individual'`, the invoice is addressed to the individual's full name.
- When `customers.type = 'company'`, the invoice is addressed to `customer_businesses.company_name` and includes `tax_number` and `registration_number`.
- The `invoices` table carries a nullable `customer_business_id UUID FK → customer_businesses` for this purpose.

---

### Domain 6 — Reservations

**Responsibility:** The full lifecycle of a rental — from the moment a request is made to the moment the vehicle is returned and all obligations are settled.

**Why it exists:** The reservation is the central business event that drives revenue, contracts, invoices, and fleet utilization. It is the record that every other operational domain touches.

**Which modules use it:** Contracts are created from reservations. Invoices reference reservations. Payments are linked to reservations. Vehicle availability is blocked by reservations. Dashboard KPIs count, group, and sum reservation data.

**Tables:** `reservation_sources`, `reservations`, `reservation_pricing_snapshots`, `reservation_extras`, `reservation_timeline_events`

**Key design decision:** `reservation_pricing_snapshots` is write-once. Once a reservation is confirmed, the pricing cannot be edited — only the snapshot can be referenced. A new pricing adjustment creates a new snapshot row with a `supersedes_id` reference. This preserves the full audit trail of price changes.

---

### Domain 7 — Contracts

**Responsibility:** The legal agreement between the agency and the customer for a specific rental.

**Why it exists:** A contract is not just a PDF. It is a versioned legal document with vehicle condition records at pickup and return, and cryptographically linkable signatures. Separating contracts from reservations allows the inspection model and signature model to evolve independently.

**Which modules use it:** Reservations create contracts. Finance generates invoices only after a contract exists. Documents attach the contract PDF. Audit logs every contract mutation.

**Tables:** `contract_templates`, `contract_template_versions`, `contracts`, `contract_inspection_items`, `contract_signatures`

**Key design decision:** `contract_template_versions` is mandatory in Phase 1 even if the UI for editing templates is deferred. Every generated contract must reference the exact template version that produced it. This is a legal-correctness requirement, not a feature.

---

### Domain 8 — Finance

**Responsibility:** All money in and out of the agency: invoices for rentals, payments from customers, deposits held and released, and operational expenses.

**Why it exists:** Revenue tracking, profit calculation, and tax reporting are the reason the business runs software at all. Finance data is also the data most likely to be legally challenged, so immutability and auditability are paramount.

**Which modules use it:** Reservations trigger invoice generation. Contracts gate invoice issuance. Expenses link to vehicles and reservations. Dashboard aggregates all finance data for KPI cards.

**Tables:** `invoices`, `invoice_line_items`, `payments`, `deposits`, `expense_categories`, `expenses`, `credit_notes`, `driver_payments`

**Invoice lifecycle:**

```
draft → issued → partially_paid → paid → overdue → voided (via credit_note)
```

| Status | Description |
|---|---|
| `draft` | Created but not yet sent to the customer. Editable. |
| `issued` | Formally issued. Immutable. `issued_at` timestamp set. |
| `partially_paid` | At least one payment recorded but total not yet met. |
| `paid` | Total payments equal or exceed the invoice total. `paid_at` timestamp set. |
| `overdue` | Past `due_date` without full payment. Set by a background job. |
| `voided` | Cancelled via a `credit_notes` row. Original invoice is never deleted. |

**Invoice ownership:**
- An invoice is owned by the agency that issued it (`agency_id`).
- Every invoice references one reservation (`reservation_id`).
- Every invoice references one customer (`customer_id`).
- When the customer type is `company`, `customer_business_id` is also populated for accurate legal billing.

**Invoice numbering strategy:**
- Format: `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` — e.g. `INV-AGA-2025-00017`.
- Sequence is per `(company_id, agency_id, year)`, stored in `number_sequences`.
- Numbers are gapless within the period. A voided invoice retains its number; the credit note receives its own `CN-` prefixed number.
- `credit_notes` follow the same pattern: `CN-{AGENCY_CODE}-{YEAR}-{SEQUENCE}`.

**Relations with customers, companies, reservations, payments:**
- `invoices.customer_id` → `customers` — always set.
- `invoices.customer_business_id` → `customer_businesses` — set only when customer type is `company`.
- `invoices.reservation_id` → `reservations` — always set for rental invoices.
- `payments.invoice_id` → `invoices` — nullable (advance or deposit payments may not yet reference an invoice).
- `credit_notes.original_invoice_id` → `invoices` — the invoice being corrected.
- `credit_notes.replacement_invoice_id` → `invoices` — nullable; the correcting invoice if one was re-issued.

**Key design decision:** `invoices` and `credit_notes` are never deleted or mutated after issuance. A correction creates a new credit note referencing the original invoice. This is not optional — it is how VAT-compliant accounting works in every jurisdiction.

**Tax and document snapshots:**
- `settings.tax_rate` is mutable agency configuration. It is resolved at reservation confirmation/repricing time and copied into `reservation_pricing_snapshots.tax_rate`.
- `reservation_pricing_snapshots.tax_rate` is the immutable accepted tax rate for that pricing snapshot. Historical rows may be `NULL` when the rate was not stored before the Phase-1 Finance tax snapshot migration.
- `invoice_line_items.tax_rate` and `invoice_line_items.tax_amount` freeze the tax basis actually used for each issued invoice line. Issued invoices never recalculate tax from current settings.
- `invoices.document_url` stores the generated invoice document/PDF location. Invoice PDFs are accounting documents and are retained permanently.

**Phase-1 correction boundary:**
- `credit_notes` are accounting/document corrections for invoice voids or amount corrections.
- `credit_notes` are not cash refunds.
- A dedicated `refunds` table is postponed to the Phase 2 online-payment/refund workflow.
- `FinancialAccount`/cashbox/bank account modeling is not required in Phase 1; Finance remains operational rental ERP finance, not a double-entry accounting ledger.

**Currency aggregation rule:** Finance rows carry explicit currency. Until an FX/conversion model exists, reports and KPIs must group or filter by currency and must not aggregate different currencies into one total.

---

### Domain 9 — Drivers

**Responsibility:** Chauffeurs and drivers employed or contracted by an agency, their pricing models, payment history, document records, and their assignment to reservations.

**Why it exists:** A driver is a distinct operational entity from a `user`. An agency may employ drivers who have no system login. Drivers accumulate a history of reservations, payments, and document renewals that must be tracked independently. Conflating drivers with agency members creates a wide nullable schema and makes driver-specific queries (payment history, license expiry) unnecessarily complex.

**Which modules use it:** Reservations link drivers to rentals via `driver_reservation_assignments`. Finance records driver compensation via `driver_payments`. Alerts watch driver document expiry. Documents attach licenses and contracts to drivers.

**Tables:** `drivers`, `driver_pricing_rules`, `driver_documents`, `driver_reservation_assignments` *(4 tables; `driver_payments` is a Finance-domain table, counted there)*

**Driver ownership:** A driver is owned by the agency that employs or contracts them (`agency_id`). A driver cannot be shared across agencies within the same company in Phase 1. Cross-agency driver sharing is a Phase 4 concern.

**Driver pricing models:**

| Model | Description | Stored in |
|---|---|---|
| `monthly` | Fixed monthly salary regardless of reservations. | `driver_pricing_rules.monthly_rate` |
| `hourly` | Paid per hour of active assignment. | `driver_pricing_rules.hourly_rate` |
| `mission` | Paid per completed reservation (mission). | `driver_pricing_rules.mission_rate` |

A driver may have multiple `driver_pricing_rules` rows over time (e.g., salary increased). The active rule is identified by `is_current = true` with a `valid_from` date. Historical rules are retained for payroll audit.

**Driver payment history:**
- `driver_payments` records each payment to a driver.
- A payment references the `driver_pricing_rules` row that was active at payment time.
- For `mission` model, `driver_payments.reservation_id` is populated.
- For `monthly` and `hourly` models, `reservation_id` is null and `period_start` / `period_end` define the covered period.

**Driver relation with reservations:**
- A reservation may have one primary driver and optionally one additional driver.
- `driver_reservation_assignments` is the join table: `(reservation_id, driver_id, role)` where `role` is `primary` or `additional`.
- An earlier draft named this table `reservation_drivers` and scoped it to `users`; the canonical table is `driver_reservation_assignments`, scoped to the driver entity.

**Driver documents / files:**
- `driver_documents` tracks identity and license records with expiry dates (similar to `customer_documents`).
- Document types: `driving_license`, `national_id`, `contract`, `other`.
- The physical files are stored in the generic `documents` table via polymorphic `(entity_type = 'driver', entity_id = driver_id)`.

---

### Domain 10 — Documents

**Responsibility:** File attachments for any entity in any domain.

**Why it exists:** Every domain needs to attach files (vehicle photos, customer ID scan, contract PDF, insurance certificate). Building a separate attachments table per entity creates 15 identical tables. A single polymorphic `documents` table eliminates this redundancy while retaining full query capability through `(entity_type, entity_id)`.

**Which modules use it:** All modules. Every entity that can have a file attached uses this table.

**Tables:** `documents`

**Key design decision:** `entity_type` is a string enum (`'vehicle'`, `'customer'`, `'contract'`, `'driver'`, etc.). There is no FK enforcement from `documents` to the referenced entity — enforcing it would require a trigger per entity type, and the performance cost of validating polymorphic FKs at insert time is not worth it. Instead, the application enforces valid `entity_type` values via a CHECK constraint on the column, and orphaned document cleanup is a background job.

---

### Domain 11 — Audit

**Responsibility:** An immutable record of everything that changed, and a human-readable feed of what happened.

**Why it exists:** Two audiences, two tables. Compliance engineers need structured before/after diffs. Customer-facing dashboards need readable sentences like "Ahmed confirmed the reservation." Mixing these into one table serves neither audience well.

**Which modules use it:** Every mutation in every module writes to `audit_logs`. Every meaningful business event writes to `activity_logs`. Nothing reads from audit in the hot path — it is write-only in production operations.

**Tables:** `audit_logs`, `activity_logs`

**Key design decision:** `audit_logs` is append-only with no `updated_at` or `deleted_at`. `activity_logs` is also append-only but carries a denormalized `actor_name` and `summary` string so the UI renders without any joins. Retention: `activity_logs` are kept for 90 days in hot storage. `audit_logs` are kept forever, partitioned by month after 6 months.

---

### Domain 12 — Settings

**Responsibility:** Configuration values at every scope level: platform defaults, company overrides, agency overrides.

**Why it exists:** Configuration that is stored as code cannot be changed without a deployment. Configuration stored as wide columns forces an `ALTER TABLE` for every new setting. Typed key/value with scope-resolution gives the runtime flexibility of the first approach and the structure of the second.

**Which modules use it:** Finance reads invoice prefix, due days, tax rate. Fleet reads default deposit amount. Reservations read late-return fee. All modules read timezone and currency.

**Tables:** `settings`

**Key design decision:** Every setting has a canonical `key` string, a `value_type` that tells the reader how to cast the stored text, and a scope hierarchy (platform → company → agency). Resolution is always most-specific-wins: agency override beats company default beats platform default.

---

### Domain 13 — Utility

**Responsibility:** Gapless, concurrency-safe generation of human-readable business codes (invoice numbers, contract numbers, reservation references, credit-note numbers).

**Why it exists:** Legal and accounting codes must be sequential with no gaps and no duplicates, even under concurrent inserts. A database sequence can skip numbers on rollback; a `MAX()+1` query races. A dedicated counter table locked per `(company, sequence_type)` row guarantees gapless allocation inside the same transaction as the record it numbers.

**Which modules use it:** Finance (`invoices`, `credit_notes`), Contracts (`contracts`), Reservations (`reservations`). Any table needing a formatted `code` draws its next value here.

**Tables:** `number_sequences`

**Key design decision:** One row per `(company_id, agency_id?, sequence_type, year)`. Allocation does `SELECT ... FOR UPDATE`, increments `current_value`, and returns it within the caller's transaction, so a rolled-back insert also rolls back the counter — preserving gapless numbering. Format templates (e.g. `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}`) live in Settings, not here.

---

## 2. Entity Relationship Design

Every table, its parent, its children, and the cardinality of each relationship.

---

### Multi-Tenant

```
companies
 ├── agencies                    (1:N) — a company has one or more branches
 ├── company_memberships         (1:N) — users belong to a company with a role
 ├── subscriptions               (1:1) — a company has one active subscription
 ├── roles                       (1:N) — a company defines its own role presets
 ├── settings (company-level)    (1:N) — rows where agency_id IS NULL
 └── vehicle_categories          (1:N) — seeded per company at signup

agencies
 ├── agency_memberships          (1:N) — users assigned to this agency
 ├── vehicles                    (1:N) — fleet owned by this agency
 ├── customers                   (1:N) — customers served by this agency
 ├── reservations                (1:N) — rentals processed at this agency
 ├── settings (agency-level)     (1:N) — rows where agency_id IS NOT NULL
 ├── contract_templates          (1:N) — templates managed by this agency
 ├── expense_categories          (1:N) — expense taxonomy for this agency
 └── invitations                 (1:N) — pending membership invitations
```

---

### Identity

```
users
 ├── company_memberships         (1:N) — one per company the user belongs to
 ├── agency_memberships          (1:N) — zero to many per company
 ├── invitations (sent)          (1:N) — invitations this user created
 └── invitations (received)      (1:N) — invitations sent to this user's email

company_memberships
 └── roles                       (N:1) — each membership has one company-scoped role

agency_memberships
 └── roles                       (N:1) — each membership has one agency-scoped role

roles
 ├── role_permissions            (1:N) — a role grants many permissions
 └── user_permission_overrides   (1:N) — a role can be individually overridden per user

permissions
 ├── role_permissions            (1:N) — a permission appears in many roles
 └── user_permission_overrides   (1:N) — a permission can be individually granted/denied

user_permission_overrides
 ├── users                       (N:1)
 ├── agency_memberships          (N:1)
 └── permissions                 (N:1)

invitations
 ├── companies                   (N:1)
 ├── agencies                    (N:1, nullable — null = company-level invite)
 ├── roles                       (N:1)
 └── users (invited_by)          (N:1)
```

---

### Subscription

```
plans
 ├── plan_limits                 (1:N) — one row per limit key per plan
 └── plan_features               (1:N) — one row per feature key per plan

companies
 └── plans                       (N:1) — a company is on one plan at a time
```

---

### Fleet

```
vehicles
 ├── vehicle_categories          (N:1) — every vehicle has a category
 ├── vehicle_registrations       (1:N) — one row per registration period
 ├── vehicle_insurances          (1:N) — one row per insurance policy
 ├── vehicle_inspections         (1:N) — one row per technical inspection
 ├── vehicle_vignettes           (1:N) — one row per annual vignette
 ├── vehicle_maintenances        (1:N) — one row per maintenance event
 ├── vehicle_mileage_logs        (1:N) — one row per odometer reading event
 ├── vehicle_availability_blocks (1:N) — manual unavailability windows
 ├── reservations                (1:N) — rentals for this vehicle
 ├── expenses                    (1:N) — costs attributed to this vehicle
 └── documents                   (1:N) — polymorphic via entity_type='vehicle'

vehicle_categories
 └── vehicles                    (1:N) — vehicles using this category

vehicle_maintenances
 └── documents                   (1:N) — repair receipts, invoices (polymorphic)
```

---

### Customers

```
customers
 ├── customer_individuals        (1:1) — present when type = 'individual'
 ├── customer_businesses         (1:1) — present when type = 'company'
 ├── customer_contacts           (1:N) — phone numbers, emails, WhatsApp contacts
 ├── customer_documents          (1:N) — driving license, passport, etc.
 ├── customer_blacklist          (1:N) — one row per blacklist event (not a flag)
 ├── reservations                (1:N) — reservations made by this customer
 └── documents                   (1:N) — polymorphic via entity_type='customer'

customer_businesses
 └── invoices                    (1:N) — invoices issued to this company entity
                                         (via invoices.customer_business_id)

customer_documents
 └── documents                   (1:N) — the actual file records (polymorphic)
```

---

### Reservations

```
reservations
 ├── customers                         (N:1) — the renter
 ├── vehicles                          (N:1) — the rented vehicle
 ├── agencies                          (N:1) — the processing branch
 ├── reservation_sources               (N:1) — origin channel
 ├── reservation_pricing_snapshots     (1:N) — supersession chain; exactly one is_current=true
 ├── reservation_extras                (1:N) — add-ons selected
 ├── reservation_timeline_events       (1:N) — append-only status log
 ├── contracts                         (1:N) — version/amendment chain; one is_current=true
 ├── invoices                          (1:1) — issued on confirmation/pickup
 └── deposits                          (1:1, nullable)

reservation_sources
 └── reservations                      (1:N) — lookup only, never updated

reservation_pricing_snapshots
 ├── reservations                      (N:1)
 └── reservation_pricing_snapshots     (N:1, self — supersedes_id for adjustments)

reservation_extras
 └── reservations                      (N:1)

reservation_timeline_events
 ├── reservations                      (N:1)
 └── users (actor)                     (N:1, nullable — null = system event)
```

---

### Contracts

```
contract_templates
 ├── agencies                          (N:1)
 └── contract_template_versions        (1:N) — one per edit

contract_template_versions
 ├── contract_templates                (N:1)
 └── contracts                         (1:N) — contracts referencing this version

contracts
 ├── reservations                      (N:1)
 ├── reservation_pricing_snapshots      (N:1) — exact pricing snapshot used at generation
 ├── contracts                         (N:1, self — supersedes_contract_id for amendments)
 ├── contract_template_versions        (N:1) — exact version used at generation
 ├── contract_inspection_items         (1:N) — pickup and return checklists
 ├── contract_signatures               (1:N) — one per signing party per event
 └── documents                         (1:N) — polymorphic (contract PDF)

contract_inspection_items
 └── contracts                         (N:1)

contract_signatures
 ├── contracts                         (N:1)
 └── users (signed_by, nullable)       (N:1) — null if customer signs without account
```

---

### Finance

```
invoices
 ├── reservations                      (N:1)
 ├── customers                         (N:1)
 ├── customer_businesses               (N:1, nullable — set when customer type = 'company')
 ├── agencies                          (N:1)
 ├── invoice_line_items                (1:N)
 ├── payments                          (1:N)
 └── credit_notes                      (1:N) — corrections reference original invoice

invoice_line_items
 └── invoices                          (N:1)

payments
 ├── invoices                          (N:1, nullable — advance payments)
 ├── reservations                      (N:1)
 ├── deposits                          (N:1, nullable — when releasing deposit)
 └── users (recorded_by)              (N:1)

deposits
 ├── reservations                      (N:1)
 └── payments                          (1:N) — paid, then released as a second payment

driver_payments
 ├── drivers                           (N:1)
 ├── driver_pricing_rules              (N:1) — rule active at payment time
 ├── reservations                      (N:1, nullable — for mission-based payments)
 └── users (recorded_by)              (N:1)

credit_notes
 ├── invoices (original)               (N:1)
 ├── invoices (replacement, nullable)  (N:1)
 └── users (issued_by)                 (N:1)

expenses
 ├── expense_categories                (N:1)
 ├── vehicles (nullable)               (N:1)
 ├── reservations (nullable)           (N:1)
 └── documents                         (1:N) — receipts (polymorphic)

expense_categories
 └── expenses                          (1:N)
```

---

### Drivers

```
drivers
 ├── agencies                               (N:1) — the employing agency
 ├── driver_pricing_rules                   (1:N) — pricing model history
 ├── driver_payments                        (1:N) — compensation records
 ├── driver_documents                       (1:N) — license, ID, contract files
 └── driver_reservation_assignments         (1:N) — reservations this driver served

driver_pricing_rules
 └── drivers                                (N:1)

driver_payments
 ├── drivers                                (N:1)
 ├── driver_pricing_rules                   (N:1) — rule at time of payment
 └── reservations (nullable)               (N:1) — for mission-based payments

driver_documents
 └── documents                              (1:N) — polymorphic via entity_type='driver'

driver_reservation_assignments
 ├── reservations                           (N:1)
 └── drivers                                (N:1)
```

---

### Documents

```
documents
 ├── companies                         (N:1) — tenant scoping
 ├── agencies (nullable)               (N:1)
 └── [entity_type, entity_id]          (polymorphic — no FK enforcement)
     Values for entity_type:
     'vehicle' | 'vehicle_maintenance' | 'customer' | 'customer_document'
     | 'contract' | 'invoice' | 'expense' | 'insurance' | 'inspection'
     | 'driver'
```

---

### Audit

```
audit_logs
 ├── companies                         (N:1)
 ├── agencies (nullable)               (N:1)
 └── users (actor, nullable)           (N:1) — null = system action

activity_logs
 ├── companies                         (N:1)
 ├── agencies (nullable)               (N:1)
 └── users (actor, nullable)           (N:1) — null = system action
```

---

### Settings

```
settings
 ├── companies                         (N:1)
 └── agencies (nullable)               (N:1) — null = company-level setting
```

---

## 3. Ownership Rules

Ownership defines who creates, who scopes, and who may delete a record. Every table has exactly one owner.

| Table | Owner | Reasoning |
|---|---|---|
| `companies` | Platform | Created by platform admins or via self-registration. No other entity owns it. |
| `agencies` | Company | An agency cannot exist without its company. |
| `plans` | Platform | Managed by the LokaRent platform team. Companies cannot modify plans. |
| `plan_limits` | Platform | Owned alongside `plans`. |
| `plan_features` | Platform | Owned alongside `plans`. |
| `users` | Platform | A user is a platform-level identity. They may belong to many companies. |
| `company_memberships` | Company | Created when a user joins a company. |
| `agency_memberships` | Agency | Created when a user is assigned to an agency. |
| `roles` | Company | Each company defines its own roles. |
| `permissions` | Platform | Seeded at deploy. Not tenant-editable. |
| `role_permissions` | Company | A company decides which permissions each of its roles grants. |
| `user_permission_overrides` | Agency | Overrides apply within a specific agency membership. |
| `invitations` | Agency | Sent by an agency admin (or company admin for company-level invites). |
| `vehicle_categories` | Company | Seeded per-company at signup. Tenant-customizable. |
| `vehicles` | Agency | A vehicle belongs to one agency's fleet. |
| `vehicle_registrations` | Vehicle | A vehicle owns its registration history. |
| `vehicle_insurances` | Vehicle | A vehicle owns its insurance history. |
| `vehicle_inspections` | Vehicle | A vehicle owns its inspection history. |
| `vehicle_vignettes` | Vehicle | A vehicle owns its vignette history. |
| `vehicle_maintenances` | Vehicle | A vehicle owns its maintenance records. |
| `vehicle_mileage_logs` | Vehicle | A vehicle owns its odometer history. |
| `vehicle_availability_blocks` | Vehicle | A vehicle owns its manual unavailability windows. |
| `customers` | Agency | A customer belongs to the agency that first onboarded them (`primary_agency_id`). |
| `customer_individuals` | Customer | Detail record owned by the parent customer. |
| `customer_businesses` | Customer | Detail record owned by the parent customer. Used as the legal billing entity on invoices for company customers. |
| `customer_contacts` | Customer | A customer owns their contact records. |
| `customer_documents` | Customer | A customer owns their identity documents. |
| `customer_blacklist` | Agency | An agency creates blacklist entries. Not the customer. |
| `reservation_sources` | Platform | Seeded at deploy. Lookup-only. |
| `reservations` | Agency | Created and managed by the agency's agents. |
| `reservation_pricing_snapshots` | Reservation | Created and locked by the reservation at confirmation. |
| `reservation_extras` | Reservation | Configured per reservation. |
| `reservation_timeline_events` | Reservation | Append-only. Each event is owned by the moment it was created. |
| `contract_templates` | Agency | Each agency manages its own templates. |
| `contract_template_versions` | Template | A template owns its version history. |
| `contracts` | Reservation | One contract per reservation. Created at pickup. |
| `contract_inspection_items` | Contract | A contract owns its inspection checklist. |
| `contract_signatures` | Contract | A contract owns its signature records. |
| `invoices` | Agency | Issued by the agency. References one reservation and one customer. When `customer_businesses` applies, also references the business entity. |
| `invoice_line_items` | Invoice | An invoice owns its line items. |
| `payments` | Agency | Recorded by agency staff. |
| `deposits` | Reservation | A deposit is tied to one reservation. |
| `credit_notes` | Invoice | A credit note references and partially or fully corrects an invoice. |
| `expense_categories` | Agency | Each agency defines its own expense taxonomy. |
| `expenses` | Agency | Operational costs incurred by the agency. |
| `drivers` | Agency | A driver is employed or contracted by one agency. |
| `driver_pricing_rules` | Driver | A driver owns their pricing history. |
| `driver_payments` | Agency | Compensation payments recorded by agency staff. |
| `driver_documents` | Driver | A driver owns their identity and license document records. |
| `driver_reservation_assignments` | Reservation | A reservation owns its driver assignment records. |
| `documents` | Agency | Files are scoped to the agency, attached to an entity. |
| `settings` | Company / Agency | Company-level or agency-level depending on `agency_id` nullability. |
| `audit_logs` | Platform | Immutable. No owner can modify or delete these. |
| `activity_logs` | Platform | Append-only. Owned by the system event that generated them. |

---

## 4. Delete Rules

Every table has exactly one delete strategy. No exceptions. No "it depends."

### Never Delete

These records must exist forever, even after the tenant account is closed.

| Table | Reason |
|---|---|
| `audit_logs` | Legal compliance. Tamper-proof evidence of every change. |
| `activity_logs` | Operational history required for dispute resolution. |
| `invoices` | Accounting law in every jurisdiction prohibits deleting issued invoices. |
| `invoice_line_items` | Owned by invoice — cannot exist without it, cannot be deleted independently. |
| `credit_notes` | Financial correction documents. Same legal status as invoices. |
| `payments` | Financial transaction records. Immutable. A reversal creates a new record, not a deletion. |
| `deposits` | Financial records. A deposit release is a state change, not a deletion. |
| `driver_payments` | Driver compensation records. Immutable once recorded. A correction creates a new row. |
| `reservation_pricing_snapshots` | Write-once. The locked price is a legal artifact once the customer accepted it. |
| `reservation_timeline_events` | Append-only event log. Deleting a timeline event destroys the audit trail. |
| `contract_signatures` | Legal signature records. Destroying them destroys the legal agreement. |
| `contract_template_versions` | Existing contracts reference template versions. Deleting a version orphans legal documents. |
| `permissions` | Platform-seeded. Never modified after deploy. |
| `reservation_sources` | Lookup table. Seeded. Never deleted — historical reservations reference them. |
| `expense_categories` | Historical expenses reference them. Deprecate via `is_active`, never delete. |
| `plan_limits` | Historical subscriptions reference plan configurations. |
| `plan_features` | Same as plan_limits. |

---

### Soft Delete

These records are deactivated with `deleted_at` + `deleted_by`. The row remains in the database. All queries must filter `WHERE deleted_at IS NULL`.

| Table | Reason |
|---|---|
| `companies` | A closed company account must remain for compliance. Data cannot be purged until a legal retention period expires. |
| `agencies` | A closed branch may have active historical contracts and invoices. |
| `users` | A deactivated user still appears in historical records as the actor. |
| `company_memberships` | A removed member's historical actions still reference them. |
| `agency_memberships` | Same as company_memberships. |
| `roles` | A deleted role may still be referenced by historical memberships. Archive via soft delete. |
| `invitations` | An expired or revoked invitation should remain for audit purposes. |
| `vehicle_categories` | Vehicles reference categories. Deleting a category that vehicles still use is a FK violation. Deactivate via `deleted_at`. |
| `vehicles` | A sold or retired vehicle has a full history that must be preserved. |
| `vehicle_availability_blocks` | A cancelled block should remain in history for fleet audit purposes. |
| `customers` | A customer's record may be referenced by past reservations, invoices, and contracts. |
| `customer_blacklist` | Blacklist entries are auditable records. A "lifted" ban adds a `lifted_at` timestamp — not a deletion. |
| `customer_documents` | An expired or replaced document remains for identity verification history. |
| `customer_contacts` | A removed contact method remains for communication history. |
| `drivers` | A deactivated driver still appears in historical reservation and payment records. |
| `driver_pricing_rules` | Historical pricing rules are retained for payroll audits. Soft-delete when superseded. |
| `driver_documents` | An expired or replaced driver document remains for audit history. |
| `driver_reservation_assignments` | A removed driver assignment remains in the reservation audit trail. |
| `contract_templates` | Active contracts may reference this template. Archive, do not delete. |
| `contracts` | A cancelled contract is still a legal document. It is cancelled, not destroyed. |
| `contract_inspection_items` | Owned by a contract. Follows contract's soft delete. |
| `reservations` | A cancelled reservation remains as a business record and may have invoices. |
| `reservation_extras` | Removed add-ons remain for pricing audit. |
| `expenses` | A corrected expense is voided via a new expense row — but the original remains. |
| `vehicle_registrations` | Historical records. Soft delete when superseded by a new registration. |
| `vehicle_insurances` | Historical records. Soft delete when superseded. |
| `vehicle_inspections` | Historical records. Soft delete only on data entry errors. |
| `vehicle_vignettes` | Historical records. Same as inspections. |
| `vehicle_maintenances` | Historical records. A cancelled maintenance record is closed, not deleted. |
| `settings` | A removed setting reverts to the inherited default. The row is soft-deleted, not hard-deleted, so the change is auditable. |
| `documents` | A removed file attachment soft-deletes the metadata row. The file in object storage is purged asynchronously after a retention window. |

---

### Hard Delete

These records may be permanently removed because they carry no legal, financial, or audit weight.

| Table | Reason |
|---|---|
| `vehicle_mileage_logs` (data entry errors only) | A duplicate or clearly erroneous entry recorded immediately may be hard-deleted if no downstream record references it yet. Once a contract or reservation references it, it becomes permanent. |
| Draft invitations (never accepted, expired > 30 days) | An expired invitation that was never accepted by the recipient has no legal significance. A background job removes them after 30 days. |
| `role_permissions` (when rebuilding a role definition) | When an admin rebuilds a role's permission set, old `role_permissions` rows are hard-deleted and replaced. The `roles` row itself is soft-deleted if removed. |
| `user_permission_overrides` (when override expires or is revoked) | An expired or revoked override is no longer operative. The audit log records its existence; the row is safe to remove. |
| Unprocessed `documents` (upload failed, no entity reference) | A file that failed to link to any entity during upload has no business significance. A cleanup job removes orphaned `documents` rows after 24 hours. |

---

## 5. Cascade Rules

Every foreign key relationship has an explicit `ON DELETE` behavior. "No action" is not a strategy — it is a deferred error. Every relationship below is intentional.

---

### ON DELETE RESTRICT

Prevents deletion of the parent if any child row exists. Used when the child gives the parent business meaning that must be preserved.

| Relationship | Reason |
|---|---|
| `vehicles → vehicle_categories` | You cannot delete a vehicle category that still has active vehicles. Soft-delete the category instead. |
| `companies → agencies` | Deleting a company that still has agencies is a data disaster. Company closure must explicitly deactivate agencies first. |
| `companies → company_memberships` | A company cannot be deleted while users are still members. |
| `agencies → reservations` | An agency cannot be deleted while it has active reservations. |
| `agencies → vehicles` | An agency cannot be deleted while it owns fleet. |
| `agencies → customers` | An agency cannot be deleted while it has customers on record. |
| `reservations → contracts` | A reservation cannot be deleted while a contract exists for it. |
| `reservations → invoices` | A reservation cannot be deleted while an invoice exists. |
| `contracts → contract_signatures` | A signed contract cannot be modified or deleted. |
| `invoices → payments` | An invoice that has received payments cannot be deleted. |
| `plans → companies` | A plan that has active subscribers cannot be deleted from the catalog. |
| `contract_templates → contracts` | A template referenced by generated contracts cannot be deleted. Soft-delete only. |
| `contract_template_versions → contracts` | A version referenced by a generated contract is permanently immutable. |

---

### ON DELETE CASCADE

Automatically deletes child rows when the parent is deleted. Used only when the child has no independent business meaning and is strictly owned by the parent.

| Relationship | Reason |
|---|---|
| `roles → role_permissions` | If a role is hard-deleted (never done in practice — roles are soft-deleted), its permission grants go with it. |
| `invoices → invoice_line_items` | Line items have no meaning without their invoice. |
| `vehicle_categories → (never used)` | Categories use RESTRICT — no cascade here. |
| `reservations → reservation_extras` | Add-ons have no meaning without their reservation. |
| `contracts → contract_inspection_items` | Inspection items have no meaning without the contract. |
| `drivers → driver_reservation_assignments` | Assignment records have no meaning without the driver entity. (In practice drivers are soft-deleted, so this cascade is a safety net only.) |

---

### SET NULL

Nullifies the FK on the child when the parent is deleted. Used when the child can exist meaningfully without the reference.

| Relationship | Reason |
|---|---|
| `users → reservation_timeline_events (actor)` | A deleted user's historical timeline events remain. The actor is set to null and `actor_name` (denormalized text) preserves the readable record. |
| `users → activity_logs (actor)` | Same reasoning. The readable `actor_name` field is denormalized. |
| `users → audit_logs (actor)` | Same reasoning. |
| `users → contract_signatures (signed_by)` | A deleted user's historical signatures remain valid. The `signer_name` (denormalized) preserves identity. |
| `reservations → expenses (reservation_id)` | An expense associated with a reservation that gets cancelled remains a real cost. Set null on the FK; keep the expense. |
| `vehicles → expenses (vehicle_id)` | A sold vehicle's historical expenses remain real costs. |
| `contract_templates → contracts (template_id)` | If a template is soft-deleted, existing contracts still exist. The `template_id` can be set null — the `rendered_html` and `content_snapshot` fields on `contracts` already preserve everything needed for reproduction. |

---

### NO ACTION (explicit, with deferred constraint)

Used where the application enforces integrity before the database acts. The database check is a safety net, not the primary enforcement.

| Relationship | Reason |
|---|---|
| `documents → [entity_type, entity_id]` | Polymorphic references cannot use FK constraints. The application validates `entity_type` against a CHECK constraint and resolves `entity_id` before inserting. Orphan cleanup is a background job. |
| `agency_memberships → roles` | The composite-FK safety check (role must be scoped to the same company) is enforced by a DB trigger or application rule, not a standard FK. Standard FK alone cannot enforce this cross-table constraint. |

---

## 6. UUID Strategy

### UUID v7

All primary keys use UUID v7 (time-ordered UUIDs). This is a deliberate choice over UUID v4 (random) or sequential integers.

**Why UUID v7 over UUID v4:**
- UUID v7 is time-sortable. Index fragmentation is dramatically reduced because new rows are appended near the end of the B-tree rather than randomly inserted.
- UUID v7 is globally unique and safe to generate client-side. No round-trip to DB needed before an insert.
- UUID v7 still defeats enumeration attacks — the random suffix (48 bits) makes prediction impossible.

**Why UUID over integer sequences:**
- Integer IDs expose row counts and growth rate to anyone with access to the API.
- FK references across shards or future microservices require global uniqueness.
- UUID enables client-side ID generation, which simplifies offline-first and optimistic UI patterns.

---

### Human-Readable Numbers

Some entities also need a **human-readable reference number** for use in communication, printed documents, and support queries. These are separate from UUIDs and generated by the `number_sequences` table using a row-level lock.

| Entity | UUID | Human-Readable Code | Format | Example |
|---|---|---|---|---|
| `reservations` | Yes | Yes — `code` | `RES-{YEAR}-{SEQUENCE}` | `RES-2025-00842` |
| `contracts` | Yes | Yes — `number` | `CTR-{YEAR}-{SEQUENCE}` | `CTR-2025-00391` |
| `invoices` | Yes | Yes — `number` | `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` | `INV-AGA-2025-00017` |
| `credit_notes` | Yes | Yes — `number` | `CN-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` | `CN-AGA-2025-00003` |
| `drivers` | Yes | Optional — `reference` | `DRV-{AGENCY_CODE}-{SEQUENCE}` | `DRV-AGA-00014` |
| `vehicles` | Yes | Yes — `plate` | Plate from registration authority | `12345-A-7` |
| `customers` | Yes | Optional — `reference` | `CLT-{AGENCY_CODE}-{SEQUENCE}` | `CLT-AGA-00241` |
| `expenses` | Yes | Optional — `reference` | `EXP-{YEAR}-{SEQUENCE}` | `EXP-2025-00089` |
| `companies` | Yes | Yes — `slug` | kebab-case company name | `lokarent-casablanca` |
| `agencies` | Yes | Yes — `code` | Short uppercase code | `AGA`, `RAB`, `MKN` |

**Entities that use UUID only (no human-readable code needed):**

`users`, `roles`, `permissions`, `role_permissions`, `user_permission_overrides`, `company_memberships`, `agency_memberships`, `invitations`, `plans`, `plan_limits`, `plan_features`, `vehicle_categories`, `vehicle_registrations`, `vehicle_insurances`, `vehicle_inspections`, `vehicle_vignettes`, `vehicle_maintenances`, `vehicle_mileage_logs`, `vehicle_availability_blocks`, `customer_individuals`, `customer_businesses`, `customer_contacts`, `customer_documents`, `customer_blacklist`, `reservation_sources`, `reservation_pricing_snapshots`, `reservation_extras`, `reservation_timeline_events`, `contract_templates`, `contract_template_versions`, `contract_inspection_items`, `contract_signatures`, `invoice_line_items`, `payments`, `deposits`, `expense_categories`, `driver_pricing_rules`, `driver_payments`, `driver_documents`, `driver_reservation_assignments`, `documents`, `settings`, `audit_logs`, `activity_logs`

**Number sequence table:**

```
number_sequences
 - id             UUID PK
 - company_id     UUID NOT NULL FK → companies
 - agency_id      UUID NULL FK → agencies
 - sequence_key   TEXT NOT NULL     -- 'reservation', 'invoice', 'contract', etc.
 - period_key     TEXT NOT NULL     -- '2025', '2025-Q1', or 'all-time'
 - last_value     BIGINT NOT NULL DEFAULT 0
 - prefix         TEXT NOT NULL     -- company/agency configurable
 UNIQUE (company_id, agency_id, sequence_key, period_key)
```

Each sequence increment is a `SELECT ... FOR UPDATE` on the sequence row, followed by an `UPDATE last_value = last_value + 1`. This guarantees gapless, ordered numbers within a period.

---

## 7. Global Settings Ownership

Every configuration value belongs to exactly one scope. The rule is: assign the setting to the most specific scope where it is operationally meaningful. A value that all agencies must share is company-level. A value that varies per branch is agency-level. A value that applies globally regardless of tenant is platform-level.

Resolution order: **agency setting → company setting → platform default**

| Setting Key | Scope | Owner | Reason |
|---|---|---|---|
| `currency` | Agency | Agency | Moroccan agencies use MAD; a future Spanish agency uses EUR. Currency is per-branch. |
| `timezone` | Agency | Agency | An agency in Casablanca uses `Africa/Casablanca`. One in Paris uses `Europe/Paris`. |
| `language` | Agency | Agency | Customer-facing communications use the language of the branch location. |
| `date_format` | Agency | Agency | Date display preference varies by region and agent. |
| `tax_rate` | Agency | Agency | VAT rate may differ by region or entity type. |
| `tax_number` | Company | Company | One legal tax registration per company, not per branch. |
| `invoice_prefix` | Agency | Agency | Each agency issues invoices under its own identifier (`INV-AGA-`, `INV-RAB-`). |
| `invoice_due_days` | Company | Company | Default payment terms set by the company. Agency overrides possible. |
| `reservation_prefix` | Company | Company | Reservation numbering is company-wide for tracking. |
| `contract_prefix` | Company | Company | Same reasoning as reservation prefix. |
| `default_deposit_amount` | Agency | Agency | Deposit policy varies by vehicle category and market. |
| `deposit_policy` | Agency | Agency | Some agencies take deposits on all rentals; others only for specific categories. |
| `late_fee_per_day` | Agency | Agency | Late return penalty varies by market. |
| `late_fee_currency` | Agency | Agency | Follows the agency's operational currency. |
| `fuel_policy` | Agency | Agency | Full-to-full vs. full-to-empty varies by agency. |
| `business_hours_open` | Agency | Agency | Operating hours are branch-specific. |
| `business_hours_close` | Agency | Agency | Same. |
| `business_days` | Agency | Agency | Some branches operate 7 days; others close on Sunday. |
| `default_pickup_location` | Agency | Agency | Physical address of the branch. |
| `max_advance_booking_days` | Agency | Agency | Some agencies accept bookings 6 months out; others 30 days. |
| `min_rental_days` | Agency | Agency | Minimum rental duration by branch policy. |
| `max_active_reservations_alert` | Agency | Agency | Alert threshold for fleet utilization. |
| `contract_default_template_id` | Agency | Agency | Which template is pre-selected when creating a new contract. |
| `driver_default_pricing_model` | Agency | Agency | Default pricing model (`monthly`, `hourly`, `mission`) when onboarding a new driver. |
| `driver_payment_currency` | Agency | Agency | Currency used for driver compensation. Follows the agency's operational currency. |

**Platform defaults** (used when neither company nor agency has set a value):

| Key | Default Value |
|---|---|
| `currency` | `MAD` |
| `language` | `fr` |
| `date_format` | `DD/MM/YYYY` |
| `invoice_due_days` | `30` |
| `late_fee_per_day` | `200` |
| `fuel_policy` | `full_to_full` |
| `min_rental_days` | `1` |
| `max_advance_booking_days` | `365` |

---

## 8. Event Sources

Every table that emits a domain event when a meaningful state change occurs. Events drive `activity_logs`, notifications (Phase 2), webhooks (Phase 3), and automation rules.

Events follow the convention: `EntityNameVerbPast`. They are strings, not DB rows.

---

### Multi-Tenant Events

| Source Table | Event | Trigger |
|---|---|---|
| `companies` | `CompanyCreated` | New tenant signs up |
| `companies` | `CompanyDeactivated` | Account closed |
| `agencies` | `AgencyCreated` | New branch added |
| `agencies` | `AgencyDeactivated` | Branch closed |

---

### Identity Events

| Source Table | Event | Trigger |
|---|---|---|
| `invitations` | `InvitationSent` | Admin invites a new member |
| `invitations` | `InvitationAccepted` | Invited user completes signup |
| `invitations` | `InvitationExpired` | Background job marks invitation stale |
| `company_memberships` | `MemberAdded` | User joins a company |
| `agency_memberships` | `MemberAssignedToAgency` | User assigned to a branch |
| `agency_memberships` | `MemberRemovedFromAgency` | User removed from a branch |
| `roles` | `RoleCreated` | Admin creates a new role |
| `roles` | `RolePermissionsUpdated` | Admin changes what a role can do |

---

### Subscription Events

| Source Table | Event | Trigger |
|---|---|---|
| `companies` (plan_id) | `SubscriptionPlanChanged` | Company upgrades or downgrades |
| `plan_limits` | `UsageLimitApproaching` | Usage reaches 80% of a plan limit |
| `plan_limits` | `UsageLimitReached` | Usage hits 100% of a plan limit |

---

### Fleet Events

| Source Table | Event | Trigger |
|---|---|---|
| `vehicles` | `VehicleAdded` | New vehicle registered in fleet |
| `vehicles` | `VehicleDeactivated` | Vehicle retired from fleet |
| `vehicle_insurances` | `VehicleInsuranceExpiringSoon` | Expiry within alert threshold |
| `vehicle_insurances` | `VehicleInsuranceExpired` | Expiry date has passed |
| `vehicle_registrations` | `VehicleRegistrationExpiringSoon` | Expiry within alert threshold |
| `vehicle_inspections` | `VehicleInspectionExpiringSoon` | Expiry within alert threshold |
| `vehicle_vignettes` | `VehicleVignetteExpiringSoon` | Expiry within alert threshold |
| `vehicle_maintenances` | `VehicleMaintenanceStarted` | Maintenance record opened |
| `vehicle_maintenances` | `VehicleMaintenanceCompleted` | Maintenance record closed |
| `vehicle_availability_blocks` | `VehicleBlockedManually` | Agent adds unavailability window |

---

### Customer Events

| Source Table | Event | Trigger |
|---|---|---|
| `customers` | `CustomerCreated` | New customer onboarded |
| `customers` | `CustomerTypeSet` | Customer typed as `individual` or `company` at creation |
| `customer_businesses` | `CustomerBusinessUpdated` | Company name, tax number, or registration updated |
| `customer_documents` | `CustomerDocumentExpiringSoon` | Document expiry within alert threshold |
| `customer_documents` | `CustomerDocumentExpired` | Document expiry date has passed |
| `customer_blacklist` | `CustomerBlacklisted` | Customer added to blacklist |
| `customer_blacklist` | `CustomerBlacklistLifted` | Blacklist entry resolved |

---

### Reservation Events

| Source Table | Event | Trigger |
|---|---|---|
| `reservations` | `ReservationCreated` | New request submitted |
| `reservations` | `ReservationConfirmed` | Agent confirms the booking |
| `reservations` | `ReservationPickedUp` | Vehicle handed to customer |
| `reservations` | `ReservationReturned` | Vehicle returned by customer |
| `reservations` | `ReservationCompleted` | All financial obligations settled |
| `reservations` | `ReservationCancelled` | Reservation cancelled by any party |
| `reservations` | `ReservationOverdueReturn` | Return date has passed without return |
| `reservation_pricing_snapshots` | `PricingSnapshotLocked` | Price confirmed and frozen |
| `reservation_pricing_snapshots` | `PricingSnapshotAdjusted` | Agent creates a price adjustment |

---

### Contract Events

| Source Table | Event | Trigger |
|---|---|---|
| `contracts` | `ContractGenerated` | Contract created at pickup |
| `contracts` | `ContractSignedByCustomer` | Customer signature captured |
| `contracts` | `ContractSignedByAgent` | Agent countersignature captured |
| `contracts` | `ContractCompleted` | Return inspection completed |
| `contract_inspection_items` | `DamageRecordedAtPickup` | Damage noted on pickup checklist |
| `contract_inspection_items` | `DamageRecordedAtReturn` | New damage noted on return checklist |

---

### Finance Events

| Source Table | Event | Trigger |
|---|---|---|
| `invoices` | `InvoiceGenerated` | Invoice created for a reservation (status: `draft`) |
| `invoices` | `InvoiceIssued` | Invoice formally issued to customer (status: `issued`) |
| `invoices` | `InvoicePartiallyPaid` | First payment received but total not yet met |
| `invoices` | `InvoiceOverdue` | Invoice past due date without full payment |
| `invoices` | `InvoicePaid` | Invoice fully settled |
| `invoices` | `InvoiceVoided` | Invoice cancelled via a credit note |
| `payments` | `PaymentRecorded` | Agent records a payment received |
| `payments` | `PaymentReversed` | A payment is reversed or refunded |
| `deposits` | `DepositCollected` | Deposit payment recorded |
| `deposits` | `DepositReleased` | Deposit returned to customer |
| `deposits` | `DepositForfeited` | Deposit retained due to damage |
| `credit_notes` | `CreditNoteIssued` | A correction to an invoice is issued |
| `expenses` | `ExpenseRecorded` | Operational cost recorded |
| `driver_payments` | `DriverPaymentRecorded` | Compensation payment recorded for a driver |

---

### Driver Events

| Source Table | Event | Trigger |
|---|---|---|
| `drivers` | `DriverCreated` | New driver onboarded to an agency |
| `drivers` | `DriverDeactivated` | Driver account deactivated |
| `driver_pricing_rules` | `DriverPricingModelUpdated` | A new pricing rule becomes active for the driver |
| `driver_documents` | `DriverDocumentExpiringSoon` | Driver license or ID expiry within alert threshold |
| `driver_documents` | `DriverDocumentExpired` | Driver document expiry date has passed |
| `driver_payments` | `DriverPaymentRecorded` | Compensation recorded for a driver |
| `driver_reservation_assignments` | `DriverAssignedToReservation` | Driver assigned as primary or additional driver |
| `driver_reservation_assignments` | `DriverUnassignedFromReservation` | Driver removed from a reservation |

---

## 9. File Ownership

Every file type that the system stores, where it lives, who owns it, and what happens to it over time.

| File Type | Owner Entity | Storage | Lifetime | Delete Behavior |
|---|---|---|---|---|
| **Vehicle photos** | `vehicles` | Object storage (Vercel Blob / S3) | Life of the vehicle record | Soft-delete the `documents` row. File purged from storage by a background job after 7-day retention window post soft-delete. |
| **Customer driving license scan** | `customer_documents` | Object storage — private bucket | Life of the customer relationship. Minimum 5 years for KYC compliance. | Soft-delete the `documents` row. File is legally retained for 5 years minimum before purge. |
| **Customer passport scan** | `customer_documents` | Object storage — private bucket | Same as driving license | Same as driving license. |
| **Contract PDF (generated)** | `contracts` | Object storage — private bucket, immutable path | Forever — legal document | Never deleted. Not even after company closure. The object storage path is preserved in `contracts.rendered_pdf_url`. |
| **Contract signed PDF** | `contracts` | Object storage — private bucket, immutable path | Forever | Never deleted. |
| **Invoice PDF** | `invoices.document_url` | Object storage — private bucket | Forever — accounting document | Never deleted. |
| **Credit note PDF** | `credit_notes` | Object storage — private bucket | Forever | Never deleted. |
| **Vehicle insurance certificate** | `vehicle_insurances` | Object storage | Life of the insurance policy + 5 years | Soft-delete `documents` row. File purged after 5-year retention from policy end. |
| **Vehicle registration document** | `vehicle_registrations` | Object storage | Life of registration period + 5 years | Same as insurance. |
| **Technical inspection certificate** | `vehicle_inspections` | Object storage | Life of inspection validity + 5 years | Same as insurance. |
| **Maintenance receipt / invoice** | `vehicle_maintenances` | Object storage | Life of vehicle + 5 years | Soft-delete `documents` row. File retained with vehicle history. |
| **Expense receipt** | `expenses` | Object storage | 7 years (tax law minimum) | Soft-delete `documents` row. File retained in cold storage for 7 years. |
| **Agency logo** | `agencies` | Object storage — public CDN | Life of agency | Replace on update (old file purged after 30 days). |
| **Company logo** | `companies` | Object storage — public CDN | Life of company | Same as agency logo. |
| **Pickup inspection photos** | `contract_inspection_items` | Object storage — private bucket | Life of contract + 5 years | Soft-delete `documents` row. File retained. |
| **Return inspection photos** | `contract_inspection_items` | Object storage — private bucket | Life of contract + 5 years | Same. |
| **Driver driving license scan** | `driver_documents` | Object storage — private bucket | Life of driver relationship. Minimum 5 years for compliance. | Soft-delete the `documents` row. File legally retained for 5 years minimum before purge. |
| **Driver national ID scan** | `driver_documents` | Object storage — private bucket | Same as driving license | Same. |
| **Driver employment contract** | `driver_documents` | Object storage — private bucket | Life of employment + 5 years | Soft-delete `documents` row. File retained for legal compliance. |

**Storage rules that apply to all files:**

1. File metadata (name, size, MIME type, URL, `entity_type`, `entity_id`) is always stored in the `documents` table. Never in the owning entity's table itself.
2. The URL stored in `documents.storage_url` is always the permanent, internal storage path — not a signed URL. Signed URLs are generated per-request at the application layer.
3. Files are never stored inline (base64 in DB columns). The database stores only metadata.
4. Bucket structure: `{company_id}/{agency_id}/{entity_type}/{entity_id}/{filename}`. This makes per-tenant data isolation and future GDPR deletion requests trivial.

---

## 10. Index Strategy

Without writing SQL. Every field below must have an index, and the type and reason are specified.

---

### Universal indexes (apply to every business table)

| Column | Index Type | Reason |
|---|---|---|
| `company_id` | B-tree | First filter on every query. Missing this index means full table scans on multi-tenant reads. |
| `agency_id` | B-tree | Second filter on most operational queries. |
| `deleted_at` | Partial B-tree (`WHERE deleted_at IS NULL`) | All application queries filter by soft delete. A partial index on non-deleted rows avoids index bloat from deleted records. |
| `created_at` | B-tree | Ordering and date range filters on lists. |

---

### Identity Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `users` | `email` | Unique B-tree | Login lookup. Must be globally unique. |
| `users` | `phone` | B-tree (sparse) | Phone-based search. |
| `company_memberships` | `(user_id, company_id)` | Unique B-tree | One membership per user per company. |
| `agency_memberships` | `(user_id, agency_id)` | Unique B-tree | One membership per user per agency. |
| `agency_memberships` | `is_primary` | Partial unique (`WHERE is_primary = true`) | Only one primary agency per user. |
| `invitations` | `email` | B-tree | Look up pending invitations by email on signup. |
| `invitations` | `token` | Unique B-tree | Accept-invitation flow looks up by token. |
| `invitations` | `expires_at` | B-tree | Background job finds expired invitations. |

---

### Subscription Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `plan_limits` | `(plan_id, key)` | Unique B-tree | Single limit lookup at feature-check time. |
| `plan_features` | `(plan_id, key)` | Unique B-tree | Same — feature flag lookup. |

---

### Fleet Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `vehicles` | `plate` | Unique B-tree (per company) — `UNIQUE(company_id, plate)` | Plate is the primary field agents search on. Must be unique per company. |
| `vehicles` | `status` | B-tree | Filter available vehicles for a date range. |
| `vehicles` | `category_id` | B-tree | Filter vehicles by category. |
| `vehicle_insurances` | `(vehicle_id, expires_at)` | B-tree | Alert job scans for expiring policies by vehicle. |
| `vehicle_registrations` | `(vehicle_id, expires_at)` | B-tree | Same pattern. |
| `vehicle_inspections` | `(vehicle_id, expires_at)` | B-tree | Same pattern. |
| `vehicle_vignettes` | `(vehicle_id, expires_at)` | B-tree | Same pattern. |
| `vehicle_maintenances` | `(vehicle_id, status)` | B-tree | Find in-progress maintenance for a vehicle. |
| `vehicle_mileage_logs` | `(vehicle_id, recorded_at)` | B-tree | Last known mileage query. |
| `vehicle_availability_blocks` | `(vehicle_id, start_date, end_date)` | B-tree | Availability check during reservation creation. |

---

### Customer Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `customers` | `(agency_id, status)` | B-tree | List active customers per agency. |
| `customers` | `type` | B-tree | Filter by customer type (`individual`, `company`). |
| `customer_individuals` | `full_name` | GIN trigram | Full-text search on name during reservation creation. |
| `customer_individuals` | `phone` | B-tree | Phone lookup. |
| `customer_individuals` | `email` | B-tree | Email lookup. |
| `customer_businesses` | `company_name` | GIN trigram | Full-text search on company name. |
| `customer_businesses` | `tax_number` | B-tree | Lookup by tax registration number for invoice generation. |
| `customer_contacts` | `(customer_id, type)` | B-tree | List contact methods per customer and type. |
| `customer_blacklist` | `(agency_id, customer_id, status)` | B-tree | Fast blacklist check before any reservation is created. |
| `customer_documents` | `(customer_id, type, expires_at)` | B-tree | Expiry alert job per document type. |

---

### Reservation Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `reservations` | `code` | Unique B-tree (per company) | Agents search by reservation code constantly. |
| `reservations` | `(agency_id, status)` | B-tree | Kanban and list views filter by status. |
| `reservations` | `(vehicle_id, start_date, end_date)` | B-tree | Availability conflict check. Critical hot path. |
| `reservations` | `(customer_id, status)` | B-tree | Customer reservation history. |
| `reservations` | `start_date` | B-tree | Calendar view, overdue detection. |
| `reservations` | `end_date` | B-tree | Overdue return detection. |
| `reservations` | `created_at` | B-tree | Default sort in list view. |
| `reservation_timeline_events` | `(reservation_id, created_at)` | B-tree | Timeline ordered by time. |
| `reservation_pricing_snapshots` | `(reservation_id, created_at)` | B-tree | Fetch the snapshot chain; latest by created_at. |
| `reservation_pricing_snapshots` | `reservation_id WHERE is_current = true` | Partial Unique B-tree | Exactly one current snapshot per reservation; historical rows retained. |

---

### Contract Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `contracts` | `number` | Unique B-tree (per company) | Contract number search. |
| `contracts` | `(reservation_id, version_number)` | Unique B-tree | One contract version number per reservation. |
| `contracts` | `reservation_id WHERE is_current = true AND deleted_at IS NULL` | Partial Unique B-tree | Exactly one current non-deleted contract per reservation. |
| `contracts` | `pricing_snapshot_id` | B-tree | Reconstruct the exact pricing snapshot used by a contract version. |
| `contracts` | `supersedes_contract_id` | B-tree | Traverse amendment history. |
| `contracts` | `status` | B-tree | Filter contracts by state. |
| `contract_signatures` | `(contract_id, signer_type)` | B-tree | Find whether customer/agent has signed. |

---

### Finance Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `invoices` | `number` | Unique B-tree (per company) | Invoice number lookup. |
| `invoices` | `reservation_id` | Unique B-tree | One invoice per reservation. |
| `invoices` | `(agency_id, status)` | B-tree | Outstanding invoices dashboard. |
| `invoices` | `due_date` | B-tree | Overdue detection job. |
| `invoices` | `customer_id` | B-tree | All invoices for a customer. |
| `invoices` | `customer_business_id` | B-tree (sparse) | All invoices for a company customer entity. |
| `payments` | `invoice_id` | B-tree | Payments for an invoice. Phase 1 has no `Payment.status`. |
| `payments` | `(agency_id, created_at)` | B-tree | Payment feed and reporting. |
| `deposits` | `(reservation_id, status)` | B-tree | Deposit status per reservation. |
| `expenses` | `(agency_id, date)` | B-tree | Expense reports by date range. |
| `expenses` | `(vehicle_id, date)` | B-tree | Per-vehicle cost analysis. |

---

### Driver Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `drivers` | `(agency_id, status)` | B-tree | List active drivers per agency. |
| `driver_pricing_rules` | `(driver_id, is_current)` | Partial B-tree (`WHERE is_current = true`) | Fast lookup of the active pricing rule for a driver. |
| `driver_pricing_rules` | `(driver_id, valid_from)` | B-tree | Retrieve pricing history in chronological order. |
| `driver_payments` | `(driver_id, created_at)` | B-tree | Driver payment history and reporting. |
| `driver_payments` | `reservation_id` | B-tree (sparse) | Look up payment for a specific mission-based reservation. |
| `driver_documents` | `(driver_id, type, expires_at)` | B-tree | Expiry alert job per document type. |
| `driver_reservation_assignments` | `(reservation_id, role)` | B-tree | Find primary and additional drivers for a reservation. |
| `driver_reservation_assignments` | `(driver_id, created_at)` | B-tree | Driver assignment history and workload reporting. |

---

### Documents Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `documents` | `(entity_type, entity_id)` | B-tree | The primary polymorphic lookup. Must be composite. |
| `documents` | `(company_id, deleted_at)` | Partial B-tree | Cleanup jobs and tenant-wide document queries. |

---

### Audit Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `audit_logs` | `(company_id, created_at)` | B-tree | Compliance queries filter by tenant and time range. |
| `audit_logs` | `(entity_type, entity_id)` | B-tree | "Show audit history for this reservation" query. |
| `activity_logs` | `(agency_id, created_at)` | B-tree | Activity feed queries filter by agency and time. |
| `activity_logs` | `(entity_type, entity_id)` | B-tree | Entity-specific activity timeline. |

---

### Settings Domain

| Table | Column(s) | Index Type | Reason |
|---|---|---|---|
| `settings` | `(company_id, agency_id, key)` | Unique B-tree | The resolution query: find the most specific setting for a key. |

---

## 11. Future Compatibility Review

Every domain is reviewed for latent migration traps. If a problem exists, a redesign is specified here — before Prisma.

---

### Stripe (Payment Processing)

**Domain impact:** Finance, Customers, Companies

**Potential traps:**

1. **`payments.method` as a string enum** — Stripe introduces method subtypes (card vs. SEPA vs. ACH). If `method` is a Postgres native ENUM, adding a value requires a migration. **Fix already applied:** `method` is a `TEXT` column with a CHECK constraint listing valid values. Adding a new method is a single `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT`. No data rewrite.

2. **No `stripe_customer_id` on customers** — When Stripe is added, each customer needs to be linked to a Stripe Customer object. A new nullable column `stripe_customer_id TEXT` on `customers` is an additive, non-breaking change. No redesign needed — but document the expectation that this column will be added.

3. **No `stripe_payment_intent_id` on payments** — Same: a new nullable `external_id` + `external_provider` (text) on `payments` is the future-proof pattern. One column handles Stripe, CMI, or any future processor. **Recommended addition now:** add `external_provider TEXT NULL` and `external_id TEXT NULL` to `payments` before Prisma. Adding them after production data exists is safe but requires a deploy and migration.

4. **Invoices do not have a `stripe_invoice_id`** — If Stripe's invoicing is used, the Stripe invoice must link back. Same solution: `external_provider + external_id` on `invoices`.

---

### CRM Integration (Salesforce, HubSpot)

**Domain impact:** Customers, Reservations

**Potential traps:**

1. **No external CRM ID on customers** — CRM sync requires bidirectional IDs. Add `external_crm_provider TEXT NULL` + `external_crm_id TEXT NULL` on `customers`. Already covered by the general external ID pattern.

2. **Customer deduplication** — CRM integrations will identify duplicates that the UI missed. The system must support a `merged_into_customer_id UUID NULL` column on `customers` to handle record merges without deleting either row. **Add now:** `merged_into_customer_id UUID NULL FK → customers ON DELETE RESTRICT`. The merged row is soft-deleted; the surviving row absorbs the historical reservations.

---

### Public API

**Domain impact:** All domains

**Potential traps:**

1. **UUID stability** — All external-facing IDs are UUIDs. No integer IDs are exposed. This is already correct.

2. **API versioning requires stable field names** — Once a field name is in a public API response, renaming it is a breaking change. The field names in the Prisma schema become the public API contract. Choose them carefully. Avoid abbreviations (`res_id` vs. `reservation_id`). **No schema change needed — this is a naming discipline requirement.**

3. **Rate limiting requires a consumer identity table** — An `api_keys` table will be needed. It is a new table. No existing table needs modification. The FK is `api_keys.company_id → companies`. **Deferred to Phase 3. No blocker.**

---

### Mobile App (Offline-first)

**Domain impact:** Reservations, Contracts, Fleet

**Potential traps:**

1. **Conflict resolution on offline writes** — If a mobile agent can create a reservation offline, two agents may confirm the same vehicle for overlapping dates. The conflict detection check (`reservations WHERE vehicle_id = ? AND dates overlap AND status NOT IN ('cancelled')`) is already enforced in the reservation creation flow. This is not a schema problem — it is a sync protocol problem. The schema is compatible.

2. **Large binary payloads** — Contract inspection photos uploaded from mobile. These go to object storage via the `documents` table. No changes needed.

3. **Push notification tokens** — A `device_tokens` table will be needed: `(user_id, platform, token, created_at)`. New table. No existing table changes.

---

### Accounting / Bookkeeping Integration

**Domain impact:** Finance

**Potential traps:**

1. **No chart of accounts** — Accounting software (QuickBooks, Sage, Odoo) requires every transaction to be mapped to a chart of accounts code. The `expenses` table has `expense_categories` but categories are not accounting codes. **Potential future trap:** if `expense_categories` is used as the accounting code, changing it later requires mapping all historical expenses. **Fix:** add `accounting_code TEXT NULL` to `expense_categories` now. It stays null until accounting integration is activated. No migration cost later.

2. **Invoice line items lack accounting codes** — Same issue: each line item should eventually carry a revenue account code. Add `accounting_code TEXT NULL` to `invoice_line_items`. Nullable now, populated when integration is activated.

3. **Multi-currency** — Already addressed: every monetary column is `NUMERIC(14,4)` and every monetary row has `currency_code CHAR(3)`. Accounting integrations require per-transaction currency. This is already correct.

---

### White Label

**Domain impact:** Companies, Settings, Documents

**Potential traps:**

1. **Company branding** — White-label requires per-company color palette, logo, subdomain, custom CSS. The `settings` table already handles arbitrary string values. Branding keys (`brand.primary_color`, `brand.logo_url`, `brand.subdomain`) are just new setting keys. **No schema change.**

2. **Email sender identity** — White-label email requires per-company sender name and address. These are settings keys: `email.sender_name`, `email.sender_address`. **No schema change.**

3. **Custom domain verification** — A `custom_domains` table will be needed: `(company_id, domain, verified_at, verification_token)`. New table, FK to `companies`. No existing table change.

---

### Channel Manager (Booking.com, Expedia, Airbnb)

**Domain impact:** Reservations, Fleet

**Potential traps:**

1. **`reservation_sources` is a lookup table, not hardcoded** — Channel origins (`booking_com`, `expedia`, `kayak`) are rows in `reservation_sources`. Adding a new channel is an `INSERT`. **No schema change.**

2. **External reservation IDs** — A reservation originating from Booking.com has an external ID. Add `external_source_id TEXT NULL` + `external_source_ref TEXT NULL` to `reservations`. These are nullable and additive. **Add now before Prisma to avoid a post-launch migration on a hot table.**

3. **Real-time availability sync** — Channel managers require availability calendars pushed to them. `vehicle_availability_blocks` already represents unavailability windows. A new `channel_sync_jobs` table handles the sync queue. New table, no existing changes.

---

### Marketplace (Multi-Agency Bookings)

**Domain impact:** Reservations, Customers, Finance

**Potential traps:**

1. **A reservation must be assignable between agencies** — If a customer books via the marketplace and the closest agency takes the reservation, `reservations.agency_id` is the assigned agency. Reassignment would update this FK. The current design allows this — `agency_id` is mutable on `reservations`.

2. **Commission tracking** — A marketplace introduces a platform fee. A new `reservation_commissions` table handles this: `(reservation_id, platform_fee, platform_currency, calculated_at)`. New table. FK to `reservations`. No existing changes.

3. **Customer portability** — A customer who books via the marketplace does not belong to a single agency. The current `customers.agency_id` (the creating agency) model must evolve. **Potential migration:** `customers.agency_id` becomes nullable and a new `customer_agency_relationships` table handles the many-to-many. This is a non-trivial migration on a core table. **Recommended now:** make `customers.agency_id` a "primary agency" reference rather than an ownership claim. Document this now. The actual migration is a Phase 6 concern, but naming the FK `primary_agency_id` instead of `agency_id` on `customers` communicates the intended semantics correctly from day one.

---

### AI / Analytics

**Domain impact:** All domains

**Potential traps:**

1. **No vector storage** — AI embeddings for customer profiles or reservation descriptions require vector columns or a separate vector store. Not a Phase 1 concern. No schema change needed. Future: add `embedding VECTOR(1536) NULL` to `customers` and `reservations` using the `pgvector` extension.

2. **Event sourcing** — `reservation_timeline_events` and `activity_logs` are already event logs. AI training pipelines can consume these directly. No schema change needed.

3. **Reporting aggregates** — Dashboard KPIs computed in real time will become slow at scale. A `reporting_snapshots` table with pre-computed daily aggregates per agency is the standard solution. New table. No existing changes.

---

### Driver Payroll Integration

**Domain impact:** Drivers, Finance

**Potential traps:**

1. **External payroll system IDs** — If an external payroll provider (Sage Paie, Cegid) is connected, each driver will need an `external_payroll_id TEXT NULL` column on `drivers`. This is additive and nullable. **No redesign needed — add when integration is implemented.**

2. **Tax withholding** — Some jurisdictions require income tax withholding from driver payments. `driver_payments` must eventually carry `gross_amount`, `tax_withheld_amount`, and `net_amount`. **Recommended now:** add these three columns as `NUMERIC(14,4) NULL` before Prisma. They stay null for agencies that don't withhold. Backfilling after production data exists is expensive.

3. **Cross-agency driver sharing** — Phase 1 requires `drivers.agency_id NOT NULL`. If a future phase allows an agency to borrow a driver from a sister agency within the same company, `agency_id` would need to become a "home agency" reference and a `driver_agency_assignments` table would handle temporary assignments. **Document the intent now:** name the FK `home_agency_id` on `drivers` so the semantic difference from a temporary assignment is clear from day one.

---

### Summary — Required Changes Before Prisma

The following changes are not blocking the Phase 1 build but are low-cost now and expensive after production data exists. Apply them before generating the Prisma schema:

| Change | Table | Impact |
|---|---|---|
| Add `external_provider TEXT NULL` + `external_id TEXT NULL` | `payments`, `invoices` | Enables Stripe and any future payment processor without migration |
| Add `external_source_id TEXT NULL` + `external_source_ref TEXT NULL` | `reservations` | Enables channel manager without migrating a hot table |
| Add `merged_into_customer_id UUID NULL` | `customers` | Enables CRM deduplication and customer merging |
| Rename `customers.agency_id` to `customers.primary_agency_id` | `customers` | Communicates correct semantics; prevents a confusing rename migration later |
| Add `accounting_code TEXT NULL` | `expense_categories`, `invoice_line_items` | Enables accounting integration without backfill |
| Confirm all monetary columns are `NUMERIC(14,4)` with `currency_code CHAR(3)` | `invoices`, `payments`, `deposits`, `expenses`, `reservation_pricing_snapshots` | Multi-currency and Stripe payout reconciliation cannot work without this |
| Confirm no native Postgres ENUMs exist in the schema | All tables | ENUM types cannot be tenant-scoped and cannot be removed without rewrite |
| Add `contract_template_versions` to Phase 1 | New table | Legal correctness — existing contracts must reference the exact version used |
| Add `credit_notes` to Phase 1 | New table | First invoice correction without this table forces a hack |
| Add `number_sequences` to Phase 1 | New table | Gapless human-readable numbers for reservations, invoices, contracts |
| Add `settings` to Phase 1 | New table | Runtime configuration without code deployments |
| Add `vehicle_categories` to Phase 1 | New table | Category as text on vehicles is a 10-year data quality problem |
| Add `customer_business_id UUID NULL FK → customer_businesses` to `invoices` | `invoices` | Required for legally correct invoice addressing when customer type is `company` |
| Add `customer_contacts` to Phase 1 | New table | Multiple contact methods per customer; avoids nullable columns on `customer_individuals` |
| Add Drivers domain tables to Phase 1: `drivers`, `driver_pricing_rules`, `driver_payments`, `driver_documents`, `driver_reservation_assignments` | New tables | Driver management and compensation are core operational features |
| Add `gross_amount`, `tax_withheld_amount`, `net_amount NUMERIC(14,4) NULL` to `driver_payments` | `driver_payments` | Enables tax withholding compliance without backfill migration |
| Name `drivers.agency_id` as `drivers.home_agency_id` | `drivers` | Communicates correct semantics; prevents confusing rename migration when cross-agency driver sharing is introduced |
