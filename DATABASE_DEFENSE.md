# LokaRent — Architecture Defense & Review

> Role: Staff Software Architect reviewing my own architecture before Prisma implementation.
> This is not a description. Every decision is defended, challenged, and concluded.

---

## Table of Contents

1. [Multi-Tenant Domain](#1-multi-tenant-domain)
2. [Identity Domain](#2-identity-domain)
3. [Subscription Domain](#3-subscription-domain)
4. [Fleet Domain](#4-fleet-domain)
5. [Customers Domain](#5-customers-domain)
6. [Reservations Domain](#6-reservations-domain)
7. [Contracts Domain](#7-contracts-domain)
8. [Finance Domain](#8-finance-domain)
9. [Documents Domain](#9-documents-domain)
10. [Audit Domain](#10-audit-domain)
11. [Global Architecture Review](#11-global-architecture-review)
12. [Final Assessment](#12-final-assessment)

---

## 1. Multi-Tenant Domain

### `companies`

#### Responsibility
The tenant root. Owns all data. Every other table points to it.

#### Why it exists
Without a tenant root, there is no safe boundary between customers' data. Every query, every permission check, every report ultimately begins with: "what company is this user?" A missing or incorrect `company_id` is the most catastrophic bug a multi-tenant SaaS can ship.

#### Why not merge it?
There is nothing to merge it into. `companies` is the foundation. Everything else could theoretically be merged into something — `companies` cannot be.

#### Future-proofing
- **White-label:** `slug` already points to `{slug}.lokarent.com`. No schema change needed.
- **Stripe:** A future `subscriptions` table will reference `companies.id` and wrap `plan_id` with billing cycle data. No column change to `companies`.
- **BI/Reporting:** `company_id` is the partition key for analytics. All aggregate queries group or filter on it.
- **Multi-country:** `country_code`, `currency`, `language`, `timezone` are already columns. Expanding internationally is zero-cost.

#### Scalability
With 100 companies: trivial. With 10,000 companies: `companies` itself is a small table — it scales perfectly. With 1 million reservations: every hot table is partitioned by `company_id`. The tenant root does not grow with reservation volume.

#### Risks
- `slug` must be immutable. If a company URL changes after being bookmarked by thousands of users, the damage is irreversible. Enforce immutability at the application layer and document it as a constraint.
- `plan_id` as a direct FK means we are one step from the billing system being embedded in `companies`. The future `subscriptions` table must own the plan assignment, and `companies.plan_id` should become a denormalized cache. This is acceptable for Phase 1 but must be tracked as tech debt.

#### Simpler alternative
```
-- Alternative: store all settings as flat columns directly on agencies
agencies
  plan text
  max_vehicles int
  ...
```
Rejected. This collapses the company/agency distinction. It forces every plan check to scan every agency. It makes company-level ownership impossible to express.

#### Verdict
**Keep.** No changes needed.

---

### `agencies`

#### Responsibility
An operational branch of a company. Fleet, customers, and reservations are scoped here, not at the company level.

#### Why it exists
A car rental company in Morocco may have 5 cities: Casablanca, Marrakech, Agadir, Fès, Tanger. Each city operates its own fleet, its own clients, its own agents. They all belong to the same company, pay the same subscription, and appear in the same company-level dashboard — but their day-to-day operations are fully separate. The agency is the unit of that operational separation.

#### Why not merge it?
The natural alternative is to put everything on `companies` and give them "locations" as a label on each record. This was rejected because:
1. It puts filtering burden on every single query (filter by location string instead of indexed FK).
2. It makes permissions impossible to express without embedding location lists into role definitions.
3. It prevents per-agency settings override (timezone, currency).

#### Future-proofing
- **Booking.com integration:** Channels will connect at the agency level, not the company level. A Casablanca agency may list on Booking.com while Agadir stays off-platform.
- **Mobile app:** Agents are scoped to an agency. The mobile app's default view, fleet, and calendar are all filtered by `agency_id`.
- **API:** External integrations will authenticate per agency, not per company.

#### Scalability
`agencies` is small relative to the tables it scopes. A company with 100 agencies has 100 rows here and millions of rows in `reservations` — all correctly indexed by `agency_id`. The table itself never becomes a performance concern.

#### Risks
- The `(company_id, agency_id)` dual-key pattern on every table adds cognitive overhead. Every developer must understand that queries can be company-scoped (owner view) or agency-scoped (agent view). This is a training issue, not a schema issue.
- `address` stored as JSONB is a pragmatic shortcut. A future address normalisation (for multi-country compliance) may require migration. Acceptable for Phase 1.

#### Simpler alternative
```
-- Alternative: one big "tenants" table, location is a string column on records
reservations
  tenant_id uuid
  location  text   -- "casablanca"
```
Rejected. This is not enforceable, not indexable cleanly, and destroys the ability to express per-agency roles.

#### Verdict
**Keep.** No changes needed.

---

## 2. Identity Domain

### `users`

#### Responsibility
Platform-level human identity. One record per person, regardless of how many agencies they work in.

#### Why it exists
A user's email, name, and authentication credentials are facts about a person, not about a role or a location. Separating identity from membership allows one person to work in three agencies without duplicating their personal record, and allows them to change roles without touching their identity.

#### Why not merge it?
Merged alternative: embed full user info into each `agency_memberships` row.

Rejected. A user changing their email would require updating N rows across all their memberships. A system event targeting a user would have to pick an arbitrary membership to find their email. Authentication would require joining memberships just to validate a login.

#### Future-proofing
- **Mobile app:** The app authenticates against the user record and resolves their agencies at login. No membership change needed for a new app.
- **Notifications:** A notification goes to a user, not to a membership. Without a central user record, "send email to all users with finance.view" becomes a multi-join nightmare.
- **API:** API keys will be issued per user. One user record = one consistent identity.

#### Scalability
`users` is small. Even at 10,000 companies with 15 users each, that is 150,000 rows. Email lookup with a unique index is O(1). No concern.

#### Risks
- No `password_hash` on `users`. Authentication is delegated to Better Auth, which manages its own tables. This is correct but creates a dependency on a third-party library's schema. If Better Auth is replaced, its tables must be migrated alongside this one.
- `company_id` on `users` means a person who switches companies must get a new user record. Cross-company users (e.g. an IT consultant working for two car rental companies) are not supported. This is an explicit Phase 1 constraint and must be documented.

#### Simpler alternative
```
-- Alternative: fold identity and membership into one table
agency_users
  agency_id, email, full_name, role, ...
```
Rejected. Email is no longer unique. Authentication becomes per-agency instead of per-person. Reporting across all agents at a company requires a `DISTINCT` on email.

#### Verdict
**Keep.** No changes needed.

---

### `roles`

#### Responsibility
Named permission presets, scoped to a company. The bridge between users and permissions.

#### Why it exists
Permissions at the individual level are unmanageable at scale. When a new agent joins, you should assign a role, not configure 40 individual permissions. When the company decides agents can no longer delete contracts, you change the role once — not 30 individual user records.

#### Why not merge it?
Could live as an enum on `agency_memberships`. Rejected because:
1. An enum cannot store custom roles. "Senior Agent" with a specific permission set is not expressible.
2. An enum cannot be modified without a schema migration every time the business logic changes.

#### Future-proofing
- **Custom roles (Pro plan):** The `is_system = false` flag already supports this. Pro companies can create their own roles. Enforced by `plan_features.custom_roles`.
- **Role templates:** When a company creates a new agency, default roles can be seeded from the existing role set without any schema change.

#### Scalability
Even at 10,000 companies with 20 custom roles each, this is 200,000 rows. A non-issue.

#### Risks
- The `scope` column (`company` or `agency`) must be enforced by the application when assigning roles to memberships. A company-scoped role assigned to an `agency_membership` is a silent logic bug. Add a database check constraint: `CHECK (scope = 'agency')` on `agency_memberships.role_id`.

#### Verdict
**Modify.** Add a database-level constraint enforcing `scope` on both membership tables. Otherwise correct.

---

### `permissions`

#### Responsibility
A flat, static registry of every grantable action in the system. Seeded at deploy time.

#### Why it exists
Without a central registry, permissions are magic strings scattered across the codebase. There is no way to enumerate all permissions, validate that a permission key is real, or display a permission management UI without hardcoding the list somewhere. The `permissions` table makes the permission space explicit, queryable, and documented.

#### Why not merge it?
Could be a TypeScript enum or a hardcoded array. Rejected because:
1. The UI needs to list all permissions to build a role editor — a DB query is the only reliable source of truth.
2. Seeding ensures all environments (dev, staging, prod) have the same permission set.
3. A future i18n requirement means permission descriptions need to be translatable — that requires a DB row.

#### Scalability
A fixed, small table. ~200 rows maximum. Fully cached in memory at application startup. Zero performance concern.

#### Risks
- The `key` convention (`{domain}.{action}`) must be enforced by policy, not by a database constraint. A typo in a permission key during seeding will silently create an unusable permission. Add integration tests that seed and validate the full permission set.

#### Verdict
**Keep.** No changes needed.

---

### `role_permissions`

#### Responsibility
Maps which permissions each role grants. The junction table of the RBAC system.

#### Why it exists
This is the canonical expression of "what can a Manager do?" Without this table, the answer lives in code — brittle, inconsistent, and un-queryable by the UI.

#### Why not merge it?
Could store permissions as a JSONB array on `roles`. Rejected because:
1. A JSONB array cannot be indexed for queries like "which roles grant `finance.export`?"
2. Adding or removing a permission from a role would require deserializing, modifying, and re-serializing JSONB — a read-modify-write on a potentially hot row.
3. A proper join table allows the permission system to be extended (e.g. adding conditions or expiry per permission) without touching `roles`.

#### Verdict
**Keep.** No changes needed.

---

### `company_memberships`

#### Responsibility
Links a user to their company with a company-level role. Handles cross-agency access (owner, accountant, company-wide viewer).

#### Why it exists
Some users need to see all agencies without being assigned to each one individually. An owner should see every agency's dashboard. An accountant should export all invoices. Without a company-level membership, this access would require creating one agency membership per agency per user — fragile and maintenance-heavy.

#### Why not merge it with `agency_memberships`?
Could have one `memberships` table with a nullable `agency_id`. Rejected because:
1. A nullable FK is harder to enforce and reason about.
2. Company-level queries would need to filter `WHERE agency_id IS NULL` — semantically confusing.
3. The `UNIQUE(company_id, user_id)` constraint on `company_memberships` is cleaner and more enforceable as a separate table.

#### Scalability
One row per user. At 150,000 users: 150,000 rows. Negligible.

#### Verdict
**Keep.** No changes needed.

---

### `agency_memberships`

#### Responsibility
Links a user to a specific agency with an agency-level role. A user in three agencies has three rows.

#### Why it exists
Agency-level access must be explicit. An agent hired by the Casablanca branch should not automatically see Marrakech's fleet. The membership record is the authorization gate. Without it, any company-scoped user would see all agencies.

#### Scalability
At 10,000 companies with 5 agencies and 15 users each: 750,000 rows. With a composite index on `(company_id, user_id)` this is a fast lookup. No concern.

#### Risks
- `is_primary` as a boolean flag with no uniqueness constraint means a user could technically have two primary agencies. Enforce with a partial unique index: `UNIQUE(user_id) WHERE is_primary = true`.

#### Verdict
**Modify.** Add partial unique index on `is_primary`. Otherwise correct.

---

### `invitations`

#### Responsibility
Tracks pending invitations before a user account exists and a membership is created.

#### Why it exists
A user cannot have a membership until they accept an invitation and create an account. The invitation must persist across the gap between "admin sends invite" and "user clicks link 3 days later." Without this table, expired or revoked invitations cannot be enforced.

#### Why not merge it with `users`?
An invitation is for a person who does not yet have a user record. It is pre-user, not a subset of user.

#### Risks
- `UNIQUE(company_id, email)` prevents double-inviting the same email to the same company. But what if an admin re-invites after the first invitation expired? The status-aware logic must allow a new invitation only when the previous one is `expired` or `revoked`. Enforce at application layer.

#### Verdict
**Keep.** No changes needed.

---

## 3. Subscription Domain

### `plans`

#### Responsibility
The platform's plan catalog. Seeded at deploy. Never created by tenants.

#### Why it exists
Plan enforcement requires a source of truth. Hardcoding plan names in code means a plan change requires a deployment. A database record means a plan rename, addition, or deprecation is a single-row insert with no downtime.

#### Why not merge it with `companies`?
`plans` is platform data. `companies` is tenant data. Merging them would collapse the boundary between what the platform controls and what a company owns.

#### Verdict
**Keep.** No changes needed.

---

### `plan_limits`

#### Responsibility
Integer resource limits per plan, stored as key/value rows. `-1` = unlimited.

#### Why it exists
Adding a new resource limit (e.g. `max_reports_per_day`) must not require a schema migration. With `plan_limits`, it is one `INSERT` per plan. Without it, every new limit requires adding a column to `plans` — a migration, a deployment, and an ORM model change.

#### Why not store limits as JSONB on `plans`?
Rejected. A JSONB blob cannot be queried individually without deserializing the whole blob. `WHERE limit_key = 'max_vehicles'` is not expressible efficiently against JSONB without a GIN index — and even then it returns a blob, not an integer.

#### Scalability
~5 limit keys × 3 plans = 15 rows. Even at 20 limit keys, this is 60 rows. Fully cacheable at startup.

#### Verdict
**Keep.** No changes needed.

---

### `plan_features`

#### Responsibility
Boolean feature flags per plan. A row exists = feature is enabled. Absence = disabled.

#### Why it exists
For the same reason as `plan_limits`. Adding a new feature flag (`export_csv`, `advanced_reporting`) is one `INSERT` per plan. No migration. No deployment.

#### Why not merge with `plan_limits`?
Limits are integers. Features are booleans (presence/absence). Merging them into one table with a `value_type` discriminator creates ambiguity and makes the code harder to read. The split is clean and explicit.

#### Verdict
**Keep.** No changes needed.

---

## 4. Fleet Domain

### `vehicles`

#### Responsibility
Core vehicle identity. The fields here rarely or never change.

#### Why it exists
The vehicle is the central operational asset of a car rental business. Every reservation needs a vehicle. Every contract references one. Every maintenance record belongs to one. Without a `vehicles` table, none of the operational tables have a meaningful anchor.

#### Why is current mileage NOT stored here?
Because mileage changes every time a vehicle is picked up or returned. If mileage were a column on `vehicles`, every contract completion would UPDATE the vehicle row — creating write contention on a hot row, destroying mileage history, and making it impossible to answer "what was the mileage when this contract was signed?"

#### Why is price per day NOT stored here?
Because pricing changes over time (seasons, promotions, model updates). A price column on `vehicles` would mean the price shown on a historical contract is wrong the moment the price changes. The pricing snapshot on the reservation locks the price at confirmation.

#### Future-proofing
- **Booking.com:** Vehicle metadata (category, seats, fuel type) is exactly what an OTA channel needs to build availability listings. Zero schema change required.
- **Mobile app:** The agent app needs vehicle photos, category, and status — all present.
- **BI:** Fleet utilization, revenue per vehicle, and maintenance cost per vehicle all use `vehicles.id` as the grouping key.

#### Scalability
With 10,000 companies × 50 vehicles = 500,000 rows. With `UNIQUE(company_id, plate)` indexed, per-company lookups are fast. No concern.

#### Risks
- `category` is a `text` column, not a foreign key to a lookup table. This means inconsistent values (`"SUV"` vs `"suv"` vs `"Sport Utility"`). Either enforce an enum or add a `vehicle_categories` lookup table in Phase 2.
- `status` reflects current operational state but is not derived from booking data. An agent must remember to change status to `rented` when a reservation starts. An automated background job that syncs status from active reservations would be safer. Mark as Phase 2 automation.

#### Verdict
**Keep.** Note `category` normalization as Phase 2 tech debt.

---

### `vehicle_registrations`

#### Responsibility
Registration document history. One row per registration period.

#### Why it exists
Registration expires. The next registration is a different document with a different number and different dates. If the current registration were a column on `vehicles`, the previous one would be overwritten and lost. Lost history means no audit trail for compliance, no ability to prove a vehicle was legally registered during a past rental.

#### Why not merge with `vehicles`?
A single `registration_expires_at` column would answer "when does it expire?" but not "was this vehicle registered on 15 March 2023?" which is exactly what a legal dispute requires.

#### Future-proofing
- **Alerts system:** `expires_at` is the trigger. The alert engine scans all history tables for approaching expiries. This table is the data source.
- **Document storage:** `document_url` points to the scanned certificate. Future document management links here.

#### Verdict
**Keep.** No changes needed.

---

### `vehicle_insurances`

#### Responsibility
Insurance policy history. One row per policy period.

#### Why it exists
Same reasoning as `vehicle_registrations`. Insurance policies expire, are renewed, and sometimes changed mid-year. A policy history is a legal and compliance requirement. If a vehicle is involved in an accident, the system must prove what policy was active on that date.

#### Why not merge with `vehicle_registrations`?
They are different legal documents from different providers with different expiry cycles. Merging them into one "vehicle_documents" table would require a `type` discriminator column and make field-specific queries more complex.

#### Verdict
**Keep.** No changes needed.

---

### `vehicle_inspections`

#### Responsibility
Technical inspection (contrôle technique) history. One row per inspection event.

#### Why it exists
Inspection validity is legally required to operate a commercial vehicle on public roads in Morocco. An expired inspection certificate means the vehicle is legally unrentable. This table is the source of truth for the alert engine that warns 30 days before expiry.

#### Scalability
A vehicle inspected once per year × 500,000 vehicles × 10 years = 5 million rows. Partitioned by `company_id` or `vehicle_id`, this is fast.

#### Verdict
**Keep.** No changes needed.

---

### `vehicle_vignettes`

#### Responsibility
Annual road tax records. One row per tax year.

#### Why it exists
Vignette is a Moroccan-specific annual vehicle tax. Missing vignette = administrative fine at a police checkpoint. The alert system must warn before expiry.

#### Challenge: is this too Morocco-specific for a SaaS?
It is. However, the table is narrow (5 columns), cheap to add, and relevant to the entire Phase 1 target market. Phase 2 multi-country expansion will need to generalize this. The generalization path: rename to `vehicle_road_taxes`, add `tax_type` column. Zero reservation data is affected.

#### Verdict
**Keep** for Phase 1. Mark `vehicle_vignettes → vehicle_road_taxes` generalization as Phase 2.

---

### `vehicle_maintenances`

#### Responsibility
Maintenance and repair records. Each event is a row.

#### Why it exists
Maintenance cost per vehicle is a key business metric. "Is this vehicle costing more to maintain than it generates in revenue?" is a C-level question that requires this table. Additionally, `next_due_at` and `next_due_mileage` feed the alert system.

#### Why not use `expenses` for maintenance costs?
`expenses` tracks financial costs. `vehicle_maintenances` tracks operational events with operational metadata (mileage at service, service type, next due mileage). They serve different queries. A financial query sums cost. An operational query asks "when is the next oil change due?" These are different.

#### Verdict
**Keep.** No changes needed.

---

### `vehicle_mileage_logs`

#### Responsibility
Every odometer reading is an immutable append-only log entry.

#### Why it exists
Mileage is auditable. A rental agreement specifies starting mileage and ending mileage. The difference is the distance charged to the customer. If mileage were a mutable column on `vehicles`, there would be no way to prove what the odometer read at the start of a specific rental 18 months ago.

#### Why not store mileage on the contract?
The contract stores the mileage at pickup and return (captured during inspection). The mileage log is a broader record that also captures maintenance-time readings and manual corrections. They are complementary, not redundant.

#### Scalability
2 readings per reservation × 1 million reservations = 2 million rows. Lightweight. Index on `(vehicle_id, recorded_at DESC)` makes the "current mileage" query a fast index scan.

#### Verdict
**Keep.** No changes needed.

---

### `vehicle_availability_blocks`

#### Responsibility
Manual unavailability windows not driven by a reservation.

#### Why it exists
A vehicle may be unavailable for maintenance, held for a VIP, or temporarily taken off fleet for body repairs. These windows are not reservations. Without a dedicated table, the availability check must be "no active reservation for this period" — which is insufficient.

#### Why not model this as a reservation with `status = blocked`?
Because it is not a reservation. Conflating administrative holds with customer reservations pollutes the reservation table's purpose, breaks status semantics, and makes reporting inaccurate (a blocked vehicle would appear in reservation counts).

#### Verdict
**Keep.** No changes needed.

---

## 5. Customers Domain

### `customers`

#### Responsibility
Core customer record. The anchor for all customer data.

#### Why it exists
A customer is a named entity that can make reservations. Without this record, there is no way to track lifetime value, reservation history, or blacklist status for a renter.

#### Why is `type` on `customers` instead of having two separate root tables?
Because a customer is a customer regardless of type. Their reservation history, blacklist record, and document set all reference `customers.id`. If we had `individual_customers` and `business_customers` as separate root tables, the reservation table would need two nullable FKs (`individual_customer_id`, `business_customer_id`) — a violation of relational integrity.

#### Risks
- `status = blacklisted` on `customers` is a denormalized cache of `customer_blacklist`. If a blacklist entry is added, `customers.status` must be updated. If a lift is recorded in `customer_blacklist`, `customers.status` must be reset. This sync must be handled transactionally or via a database trigger.

#### Verdict
**Keep.** Document the `status` sync as a required application-layer transaction.

---

### `customer_individuals` and `customer_businesses`

#### Responsibility
Type-specific details for individual renters and business clients respectively.

#### Why not put all fields on `customers`?
`customers` would need nullable columns for `first_name`, `last_name`, `date_of_birth`, `driving_license_number` (individual only) AND `company_name`, `registration_number`, `tax_id` (business only). This creates a wide, sparse table where half the columns are always NULL depending on `type`. Sparse tables are harder to reason about, document, and enforce.

The sub-table pattern means: if `type = individual`, exactly one row exists in `customer_individuals`. The schema is self-documenting.

#### Challenge: does this add unnecessary joins?
Yes. Every query for an individual customer's name requires joining `customer_individuals`. But this is a single, indexed, one-to-one join — the cheapest join in relational databases. The clarity trade-off is worth it.

#### Verdict
**Keep.** No changes needed.

---

### `customer_documents`

#### Responsibility
Identity document scans with expiry tracking.

#### Why not use the generic `documents` table?
The generic `documents` table stores file attachments. `customer_documents` stores structured data: document type, number, expiry date, issuing country. The structured fields are what drive the alert system ("this customer's driving license expires in 15 days"). A generic attachment table cannot drive type-aware logic without unstructured metadata.

#### Verdict
**Keep.** No changes needed.

---

### `customer_blacklist`

#### Responsibility
An auditable record of blacklist entries with full history of who added them, when, why, and who lifted them.

#### Why not use a boolean flag on `customers`?
A boolean flag answers "is this customer blacklisted?" but not:
- "Who blacklisted them and when?"
- "Why were they blacklisted?"
- "Was this a temporary warning or a permanent block?"
- "Who lifted the blacklist and what was the reason?"

In a regulated business, these questions have legal weight. A dispute about a refused rental requires answers to all of them. A boolean flag is irreversible evidence destruction.

#### Verdict
**Keep.** No changes needed.

---

## 6. Reservations Domain

### `reservation_sources`

#### Responsibility
A lookup table for the channel through which a reservation was created.

#### Why it exists as a table and not an enum?
Adding a new channel (Booking.com, a mobile app, a website widget) requires inserting one row. If it were an enum, it would require a database migration, an ORM model update, and a deployment. For a system that will integrate with external channels over time, enum churn is unacceptable.

#### Verdict
**Keep.** No changes needed.

---

### `reservations`

#### Responsibility
The central record of a rental request. The hub that all other reservation data points to.

#### Why it exists
This is the core business entity. No defense needed — this is what the entire system exists to create.

#### Design decisions worth defending:

**`code` as a human-readable string (`RES-2025-00142`)**
Agents need to reference reservations verbally and in documents. A UUID is unusable in a phone call. The code is generated at creation and is immutable.

**Financial fields on `reservations` AND `reservation_pricing_snapshots`**
The fields on `reservations` (`price_per_day`, `estimated_total`) are the working figures during the enquiry and confirmation flow. The snapshot locks them at confirmation. This duplication is intentional — the working fields can change during negotiation; the snapshot cannot.

**`vehicle_id` as a hard FK**
A reservation must reference a specific vehicle, not a category. If a vehicle breaks down, a new reservation must be created or the vehicle reassigned — the system must not silently reroute.

#### Scalability
The hot table in the system. At 1 million rows, partitioned by `company_id`, with indexes on `(agency_id, status)`, `(vehicle_id, starts_at)`, `(customer_id)`, all standard queries are fast. At 10 million rows, time-based partitioning (by year) becomes relevant.

#### Verdict
**Keep.** No changes needed.

---

### `reservation_pricing_snapshots`

#### Responsibility
An immutable record of the exact price agreed at the moment of confirmation.

#### Why it exists
This is the most important design decision in the entire schema. A reservation's pricing must be locked at confirmation. If the daily rate changes tomorrow, invoices from yesterday must still show yesterday's rate. Without a snapshot, a price change would silently alter every historical calculation.

#### Why not just lock the columns on `reservations`?
Because `reservations` has mutable fields for operational reasons (status changes, notes, vehicle reassignment). Making the entire row immutable after confirmation is not practical. Separating the financial snapshot into its own write-once table is cleaner, enforceable, and explicit.

#### Simpler alternative
```
-- Alternative: store all pricing as columns on reservations and never update them
ALTER TABLE reservations ADD locked_price_per_day numeric;
ALTER TABLE reservations ADD locked_total numeric;
```
Rejected. The snapshot is not just price — it includes discount justification, currency rate, extra costs, deposit amounts, and a `locked_at` timestamp. Putting 8+ locked financial columns on `reservations` clutters the main table and is harder to enforce as immutable.

#### Verdict
**Keep.** No changes needed. This is correct and non-negotiable.

---

### `reservation_extras`

#### Responsibility
Add-on items selected for a reservation (GPS, baby seat, extra driver, insurance upgrade).

#### Why not store extras as a JSONB array on `reservations`?
1. Each extra has a `price_per_day` and a `total` — these are financial figures that must be individually auditable.
2. The invoice line items are generated from extras. A JSONB array cannot be iterated cleanly in SQL to generate invoice rows.
3. Future extras may have their own configuration (e.g. an extra driver requires a name — a structured FK, not a string).

#### Verdict
**Keep.** No changes needed.

---

### `reservation_timeline_events`

#### Responsibility
Append-only log of every significant event in a reservation's lifecycle.

#### Why it exists
Reservations are long-lived objects with a complex status machine. An agent needs to see: "who changed this from confirmed to cancelled, and when?" A `status` column with a `updated_at` timestamp answers "what is the current state?" but not "what was the history?"

#### Why not use `audit_logs` for this?
`audit_logs` captures raw before/after diffs for compliance. `reservation_timeline_events` captures human-readable, business-meaningful events like "vehicle returned with damage" or "payment received." They serve different audiences: audit logs for compliance; timeline events for agents using the UI.

#### Verdict
**Keep.** No changes needed.

---

## 7. Contracts Domain

### `contract_templates`

#### Responsibility
Reusable contract content templates. One default per agency. Custom ones for Pro companies.

#### Why it exists
A contract must be legally valid. Its content — terms, clauses, agency details — must be consistent and controlled. Without a template, agents would type contract content manually every time, introducing variation and legal risk.

#### Why not hardcode the template in code?
Because agencies need to customize terms (their specific late return clause, their damage policy). A hardcoded template is un-customizable without a deployment.

#### Risks
- If an agency updates their template, all future contracts must use the new version while historical contracts must still reference what was in effect when they were signed. This cannot be backfilled later without reconstructing the legal state of past documents.

#### Verdict
**Keep + version in Phase 1.** This section's original "Phase 2" recommendation is **superseded** by the adjudicating `DATABASE_FINAL_REVIEW.md` verdict: template versioning is a **blocking Phase 1 dependency**. Phase 1 includes the `contract_template_versions` table, and `contracts.template_version_id` is a **nullable provenance** FK (`onDelete: Restrict`) recorded at signing — the contract also freezes its own `rendered_html` + `content_snapshot` + `hash`, so it does not hard-depend on the version row. See `FINAL_DATABASE_SOURCE_OF_TRUTH.md` § 1 (Contracts = 5, total = 55).

---

### `contracts`

#### Responsibility
One contract per reservation. Created at pickup. The legal agreement between the company and the customer.

#### Why it exists
A reservation is a business intent. A contract is a legal commitment. The distinction matters: a reservation can be cancelled; a signed contract has legal weight. The contract captures: which template was used, who signed, what the vehicle state was, and what was agreed.

#### Why not merge with `reservations`?
A contract has a different lifecycle (created at pickup, not at booking), different signatories, different inspection data, and potentially different pricing (damage deposits finalized at pickup). Merging would put contract signing fields on a record that exists days before signing.

#### Verdict
**Keep.** No changes needed.

---

### `contract_inspection_items`

#### Responsibility
Vehicle condition checklist items at pickup and return.

#### Why it exists
Disputes about damage are the most common legal conflicts in car rental. "This scratch was there when I picked it up" vs "you returned it damaged." Without a structured checklist with timestamps and signatures, the company cannot win this dispute. Each inspection item is a documented point of agreement.

#### Why not store inspection as a JSONB blob on `contracts`?
Because individual items must be diffed between pickup and return. "At pickup: no scratch on door. At return: scratch on door." You cannot compute this diff efficiently on a JSONB blob.

#### Verdict
**Keep.** No changes needed.

---

### `contract_signatures`

#### Responsibility
One row per signing party per signing event.

#### Why not store signatures as a boolean on `contracts`?
A boolean (`customer_signed: true`) destroys: who signed, when they signed, what method they used (digital, handwritten scan, SMS OTP), and whether the agent also signed. These are all legally relevant facts.

#### Future-proofing
- **Digital signature providers:** When DocuSign or a local equivalent is integrated, `signature_method` and `provider_reference_id` are added to this table. No change to `contracts`.

#### Verdict
**Keep.** No changes needed.

---

## 8. Finance Domain

### `invoices`

#### Responsibility
One invoice per reservation. The commercial document issued to the customer.

#### Why it exists
An invoice is a legal document in Morocco and across North Africa. It has a sequential number, a date, a due date, and a total. It is not the same as a reservation — it is issued after the rental is confirmed and may be issued as a pro forma before pickup or a final invoice after return.

#### Why not derive the invoice dynamically from the reservation?
Because invoices must be immutable once issued. Tax regulations require that an issued invoice cannot be altered — only credited with a credit note. A dynamic derivation would mean the invoice changes every time the reservation is updated.

#### Scalability
One invoice per reservation. At 1 million reservations: 1 million invoices. With `company_id` indexing, fast. No concern.

#### Verdict
**Keep.** No changes needed.

---

### `invoice_line_items`

#### Responsibility
The itemized breakdown of an invoice. Each line is one service.

#### Why it exists
An invoice line item is a legal requirement in most jurisdictions. The invoice cannot simply say "rental: 2,500 MAD" — it must say: "5 days × 400 MAD/day = 2,000 MAD", "GPS rental: 5 days × 50 MAD = 250 MAD", "insurance upgrade: 250 MAD."

#### Why not store lines as a JSONB array on `invoices`?
Accounting integrations will need to query line items by type (e.g. sum all GPS revenue across all invoices this month). A JSONB array requires a GIN index and complex querying. A normalized table makes this a simple `WHERE line_type = 'extra_gps'`.

#### Verdict
**Keep.** No changes needed.

---

### `payments`

#### Responsibility
One row per payment event. Method-agnostic.

#### Why it exists
A reservation may be partially paid at booking, partially at pickup, and the remainder at return. Each event is a separate `payments` row. An invoice is not paid until `SUM(payments.amount) >= invoices.total`.

#### Why not store a single `paid_amount` on the invoice?
Because "how much has been paid, by what method, and when" is auditable financial data. A mutable column destroys the history. If a cash payment is recorded and then the agent discovers it was a card payment, the correction must be traceable.

#### Verdict
**Keep.** No changes needed.

---

### `deposits`

#### Responsibility
Caution deposit lifecycle — held, partially released, fully released.

#### Why it exists separately from `payments`?
A deposit is not revenue. It is a liability. The company holds the customer's money temporarily and must return it (minus damages if applicable). Mixing deposits with payments would require the accounting layer to know which payment rows are deposits — fragile, error-prone, and accountant-hostile.

#### Future-proofing
- **Stripe:** When Stripe integration arrives, `stripe_charge_id` is added to `deposits` for the hold. `stripe_refund_id` is added for the release. Zero changes to other tables.

#### Verdict
**Keep.** No changes needed.

---

### `expense_categories`

#### Responsibility
Lookup table for expense classification.

#### Why not use an enum?
Adding a new category (e.g. `cleaning`, `airport_parking`) requires a deployment if it is an enum. A lookup table row is an insert with no downtime. Finance managers in the UI can also manage categories themselves in Phase 2.

#### Verdict
**Keep.** No changes needed.

---

### `expenses`

#### Responsibility
Operational costs. Optionally linked to a vehicle or reservation.

#### Why it exists
A car rental business has costs beyond rental revenue: fuel, cleaning, repairs, fines. Without an expense record, the P&L is incomplete. Profit = revenue from `invoices` minus expenses from `expenses`.

#### Why are vehicle expenses not stored on `vehicle_maintenances`?
`vehicle_maintenances` captures operational events. `expenses` captures financial transactions. A maintenance event creates an expense — but the expense may be split across multiple invoices (labor + parts from two suppliers). The separation allows one maintenance event to generate multiple expense rows.

#### Verdict
**Keep.** No changes needed.

---

## 9. Documents Domain

### `documents`

#### Responsibility
A single polymorphic attachment system for all entities in the platform.

#### Why it exists
Without a central document table, every domain that needs file attachments needs its own attachment table: `vehicle_files`, `customer_files`, `contract_files`, `reservation_files`. That is 5+ redundant tables with identical structure.

#### Why polymorphic instead of separate FK columns?
The alternative is a documents table with nullable FK columns for every entity:
```sql
documents
  vehicle_id      uuid FK null
  customer_id     uuid FK null
  contract_id     uuid FK null
  reservation_id  uuid FK null
```
This pattern breaks every time a new entity needs document attachment. Adding a new entity requires a migration to add a new nullable FK column. With `entity_type + entity_id`, adding a new entity requires zero schema change.

#### Risks
- No database-level FK constraint. `entity_id` points to different tables depending on `entity_type`. The integrity guarantee must be maintained at the application layer.
- Queries like "give me all documents for this entity" are straightforward. But "give me all documents across all vehicles in this agency" require a join on `vehicles` plus a filter on `entity_type`. This is acceptable.

#### Scalability
High-volume table. At 10 documents per reservation × 1 million reservations = 10 million rows. Index on `(entity_type, entity_id)` makes per-entity lookups a fast index scan. At 100 million rows, time-partitioning by `created_at` is needed.

#### Verdict
**Keep.** No changes needed.

---

## 10. Audit Domain

### `audit_logs`

#### Responsibility
Immutable compliance trail. Records the exact before/after state of every write operation on every business table.

#### Why it exists
Compliance. If a customer disputes a charge and claims the price was changed after they agreed, the audit log proves it was not. If an employee deletes a reservation fraudulently, the audit log proves when and by whom. This is not optional for a SaaS handling financial transactions.

#### Why not use PostgreSQL triggers or a change-data-capture tool?
Application-level audit logging (writing to `audit_logs` in the same transaction) is simpler, testable, and framework-friendly. CDC tools (Debezium, etc.) add infrastructure complexity. For Phase 1, application-level is the right choice. Phase 3 may migrate to CDC if volume demands it.

#### Scalability
Every write on every business table creates one row. At 10 writes per reservation × 1 million reservations = 10 million rows. This table grows faster than any other. Partition by `created_at` (monthly). Archive rows older than 24 months to cold storage. The table itself never stores blobs — only text diffs.

#### Verdict
**Keep.** Document partitioning strategy before implementation.

---

### `activity_logs`

#### Responsibility
A human-readable event feed. Used to render the "activity timeline" in the UI.

#### Why it exists separately from `audit_logs`?
`audit_logs` is for compliance — dense, before/after diffs, written for machines and auditors.
`activity_logs` is for the UI — human language, denormalized names, written for agents and managers.

| | `audit_logs` | `activity_logs` |
|---|---|---|
| Audience | Auditors, compliance | Agents, managers |
| Content | Before/after JSON diffs | "Ahmed confirmed reservation RES-2025-00142" |
| Volume | Every write | Key business events only |
| Joins required | Yes (user name lookup) | No (actor_name denormalized) |
| Retention | 24 months minimum | 12 months UI, indefinite archive |

#### Why denormalize `actor_name`?
Because the activity log must remain readable even if the user who performed the action is later deactivated and soft-deleted. A join on `users` would return NULL. Denormalization locks the human-readable name at event time.

#### Verdict
**Keep.** No changes needed.

---

## 11. Global Architecture Review

### Multi-Tenancy

**Score: 9/10**

The `company_id + agency_id` dual-key pattern on every table is correct and enforceable. The scoping hierarchy (Company → Agency) is the right granularity for a car rental SaaS. The single weak point is that tenant isolation is enforced at the application layer — there is no Row Level Security (RLS) at the database level. For Phase 1 this is acceptable. Phase 2 should evaluate Supabase RLS or a Postgres RLS layer as a defense-in-depth measure.

---

### RBAC

**Score: 7/10**

The role/permission/membership model is correct for Phase 1. The `permissions` table as a static registry, `roles` as named presets, and two membership tables for company vs agency scoping are all sound decisions.

**Weakness:** There is no per-user permission override mechanism. If one specific agent needs a single extra permission without a role change, that is not expressible in Phase 1. The architecture document mentions this is deferred — that is the right call, but it must be documented as a known gap for customer-facing promises about granular permissions.

**Weakness:** Role `scope` enforcement is application-level only. A database check constraint would be safer. This was noted in the per-table review above.

---

### Fleet

**Score: 9/10**

The split between `vehicles` (identity) and multiple history tables (registrations, insurances, inspections, maintenances, mileage) is architecturally correct. Every fact that changes over time is an append-only history row. The design supports auditing, alert generation, and future mobile integrations without modification.

**Weakness:** `vehicle.category` as a free-text string is inconsistent. Standardize as a lookup table or enum before Phase 1 implementation.

---

### Reservations

**Score: 10/10**

The `reservations` + `reservation_pricing_snapshots` pattern is the most important design decision in the schema and it is correct. The timeline events table is a good pattern. Source tracking via a lookup table is future-proof. The reservation graph (reservation → contract → invoice → payments) is clean and navigable.

No changes recommended.

---

### Contracts

**Score: 7/10**

The core contract model is correct. The weakness is template versioning. When an agency updates their contract template, it must not retroactively affect already-signed contracts. The `contracts` table currently stores only `template_id` with no version reference. This is a Phase 1 acceptable gap but must be on the Phase 2 list before the platform handles legally contested contracts.

---

### Finance

**Score: 9/10**

The separation of `invoices`, `invoice_line_items`, `payments`, `deposits`, and `expenses` is correct. Each entity has a clear, non-overlapping responsibility. The deposit lifecycle (held → partially released → fully released) is expressed correctly as a single row with running balance fields.

**Weakness:** There is no concept of a credit note. When an invoice is disputed and partially credited, the accounting model breaks. Credit notes should be a Phase 2 addition — but the schema should pre-position for them by adding a nullable `credited_invoice_id` FK on invoices now.

---

### Documents

**Score: 8/10**

The polymorphic `documents` table is pragmatic and correct for Phase 1. The integrity trade-off (no DB-level FK) is documented and acceptable. The main risk is the lack of access control — any query that resolves `entity_type + entity_id` can retrieve any document. The application must enforce that document access is gated by the calling user's permissions for that entity.

---

### Audit

**Score: 9/10**

Two-table audit strategy (compliance vs UI feed) is correctly separated. The denormalization of `actor_name` on `activity_logs` is a deliberate and correct decision. The only missing piece is a documented partitioning strategy for `audit_logs`, which will become the highest-volume table in the system.

---

### Performance

**Score: 7/10**

The index strategy described in the architecture document is solid for Phase 1 workloads. However, there are two unaddressed performance concerns:

1. **The mileage query pattern** (`ORDER BY recorded_at DESC LIMIT 1`) is correct but requires an index on `(vehicle_id, recorded_at DESC)`. This must be in the Prisma migration.

2. **Plan limit checks** require a JOIN between `companies`, `plan_limits`, and a COUNT query on the target table. At high frequency (every vehicle creation), this may become a bottleneck. The mitigation is to cache plan limits at application startup and invalidate on plan change — not a schema problem, but a Phase 1 application architecture requirement.

---

### Scalability

**Score: 8/10**

The architecture scales correctly to 10,000 companies and 1 million reservations with standard indexing. At 10 million reservations, partitioning is required on `reservations`, `audit_logs`, `activity_logs`, and `vehicle_mileage_logs`. The phase documents call this out. No schema change is required to add partitioning later — it is a Postgres-level operation on existing tables.

---

### Future Integrations

**Score: 10/10**

The reservation source lookup table, the method-agnostic payment model, the polymorphic document table, and the plan feature flag system are all designed to accept integrations via new rows and new tables — not via schema modifications. This is the strongest area of the architecture.

---

### Data Consistency

**Score: 7/10**

The `customer.status = blacklisted` sync with `customer_blacklist` is a consistency risk. The `vehicles.status` sync with active reservations is a consistency risk. Both require transactional application-level logic. Neither is enforced by the database. Phase 2 should add database triggers or application-layer saga patterns for these critical state transitions.

---

### Simplicity

**Score: 7/10**

55 tables is not simple. It is the correct level of complexity for the domain. But the architecture will require careful onboarding documentation for new engineers. The split between `customer_individuals` and `customer_businesses` adds join overhead that some engineers will find surprising. The polymorphic `documents` table requires careful explanation.

---

### Maintainability

**Score: 8/10**

The "no schema changes for new features" principle is well-implemented. Lookup tables, feature flags, and plan limits all accept new values without migrations. The main maintenance risk is the growth of the `permissions` seed file — it must be kept in sync with actual application logic, or phantom permissions will accumulate.

---

## 12. Final Assessment

### Overall Scores

| Dimension | Score |
|---|---|
| **Simplicity** | 7/10 |
| **Scalability** | 8/10 |
| **Maintainability** | 8/10 |
| **Performance** | 7/10 |
| **Extensibility** | 10/10 |
| **SaaS Readiness** | 9/10 |
| **Overall** | **8.2/10** |

---

### Weak Points

1. **`roles.scope` enforcement** is application-only. A check constraint at the DB level is missing.
2. **`agency_memberships.is_primary`** has no uniqueness enforcement. Two primary agencies per user is possible.
3. **`vehicles.category`** is a free-text string. Inconsistent values are a data quality risk.
4. **Contract template versioning** is absent. Updating a template retroactively affects past contracts in reporting queries.
5. **Credit notes** are not modeled. A disputed invoice has no correct accounting resolution path.
6. **`customers.status` sync** with `customer_blacklist` is a consistency risk — no database-level enforcement.
7. **`vehicles.status` sync** with active reservations is manual and error-prone.
8. **`audit_logs` partitioning** strategy is documented but not specified in the Prisma migration plan.
9. **No Row Level Security** at the database layer. Tenant isolation is 100% application-enforced.
10. **Permission key typos** during seeding create phantom permissions. Integration tests are required.

---

### Recommended Changes Before Prisma

These are the changes that should be made to `DATABASE_PHASE1.md` before writing a single line of Prisma schema:

1. **Add DB check constraint** on `agency_memberships`: `role.scope must = 'agency'`. Document the equivalent for `company_memberships`.

2. **Add partial unique index** on `agency_memberships (user_id) WHERE is_primary = true`.

3. **Replace `vehicles.category` free text** with a `vehicle_categories` lookup table or a closed enum. Decide now — changing this after data exists is painful.

4. **Add `template_snapshot`** (JSONB) to `contracts`. When a contract is created, copy the full template content into this field. This preserves what the customer actually signed regardless of future template changes.

5. **Add `credited_invoice_id` (nullable FK)** to `invoices` to pre-position for credit notes in Phase 2.

6. **Document the `customers.status` sync rule** as a required atomic transaction: every INSERT into `customer_blacklist` must UPDATE `customers.status` in the same transaction. Specify this in the Prisma transaction layer.

7. **Add `audit_logs` index and partition specification** to the architecture document before implementing. Minimum: index on `(company_id, table_name, record_id, created_at)`. Partition plan: monthly, archive after 24 months.

8. **Add a `settings` table** for agency-level configuration overrides (late return fee, default deposit amount, invoice terms). This is Phase 1 data that is currently unmodeled. Without it, these values will be hardcoded in the application.

---

### Final Verdict

> Is this architecture mature enough to freeze and start implementing Prisma?

## NO — More architecture work required.

**Reason:** Seven of the eight recommended changes above are small and fast to implement in the architecture document — they do not require rethinking the design. But three of them must be resolved before any Prisma code is written:

1. **`vehicles.category`**: A free-text string that becomes an indexed enum or lookup table after data exists requires a painful migration. Decide the type before the first `prisma migrate dev`.

2. **`contracts` template snapshot**: Without a content snapshot, the contract model has a legal correctness gap. This is not a Phase 2 problem — it affects every contract created from day one.

3. **`settings` table**: Agency-level configuration values (late fees, deposit defaults, invoice payment terms) are certain to be needed in Phase 1. Building the application without them means these values are hardcoded strings that will require a schema migration the first time an agency wants to customize them.

Apply these changes to `DATABASE_PHASE1.md`, then the architecture is ready for Prisma.
