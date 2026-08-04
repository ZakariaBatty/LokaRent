# LokaRent — Complete Business Domain & Database Architecture Blueprint

**Version:** 3.0 — Definitive  
**Status:** Analysis Only — No Prisma, No SQL, No Migrations  
**Classification:** Official Architectural Reference  
**Scope:** Multi-Tenant SaaS Platform — Enterprise Scale

---

> **⚠️ Precedence note — read before using this document as a schema source.**
> This blueprint is the **aspirational full-system vision** (all 14 domains, including Phase 2+ scope). It intentionally uses a **broader, older taxonomy** than the buildable Phase 1 schema. For example, this document models reservations with `reservation_pricing`, `reservation_drivers`, `reservation_deposits`, `reservation_pickups`, and `reservation_returns`, whereas the canonical Phase 1 schema uses `reservation_pricing_snapshots`, `driver_reservation_assignments` (Drivers domain), folds deposits into the Finance domain (`deposits`), and folds pickup/return condition into `contract_inspection_items` + `reservation_timeline_events`.
>
> **For canonical Phase 1 table names, counts (55 tables), domain placement, enums, and cardinalities, `FINAL_DATABASE_SOURCE_OF_TRUTH.md` and `PRISMA_IMPLEMENTATION_PLAN.md` § 1 govern and supersede any conflicting detail in this document.** Do not generate the Phase 1 schema from this file.

---

## Table of Contents
    
