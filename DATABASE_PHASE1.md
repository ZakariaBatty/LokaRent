# LokaRent — Phase 1 Database Architecture

> **Core philosophy:** Build only what is needed today. Every future feature must plug in through
> existing UUID references. We strongly prefer adding new tables over modifying existing ones.
> Backward compatibility is a requirement.

---

## Table of Contents

1. [Phase 1 Business Domains](#1-phase-1-business-domains)
2. [Complete Phase 1 Table List](#2-complete-phase-1-table-list)
3. [Relationships](#3-relationships)
4. [Conceptual ERD](#4-conceptual-erd)
5. [Table-by-Table Explanation](#5-table-by-table-explanation)
6. [Future Modules Roadmap](#6-future-modules-roadmap)
7. [Evolution Examples](#7-evolution-examples)
8. [Architecture Review](#8-architecture-review)

---

## 1. Phase 1 Business Domains

Thirteen domains.

| # | Domain | What it owns |
|---|---|---|
| 1 | **Multi-Tenant** | Company and Agency records. The scoping boundary for every other table. |
| 2 | **Identity** | Users, memberships, roles, permissions, overrides, invitations. |
| 3 | **Subscription** | Plan catalog, limits, feature flags. No billing provider yet. |
| 4 | **Fleet** | Vehicle registry and all operational history tables. |
| 5 | **Customers** | Individual and business renters. |
| 6 | **Reservations** | Full rental lifecycle from enquiry to return. |
| 7 | **Contracts** | Rental agreements, template versions, inspections, signatures. |
| 8 | **Finance** | Payments, invoices, deposits, expenses, driver compensation. |
| 9 | **Drivers** | Driver records, pricing rules, documents, reservation assignments. |
| 10 | **Documents** | One generic attachment system for all domains. |
| 11 | **Audit** | Immutable audit trail and human-readable activity feed. |
| 12 | **Settings** | Typed company/agency configuration key/values. |
| 13 | **Utility** | Gapless number sequence counters. |

**Not a domain:** Workspace. It is a UI routing concept only and has zero presence in the database.

---

## 2. Complete Phase 1 Table List

**55 tables (canonical).** Every one is challenged individually in Section 8. The earlier "59" figure double-counted `driver_payments` (listed under both Finance and Drivers) and counted several lookup/utility tables inconsistently; the "54" figure omitted `contract_template_versions`. The authoritative count is **55 models = 55 tables** — see `PRISMA_IMPLEMENTATION_PLAN.md` § 10.5.

> **Changes from the original 52-table scope:** +1 `customer_contacts`, `driver_payments` placed in Finance (its single home), +4 Drivers domain (`drivers`, `driver_pricing_rules`, `driver_documents`, `driver_reservation_assignments`), +1 `contract_template_versions` (Phase 1 blocking dependency per `DATABASE_FINAL_REVIEW.md`), `invoices` updated to reference `customer_businesses` for company billing.

### Multi-Tenant (2)
| Table | Purpose |
|---|---|
| `companies` | Tenant root. Owns everything. |
| `agencies` | Operational branch of a company. Fleet, customers, reservations live here. |

### Identity (8)
| Table | Purpose |
|---|---|
| `users` | Platform-level identity. One record per human. |
| `company_memberships` | Links a user to a company with a company-level role. |
| `agency_memberships` | Links a user to a specific agency with an agency-level role. |
| `roles` | Named role presets. Scoped to a company. |
| `permissions` | Flat registry of all grantable actions. Seeded at deploy time. |
| `role_permissions` | Which permissions each role grants. |
| `user_permission_overrides` | Per-user permission exceptions (grant/revoke). Not the normal auth path. |
| `invitations` | Pending invitations before a user accepts. |

### Subscription (3)
| Table | Purpose |
|---|---|
| `plans` | Plan catalog. Managed by the platform. |
| `plan_limits` | Integer limits per plan per key. `-1` = unlimited. |
| `plan_features` | Boolean feature flags per plan per key. |

### Fleet (9)
| Table | Purpose |
|---|---|
| `vehicle_categories` | Vehicle class/segment lookup. Seeded per company at signup, tenant-customizable. |
| `vehicles` | Core vehicle identity only. Does not change frequently. |
| `vehicle_registrations` | Registration document history. One row per period. |
| `vehicle_insurances` | Insurance policy history. One row per policy. |
| `vehicle_inspections` | Technical inspection history. |
| `vehicle_vignettes` | Annual road tax history. |
| `vehicle_maintenances` | Maintenance and repair records. |
| `vehicle_mileage_logs` | Odometer readings at key events. Never stored on `vehicles`. |
| `vehicle_availability_blocks` | Manual unavailability windows. |

### Customers (6)
| Table | Purpose |
|---|---|
| `customers` | Core customer record. Type = `individual` or `company`. |
| `customer_individuals` | Personal details for individual customers. |
| `customer_businesses` | Legal entity details for company customers. Used as the billing entity on invoices. |
| `customer_contacts` | Multiple contact methods per customer (phone, email, WhatsApp). |
| `customer_documents` | Identity document records with expiry dates. |
| `customer_blacklist` | Auditable blacklist entries — not a boolean flag on customers. |

### Reservations (5)
| Table | Purpose |
|---|---|
| `reservation_sources` | Lookup table for reservation origin. Seeded at deploy. |
| `reservations` | The central record. One row per rental request. |
| `reservation_pricing_snapshots` | Immutable pricing locked at confirmation. |
| `reservation_extras` | Add-on items (GPS, baby seat, extra driver). |
| `reservation_timeline_events` | Append-only log of every status change and note. |

### Contracts (5)
| Table | Purpose |
|---|---|
| `contract_templates` | Reusable templates. One default per agency is enough for Phase 1. |
| `contract_template_versions` | Immutable versioned snapshot of a template body. A contract references the exact version in force at signing. **Phase 1 blocking dependency** per `DATABASE_FINAL_REVIEW.md` — required for legal integrity, cannot be backfilled later. |
| `contracts` | Contract versions/amendments for a reservation. Each row references the exact `template_version_id` and `pricing_snapshot_id` used at generation. |
| `contract_inspection_items` | Vehicle condition checklist at pickup and return. |
| `contract_signatures` | One row per signing party per event. |

### Finance (8)
| Table | Purpose |
|---|---|
| `invoices` | One invoice per reservation. References customer and optionally customer_businesses for company billing. |
| `invoice_line_items` | Auto-generated from pricing snapshot and extras. |
| `credit_notes` | Corrections/voids referencing the original invoice. Required for the `voided` invoice status. |
| `payments` | Payment records. Method agnostic. |
| `deposits` | Caution deposits with full release tracking. |
| `expense_categories` | Lookup table for expense classification. |
| `expenses` | Operational costs linked optionally to vehicles or reservations. |
| `driver_payments` | Driver compensation records (salary, hourly, or per-mission). |

### Drivers (4)
| Table | Purpose |
|---|---|
| `drivers` | Core driver record. Owned by an agency (`home_agency_id`). |
| `driver_pricing_rules` | Pricing model history per driver (monthly, hourly, mission-based). |
| `driver_documents` | License, ID, and contract documents with expiry tracking. |
| `driver_reservation_assignments` | Join table linking drivers to reservations with `role` (primary / additional). |

> `driver_payments` is a Finance-domain table (compensation records). It is **not** counted here to avoid double-counting — see Finance above.

### Documents (1)
| Table | Purpose |
|---|---|
| `documents` | Polymorphic. Handles file attachments for all entities. |

### Audit (2)
| Table | Purpose |
|---|---|
| `audit_logs` | Immutable compliance trail. Before/after diffs. |
| `activity_logs` | Human-readable feed. Denormalized for join-free rendering. |

### Settings (1)
| Table | Purpose |
|---|---|
| `settings` | Typed key/value configuration at company-level (`agency_id IS NULL`) or agency-level. |

### Utility (1)
| Table | Purpose |
|---|---|
| `number_sequences` | Row-lock counter for gapless human-readable codes (`INV-`, `CTR-`, `RES-`, `CN-`). |

---

## 3. Relationships

### Tenant Spine

```
companies
  ├── plans               (companies.plan_id → plans.id)
  └── agencies (1..n)
        ├── agency_memberships → users
        │     └── roles → role_permissions → permissions
        ├── vehicles
        ├── customers
        ├── reservations
        ├── contracts
        └── payments / invoices / deposits / expenses
```

### User Multi-Agency Membership

```
users
  ├── company_memberships  (1 per user — company-level role)
  └── agency_memberships   (0..n — one per agency the user belongs to)
        └── roles → role_permissions → permissions
```

A user can belong to zero or many agencies within their company. Their company-level role (`company_memberships`) handles cross-agency access (e.g. an owner or accountant). Their agency-level roles (`agency_memberships`) scope their access to specific branches.

### Reservation Graph

```
reservations
  ├── customer_id              → customers
  ├── vehicle_id               → vehicles
  ├── agency_id                → agencies
  ├── source_id                → reservation_sources
  ├── reservation_pricing_snapshots   (1:n chain; one is_current=true, rest superseded)
  ├── reservation_extras              (1:n)
  ├── reservation_timeline_events     (1:n, append-only)
  └── contracts (1:n version chain; one is_current=true)
        ├── contract_inspection_items (1:n)
        ├── contract_signatures       (1:n)
        └── documents (polymorphic, entity_type = 'contract')

contracts
  └── invoices (1:1)
        ├── invoice_line_items (1:n)
        └── payments (1:n)
  └── deposits (0:1)
```

### Finance Graph

```
invoices ──── invoice_line_items
    │
    ├── customer_id → customers (always set)
    ├── customer_business_id → customer_businesses (nullable — set when type = 'company')
    └── payments (1:n, invoice_id nullable on partial/advance payments)

payments ──── deposits (when releasing a deposit, deposit_id is set)

expenses ──── expense_categories
    ├── vehicle_id? → vehicles
    └── reservation_id? → reservations

driver_payments
    ├── driver_id → drivers
    ├── driver_pricing_rule_id → driver_pricing_rules
    └── reservation_id? → reservations (mission-based payments only)
```

---

## 4. Conceptual ERD

```
╔══════════════════════════════════════════════════════════════════╗
║  PLATFORM                                                        ║
║                                                                  ║
║  plans ─── plan_limits                                           ║
║   │    └── plan_features                                         ║
║   │                                                              ║
║  companies (company_id on ALL tables below)                      ║
║   └── agencies (agency_id on most tables below)                  ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────────────────────────┐     ║
║  │ IDENTITY                                                │     ║
║  │  users                                                  │     ║
║  │   ├── company_memberships ─── roles                     │     ║
║  │   └── agency_memberships  ─── roles                     │     ║
║  │         └── role_permissions ── permissions             │     ║
║  │  invitations                                            │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────────────────────────┐     ║
║  │ FLEET                                                   │     ║
║  │  vehicles                                               │     ║
║  │   ├── vehicle_registrations                             │     ║
║  │   ├── vehicle_insurances                                │     ║
║  │   ├── vehicle_inspections                               │     ║
║  │   ├── vehicle_vignettes                                 │     ║
║  │   ├── vehicle_maintenances                              │     ║
║  │   ├── vehicle_mileage_logs                              │     ║
║  │   └── vehicle_availability_blocks                       │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────────────────────────┐     ║
║  │ CUSTOMERS                                               │     ║
║  │  customers                                              │     ║
║  │   ├── customer_individuals                              │     ║
║  │   ├── customer_businesses                               │     ║
║  │   ├── customer_contacts                                 │     ║
║  │   ├── customer_documents                                │     ║
║  │   └── customer_blacklist                                │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────────────────────────┐     ║
║  │ RESERVATIONS                                            │     ║
║  │  reservation_sources (lookup)                           │     ║
║  │  reservations                                           │     ║
║  │   ├── reservation_pricing_snapshots                     │     ║
║  │   ├── reservation_extras                                │     ║
║  │   └── reservation_timeline_events                       │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────────────────────────┐     ║
║  │ CONTRACTS                                               │     ║
║  │  contract_templates                                     │     ║
║  │   └── contract_template_versions                        │     ║
║  │  contracts (→ template_version_id)                      │     ║
║  │   ├─��� contract_inspection_items                         │     ║
║  │   └── contract_signatures                               │     ║
║  └────────────────────────────────────��────────────────────┘     ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────────────────────────┐     ║
║  │ FINANCE                                                 │     ║
║  │  invoices ─── invoice_line_items                        │     ║
║  │   └── customer_businesses (nullable FK)                 │     ║
║  │  payments                                               │     ║
║  │  deposits                                               │     ║
║  │  driver_payments                                        │     ║
║  │  expenses ─── expense_categories                        │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║         │                                                        ║
║  ┌───────┴─────────────────────────────��───────────────────┐     ║
║  │ DRIVERS                                                 │     ║
║  │  drivers (home_agency_id)                               │     ║
║  │   ├── driver_pricing_rules                              │     ║
║  │   ├── driver_documents                                  │     ║
║  │   └── driver_reservation_assignments                    │     ║
║  │  (driver_payments lives in FINANCE above)               │     ║
║  └─────────────────────────────────────────────────────────┘     ║
║                                                                  ║
║  documents  (polymorphic — attached to any entity above)         ║
║  audit_logs                                                      ║
║  activity_logs                                                   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 5. Table-by-Table Explanation

### Universal Column Contract

Every business table ships with these columns — no exceptions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. UUID v7 preferred (time-sortable, index-friendly). |
| `company_id` | `uuid FK` | Tenant isolation. Every query filters by this first. |
| `agency_id` | `uuid FK \| null` | Set for agency-scoped records. Null for company-level records. |
| `created_at` | `timestamptz` | Immutable. Set on insert. |
| `updated_at` | `timestamptz` | Auto-updated on every write. |
| `deleted_at` | `timestamptz \| null` | Soft delete. Business data is never hard-deleted. |
| `deleted_by` | `uuid \| null` | User who performed the soft delete. |

Status enums are defined per-table because each entity has a different lifecycle.

---

### Multi-Tenant Domain

#### `companies`

The tenant root. Owns all data beneath it. One record per customer organization.

```
companies
  id              uuid PK
  name            text NOT NULL
  slug            text UNIQUE NOT NULL        -- immutable after creation, used in URLs
  country_code    char(2) NOT NULL            -- ISO 3166-1, drives locale defaults
  timezone        text NOT NULL               -- IANA timezone string
  currency        char(3) NOT NULL            -- ISO 4217, drives financial defaults
  language        text NOT NULL DEFAULT 'fr'  -- BCP 47
  plan_id         uuid FK → plans NOT NULL
  status          enum(active, suspended, trial, cancelled) NOT NULL
  trial_ends_at   timestamptz
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid
```

**Design notes:**
- `slug` is set once and never changed. It will appear in subdomain routing (`{slug}.lokarent.com`) when white-label lands in Phase 3.
- `country_code`, `currency`, `language`, `timezone` become the defaults inherited by all agencies. Agencies can override them. Multi-country expansion is zero-cost later.
- `plan_id` is a direct FK here. A future `subscriptions` table will wrap it with billing cycle data — no column change to `companies`.

---

#### `agencies`

An operational branch within a company. Fleet, customers, and reservations belong to an agency, not directly to a company.

```
agencies
  id              uuid PK
  company_id      uuid FK → companies NOT NULL
  name            text NOT NULL
  code            text NOT NULL               -- short code e.g. "CAS", unique per company
  country_code    char(2)                     -- overrides company default
  timezone        text                        -- overrides company default
  currency        char(3)                     -- overrides company default
  phone           text
  email           text
  address         jsonb                       -- { street, city, postal_code, country }
  status          enum(active, inactive, suspended) NOT NULL
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid

  UNIQUE(company_id, code)
```

**Design notes:**
- Every business table carries both `company_id` and `agency_id`. Company-level queries filter on `company_id` alone. Agency-level queries filter on both.
- `code` is human-readable and short. It appears on printed documents and reports.

---

### Identity Domain

#### `users`

Platform-level identity. A user is not tied to an agency at this level. Memberships create that link.

```
users
  id                  uuid PK
  company_id          uuid FK → companies NOT NULL
  email               text UNIQUE NOT NULL
  email_verified_at   timestamptz
  full_name           text NOT NULL
  phone               text
  avatar_url          text
  locale              text DEFAULT 'fr'       -- overrides company default
  timezone            text
  status              enum(active, suspended, deactivated) NOT NULL
  last_login_at       timestamptz
  created_at          timestamptz
  updated_at          timestamptz
  deleted_at          timestamptz
  deleted_by          uuid
```

**Design notes:**
- No `password_hash` here. Authentication is handled by Better Auth at the application layer, which manages its own sessions and accounts tables alongside this one.
- A user belongs to exactly one company. Cross-company access is not a Phase 1 requirement.

---

#### `roles`

Named permission presets. Scoped to a company. Platform built-in roles (`owner`, `admin`, `agent`) are seeded at company creation with `is_system = true` and cannot be deleted.

```
roles
  id              uuid PK
  company_id      uuid FK → companies NOT NULL
  name            text NOT NULL
  description     text
  scope           enum(company, agency) NOT NULL   -- which membership type uses this role
  is_system       boolean DEFAULT false
  created_at      timestamptz
  updated_at      timestamptz

  UNIQUE(company_id, name, scope)
```

---

#### `permissions`

Flat registry of all grantable actions. Seeded at deploy time. Never created by users.

```
permissions
  id              uuid PK
  key             text UNIQUE NOT NULL        -- e.g. "reservations.create", "fleet.delete"
  domain          text NOT NULL               -- e.g. "reservations", "fleet", "finance"
  description     text
  created_at      timestamptz
```

**Naming convention:** `{domain}.{action}` — e.g. `reservations.create`, `fleet.edit`, `finance.view`, `finance.export`.

---

#### `role_permissions`

Many-to-many join between roles and permissions.

```
role_permissions
  id              uuid PK
  role_id         uuid FK → roles NOT NULL
  permission_key  text FK → permissions.key NOT NULL
  created_at      timestamptz

  UNIQUE(role_id, permission_key)
```

---

#### `company_memberships`

Links a user to their company-level role. One row per user. Handles access that spans all agencies (owner, billing manager, company viewer).

```
company_memberships
  id              uuid PK
  company_id      uuid FK NOT NULL
  user_id         uuid FK → users NOT NULL
  role_id         uuid FK → roles NOT NULL    -- scope must = 'company'
  status          enum(active, suspended, revoked) NOT NULL
  created_at      timestamptz
  updated_at      timestamptz

  UNIQUE(company_id, user_id)
```

---

#### `agency_memberships`

Links a user to a specific agency with an agency-level role. A user with access to three agencies has three rows.

```
agency_memberships
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK → agencies NOT NULL
  user_id         uuid FK → users NOT NULL
  role_id         uuid FK → roles NOT NULL    -- scope must = 'agency'
  is_primary      boolean DEFAULT false       -- drives default agency on login
  status          enum(active, suspended, revoked) NOT NULL
  joined_at       timestamptz
  created_at      timestamptz
  updated_at      timestamptz

  UNIQUE(agency_id, user_id)
```

---

#### `invitations`

Pending invitations before a user accepts and a membership is created.

```
invitations
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK                     -- null = company-level invitation
  email           text NOT NULL
  role_id         uuid FK → roles NOT NULL
  invited_by      uuid FK → users NOT NULL
  token_hash      text UNIQUE NOT NULL        -- never store plain token
  status          enum(pending, accepted, expired, revoked) NOT NULL
  expires_at      timestamptz NOT NULL
  accepted_at     timestamptz
  created_at      timestamptz
  updated_at      timestamptz

  UNIQUE(company_id, email)                   -- one pending invite per email per company
```

**Flow:** On accept → create `user` if new → create `company_membership` → create `agency_membership` if `agency_id` set → mark `accepted`.

---

### Subscription Domain

#### `plans`

Platform-managed plan catalog. Seeded at deploy. Never created by tenants.

```
plans
  id              uuid PK
  name            text NOT NULL               -- "starter", "pro", "enterprise"
  display_name    text NOT NULL
  is_active       boolean DEFAULT true
  created_at      timestamptz
  updated_at      timestamptz
```

---

#### `plan_limits`

One row per limit per plan. Adding a new limit never requires a schema change.

```
plan_limits
  id              uuid PK
  plan_id         uuid FK → plans NOT NULL
  limit_key       text NOT NULL
  limit_value     integer NOT NULL            -- -1 = unlimited
  created_at      timestamptz

  UNIQUE(plan_id, limit_key)
```

**Phase 1 limit key catalog:**

| `limit_key` | Starter | Pro | Enterprise |
|---|---|---|---|
| `max_agencies` | 1 | 5 | -1 |
| `max_users` | 3 | 15 | -1 |
| `max_vehicles` | 15 | 50 | -1 |
| `max_customers` | 200 | 2 000 | -1 |
| `max_reservations_per_month` | 50 | 500 | -1 |

**Runtime check:**
```sql
SELECT pl.limit_value
FROM plan_limits pl
JOIN companies c ON c.plan_id = pl.plan_id
WHERE c.id = :company_id AND pl.limit_key = 'max_vehicles';
-- Then compare against COUNT(*) FROM vehicles WHERE company_id = :company_id
```

---

#### `plan_features`

One row per feature per plan. Adding a new feature flag never requires a schema change.

```
plan_features
  id              uuid PK
  plan_id         uuid FK → plans NOT NULL
  feature_key     text NOT NULL
  created_at      timestamptz

  UNIQUE(plan_id, feature_key)
```

**Phase 1 feature key catalog:**

| `feature_key` | Starter | Pro | Enterprise |
|---|---|---|---|
| `multi_agency` | — | yes | yes |
| `custom_roles` | — | yes | yes |
| `export_pdf` | yes | yes | yes |
| `activity_log` | — | yes | yes |
| `api_access` | — | — | yes |

A feature is enabled if a row exists for `(plan_id, feature_key)`. Absence = disabled.

---

### Fleet Domain

Vehicle identity is written once. Every fact that changes over time lives in a dedicated history table.

#### `vehicles`

Core identity. The fields here rarely or never change.

```
vehicles
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  code            text NOT NULL               -- internal e.g. "VEH-001"
  plate           text NOT NULL
  vin             text
  brand           text NOT NULL
  model           text NOT NULL
  year            smallint NOT NULL
  color           text
  category        text                        -- "economy", "suv", "van", "premium"
  fuel_type       enum(petrol, diesel, electric, hybrid, lpg) NOT NULL
  transmission    enum(manual, automatic) NOT NULL
  seats           smallint
  status          enum(available, rented, maintenance, inactive, retired) NOT NULL
  notes           text
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid

  UNIQUE(company_id, plate)
  UNIQUE(company_id, code)
```

**What is NOT on `vehicles`:** current mileage, current insurance, current registration expiry, price per day. All of those live in their own tables.

---

#### `vehicle_registrations`

One row per registration document period.

```
vehicle_registrations
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  vehicle_id      uuid FK → vehicles NOT NULL
  registration_number text NOT NULL
  issued_at       date
  expires_at      date NOT NULL               -- alert fires 30 days before
  issuing_authority text
  document_url    text
  created_at      timestamptz
```

---

#### `vehicle_insurances`

One row per insurance policy.

```
vehicle_insurances
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  vehicle_id      uuid FK → vehicles NOT NULL
  provider        text NOT NULL
  policy_number   text NOT NULL
  coverage_type   enum(third_party, comprehensive, fleet)
  starts_at       date NOT NULL
  expires_at      date NOT NULL               -- alert fires 30 days before
  premium_amount  numeric(12,2)
  currency        char(3)
  document_url    text
  created_at      timestamptz
```

---

#### `vehicle_inspections`

Technical inspection (contrôle technique) history.

```
vehicle_inspections
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  vehicle_id      uuid FK → vehicles NOT NULL
  inspected_at    date NOT NULL
  expires_at      date NOT NULL               -- alert fires 30 days before
  result          enum(pass, fail, conditional) NOT NULL
  center          text
  cost            numeric(10,2)
  currency        char(3)
  document_url    text
  created_at      timestamptz
```

---

#### `vehicle_vignettes`

Annual road tax. One row per year.

```
vehicle_vignettes
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  vehicle_id      uuid FK → vehicles NOT NULL
  tax_year        smallint NOT NULL
  paid_at         date NOT NULL
  expires_at      date NOT NULL
  amount          numeric(10,2)
  currency        char(3)
  document_url    text
  created_at      timestamptz

  UNIQUE(vehicle_id, tax_year)
```

---

#### `vehicle_maintenances`

Maintenance records for a vehicle. Each record tracks a maintenance event: scheduled service, repair, inspection, etc. The `status` field tracks the maintenance lifecycle: `scheduled` → `in_progress` → `completed` or `cancelled`. Index on `(vehicle_id, status)` enables fast queries for pending/overdue maintenance per vehicle.

> **CANONICAL definition lives in `FINAL_DATABASE_SOURCE_OF_TRUTH.md` → "`vehicle_maintenances` (canonical columns)".** The two conflicting blocks that previously appeared here have been merged into that single authoritative version (keeping every field from either block: `id`, `company_id`, `agency_id`, `vehicle_id`, `status`, `type`, `performed_at`, `mileage_at_service`, `description`, `cost numeric(14,4)`, `currency_code`, `provider`, `next_due_at`, `next_due_mileage`, `recorded_by`, `created_at`, `updated_at`, with `INDEX(vehicle_id, status)`). Do not re-inline a column list here — refer to the SoT to avoid drift.

---

#### `vehicle_mileage_logs`

Every odometer reading is an immutable log entry. Never store current mileage on `vehicles`.

```
vehicle_mileage_logs
  id              uuid PK
  company_id      uuid FK NOT NULL
  vehicle_id      uuid FK → vehicles NOT NULL
  mileage         integer NOT NULL
  recorded_at     timestamptz NOT NULL
  source          enum(contract_pickup, contract_return, maintenance, manual) NOT NULL
  reference_id    uuid                        -- FK to the source record
  recorded_by     uuid FK → users
  created_at      timestamptz
```

**Query pattern for current mileage:**
```sql
SELECT mileage FROM vehicle_mileage_logs
WHERE vehicle_id = :id
ORDER BY recorded_at DESC LIMIT 1;
```

---

#### `vehicle_availability_blocks`

Manual blocks for maintenance holds, personal use, or external bookings not yet in the system.

```
vehicle_availability_blocks
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  vehicle_id      uuid FK → vehicles NOT NULL
  reason          enum(maintenance, personal_use, hold, other) NOT NULL
  starts_at       timestamptz NOT NULL
  ends_at         timestamptz NOT NULL
  reservation_id  uuid FK → reservations      -- set when reason = hold
  notes           text
  created_by      uuid FK → users
  created_at      timestamptz
  updated_at      timestamptz
```

---

### Customers Domain

#### `customers`

The core record. `type` determines which sub-table is populated.

```
customers
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  code            text NOT NULL               -- "CLI-0001"
  type            enum(individual, company) NOT NULL
  email           text
  phone           text
  city            text
  status          enum(active, inactive, blacklisted) NOT NULL
  notes           text
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid

  UNIQUE(company_id, code)
```

---

#### `customer_individuals`

Personal details. One row per customer where `type = individual`.

```
customer_individuals
  id                          uuid PK
  customer_id                 uuid FK → customers UNIQUE NOT NULL
  company_id                  uuid FK NOT NULL
  first_name                  text NOT NULL
  last_name                   text NOT NULL
  date_of_birth               date
  nationality                 char(2)
  driving_license_number      text
  driving_license_expires_at  date            -- alert fires 30 days before
  driving_license_country     char(2)
  cin_number                  text
  cin_expires_at              date
  created_at                  timestamptz
  updated_at                  timestamptz
```

---

#### `customer_businesses`

Business details. One row per customer where `type = company`.

```
customer_businesses
  id                      uuid PK
  customer_id             uuid FK → customers UNIQUE NOT NULL
  company_id              uuid FK NOT NULL
  company_name            text NOT NULL
  registration_number     text
  tax_id                  text
  contact_person_name     text
  contact_person_phone    text
  created_at              timestamptz
  updated_at              timestamptz
```

---

#### `customer_documents`

Identity document scans with expiry tracking.

```
customer_documents
  id              uuid PK
  company_id      uuid FK NOT NULL
  customer_id     uuid FK → customers NOT NULL
  type            enum(passport, national_id, driving_license, residence_permit) NOT NULL
  document_number text NOT NULL
  issued_at       date
  expires_at      date
  issuing_country char(2)
  document_url    text
  created_at      timestamptz
  updated_at      timestamptz
```

---

#### `customer_blacklist`

Blacklist is an auditable record, not a boolean flag. Knowing who was blacklisted, when, why, and by whom is a compliance requirement.

```
customer_blacklist
  id              uuid PK
  company_id      uuid FK NOT NULL
  customer_id     uuid FK → customers NOT NULL
  reason          text NOT NULL               -- mandatory
  severity        enum(warning, blocked, permanent) NOT NULL
  added_by        uuid FK → users NOT NULL
  lifted_at       timestamptz
  lifted_by       uuid FK → users
  lift_reason     text
  created_at      timestamptz
```

---

### Reservations Domain

#### `reservation_sources`

Lookup table. Seeded at deploy time. Adding a new channel (Booking.com, app) inserts one row — no schema change, no deployment.

| `key` | Description |
|---|---|
| `dashboard` | Created by an agent via the web app |
| `walk_in` | Customer walked in |
| `phone` | Received by phone and entered manually |
| `website` | Company website (Phase 2) |
| `booking_com` | Booking.com integration (Phase 3) |
| `expedia` | Expedia integration (Phase 3) |
| `public_api` | Public API (Phase 3) |
| `other` | Unlisted source |

```
reservation_sources
  id          uuid PK
  key         text UNIQUE NOT NULL
  label       text NOT NULL
  is_external boolean DEFAULT false   -- true = requires a channel integration
  created_at  timestamptz
```

---

#### `reservations`

The central entity. Every field that is financial is also captured in `reservation_pricing_snapshots` at confirmation.

```
reservations
  id                  uuid PK
  company_id          uuid FK NOT NULL
  agency_id           uuid FK NOT NULL
  code                text NOT NULL           -- "RES-2025-00142"
  customer_id         uuid FK → customers NOT NULL
  vehicle_id          uuid FK → vehicles NOT NULL
  source_id           uuid FK → reservation_sources NOT NULL
  assigned_agent_id   uuid FK → users

  status              enum(
                        enquiry,
                        confirmed,
                        active,
                        completed,
                        cancelled,
                        no_show
                      ) NOT NULL DEFAULT 'enquiry'

  starts_at           timestamptz NOT NULL
  ends_at             timestamptz NOT NULL
  pickup_location     text
  return_location     text

  days                smallint NOT NULL
  price_per_day       numeric(10,2) NOT NULL
  extras_total        numeric(10,2) NOT NULL DEFAULT 0
  discount_amount     numeric(10,2) NOT NULL DEFAULT 0
  discount_reason     text
  total_amount        numeric(10,2) NOT NULL
  currency            char(3) NOT NULL

  deposit_amount      numeric(10,2) NOT NULL DEFAULT 0
  advance_amount      numeric(10,2) NOT NULL DEFAULT 0

  internal_notes      text
  cancellation_reason text
  cancelled_at        timestamptz
  cancelled_by        uuid FK → users
  confirmed_at        timestamptz
  activated_at        timestamptz
  completed_at        timestamptz

  created_at          timestamptz
  updated_at          timestamptz
  deleted_at          timestamptz
  deleted_by          uuid

  UNIQUE(company_id, code)
```

---

#### `reservation_pricing_snapshots`

Each row is written once and never updated (immutable). Protects against retroactive price edits corrupting financial records. A reservation may have **multiple** snapshot rows over its lifetime: a price adjustment inserts a **new** snapshot that references the prior one via `supersedes_id`, forming a supersession chain. Exactly one row per reservation is the current snapshot (`is_current = true`); all others are historical.

```
reservation_pricing_snapshots
  id                  uuid PK
  company_id          uuid FK NOT NULL
  reservation_id      uuid FK → reservations NOT NULL      -- NOT unique: a reservation has a chain of snapshots
  supersedes_id       uuid FK → reservation_pricing_snapshots NULL  -- prior snapshot this one replaces; NULL for the first
  is_current          boolean NOT NULL DEFAULT true        -- exactly one true per reservation
  pricing_rule_id     uuid FK → vehicle_pricing_rules NULL -- resolved rate source when available
  starts_at           timestamptz NULL                     -- frozen rental start used for pricing
  ends_at             timestamptz NULL                     -- frozen rental end used for pricing
  duration_value      smallint NULL                        -- frozen duration basis
  duration_unit       text NULL                            -- e.g. day
  price_per_day       numeric(14,4) NOT NULL
  days                smallint NOT NULL
  extras_total        numeric(14,4) NOT NULL
  discount_amount     numeric(14,4) NOT NULL
  discount_reason     text NULL
  total_amount        numeric(14,4) NOT NULL
  mileage_limit       integer NULL
  extra_mileage_rate  numeric(14,4) NULL
  deposit_amount      numeric(14,4) NULL
  tax_rate            numeric(14,4) NULL              -- immutable accepted tax rate copied from agency setting at snapshot creation
  currency            char(3) NOT NULL
  locked_at           timestamptz NOT NULL
  locked_by           uuid FK → users NOT NULL

  -- Current snapshot strategy: enforced by a PARTIAL UNIQUE index
  UNIQUE(reservation_id) WHERE is_current = true
  INDEX(reservation_id, created_at)   -- fetch full chain / latest by created_at
  INDEX(pricing_rule_id)
```

**Current snapshot strategy:** Queries that need the active price filter `WHERE reservation_id = ? AND is_current = true`. When a price is adjusted: (1) insert the new snapshot with `supersedes_id` = old row id and `is_current = true`; (2) set the old row's `is_current = false`. Both steps run in one transaction. The partial unique index guarantees no two current snapshots can coexist for a reservation while still permitting the full historical chain. Note the immutability rule applies to financial columns; `is_current` is the single permitted state flag flip and is itself captured in the audit trail.

---

#### `reservation_extra_definitions`

Mutable catalog of selectable reservation extras, scoped at company level (`agency_id NULL`) or agency level. Reservation writes must copy the current label/price/currency into `reservation_extras`; browser-submitted labels and prices are not authoritative.

```
reservation_extra_definitions
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NULL
  key             text NOT NULL
  label           text NOT NULL
  description     text
  price           numeric(14,4) NOT NULL
  currency        char(3) NOT NULL
  is_active       boolean NOT NULL DEFAULT true
  sort_order      integer NOT NULL DEFAULT 0
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid

  UNIQUE(company_id, key) WHERE agency_id IS NULL AND deleted_at IS NULL
  UNIQUE(company_id, agency_id, key) WHERE agency_id IS NOT NULL AND deleted_at IS NULL
  INDEX(company_id, agency_id, is_active, sort_order)
```

---

#### `reservation_extras`

```
reservation_extras
  id              uuid PK
  company_id      uuid FK NOT NULL
  reservation_id  uuid FK → reservations NOT NULL
  definition_id   uuid FK → reservation_extra_definitions NULL
  label           text NOT NULL               -- "GPS", "Siège bébé"
  unit_price      numeric(14,4) NOT NULL
  quantity        smallint NOT NULL DEFAULT 1
  total_price     numeric(14,4) NOT NULL
  currency        char(3) NOT NULL
  created_at      timestamptz
```

Rows are immutable price snapshots for the reservation. A definition can be edited or deleted later without changing historical reservation rows.

---

#### `reservation_authorized_drivers`

Renter/customer authorized drivers for legal/contract purposes. This is separate from `driver_reservation_assignments`, which is only for internal agency chauffeurs/drivers.

```
reservation_authorized_drivers
  id                  uuid PK
  company_id          uuid FK NOT NULL
  agency_id           uuid FK NOT NULL
  reservation_id      uuid FK → reservations NOT NULL
  full_name           text NOT NULL
  license_number      text NOT NULL
  license_issued_at   date
  license_expires_at  date
  document_url        text
  created_at          timestamptz
  updated_at          timestamptz
  deleted_at          timestamptz
  deleted_by          uuid

  INDEX(reservation_id, deleted_at)
```

---

#### `reservation_timeline_events`

Append-only. Never updated or deleted.

```
reservation_timeline_events
  id              uuid PK
  company_id      uuid FK NOT NULL
  reservation_id  uuid FK → reservations NOT NULL
  event_type      text NOT NULL               -- "status_changed", "note_added", "document_uploaded"
  from_status     text
  to_status       text
  description     text
  performed_by    uuid FK → users
  created_at      timestamptz
```

---

### Contracts Domain

#### `contract_templates`

Reusable templates. One default per agency is enough for Phase 1. The template editor UI is a Phase 2 feature.

```
contract_templates
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK
  name            text NOT NULL
  version         smallint NOT NULL DEFAULT 1
  content         text NOT NULL               -- HTML body with {{placeholder}} variables
  is_default      boolean NOT NULL DEFAULT false
  is_active       boolean NOT NULL DEFAULT true
  created_at      timestamptz
  updated_at      timestamptz

  UNIQUE(company_id, agency_id) WHERE is_default = true AND deleted_at IS NULL AND agency_id IS NOT NULL
```

---

#### `contracts`

Contract version generated from a reservation. A reservation may have multiple historical contract versions/amendments; exactly one non-deleted contract is current.

```
contracts
  id                  uuid PK
  company_id          uuid FK NOT NULL
  agency_id           uuid FK NOT NULL
  code                text NOT NULL           -- "CTR-2025-00142"
  reservation_id      uuid FK → reservations NOT NULL
  pricing_snapshot_id uuid FK → reservation_pricing_snapshots NOT NULL
  supersedes_contract_id uuid FK → contracts
  version_number      smallint NOT NULL DEFAULT 1
  is_current          boolean NOT NULL DEFAULT true
  customer_id         uuid FK → customers NOT NULL
  vehicle_id          uuid FK → vehicles NOT NULL
  template_id         uuid FK → contract_templates
  status              enum(draft, active, completed, cancelled, disputed) NOT NULL
  pickup_mileage      integer NOT NULL
  return_mileage      integer
  pickup_fuel_level   smallint                -- 0–8 scale
  return_fuel_level   smallint
  pickup_at           timestamptz NOT NULL
  returned_at         timestamptz
  notes               text
  created_at          timestamptz
  updated_at          timestamptz
  deleted_at          timestamptz
  deleted_by          uuid

  UNIQUE(company_id, code)
  UNIQUE(reservation_id, version_number)
  UNIQUE(reservation_id) WHERE is_current = true AND deleted_at IS NULL
```

---

#### `contract_inspection_items`

Vehicle condition checklist at pickup and return. One row per zone per event.

```
contract_inspection_items
  id              uuid PK
  company_id      uuid FK NOT NULL
  contract_id     uuid FK → contracts NOT NULL
  event           enum(pickup, return) NOT NULL
  zone            text NOT NULL               -- "front_bumper", "windshield", "roof", "interior"
  condition       enum(ok, scratched, dented, broken, missing) NOT NULL
  notes           text
  photo_url       text
  created_at      timestamptz
```

---

#### `contract_signatures`

One row per signer per event. Supports digital signatures at pickup and return.

```
contract_signatures
  id              uuid PK
  company_id      uuid FK NOT NULL
  contract_id     uuid FK → contracts NOT NULL
  signer_type     enum(customer, agent, witness) NOT NULL
  signer_name     text NOT NULL
  event           enum(pickup, return) NOT NULL
  signed_at       timestamptz NOT NULL
  signature_data  text                        -- base64 SVG or storage URL
  ip_address      text
  created_at      timestamptz
```

---

### Finance Domain

#### `invoices`

Invoices support two Phase-1 modes: rental invoices linked to one reservation, and manual invoices independent from reservations.

```
invoices
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  code            text NOT NULL               -- "INV-{AGENCY_CODE}-2025-00142"
  type            enum(rental, manual) NOT NULL DEFAULT rental
  reservation_id  uuid FK → reservations       -- required for rental, NULL for manual
  customer_id     uuid FK → customers NOT NULL
  status          enum(draft, issued, paid, partially_paid, voided) NOT NULL
  subtotal        numeric(14,4) NOT NULL
  tax_amount      numeric(14,4) NOT NULL DEFAULT 0
  discount_amount numeric(14,4) NOT NULL DEFAULT 0
  total_amount    numeric(14,4) NOT NULL
  currency        char(3) NOT NULL
  issued_at       date
  due_at          date
  paid_at         timestamptz
  document_url    text                        -- generated invoice document/PDF URL
  notes           text
  created_at      timestamptz
  updated_at      timestamptz

  UNIQUE(company_id, code)
  UNIQUE(reservation_id)                       -- PostgreSQL permits many NULL manual invoices
  CHECK ((type = 'rental' AND reservation_id IS NOT NULL) OR (type = 'manual' AND reservation_id IS NULL))
```

---

#### `invoice_line_items`

Auto-generated from `reservation_pricing_snapshots` and `reservation_extras` when the invoice is created. Never edited manually after that.

```
invoice_line_items
  id              uuid PK
  company_id      uuid FK NOT NULL
  invoice_id      uuid FK → invoices NOT NULL
  description     text NOT NULL
  quantity        numeric(14,4) NOT NULL
  unit_price      numeric(14,4) NOT NULL
  total_price     numeric(14,4) NOT NULL
  tax_rate        numeric(14,4) NULL           -- immutable tax rate actually used for this historical line
  tax_amount      numeric(14,4) NULL           -- immutable tax amount actually applied to this historical line
  sort_order      smallint NOT NULL DEFAULT 0
  created_at      timestamptz
```

`reservation_pricing_snapshots.tax_rate` is copied from the resolved agency `tax_rate` setting when the accepted pricing snapshot is created. Existing historical rows may be `NULL` if the accepted tax rate was not previously stored. Issued invoice line items must use their own `tax_rate` and `tax_amount` snapshot and must never recalculate tax from current settings.

---

#### `payments`

Method-agnostic. Phase 2 will add a `payment_stripe_details` table that references `payments.id` — this table stays untouched.

```
payments
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  reservation_id  uuid FK → reservations NOT NULL
  invoice_id      uuid FK → invoices
  customer_id     uuid FK → customers NOT NULL
  method          enum(cash, bank_transfer, cheque, card, other) NOT NULL
  amount          numeric(12,2) NOT NULL
  currency        char(3) NOT NULL
  paid_at         timestamptz NOT NULL
  reference       text                        -- cheque number, transfer reference
  notes           text
  recorded_by     uuid FK → users NOT NULL
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid
```

---

#### `deposits`

```
deposits
  id                  uuid PK
  company_id          uuid FK NOT NULL
  agency_id           uuid FK NOT NULL
  reservation_id      uuid FK → reservations NOT NULL
  customer_id         uuid FK → customers NOT NULL
  amount              numeric(12,2) NOT NULL
  currency            char(3) NOT NULL
  method              enum(cash, cheque, card, other) NOT NULL
  collected_at        timestamptz NOT NULL
  collected_by        uuid FK → users NOT NULL
  status              enum(held, released, forfeited, partially_released) NOT NULL
  released_at         timestamptz
  released_by         uuid FK �� users
  released_amount     numeric(12,2)
  forfeiture_reason   text
  notes               text
  created_at          timestamptz
  updated_at          timestamptz
```

---

#### `expense_categories`

```
expense_categories
  id              uuid PK
  company_id      uuid FK NOT NULL
  name            text NOT NULL
  is_system       boolean DEFAULT false
  created_at      timestamptz

  UNIQUE(company_id, name)
```

---

#### `expenses`

```
expenses
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK NOT NULL
  category_id     uuid FK → expense_categories NOT NULL
  vehicle_id      uuid FK → vehicles          -- null = non-vehicle expense
  reservation_id  uuid FK → reservations      -- null = non-reservation expense
  description     text NOT NULL
  amount          numeric(14,4) NOT NULL
  currency        char(3) NOT NULL
  occurred_at     date NOT NULL
  method          enum(cash, bank_transfer, cheque, card, other)
  reference       text
  provider        text                         -- supplier/provider shown in operational expense UI
  internal_note   text                         -- private operational note
  document_url    text
  recorded_by     uuid FK → users NOT NULL
  created_at      timestamptz
  updated_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid
```

---

### Documents Domain

#### `documents`

One table handles file attachments for every entity. The owning entity stores `document_url` directly for hot-path reads. This table is the source of truth for metadata and soft-deletes.

```
documents
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK
  entity_type     text NOT NULL               -- "vehicle", "customer", "contract"
  entity_id       uuid NOT NULL
  filename        text NOT NULL
  mime_type       text
  size_bytes      integer
  storage_url     text NOT NULL               -- Vercel Blob or S3 URL
  uploaded_by     uuid FK → users NOT NULL
  created_at      timestamptz
  deleted_at      timestamptz
  deleted_by      uuid

  INDEX(entity_type, entity_id)
```

**Entity type reference:**

| `entity_type` | `entity_id` references |
|---|---|
| `vehicle_registration` | `vehicle_registrations.id` |
| `vehicle_insurance` | `vehicle_insurances.id` |
| `vehicle_inspection` | `vehicle_inspections.id` |
| `customer` | `customers.id` |
| `customer_document` | `customer_documents.id` |
| `contract` | `contracts.id` |
| `contract_inspection` | `contract_inspection_items.id` |
| `expense` | `expenses.id` |
| `reservation` | `reservations.id` |

---

### Audit Domain

#### `audit_logs`

Compliance-grade trail. One row per write operation on any business table. Append-only — never updated or deleted.

```
audit_logs
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK
  user_id         uuid FK → users
  action          text NOT NULL               -- "reservations.create", "vehicles.update"
  entity_type     text NOT NULL
  entity_id       uuid NOT NULL
  changes         jsonb                       -- { before: {...}, after: {...} }
  ip_address      text
  user_agent      text
  created_at      timestamptz

  INDEX(company_id, entity_type, entity_id)
  INDEX(company_id, user_id)
  INDEX(created_at DESC)
```

---

#### `activity_logs`

Human-readable feed. Denormalized so the UI never needs a join to render a timeline.

```
activity_logs
  id              uuid PK
  company_id      uuid FK NOT NULL
  agency_id       uuid FK
  user_id         uuid FK → users
  entity_type     text NOT NULL
  entity_id       uuid NOT NULL
  verb            text NOT NULL               -- "created reservation RES-001"
  actor_name      text NOT NULL               -- denormalized, join-free
  metadata        jsonb                       -- { code: "RES-001", customer: "Karim B." }
  created_at      timestamptz

  INDEX(company_id, entity_type, entity_id)
  INDEX(company_id, created_at DESC)
```

**Audit vs Activity:**

| | `audit_logs` | `activity_logs` |
|---|---|---|
| Audience | Compliance, debugging | Agency staff, UI timeline |
| Content | Before/after field diff | Human-readable sentence |
| Volume | High | Medium |
| Retention | Permanent | Rolling 12 months |
| Join-free | No | Yes (denormalized) |
| Mutable | Never | Never |

---

## 6. Future Modules Roadmap

### Stripe / Online Payments

**Why postponed:** Stripe requires webhooks, idempotency, refund flows, dispute management, PCI scope, and webhook signature verification. None of this is needed for cash/cheque collection today.

**Future tables (Phase 2):**
- `billing_accounts` — Stripe customer ID per company
- `subscriptions` — Stripe subscription ID, current period, status. Replaces `companies.plan_id` as the billing source of truth
- `payment_stripe_details` — joins to `payments.id`, stores `stripe_payment_intent_id`, `stripe_charge_id`
- `refunds` — linked to `payments.id`
- `disputes` — linked to `payments.id`

**Existing tables untouched:** `payments`, `invoices`, `companies`, `reservations`. Zero new columns.

Refunds remain Phase 2. In Phase 1, `credit_notes` are accounting correction documents for invoice voids/corrections and are not cash refunds. A future dedicated `refunds` table will represent money returned from a prior payment.

Financial accounts/cashboxes/bank accounts are not required in Phase 1. Payments and expenses remain operational records, not a double-entry ledger.

Because there is no FX/conversion model, Finance aggregates must not combine different currencies into one total. KPI/report queries must filter or group by `currency`.

---

### Booking.com / Channel Manager

**Why postponed:** External channel sync requires conflict resolution, availability mapping, rate parity, and a webhook ingestion pipeline. It is a product in itself.

**Future tables (Phase 3):**
- `channel_connections` — one row per connected channel per agency
- `channel_listings` — maps `vehicle_id` to an external listing ID
- `channel_reservations` — raw external payload linked to `reservations.id` after import
- `channel_sync_jobs` �� tracks import/export jobs
- `channel_sync_logs` — result of each sync

**Existing tables untouched:** `reservation_sources` already has a row with `key = 'booking_com'` ready. `reservations.source_id` needs no change.

---

### Notifications (Email / WhatsApp / SMS)

**Why postponed:** Notification routing needs provider configuration, template management, delivery tracking, and opt-out handling. The data to trigger notifications already exists in the reservation and contract tables.

**Future tables (Phase 2):**
- `notification_templates` — by type and locale
- `notification_logs` — every sent message with delivery status
- `notification_preferences` — per user or customer

**Existing tables untouched:** `customers.phone` and `customers.email` already exist.

---

### Public API / OAuth / API Keys

**Why postponed:** No customer has requested programmatic access yet. Every entity already has a stable UUID primary key ready to be exposed.

**Future tables (Phase 3):**
- `api_keys` — hashed key, scopes, company owner
- `api_key_usage_logs`
- `oauth_applications`

**Existing tables untouched:** none.

---

### Webhooks

**Why postponed:** Webhooks require endpoint registration, signing secrets, retry queues, and delivery logs. Zero internal use case in Phase 1.

**Future tables (Phase 3):**
- `webhook_endpoints` — URL, secret, event filter, per company
- `webhook_deliveries` — payload, status, retry count

**Existing tables untouched:** `audit_logs` already captures every event. The webhook service subscribes to it.

---

### Customer Portal

**Why postponed:** Customers need their own auth, their own session, and a completely separate UI surface.

**Future tables (Phase 3):**
- `customer_portal_accounts` — email + password, linked to `customers.id`
- `customer_portal_sessions`

**Existing tables untouched:** `customers.email` already exists.

---

### Accounting / BI

**Why postponed:** Chart of accounts, journal entries, and P&L require accountant validation. All the source data already exists.

**Future tables (Phase 3):**
- `accounting_accounts` — chart of accounts
- `journal_entries` + `journal_entry_lines` — double-entry pairs
- `reporting_snapshots` — pre-aggregated daily/monthly summaries

**Existing tables untouched:** `payments`, `invoices`, `expenses`, `deposits` all carry the data needed. No new columns required.

---

### White Label

**Why postponed:** Requires custom domain routing, per-company asset hosting, and a brand management UI. Core product must be proven first.

**Future tables (Phase 3):**
- `company_domains` — custom domain per company with SSL certificate status
- `company_themes` — detailed visual configuration beyond the branding columns on `companies`

**Existing tables untouched:** `companies.slug` is already the anchor for subdomain routing.

---

## 7. Evolution Examples

### Adding Booking.com Integration

**Today:**
```
reservations
  └── source_id → reservation_sources { key: "booking_com", is_external: true }
      (row already exists, just unused)
```

**Later — new tables only:**
```
channel_connections          (new)
  id, company_id, agency_id
  channel_key = "booking_com"
  credentials JSONB (encrypted)

channel_listings             (new)
  id, channel_connection_id
  vehicle_id  ← references existing vehicles.id
  external_listing_id

channel_reservations         (new)
  id, channel_connection_id
  reservation_id  ← references existing reservations.id
  external_booking_ref
  raw_payload JSONB
  synced_at
```

**`reservations` table: zero changes.** The sync job creates a normal `reservations` row with `source_id` pointing to the existing `booking_com` source, then creates a `channel_reservations` row that references it.

---

### Adding Stripe Payments

**Today:**
```
payments
  method = "card"
  reference = "manual ref"
```

**Later — new tables only:**
```
billing_accounts             (new)
  id, company_id
  stripe_customer_id

payment_stripe_details       (new)
  id
  payment_id  ← references existing payments.id
  stripe_payment_intent_id
  stripe_charge_id
  stripe_status

subscriptions                (new)
  id, company_id
  plan_id  ← references existing plans.id
  stripe_subscription_id
  stripe_customer_id
  status
  current_period_ends_at
```

**`payments` table: zero changes.** Stripe payments create a normal `payments` row, then create a `payment_stripe_details` row alongside it.

**`companies` table: zero changes.** `companies.plan_id` continues to work. `subscriptions` adds the billing lifecycle layer on top.

---

### Adding WhatsApp Notifications

**Today:**
```
reservation_timeline_events
  event_type = "status_changed"
  to_status = "confirmed"
```

**Later — new tables only:**
```
notification_templates       (new)
  id, company_id
  event_trigger = "reservation.confirmed"
  channel = "whatsapp"
  body_template = "Votre réservation {{code}} est confirmée."

notification_logs            (new)
  id, company_id
  reservation_id  ← references existing reservations.id
  customer_id     ← references existing customers.id
  channel = "whatsapp"
  recipient_phone             -- denormalized from customers.phone at send time
  status, delivered_at
```

**`reservations` table: zero changes.** The notification service listens to reservation status transitions and queries the templates table.

---

### Adding a Driver / Staff Mobile App

**Today:**
```
users
  id, company_id, email, status
agency_memberships
  user_id, agency_id, role_id
```

**Later — new tables only:**
```
device_tokens                (new)
  id
  user_id      ← references existing users.id
  platform = "ios" | "android"
  token (hashed)
  last_active_at

push_notification_logs       (new)
  id
  user_id         ← existing
  reservation_id  ← existing
  title, body
  sent_at, read_at
```

**`users` table: zero changes.** The mobile app authenticates with the same `users` table. Device tokens are a separate concern in a separate table.

---

## 8. Architecture Review

Every Phase 1 table is challenged below. The question for each: **is this table really needed today?**

---

### `companies` — Keep

The tenant root. Without it there is no multi-tenancy. Cannot be simplified further.

---

### `agencies` — Keep

Even a single-location company has exactly one agency row. The cost of the table is zero. The cost of not having it — and retrofitting the concept later — is a full-table migration across every business table.

---

### `users` — Keep

Authentication requires it. Cannot be avoided.

---

### `roles` + `permissions` + `role_permissions` — Keep, but ship only system roles in Phase 1

**Challenge:** Three tables for RBAC feels like overengineering for a small team.

**Response:** The alternative — a hardcoded enum on `memberships` — cannot express "this agent can view finances but not export them." The flat permission key model (`finance.view`, `finance.export`) is the simplest thing that works.

**Simplification applied:** Disable the custom role creation UI for Phase 1. Ship only system roles (`owner`, `admin`, `agent`, `accountant`, `readonly`) seeded at company creation. The table structure is in place; the feature is just not exposed. Zero migration cost when Phase 2 enables custom roles.

---

### `company_memberships` + `agency_memberships` — Keep both

**Challenge:** Two membership tables feels redundant. Why not one?

**Response:** Company-level access (owner, billing manager) has no agency context. Merging into one table requires `agency_id` to be nullable everywhere, which means every permission check must handle the null case. Two tables with clear scopes (`scope = 'company'` vs `scope = 'agency'` on `roles`) is the cleaner model.

---

### `invitations` — Keep

Without this table, inviting a new user requires creating a dangling membership before the user exists. The table is small, simple, and necessary for the onboarding flow.

---

### `plans` + `plan_limits` + `plan_features` — Keep the split

**Challenge:** Three tables for plan configuration. Why not one?

**Response:** Limits are integers, features are booleans. Mixing them in one `plan_entitlements` table forces a `value_type` column and runtime casting. The split tables produce clean, typed queries. The overhead of the extra table is trivial.

---

### `vehicles` — Keep

Core entity. Irreducible.

---

### `vehicle_vignettes` — Keep

Morocco-specific (vignette = annual road tax sticker), but it has an expiry date that will drive the alert system. Without a dedicated table, tracking expiry requires parsing freetext notes. Keep it.

---

### `vehicle_mileage_logs` — Keep

Storing current mileage on `vehicles` is a frequent mistake. It creates race conditions when two contracts are returned simultaneously, loses mileage history, and makes "total km driven this month" impossible to query. The log is the correct model.

---

### `customers` single table + two sub-tables — Keep this design

**Challenge:** Why not one flat `customers` table with nullable individual/business columns?

**Response:** A flat table is simpler for Phase 1 with small customer counts. However, the sub-table design has one critical advantage: adding a new customer type (e.g. `government`) means adding a new sub-table, not adding nullable columns to a table with millions of rows. Given LokaRent's trajectory, the split is the right call now.

---

### `customer_blacklist` as a separate table — Keep

**Rejected alternative:** `customers.is_blacklisted BOOLEAN`. This loses: who blacklisted them, when, why, what severity, whether it was ever lifted, and who lifted it. The blacklist is an auditable legal record. It must be a table.

---

### `reservation_sources` — Keep

Five rows at launch. Adding Booking.com in Phase 3 inserts one row. No deployment, no migration, no application code change for the `reservations` table. Worth having.

---

### `reservation_pricing_snapshots` — Keep

**Rejected alternative:** Store pricing only on `reservations`. The problem: any edit to a reservation after confirmation silently changes the financial record. The invoice was generated from those numbers. The snapshot is written once, never updated. Financial integrity requires it.

---

### `contract_templates` — Keep the table, defer the UI

One default template per agency is all Phase 1 needs. The template editor UI is Phase 2. Keeping the table now avoids a migration later when agencies want custom clauses. Cost: near zero.

---

### `invoice_line_items` — Keep

**Rejected alternative:** `invoices.line_items JSONB`. Loses: SQL aggregation, per-line queries, clean PDF generation. The child table is the correct model.

---

### `expense_categories` — Keep

Five rows at launch. Without it, expenses are unclassified text and the expense breakdown chart is impossible to build. The table costs nothing.

---

### `documents` — Keep as one polymorphic table

**Alternative considered:** One documents table per entity type (`vehicle_documents`, `customer_documents`, etc.). This would produce 8+ near-identical tables with identical columns. The polymorphic design with `entity_type + entity_id` and an index on that pair is the standard pattern for this use case. Keep it.

---

### `audit_logs` vs `activity_logs` — Keep both

**Challenge:** Why two tables? One table with a `display_text` column would be simpler.

**Response:** Audit logs are high-volume, append-only compliance records that must never be read by the UI under normal operation. Activity logs are curated, lower-volume, denormalized records queried constantly to render timeline feeds. The access patterns, retention policies, and audiences are completely different. Merging them creates a table that is too large for the feed and too unstructured for compliance. Keep them separate.

---

## Index Strategy

Minimum required indexes for Phase 1. Every query must be able to filter by `company_id` first.

```sql
-- Tenant isolation (on every business table — shown once, applies to all)
CREATE INDEX ON reservations (company_id, agency_id);
CREATE INDEX ON vehicles (company_id, agency_id);
CREATE INDEX ON customers (company_id, agency_id);

-- Reservation hot paths
CREATE INDEX ON reservations (vehicle_id, starts_at, ends_at);    -- availability check
CREATE INDEX ON reservations (customer_id);
CREATE INDEX ON reservations (status, agency_id);                   -- kanban / list views
CREATE INDEX ON reservations (created_at DESC);                     -- recent list

-- Fleet alert queries
CREATE INDEX ON vehicle_insurances (expires_at, agency_id);
CREATE INDEX ON vehicle_inspections (expires_at, agency_id);
CREATE INDEX ON vehicle_registrations (expires_at, agency_id);
CREATE INDEX ON vehicle_vignettes (tax_year, agency_id);

-- Customer lookups
CREATE INDEX ON customers (company_id, email);
CREATE INDEX ON customers (company_id, phone);
CREATE INDEX ON customer_blacklist (customer_id);

-- Documents (polymorphic lookup)
CREATE INDEX ON documents (entity_type, entity_id);

-- Audit and activity
CREATE INDEX ON audit_logs (company_id, entity_type, entity_id);
CREATE INDEX ON audit_logs (created_at DESC);
CREATE INDEX ON activity_logs (company_id, entity_type, entity_id);
CREATE INDEX ON activity_logs (company_id, created_at DESC);
```

---

## Summary

| Domain | Phase 1 tables | Status |
|---|---|---|
| Multi-Tenant | 2 | Build now |
| Identity | 8 | Build now |
| Subscription | 3 | Build now |
| Fleet | 9 | Build now |
| Customers | 6 | Build now |
| Reservations | 5 | Build now |
| Contracts | 5 | Build now |
| Finance | 8 | Build now |
| Drivers | 4 | Build now |
| Documents | 1 | Build now |
| Audit | 2 | Build now |
| Settings | 1 | Build now |
| Utility | 1 | Build now |
| **Total** | **55** | |

**Intentionally not built:** Stripe, Booking.com, WhatsApp, SMS, Email providers, Public API, OAuth, Webhooks, Customer Portal, Accounting, BI, Reporting snapshots, Notifications, White label, Mobile app, CRM, Channel manager, Marketplace, Driver app.

All 20+ deferred features plug into Phase 1 by adding new tables that reference existing UUIDs. **No existing table requires a new column to support any of them.**