1. [Platform Hier archy & Philosophy](#1-platform-hierarchy--philosophy)
2. [Complete Business Domain Model](#2-complete-business-domain-model)
3. [Complete Entity & Table List](#3-complete-entity--table-list)
4. [Conceptual ERD](#4-conceptual-erd)
5. [Relationship Diagram](#5-relationship-diagram)
6. [Company & Multi-Tenant Strategy](#6-company--multi-tenant-strategy)
7. [Subscription Strategy](#7-subscription-strategy)
8. [RBAC & Permissions Strategy](#8-rbac--permissions-strategy)
9. [Fleet Domain Design](#9-fleet-domain-design)
10. [Customer Domain Design](#10-customer-domain-design)
11. [Reservation Domain Design](#11-reservation-domain-design)
12. [Contract Domain Design](#12-contract-domain-design)
13. [Finance Domain Design](#13-finance-domain-design)
14. [Generic Documents Strategy](#14-generic-documents-strategy)
15. [Dynamic Settings Strategy](#15-dynamic-settings-strategy)
16. [Integration & Public API Strategy](#16-integration--public-api-strategy)
17. [Audit & Activity Strategy](#17-audit--activity-strategy)
18. [Scalability & Performance Recommendations](#18-scalability--performance-recommendations)
19. [Future Extension Strategy](#19-future-extension-strategy)
20. [Risks, Trade-offs & Architectural Improvements](#20-risks-trade-offs--architectural-improvements)

---

## 1. Platform Hierarchy & Philosophy

### Hierarchy

```
LokaRent Platform (SaaS)
└── Company (Tenant)
    ├── Subscription
    ├── Billing
    ├── Settings
    ├── Branding / White Label
    ├── API Keys
    ├── Integrations
    ├── Company Members (Users with Company Roles)
    ├── Invitations
    └── Agencies (1..N)
        ├── Teams (1..N, agency-scoped)
        ├── Agency Members (Users with Agency Roles)
        └── Business Modules
            ├── Fleet
            ├── Customers
            ├── Reservations
            ├── Contracts
            └── Finances
```

### Core Definitions

| Term | Definition |
|------|-----------|
| **Platform** | LokaRent SaaS — the product itself |
| **Company** | One paying customer (tenant). "AutoRent Morocco", "DriveEasy Algeria" |
| **Agency** | A branch of a Company. One company may have many agencies |
| **User** | A human account. A user can belong to one company and multiple agencies |
| **Workspace** | UI concept only — a navigation grouping. Never a database entity |

### Design Principles

1. **Company is the root tenant.** All business data is scoped to a `companyId` first, `agencyId` second.
2. **No Workspace table.** Workspace is a frontend routing concern only.
3. **Subscriptions belong to Companies, never Agencies.**
4. **Company Roles and Agency Roles are separate, never merged.**
5. **A user can hold multiple agency memberships within the same company.**
6. **Roles drive permissions.** Direct user overrides are the documented exception.
7. **Teams are strictly agency-scoped.** A team cannot span agencies.
8. **Vehicle identity and vehicle history are separate tables.**
9. **One generic Document table for all entity types.**
10. **Every major entity has an explicit status enum, not just `deletedAt`.**
11. **All business data uses soft delete. No hard deletes.**
12. **Audit Logs and Activity Logs are independent domains.**
13. **Feature gating is subscription-driven via feature key strings.**
14. **Settings are a key-value store, never schema columns.**

---

## 2. Complete Business Domain Model

### 14 Domains

```
Platform
  └── LokaRent global config, staff users, platform-level settings

Company
  └── The tenant unit. All data is scoped under a Company.
      └── Subscription → plans, limits, feature flags, billing
      └── Identity    → users, roles, permissions, invitations
      └── Agency      → branches, teams, memberships
      └── Settings    → key/value config store
      └── Branding    → white label, logo, colors, custom domain
      └── API         → keys, tokens, scopes, usage

Fleet
  └── Vehicle core identity + all operational history tables
  └── Insurance, maintenance, inspections, documents, expenses

CRM
  └── Customers — two types: Individual and Company
  └── Contacts, addresses, documents, notes, blacklist
  └── Company customers link to invoices as the billing entity

Reservation
  └── Full reservation lifecycle from enquiry to completion
  └── Pricing, extras, assignment, source tracking

Contract
  └── Templates, generated contracts, inspections, damage reports

Finance
  └── Payments, invoices, refunds, deposits, expenses, accounts
  └── Invoice lifecycle: draft → issued → partially_paid → paid → overdue → voided
  └── Invoices reference customer_businesses when customer type = company
  └── Driver compensation tracked via driver_payments

Notification
  └── Alerts, alert rules, notification templates, delivery logs

Document
  └── Generic document storage — one table for the entire platform

Integration
  └── External platform connections, sync jobs, webhook events

Audit
  └── Security audit log + business activity log (separate tables)
```

---

## 3. Complete Entity & Table List

### Platform Domain

| Table | Purpose |
|-------|---------|
| `platform_settings` | Global platform configuration (key/value) |
| `platform_admins` | LokaRent internal staff accounts |
| `platform_announcements` | System-wide announcements shown in the UI |

### Company Domain

| Table | Purpose |
|-------|---------|
| `companies` | Core tenant table. One row per paying customer |
| `company_settings` | Key/value settings scoped to a company |
| `company_branding` | Logo, colors, custom domain, email branding |
| `company_invitations` | Pending invitations to join a company |

### Subscription Domain

| Table | Purpose |
|-------|---------|
| `plans` | Subscription plan definitions (Starter, Pro, Business, Enterprise) |
| `plan_features` | Feature flags available per plan (featureKey + enabled) |
| `plan_limits` | Configurable limits per plan (agencies, users, vehicles, etc.) |
| `subscriptions` | A company's active subscription |
| `subscription_history` | Historical log of all subscription changes |
| `usage_snapshots` | Daily/monthly usage records per company for limit enforcement |
| `billing_customers` | Link between Company and payment processor (Stripe customer ID) |
| `billing_invoices` | Subscription billing invoices |
| `billing_payment_methods` | Stored payment methods per company |

### Identity Domain

| Table | Purpose |
|-------|---------|
| `users` | Global user accounts — one row per human across the platform |
| `company_roles` | Role definitions scoped to a company (Owner, Admin, Finance Admin) |
| `agency_roles` | Role definitions scoped to an agency (Manager, Receptionist, Driver) |
| `role_permissions` | Permissions assigned to roles |
| `company_memberships` | Link between a user and a company, with company role |
| `agency_memberships` | Link between a user and an agency, with agency role |
| `user_permission_overrides` | Exceptional per-user permission grants or revocations |
| `invitations` | Pending invitations to join a company or specific agency |
| `sessions` | Active user sessions (Better Auth or JWT refresh tokens) |
| `password_reset_tokens` | Short-lived tokens for password reset flow |

### Agency Domain

| Table | Purpose |
|-------|---------|
| `agencies` | Agency (branch) — belongs to a company |
| `agency_settings` | Key/value settings scoped to an agency (overrides company defaults) |
| `teams` | Teams within an agency |
| `team_memberships` | Users assigned to teams |

### Fleet Domain

| Table | Purpose |
|-------|---------|
| `vehicles` | Core vehicle identity (VIN, brand, model, plate, type) |
| `vehicle_insurance_policies` | Insurance policy history per vehicle |
| `vehicle_registrations` | Registration certificate history per vehicle |
| `vehicle_technical_inspections` | Technical inspection records per vehicle |
| `vehicle_vignettes` | Annual vignette / road tax records per vehicle |
| `vehicle_maintenance_records` | Maintenance and repair history |
| `vehicle_mileage_logs` | Point-in-time mileage snapshots |
| `vehicle_pricing_rules` | Pricing history (daily rate changes over time) |
| `vehicle_availability_blocks` | Manual unavailability periods |
| `vehicle_damage_reports` | Damage records linked to reservation or standalone |
| `vehicle_expenses` | Vehicle-specific expenses (fuel, tolls, parking) |

### CRM Domain

| Table | Purpose |
|-------|---------|
| `customers` | Individual (`individual`) or company (`company`) customer accounts |
| `customer_individuals` | Personal details for individual customers |
| `customer_businesses` | Legal entity details for company customers — used as billing entity on invoices |
| `customer_contacts` | Multiple contact methods per customer (phone, email, WhatsApp) |
| `customer_addresses` | Multiple addresses per customer |
| `customer_identity_documents` | License, passport, national ID with expiry tracking |
| `customer_notes` | Internal notes per customer |
| `customer_blacklist` | Blacklist entries with reason and duration |

### Reservation Domain

| Table | Purpose |
|-------|---------|
| `reservations` | Core reservation record |
| `reservation_sources` | Lookup table: dashboard, web, mobile, booking.com, etc. |
| `reservation_pricing` | Pricing snapshot at time of booking (immutable after confirm) |
| `reservation_extras` | Selected add-ons: GPS, baby seat, additional driver, insurance |
| `reservation_drivers` | Primary + additional driver assignments |
| `reservation_deposits` | Deposit/caution records |
| `reservation_pickups` | Pickup records (mileage, fuel, condition at pickup) |
| `reservation_returns` | Return records (mileage, fuel, condition at return) |
| `reservation_timeline` | Timestamped lifecycle events for audit trail |
| `reservation_cancellations` | Cancellation records with reason and refund link |

### Contract Domain

| Table | Purpose |
|-------|---------|
| `contract_templates` | Reusable contract template definitions per agency |
| `contract_template_versions` | Version history for templates |
| `contracts` | Generated contracts linked to reservations |
| `contract_vehicle_inspections` | Pre/post-rental vehicle condition inspections |
| `contract_signatures` | Digital or physical signature records |
| `contract_damage_reports` | Damage assessed at contract return |

### Finance Domain

| Table | Purpose |
|-------|---------|
| `financial_accounts` | Chart of accounts per agency |
| `payments` | Payment transactions (cash, card, transfer, etc.) |
| `invoices` | Customer invoices — references `customer_businesses` when customer type is `company` |
| `invoice_line_items` | Line items per invoice |
| `refunds` | Refund records linked to payments |
| `deposits` | Security deposit records |
| `expenses` | Operational expenses (not vehicle-specific) |
| `expense_categories` | Configurable expense category definitions |
| `taxes` | Tax rate definitions per agency/country |
| `driver_payments` | Driver compensation records (monthly salary, hourly, mission-based) |

**Invoice lifecycle:** `draft → issued → partially_paid → paid → overdue → voided`

**Invoice numbering:** `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}`. Gapless per agency per year via `number_sequences`. Credit notes follow `CN-{AGENCY_CODE}-{YEAR}-{SEQUENCE}`.

---

### Driver Domain

| Table | Purpose |
|-------|---------|
| `drivers` | Chauffeurs and drivers employed or contracted by an agency |
| `driver_pricing_rules` | Pricing model history: monthly, hourly, or mission-based |
| `driver_payments` | *(Finance-domain table, shown here for context — counted once, under Finance)* Compensation payment records with period and reservation reference |
| `driver_documents` | Driver license, national ID, and employment contract records with expiry |
| `driver_reservation_assignments` | Join table: drivers assigned to reservations with role (primary / additional) |

### Notification Domain

| Table | Purpose |
|-------|---------|
| `alert_rules` | Configurable alert triggers (e.g. "license expiring in 30 days") |
| `alerts` | Generated alert instances per agency |
| `notification_templates` | Email/SMS/push template definitions |
| `notification_logs` | Delivery log for all sent notifications |

### Document Domain

| Table | Purpose |
|-------|---------|
| `documents` | Single polymorphic document table for the entire platform |

### Integration Domain

| Table | Purpose |
|-------|---------|
| `integrations` | Available integration catalog (Stripe, Booking.com, WhatsApp…) |
| `company_integrations` | A company's connected integrations with credentials |
| `sync_jobs` | Scheduled or triggered sync jobs between LokaRent and external platforms |
| `sync_logs` | Execution logs per sync job |
| `webhook_endpoints` | Outbound webhook URLs registered by companies |
| `webhook_events` | Webhook event delivery log with retry tracking |
| `webhook_received_events` | Inbound webhook events received from external platforms |

### Public API Domain

| Table | Purpose |
|-------|---------|
| `api_keys` | Company-issued API keys with scope and expiry |
| `api_scopes` | Platform-defined permission scopes for the public API |
| `api_key_scopes` | Many-to-many: which scopes a key has been granted |
| `api_usage_logs` | Per-request usage log for rate limiting and analytics |
| `oauth_clients` | Future: registered OAuth applications |
| `oauth_tokens` | Future: issued OAuth access and refresh tokens |

### Audit Domain

| Table | Purpose |
|-------|---------|
| `audit_logs` | Security and system-level events (login, permission change, deletion) |
| `activity_logs` | Business-level timeline events (reservation created, payment received) |

---

## 4. Conceptual ERD

```
platform_admins ──── platform_settings

companies
  ├──── subscriptions ─────── plans
  │                               └── plan_features
  │                               └── plan_limits
  ├──── company_settings
  ├──── company_branding
  ├──── billing_customers ──── billing_invoices
  ├──── company_memberships ── users ── sessions
  ├──── invitations
  └──── agencies
            ├──── agency_settings
            ├──── teams ──────────── team_memberships ── users
            ├──── agency_memberships ── users
            │
            ├──── vehicles
            │       ├── vehicle_insurance_policies
            │       ├── vehicle_registrations
            │       ├── vehicle_technical_inspections
            │       ├── vehicle_vignettes
            │       ├── vehicle_maintenance_records
            │       ├── vehicle_mileage_logs
            │       ├── vehicle_pricing_rules
            │       ├── vehicle_availability_blocks
            │       ├── vehicle_damage_reports
            │       └── vehicle_expenses
            │
            ├──── customers
            │       ├── customer_contacts
            │       ├── customer_addresses
            │       ├── customer_identity_documents
            │       ├── customer_notes
            │       └── customer_blacklist
            │
            ��──── reservations
            │       ├── reservation_pricing
            │       ├── reservation_extras
            │       ├── reservation_drivers
            │       ├── reservation_deposits
            │       ├── reservation_pickups
            │       ├── reservation_returns
            │       ├── reservation_timeline
            │       └── reservation_cancellations
            │       │
            │       └──── contracts
            │               ├── contract_vehicle_inspections
            │               ├── contract_signatures
            │               └── contract_damage_reports
            │
            └──── finances
                    ├── financial_accounts
                    ├── payments
                    ├── invoices ─── invoice_line_items
                    ├── refunds
                    ├── deposits
                    └── expenses

documents ── (polymorphic → any entity above)
alerts ── alert_rules
notification_logs ── notification_templates
audit_logs
activity_logs
company_integrations ── integrations ── sync_jobs ── sync_logs
webhook_endpoints ── webhook_events
api_keys ── api_key_scopes ── api_scopes ── api_usage_logs
```

---

## 5. Relationship Diagram

### Core Multi-Tenant Spine

```
Platform
  │
  ├���─ 1:N ──► Company
  │              │
  │              ├── 1:1  ──► Subscription ──► Plan
  │              ├── 1:N  ──► CompanyMembership ──► User
  │              ├── 1:N  ──► Invitation
  │              ├── 1:1  ──► CompanyBranding
  │              ├── 1:N  ──► CompanySetting
  │              ├── 1:N  ──► ApiKey
  │              ├── 1:N  ──► CompanyIntegration
  │              └── 1:N  ──► Agency
  │                              │
  │                              ├── 1:N  ──► Team ──► TeamMembership ──► User
  │                              ├── 1:N  ──► AgencyMembership ──► User
  │                              ├── 1:N  ──► AgencySetting
  │                              ├── 1:N  ──► Vehicle
  │                              ├── 1:N  ──► Customer
  │                              ├── 1:N  ──► Reservation
  │                              └── 1:N  ──► FinancialAccount
```

### User Multi-Agency Membership

```
User
  ├── 1:1  ──► CompanyMembership (one company per user)
  │              └── CompanyRole
  │
  └── 1:N  ──► AgencyMembership (many agencies per user)
                 └── AgencyRole
```

### Reservation Core Relationships

```
Reservation
  ├── N:1 ──► Agency
  ├── N:1 ──► Customer
  ├── N:1 ──► Vehicle
  ├── N:1 ──► ReservationSource
  ├── N:1 ──► User (created by)
  ├── 1:1 ──► ReservationPricing
  ├── 1:N ──► ReservationExtra
  ├── 1:N ──► ReservationDriver
  ├── 1:N ──► ReservationDeposit
  ├── 1:1 ──► ReservationPickup
  ├── 1:1 ──► ReservationReturn
  ├── 1:N ──► ReservationTimeline
  ├── 0:1 ──► ReservationCancellation
  ├── 0:1 ──► Contract
  ├── 1:N ──► Payment
  └── 1:N ──► Invoice
```

---

## 6. Company & Multi-Tenant Strategy

### Tenancy Model: Company-Scoped with Agency Isolation

Every business table carries both `company_id` and `agency_id`.

- `company_id` enables tenant-level data isolation.
- `agency_id` enables branch-level data isolation within a tenant.

Query pattern:

```
WHERE company_id = :companyId AND agency_id = :agencyId
```

This dual-scoping allows:
- Reporting across an entire company (use only `company_id`)
- Operations scoped to one branch (use both)
- Future cross-agency transfers within the same company

### Multi-Agency Membership Model

A `User` has one global account. Memberships are separate records.

```
users            (one row per human)
  company_memberships   (1 per company — company role)
  agency_memberships    (N per user — one per agency)
```

A user can be a Manager in Casablanca and a Receptionist in Marrakech within the same Company account. The session context tracks which agency the user is currently operating in.

### Company Status Lifecycle

```
pending_verification → active → suspended → cancelled → archived
```

| Status | Description |
|--------|-------------|
| `pending_verification` | Registered, not yet email-verified |
| `active` | Normal operation |
| `suspended` | Payment failure or policy violation |
| `cancelled` | Company has cancelled subscription |
| `archived` | Data retained, access removed |

### Soft Delete

`companies.deleted_at` is set on cancellation. Data is never destroyed.

---

## 7. Subscription Strategy

### Plan Structure

```
plans
  ├── id, name, slug (starter, professional, business, enterprise)
  ├── price_monthly, price_yearly
  ├── is_active, is_public
  └── created_at

plan_limits  (1 row per limit per plan)
  ├── plan_id
  ├── limit_key       e.g. "max_agencies", "max_users", "max_vehicles"
  └── limit_value     e.g. 1, 10, 500, -1 (unlimited)

plan_features  (1 row per feature per plan)
  ├── plan_id
  ├── feature_key     e.g. "reports", "api_access", "white_label"
  └── is_enabled
```

### Limit Keys (Reference)

| Key | Description |
|-----|-------------|
| `max_agencies` | Maximum branches |
| `max_users` | Maximum team members |
| `max_vehicles` | Maximum fleet size |
| `max_monthly_reservations` | Monthly reservation volume cap |
| `max_storage_gb` | Document storage |
| `max_api_requests_month` | Monthly API request quota |
| `max_integrations` | Connected integrations |
| `max_contract_templates` | Custom contract templates |

### Feature Keys (Reference)

| Key | Starter | Professional | Business | Enterprise |
|-----|---------|-------------|----------|------------|
| `reservations` | yes | yes | yes | yes |
| `fleet` | yes | yes | yes | yes |
| `customers` | yes | yes | yes | yes |
| `contracts` | yes | yes | yes | yes |
| `basic_reports` | no | yes | yes | yes |
| `advanced_reports` | no | no | yes | yes |
| `finance` | no | yes | yes | yes |
| `multi_agency` | no | no | yes | yes |
| `teams` | no | no | yes | yes |
| `api_access` | no | no | no | yes |
| `white_label` | no | no | no | yes |
| `webhooks` | no | no | no | yes |
| `integrations` | no | no | yes | yes |
| `custom_roles` | no | no | yes | yes |
| `sso` | no | no | no | yes |

### Runtime Feature Check Pattern

```
function canUseFeature(companyId, featureKey):
  subscription = subscriptions.findByCompanyId(companyId)
  return plan_features.exists(plan_id = subscription.plan_id, feature_key = featureKey, is_enabled = true)
```

No schema changes needed to gate new features — add a row to `plan_features`.

### Subscription Status

```
trialing → active → past_due → suspended → cancelled → archived
```

### Usage Enforcement

`usage_snapshots` records daily snapshots of:
- Current agency count
- Current user count
- Current vehicle count
- Current month reservation count

Compared against `plan_limits` before any create operation.

---

## 8. RBAC & Permissions Strategy

### Two Independent Role Systems

```
Company Roles                    Agency Roles
─────────────────────            ─────────────────────
company_owner                    agency_owner
company_admin                    manager
workspace_admin                  receptionist
finance_admin                    accountant
                                 team_leader
                                 driver
                                 employee
```

Company Roles control company-level operations (billing, settings, agency creation).
Agency Roles control day-to-day business operations within one branch.

### Permission Structure

```
role_permissions
  ├── role_id
  ├── role_type         (company | agency)
  ├── permission_key    e.g. "reservations:create", "finance:read"
  └── is_granted
```

### Permission Namespace Convention

```
{domain}:{action}

reservations:create
reservations:read
reservations:update
reservations:delete
reservations:cancel
fleet:create
fleet:read
fleet:update
fleet:delete
finance:read
finance:create
finance:export
customers:read
customers:create
customers:blacklist
contracts:create
contracts:sign
reports:read
reports:export
settings:read
settings:update
workspace:manage
billing:read
billing:manage
api:manage
integrations:manage
```

### User Permission Overrides

Direct overrides are the exception, not the rule.

```
user_permission_overrides
  ├── user_id
  ├── agency_id (nullable — company-level if null)
  ├── permission_key
  ├── is_granted        (true = grant, false = revoke)
  ├── reason            (required — must document why)
  ├── granted_by        (user_id of admin who set it)
  ├── expires_at        (nullable — time-limited overrides)
  └── created_at
```

### Permission Resolution Order

```
1. Check user_permission_overrides (highest priority, explicit)
2. Check role_permissions for user's AgencyRole in current agency
3. Check role_permissions for user's CompanyRole
4. Default: deny
```

### Custom Roles

Tenants on Business/Enterprise plans can create custom role definitions. `company_roles` and `agency_roles` support an `is_system` flag — system roles cannot be deleted, custom roles can be fully configured.

---

## 9. Fleet Domain Design

### Vehicle Identity vs History

The `vehicles` table holds only the facts that rarely or never change.

```
vehicles (core identity only)
  ├── id, agency_id, company_id
  ├── vin
  ├── brand, model, year
  ├── plate
  ├── category          (economy, standard, suv, van, luxury, truck)
  ├── fuel_type          (petrol, diesel, electric, hybrid)
  ├── transmission       (manual, automatic)
  ├── color
  ├── seats
  ├── doors
  ├── status             (available, rented, maintenance, blocked, retired, sold)
  ├── acquisition_date
  ├── acquisition_price
  ├── acquisition_type   (purchased, leased, financed)
  ├── deleted_at, deleted_by
  └── timestamps
```

Everything that changes over time lives in dedicated history tables.

### Vehicle History Tables

**vehicle_insurance_policies**
```
  id, vehicle_id, company_id, agency_id
  insurer_name, policy_number
  coverage_type    (third_party, comprehensive, all_risk)
  premium_amount
  start_date, end_date
  status           (active, expired, cancelled)
  document_ref     → documents.id
  created_by, timestamps
```

**vehicle_registrations**
```
  id, vehicle_id, company_id, agency_id
  registration_number, registration_authority
  issue_date, expiry_date
  status           (active, expired, renewed)
  document_ref     → documents.id
  created_by, timestamps
```

**vehicle_technical_inspections**
```
  id, vehicle_id, company_id, agency_id
  inspection_center, result  (pass, fail, conditional)
  inspection_date, expiry_date
  mileage_at_inspection
  notes
  document_ref     → documents.id
  created_by, timestamps
```

**vehicle_vignettes**
```
  id, vehicle_id, company_id, agency_id
  year, amount, payment_date
  expiry_date, status
  receipt_ref      → documents.id
  created_by, timestamps
```

**vehicle_maintenance_records**
```
  id, vehicle_id, company_id, agency_id
  type              (oil_change, tire_rotation, brake_service, bodywork, other)
  description, workshop_name
  cost, currency
  date_in, date_out
  mileage_at_service
  status            (scheduled, in_progress, completed)
  notes
  created_by, timestamps
```

**vehicle_mileage_logs**
```
  id, vehicle_id, company_id, agency_id
  mileage, recorded_at
  source            (reservation_pickup, reservation_return, manual)
  reservation_id    (nullable)
  recorded_by, timestamps
```

**vehicle_pricing_rules**
```
  id, vehicle_id, company_id, agency_id
  daily_rate, currency
  minimum_days, deposit_amount
  valid_from, valid_until  (nullable = current)
  created_by, timestamps
```

**vehicle_availability_blocks**
```
  id, vehicle_id, company_id, agency_id
  start_date, end_date
  reason            (maintenance, reserved, personal_use, other)
  notes
  created_by, timestamps
```

### Vehicle Status Lifecycle

```
available → rented → maintenance → available
available → blocked
available → retired
retired   → sold
```

### Vehicle Availability Query Pattern

```
A vehicle is available for [startDate, endDate] if:
  - status = 'available'
  - No active reservation overlapping the requested period
  - No availability_block overlapping the requested period
```

---

## 10. Customer Domain Design

### Individual vs Company Customers

```
customers
  ├── id, agency_id, company_id
  ├── type               (individual | business)
  ├── reference_code     (CUS-2024-00001)
  ├── status             (active | inactive | blacklisted | archived)
  │
  ├── -- Individual fields
  ├── first_name, last_name
  ├── date_of_birth, gender, nationality
  │
  ├── -- Business fields
  ├── company_name, trade_name
  ├── tax_id, registration_number
  ├── contact_person_name
  │
  ├── -- Shared
  ├── email, phone, whatsapp
  ├── preferred_language
  ├── notes
  ├── total_rentals       (denormalized counter, updated async)
  ├── total_spent         (denormalized, updated async)
  ├── last_rental_at
  ├── deleted_at, deleted_by
  └── timestamps
```

### Customer Sub-Tables

**customer_contacts** — Multiple phones, emails, WhatsApp per customer
```
  id, customer_id, type (phone|email|whatsapp|fax), value, label, is_primary
```

**customer_addresses** — Multiple addresses per customer
```
  id, customer_id, type (home|work|billing|other)
  address_line_1, address_line_2, city, region, postal_code, country
  is_primary
```

**customer_identity_documents**
```
  id, customer_id, type (driving_license | national_id | passport | residence_permit)
  document_number, issued_by, issued_at, expires_at
  status           (valid | expired | suspended | revoked)
  document_ref     → documents.id
  verified_by, verified_at
```

**customer_notes**
```
  id, customer_id, agency_id, content, is_pinned
  created_by, timestamps
```

**customer_blacklist**
```
  id, customer_id, agency_id
  reason            (fraud, damage, non_payment, abusive, other)
  description
  severity          (warning | restricted | banned)
  blacklisted_at, expires_at (nullable = permanent)
  blacklisted_by, lifted_by, lifted_at
```

### Customer Status Lifecycle

```
active → blacklisted → active  (if lifted)
active → inactive
active → archived
```

---

## 11. Reservation Domain Design

### Reservation Lifecycle

```
enquiry → confirmed → active → completed
                   ↘ cancelled
```

| Status | Description |
|--------|-------------|
| `enquiry` | Request received, not yet confirmed |
| `confirmed` | Confirmed, vehicle assigned, contract pending |
| `active` | Vehicle handed over, rental in progress |
| `completed` | Vehicle returned, contract closed |
| `cancelled` | Cancelled before or during rental |
| `no_show` | Customer did not appear |

### Core Reservation Table

```
reservations
  ├── id, agency_id, company_id
  ├── reference_code         (RES-2024-00001)
  ├── status                 (enquiry | confirmed | active | completed | cancelled | no_show)
  ├── source_id              → reservation_sources.id
  ├── customer_id            → customers.id
  ├── vehicle_id             → vehicles.id
  ├── primary_driver_id      → customers.id or users.id
  ├── assigned_agent_id      → users.id (who handled this)
  ├── start_date, end_date
  ├── actual_start_at        (nullable — set at pickup)
  ├── actual_end_at          (nullable — set at return)
  ├── pickup_location, return_location
  ├── days                   (computed from dates)
  ├── urgency                (low | medium | high)
  ├── channel_reference      (external booking reference, e.g. Booking.com ID)
  ├── notes, internal_notes
  ├── deleted_at, deleted_by
  └── timestamps
```

### Reservation Sources (Lookup Table)

```
reservation_sources
  ├── id
  ├── key    (dashboard | website | mobile_app | walk_in | phone | booking_com | expedia | airbnb | public_api | other)
  ├── label  (display name)
  └── is_active
```

### Reservation Pricing (Immutable Snapshot)

```
reservation_pricing
  ├── reservation_id
  ├── currency
  ├── daily_rate
  ├── days
  ├── subtotal_rental
  ├── extras_total
  ├── discount_amount, discount_reason
  ├── tax_amount, tax_rate
  ├── total_amount
  ├── deposit_amount
  ├── advance_paid
  ├── balance_due
  └── locked_at (set when reservation is confirmed — pricing cannot change after this)
```

Pricing is snapshotted at confirmation and becomes immutable. This ensures historical accuracy even if vehicle pricing rules change later.

### Reservation Extras

```
reservation_extras
  ├── reservation_id
  ├── extra_type   (gps | baby_seat | additional_driver | insurance_upgrade | fuel_package | child_seat | roof_rack)
  ├── unit_price, quantity, total
  └── notes
```

### Reservation Timeline

```
reservation_timeline
  ├── reservation_id
  ├── event_type   (created | confirmed | vehicle_assigned | picked_up | returned | cancelled | payment_received | document_added | note_added | status_changed)
  ├── description
  ├── metadata     (JSON — additional event data)
  ├── actor_id     → users.id
  └── created_at
```

### Pickup & Return Records

```
reservation_pickups
  ├── reservation_id
  ├── pickup_at, pickup_location
  ├── mileage_out, fuel_level_out   (1-8 scale)
  ├── condition_notes
  ├── agent_id → users.id
  └── signature_ref → documents.id

reservation_returns
  ├── reservation_id
  ├── returned_at, return_location
  ├── mileage_in, fuel_level_in
  ├── condition_notes, damage_noted
  ├── late_return_fee, additional_charges
  ├── agent_id → users.id
  └── signature_ref → documents.id
```

---

## 12. Contract Domain Design

### Contract Templates

```
contract_templates
  ├── id, agency_id, company_id
  ├── name, description
  ├── language
  ├── is_default
  ├── status   (draft | active | archived)
  └── timestamps

contract_template_versions
  ├── id, template_id
  ├── version_number
  ├── content   (HTML or Markdown body of the contract)
  ├── change_notes
  ├── created_by
  └── created_at
```

### Generated Contracts

```
contracts
  ├── id, reservation_id, agency_id, company_id
  ├── template_id, template_version_id
  ├── reference_code           (CON-2024-00001)
  ├── status                   (draft | pending_signature | signed | active | closed | voided)
  ├── type                     (rental | extension | amendment)
  ├── generated_at
  ├── signed_at
  ├── voided_at, void_reason
  ├── pdf_document_ref         → documents.id (future)
  └── timestamps
```

### Vehicle Inspection (Pre & Post Rental)

```
contract_vehicle_inspections
  ├── id, contract_id, reservation_id
  ├── type                   (pre_rental | post_rental)
  ├── mileage, fuel_level
  ├── exterior_condition     (JSON: checklist of body panels)
  ├── interior_condition     (JSON: seats, dashboard, glass)
  ├── accessories_present    (JSON: spare tire, jack, manual, etc.)
  ├── general_notes
  ├── photo_refs             (array of documents.id)
  ├── agent_id → users.id
  └── inspected_at
```

### Digital Signatures

```
contract_signatures
  ├── id, contract_id
  ├── signer_type   (customer | agent | witness)
  ├── signer_ref    (customer_id or user_id)
  ├── signer_name
  ├── signature_method   (physical | digital | otp_confirmed)
  ├── ip_address, user_agent
  ├── signature_data     (base64 or reference, if digital)
  └── signed_at
```

### Contract Status Lifecycle

```
draft → pending_signature → signed → active → closed
                                           ↘ voided
```

---

## 13. Finance Domain Design

### Chart of Accounts

```
financial_accounts
  ├── id, agency_id, company_id
  ├── account_code, account_name
  ├── type   (asset | liability | revenue | expense)
  ├── parent_id (for hierarchical accounts)
  ├── is_active
  └── timestamps
```

### Payments

```
payments
  ├── id, agency_id, company_id
  ├── reservation_id (nullable — can be standalone)
  ├── customer_id
  ├── type          (advance | balance | deposit | refund | penalty | extra)
  ├── method        (cash | card | bank_transfer | cheque | online | other)
  ├── amount, currency
  ├── status        (pending | completed | failed | refunded | disputed)
  ├── reference_number
  ├── received_by   → users.id
  ├── received_at
  ├── notes
  └── timestamps
```

### Invoices

```
invoices
  ├── id, agency_id, company_id
  ├── reservation_id (nullable)
  ├── customer_id
  ├── invoice_number    (INV-2024-00001)
  ├── status            (draft | sent | paid | overdue | cancelled | void)
  ├── currency
  ├── subtotal, tax_amount, total_amount, amount_paid, amount_due
  ├── due_date, paid_at
  ├── notes, terms
  ├── pdf_document_ref  → documents.id
  └── timestamps

invoice_line_items
  ├── invoice_id
  ├── description
  ├── type   (rental | extra | deposit | penalty | discount | tax)
  ├── quantity, unit_price, total
  └── sort_order
```

### Deposits

```
deposits
  ├── id, reservation_id, agency_id, company_id
  ├── amount, currency
  ├── method
  ├── status   (held | released | partially_released | forfeited)
  ├── collected_at, released_at
  ├── release_notes
  ├── collected_by → users.id
  └── timestamps
```

### Expenses

```
expenses
  ├── id, agency_id, company_id
  ├── category_id → expense_categories.id
  ├── vehicle_id  (nullable — if vehicle-specific)
  ├── description
  ├── amount, currency
  ├── date, payment_method
  ├── reference_number
  ├── receipt_ref → documents.id
  ├── status      (pending | approved | rejected | paid)
  ├── approved_by → users.id
  ├── submitted_by → users.id
  └── timestamps

expense_categories
  ├── id, agency_id, company_id
  ├── name, icon, color
  ├── type   (operational | vehicle | administrative | marketing | other)
  └── is_active
```

---

## 14. Generic Documents Strategy

### Single Polymorphic Table

All file attachments across the entire platform use one table.

```
documents
  ├── id
  ├── company_id, agency_id
  ├── entity_type    e.g. "vehicle", "customer", "reservation", "contract", "agency", "company"
  ├── entity_id      UUID of the referenced entity
  ├── category       e.g. "insurance", "license", "inspection", "invoice", "photo", "signature", "other"
  ├── file_name, original_file_name
  ├── file_size_bytes
  ├── mime_type
  ├── storage_provider   (vercel_blob | s3 | local)
  ├── storage_url        (full URL or path)
  ├── storage_key        (provider-internal key for deletion/access)
  ├── is_public          (default false — all documents are private)
  ├── expires_at         (nullable — for time-limited access)
  ├── uploaded_by → users.id
  ├── deleted_at
  └── timestamps
```

### Entity Type Reference

| entity_type | Usage |
|------------|-------|
| `company` | Company registration docs, contracts with LokaRent |
| `agency` | Agency license, permits |
| `vehicle` | Insurance, registration, inspection, purchase receipt |
| `customer` | Driving license, national ID, passport, residence permit |
| `reservation` | Any ad-hoc attachment to a reservation |
| `contract` | Generated PDF, signed scan |
| `expense` | Receipts, invoices |
| `invoice` | PDF copies |
| `maintenance` | Repair receipts, workshop reports |

### Query Pattern

```
-- Fetch all insurance documents for a vehicle
SELECT * FROM documents
WHERE entity_type = 'vehicle'
  AND entity_id = :vehicleId
  AND category = 'insurance'
  AND deleted_at IS NULL
```

No join required. No per-domain document tables to maintain.

---

## 15. Dynamic Settings Strategy

### Three-Level Settings Hierarchy

```
platform_settings   (LokaRent defaults, applies to all)
  ↓ overridden by
company_settings    (Tenant-level defaults, applies to all their agencies)
  ↓ overridden by
agency_settings     (Branch-level, most specific)
```

### Settings Table Structure

All three tables share the same shape:

```
{scope}_settings
  ├── id
  ├── {scope}_id          (platform_id | company_id | agency_id)
  ├── key                 (namespaced string)
  ├── value               (text — JSON-serialized if complex)
  ├── value_type          (string | number | boolean | json | color | url)
  ├── is_encrypted        (for sensitive values)
  ├── updated_by
  └── timestamps
```

### Setting Key Catalog (Examples)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `general.default_currency` | string | MAD | Default currency |
| `general.timezone` | string | Africa/Casablanca | Timezone |
| `general.language` | string | fr | Interface language |
| `general.date_format` | string | DD/MM/YYYY | Date display format |
| `reservations.prefix` | string | RES | Reservation code prefix |
| `reservations.default_deposit_method` | string | cash | Default deposit method |
| `invoices.prefix` | string | INV | Invoice number prefix |
| `invoices.footer_text` | string | — | Invoice footer |
| `contracts.default_template_id` | uuid | — | Default contract template |
| `notifications.sms_enabled` | boolean | false | Enable SMS notifications |
| `notifications.email_from` | string | — | Sender email address |
| `branding.primary_color` | color | — | Brand primary color (Enterprise) |
| `branding.logo_url` | url | — | Logo URL |
| `branding.custom_domain` | string | — | Custom portal domain (Enterprise) |

### Runtime Resolution Pattern

```
function getSetting(key, agencyId):
  value = agency_settings.get(agencyId, key)
  if not value:
    value = company_settings.get(agency.companyId, key)
  if not value:
    value = platform_settings.get(key)
  return value
```

New settings are added by inserting a row into the catalog — no schema changes.

---

## 16. Integration & Public API Strategy

### Integration Architecture

```
integrations (catalog)
  ├── id, slug         (stripe, booking_com, expedia, whatsapp, twilio, resend)
  ├── name, category   (payment | booking_channel | communication | accounting)
  ├── is_active
  └── config_schema    (JSON Schema for required credentials)

company_integrations
  ├── id, company_id, integration_id
  ├── status           (pending | connected | error | disconnected)
  ├── credentials      (encrypted JSON — API keys, tokens, etc.)
  ├── settings         (JSON — integration-specific config)
  ├── connected_at, last_sync_at
  └── connected_by → users.id
```

### Sync Architecture

```
sync_jobs
  ├── id, company_id, integration_id
  ├── type        (reservations_pull | availability_push | prices_push | contacts_pull)
  ├── status      (pending | running | completed | failed)
  ├── started_at, completed_at
  ├── records_processed, records_failed
  └── triggered_by (user_id | system | webhook)

sync_logs
  ├── job_id, level   (info | warning | error)
  ├── message, context (JSON)
  └── created_at
```

### Webhook Architecture (Outbound)

```
webhook_endpoints
  ├── id, company_id
  ├── url
  ├── secret           (used to sign payloads)
  ├── events_subscribed (array of event types)
  ├── is_active
  └── timestamps

webhook_events
  ├── id, company_id, endpoint_id
  ├── event_type     (reservation.created | payment.received | contract.signed | …)
  ├── payload        (JSON)
  ├── status         (pending | delivered | failed | abandoned)
  ├── attempts, last_attempt_at
  ├── next_retry_at
  ├── http_status_code
  └── created_at
```

Webhook delivery uses exponential backoff with a maximum of 5 retries.

### Webhook Event Catalog (Initial)

```
reservation.created         reservation.confirmed
reservation.cancelled       reservation.completed
payment.received            payment.refunded
contract.created            contract.signed
customer.created            customer.blacklisted
vehicle.unavailable         vehicle.returned_to_fleet
```

### Public API Architecture

```
api_keys
  ├── id, company_id
  ├── name               (e.g. "Mobile App Key", "ERP Integration")
  ├── key_hash           (bcrypt hash — plain text shown only once at creation)
  ├── key_prefix         (lkr_live_ | lkr_test_ + first 8 chars, for display)
  ├── status             (active | revoked | expired)
  ├── last_used_at, expires_at
  ├── created_by
  └── timestamps

api_scopes  (platform-defined)
  ├── id, key            (reservations:read | vehicles:write | customers:read | ...)
  ├── description
  └── is_active

api_key_scopes
  ├── api_key_id, scope_id

api_usage_logs
  ├── api_key_id, company_id
  ├── endpoint, method, http_status
  ├── ip_address, user_agent
  ├── response_time_ms
  └── created_at
```

### Rate Limiting Strategy

Rate limits are enforced at the API gateway layer, not in the database. The database stores limits (in `plan_limits`) and usage counts (in `api_usage_logs`) for reporting and enforcement checks. Enforce limits by aggregating `api_usage_logs` per hour/day against `plan_limits`.

### Future OAuth

`oauth_clients` and `oauth_tokens` tables are reserved for future implementation. Schema is not designed today to avoid premature complexity. API key authentication is sufficient for the first release.

---

## 17. Audit & Activity Strategy

### Two Completely Separate Tables

| Concern | audit_logs | activity_logs |
|---------|-----------|---------------|
| **Audience** | Security & compliance team | Agents, managers, customers |
| **Purpose** | Who did what to which data | Business event timeline |
| **Examples** | Login failed, role changed, record deleted | Reservation confirmed, payment received |
| **Retention** | Long (5–10 years) | Medium (2 years) |
| **Volume** | Medium | High |
| **Queryable by** | Admins only | All authorized users |

### Audit Logs

```
audit_logs
  ├── id
  ├── company_id (nullable — platform events have no company)
  ├── actor_type   (user | system | api_key | webhook)
  ├── actor_id     (user_id, api_key_id, etc.)
  ├── event_type   (auth.login | auth.logout | auth.failed | user.role_changed | record.deleted | setting.changed | api_key.created | ...)
  ├── entity_type  (nullable)
  ├── entity_id    (nullable)
  ├── changes      (JSON — before/after for update events)
  ├── ip_address, user_agent
  ├── metadata     (JSON)
  └── created_at
```

### Activity Logs

```
activity_logs
  ├── id
  ├── company_id, agency_id
  ├── actor_id     → users.id
  ├── event_type   (reservation.created | reservation.confirmed | payment.received | ...)
  ├── entity_type
  ├── entity_id
  ├── description  (human-readable, localized)
  ├── metadata     (JSON — amounts, names, etc. for display without joins)
  └── created_at
```

`metadata` is denormalized intentionally so activity feeds can be rendered without database joins — critical for timeline UIs at high volume.

### Never Delete

Neither table supports `deleted_at`. Audit and activity records are append-only. Archival to cold storage (S3/Blob) after retention period.

---

## 18. Scalability & Performance Recommendations

### Indexing Strategy

**Every table must have these indexes as a minimum:**

```
-- Tenant isolation (applied to every business table)
CREATE INDEX ON {table} (company_id);
CREATE INDEX ON {table} (agency_id);
CREATE INDEX ON {table} (company_id, agency_id);

-- Soft delete filtering
CREATE INDEX ON {table} (deleted_at) WHERE deleted_at IS NULL;

-- Status filtering (very common in list queries)
CREATE INDEX ON {table} (status) WHERE deleted_at IS NULL;
```

**Domain-specific critical indexes:**

```
-- Reservation availability check (hot path)
CREATE INDEX ON reservations (vehicle_id, start_date, end_date, status);

-- Customer lookup
CREATE INDEX ON customers (agency_id, last_name, first_name);
CREATE UNIQUE INDEX ON customers (agency_id, email) WHERE deleted_at IS NULL;

-- Vehicle plate lookup
CREATE UNIQUE INDEX ON vehicles (plate, company_id) WHERE deleted_at IS NULL;

-- API usage
CREATE INDEX ON api_usage_logs (api_key_id, created_at);

-- Activity timeline
CREATE INDEX ON activity_logs (agency_id, created_at DESC);
CREATE INDEX ON activity_logs (entity_type, entity_id);

-- Document lookup
CREATE INDEX ON documents (entity_type, entity_id) WHERE deleted_at IS NULL;
```

### Partitioning Strategy

Partition by creation date for high-volume tables. Apply when a table exceeds ~50M rows.

| Table | Partition Key | Strategy |
|-------|--------------|---------|
| `reservations` | `created_at` | Range by year |
| `activity_logs` | `created_at` | Range by month |
| `api_usage_logs` | `created_at` | Range by month |
| `audit_logs` | `created_at` | Range by quarter |

### Connection Pooling

Use PgBouncer or Neon's built-in connection pooler. Never open unbounded connections from serverless functions.

### Caching Strategy

| Data | Cache Duration | Invalidate On |
|------|---------------|---------------|
| `plan_features` for a company | 5 minutes | Subscription change |
| `agency_settings` | 2 minutes | Settings update |
| `vehicle` availability calendar | 30 seconds | Reservation create/cancel |
| `user` session + role | Per session | Role change |

Use Redis (Upstash) for hot-path caches. Never cache financial or audit data.

### Read Replicas

Separate read replicas for:
- Report generation queries
- Dashboard analytics
- API read endpoints

Write queries (create, update, delete) always go to the primary.

### Archiving Strategy

After 2 years, move to an archive schema:
- `archive.reservations` (completed, cancelled)
- `archive.activity_logs`
- `archive.api_usage_logs`

Primary schema remains fast for active data. Archive schema is queryable but not indexed aggressively.

---

## 19. Future Extension Strategy

### Adding a New Business Module

The architecture supports adding new domains without modifying existing tables.

**Pattern for a new module (e.g. "Driver Management" or "Fuel Cards"):**

1. Add a new domain section with its own tables, all carrying `company_id` + `agency_id`
2. Add new `permission_key` entries to the permissions namespace
3. Add new `feature_key` entries to `plan_features`
4. Add new `event_type` entries to `activity_logs` and `webhook_events`
5. Add a new settings group to the settings key catalog
6. Attach documents via the existing `documents` table using a new `entity_type` value

No existing tables are modified. No migrations needed for existing tables.

### Planned Future Domains

| Domain | Description | Prerequisite |
|--------|-------------|-------------|
| Driver Management | Dedicated driver profiles, assignments, performance | Fleet, Reservations |
| Fuel Cards | Corporate fuel card management and expense tracking | Fleet, Finance |
| Customer Portal | Client-facing self-service portal | Customers, Reservations |
| Mobile App | Driver and receptionist mobile clients | Public API |
| Advanced Analytics | BI dashboards, custom reports, data export | All domains |
| Marketplace | Multi-agency booking channel for customers | Reservations, API |
| E-Signature | Legally binding digital signature integration | Contracts |
| Accounting Export | QuickBooks, Sage, Odoo integration | Finance |

### Feature Flag Driven Rollout

New modules are gated behind new `plan_features.feature_key` values. Roll out to:
1. Internal test companies (feature flag `is_beta = true`)
2. Enterprise plan only
3. Gradually down to lower plans

No infrastructure changes — only `plan_features` row updates.

---

## 20. Risks, Trade-offs & Architectural Improvements

### Risk 1: Polymorphic Documents at Scale
**Risk:** A single `documents` table serving 10+ entity types will grow very large. Queries without proper indexing become slow.
**Mitigation:** Compound index on `(entity_type, entity_id, deleted_at)`. Partition by `created_at` after 50M rows. Consider Vercel Blob or S3 for actual file storage — the table only stores metadata.

### Risk 2: Settings Key/Value Sprawl
**Risk:** Without governance, the settings catalog grows uncontrolled. Teams add keys without documentation.
**Mitigation:** Maintain a canonical `settings_catalog` table (key, description, value_type, default_value, is_sensitive). Every key must exist in the catalog before it can be set.

### Risk 3: Permission System Complexity
**Risk:** Two role systems (company + agency) plus overrides can become confusing for developers and produce subtle security bugs.
**Mitigation:** Centralize all permission resolution in a single `PermissionService` function. Never check permissions inline in controllers. Write exhaustive tests for edge cases (expired overrides, revoked roles).

### Risk 4: Activity Log Volume
**Risk:** High-traffic agencies generate millions of activity log rows per month.
**Mitigation:** Write activity logs asynchronously (queue, not inline). Partition by month. Archive aggressively. Never join `activity_logs` in transactional queries.

### Risk 5: Reservation Pricing Drift
**Risk:** Changing a vehicle's daily rate after a reservation is confirmed should not change the reservation's price.
**Mitigation:** `reservation_pricing` is a snapshot taken at confirmation and is immutable. The `locked_at` field enforces this at the application layer.

### Risk 6: Multi-Currency Complexity
**Risk:** Supporting multiple currencies requires storing amounts with their currency and converting for reporting.
**Mitigation:** Store `amount` + `currency` on every financial record. Build a `currency_exchange_rates` table with daily snapshots. Never store pre-converted amounts for reporting — convert at query time using the rate closest to the transaction date.

### Risk 7: Soft Delete Contamination
**Risk:** Queries that forget `WHERE deleted_at IS NULL` will return deleted records, causing subtle bugs.
**Mitigation:** Apply a database-level view or ORM middleware (Prisma global `where` filter) that adds `deleted_at IS NULL` automatically. Make all queries go through this filter by default. Override explicitly only for admin/restore operations.

### Risk 8: Webhook Delivery Reliability
**Risk:** Webhook delivery failures can cause integrations to drift out of sync without notification.
**Mitigation:** Exponential backoff (1s, 5s, 30s, 5min, 30min). After 5 failures, mark endpoint `status = 'failing'`. Email the company admin. Expose webhook delivery logs in the UI.

### Risk 9: Tenant Data Leakage
**Risk:** A query missing `company_id` could return another tenant's data.
**Mitigation:** All repository/service functions must accept and enforce `companyId` as a required parameter. Add a middleware that validates the session's `companyId` matches the requested resource's `companyId` before returning data. Write automated tests that simulate cross-tenant access and assert rejection.

### Risk 10: Schema Versioning for Contract Templates
**Risk:** An agency modifies a contract template after contracts have already been generated using an older version. Historical contracts must remain accurate.
**Mitigation:** `contract_template_versions` stores every version. Generated `contracts` reference both `template_id` and `template_version_id`. The contract content is never re-fetched from the live template — it is read from the version that was current at signing time.

### Risk 11: API Key Security
**Risk:** Plain text API keys stored in the database are a serious security breach if the DB is compromised.
**Mitigation:** Store only `key_hash` (bcrypt). Show the plain text key exactly once at creation (never store it). Display only the `key_prefix` thereafter. Treat API keys like passwords.

### Risk 12: Time Zone Handling
**Risk:** A company with agencies in multiple time zones (future international expansion) will produce inconsistent date-based reports.
**Mitigation:** Store all timestamps as UTC in the database. Store `timezone` in `agency_settings`. Convert to local time only at the presentation layer. Never store local timestamps.

---

*End of LokaRent Architecture Blueprint v3.0*  
*This document is the authoritative reference for all backend implementation decisions.*
