# FINAL DATABASE SOURCE OF TRUTH

> **Status:** READY FOR PRISMA GENERATION
> **Purpose:** Single canonical reference that resolves every conflict found across the six architecture documents. Where any document disagrees with this file, **this file wins**. Update this file first, then propagate.
> **Scope:** Phase 1.

---

## 1. Canonical Table / Model Count

**55 Prisma models = 55 database tables.**

Reasons earlier figures were wrong:
1. `driver_payments` was double-counted across the Finance and Drivers domains — it is **one** model whose single home is the **Finance** domain.
2. `number_sequences` and/or `vehicle_categories` were counted separately from their domain.
3. `contract_template_versions` was omitted. Per the `DATABASE_FINAL_REVIEW.md` verdict (adjudicating document), template versioning is a **blocking Phase 1 legal-integrity dependency**, so Contracts = 5 and the total is 55. The `DATABASE_DEFENSE.md` "Phase 2" note is superseded by this decision.

| # | Domain | Tables | Count |
|---|---|---|---|
| 1 | Multi-Tenant | `companies`, `agencies` | 2 |
| 2 | Identity | `users`, `company_memberships`, `agency_memberships`, `roles`, `permissions`, `role_permissions`, `user_permission_overrides`, `invitations` | 8 |
| 3 | Subscription | `plans`, `plan_limits`, `plan_features` | 3 |
| 4 | Fleet | `vehicle_categories`, `vehicles`, `vehicle_registrations`, `vehicle_insurances`, `vehicle_inspections`, `vehicle_vignettes`, `vehicle_maintenances`, `vehicle_mileage_logs`, `vehicle_availability_blocks` | 9 |
| 5 | Customers | `customers`, `customer_individuals`, `customer_businesses`, `customer_contacts`, `customer_documents`, `customer_blacklist` | 6 |
| 6 | Reservations | `reservation_sources`, `reservations`, `reservation_pricing_snapshots`, `reservation_extras`, `reservation_timeline_events` | 5 |
| 7 | Contracts | `contract_templates`, `contract_template_versions`, `contracts`, `contract_inspection_items`, `contract_signatures` | 5 |
| 8 | Finance | `invoices`, `invoice_line_items`, `payments`, `deposits`, `credit_notes`, `expense_categories`, `expenses`, **`driver_payments`** | 8 |
| 9 | Drivers | `drivers`, `driver_pricing_rules`, `driver_documents`, `driver_reservation_assignments` | 4 |
| 10 | Documents | `documents` | 1 |
| 11 | Audit | `audit_logs`, `activity_logs` | 2 |
| 12 | Settings | `settings` | 1 |
| 13 | Utility | `number_sequences` | 1 |
| | **TOTAL** | | **55** |

> The `PRISMA_IMPLEMENTATION_PLAN.md` § 1 enumerated list (#1–#55) is the authoritative per-model source, and this table mirrors it exactly. Note there is **no** `subscriptions`, `user_sessions`, or `translations`/Localization table in Phase 1 — earlier drafts that referenced them were drift. `contract_template_versions` **is** in Phase 1 (Contracts = 5). `activity_logs` lives in the **Audit** domain (not Settings), and `agencies` lives in **Multi-Tenant** (not Access Control).

---

## 2. Canonical Enum Decisions

### CustomerType
```
individual | company
```
- `company` (NOT `business`). A `type = company` row has a `customer_businesses` record.

### PaymentMethod (shared)
```
cash | bank_transfer | cheque | card | other
```
- Used by **both** `payments.method` (non-nullable) and `expenses.method` (nullable).
- There is **NO** separate `ExpensePaymentMethod` enum.
- Canonical spellings: `bank_transfer` (not `transfer`), `cheque` (not `check`).

### DepositMethod (distinct)
```
cash | cheque | card | other
```
- Stays separate from `PaymentMethod` — deposits cannot be paid by `bank_transfer`.

### VehicleMaintenanceStatus
```
scheduled | in_progress | completed | cancelled
```
- Lifecycle: `scheduled` → `in_progress` → `completed`/`cancelled`. Indexed as `(vehicle_id, status)`.

### `vehicle_maintenances` (canonical columns)

This is the single authoritative definition. It merges the two previously conflicting blocks in `DATABASE_PHASE1.md`, keeping every field from either. No other model is affected.

```
vehicle_maintenances
  id                  uuid PK
  company_id          uuid FK → companies NOT NULL
  agency_id           uuid FK → agencies NOT NULL
  vehicle_id          uuid FK → vehicles NOT NULL
  status              VehicleMaintenanceStatus NOT NULL DEFAULT 'scheduled'
  type                text NOT NULL
  performed_at        date NOT NULL
  mileage_at_service  integer
  description         text
  cost                numeric(14,4)          -- Decimal @db.Decimal(14, 4)
  currency_code       char(3)
  provider            text
  next_due_at         date
  next_due_mileage    integer
  recorded_by         uuid FK → users NOT NULL
  created_at          timestamptz NOT NULL
  updated_at          timestamptz NOT NULL

  INDEX(vehicle_id, status)
```

- `cost` follows the canonical monetary type `Decimal(14,4)`; unlike other money columns its currency companion is named `currency_code` (nullable, since cost itself is optional).
- Carries `updated_at`, so it is **not** append-only.

---

## 3. Canonical Naming

| Concept | Canonical column | Format |
|---|---|---|
| Reservation reference | `reservations.code` | `RES-{YEAR}-{SEQUENCE}` |
| Contract reference | `contracts.code` | `CTR-{YEAR}-{SEQUENCE}` |
| Invoice reference | `invoices.code` | `INV-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` |
| Credit note reference | `credit_notes.code` | `CN-{AGENCY_CODE}-{YEAR}-{SEQUENCE}` |
| Payment method field | `payments.method`, `expenses.method` | — |

- Use **`code`** everywhere for human-readable references (never `number`).
- Use the **`INV-`** prefix (never the French `FAC-`).
- Driver↔reservation join table is **`driver_reservation_assignments`** (never `reservation_drivers`).

---

## 4. Canonical Monetary Type

All money columns are **`NUMERIC(14,4)`** → Prisma `Decimal @db.Decimal(14, 4)`, always paired with a `currency CHAR(3)` column.

Affected models: `Reservation`, `ReservationPricingSnapshot`, `ReservationExtra`, `Invoice`, `InvoiceLineItem`, `CreditNote`, `Payment`, `Deposit`, `Expense`, `DriverPayment` (gross/withheld/net), `Driver`, `DriverPricingRule`.

---

## 5. Canonical Cardinality: Reservation Pricing Snapshot

**`Reservation` → `ReservationPricingSnapshot` is 1:N (supersession chain), NOT 1:1.**

- Each row is immutable in its financial columns; a price change **inserts a new row** with `supersedes_id` pointing at the prior row.
- Exactly one row per reservation has `is_current = true`, enforced by a **partial unique index**: `UNIQUE(reservation_id) WHERE is_current = true` (added via raw migration — Prisma cannot express partial unique).
- `is_current` is the only mutable field; the model carries `updatedAt` and is therefore NOT in the append-only list.
- Any document showing `(1:1)` for this relation is stale and superseded by this file.

---

## 6. Canonical Role-Scope Enforcement

Membership role assignment is enforced **structurally**, not by trigger or application rule:

1. `roles` carries `@@unique([id, scope])`.
2. `company_memberships` and `agency_memberships` each add `role_scope RoleScope` with a single-table `CHECK` pinning it (`'company'` / `'agency'`).
3. Compound relation: `@relation(fields: [roleId, roleScope], references: [id, scope], onDelete: NoAction)`.

The `CHECK` constraints are added via raw migration.

---

## 7. Document Precedence

When documents conflict, resolve in this order:

1. **`FINAL_DATABASE_SOURCE_OF_TRUTH.md`** (this file)
2. `PRISMA_IMPLEMENTATION_PLAN.md`
3. `DATABASE_PHASE1.md`
4. `DATABASE_DOMAIN_DESIGN.md`
5. `DATABASE_SPECIFICATION.md`
6. `DATABASE_ARCHITECTURE.md` (full-system superset — includes non-Phase-1 tables)

---

## 8. Pre-Generation Checklist

- [x] Count reconciled to 55 across all docs
- [x] `driver_payments` counted once (Finance); Drivers = 4
- [x] `credit_notes` included in Finance (Phase 1)
- [x] `contract_template_versions` included in Contracts (Phase 1); Contracts = 5; version rows are immutable. `contracts.template_version_id` is a **nullable provenance FK** with `onDelete: Restrict` (per `DATABASE_FINAL_REVIEW.md`: contracts reproduce from their own frozen `rendered_html` + `content_snapshot` + `hash`, so they do not hard-depend on the version row; the FK exists for provenance and a referenced version can never be deleted)
- [x] CustomerType = `individual | company`
- [x] Single `PaymentMethod` enum (`cash, bank_transfer, cheque, card, other`), field `method`
- [x] `ExpensePaymentMethod` removed
- [x] Monetary columns = `Decimal @db.Decimal(14, 4)` + `currency CHAR(3)`
- [x] Reference columns named `code`, invoice format `INV-`
- [x] Pricing snapshot = 1:N chain with partial unique on `is_current`
- [x] Role-scope composite FK + CHECK
- [x] `VehicleMaintenanceStatus` enum + `status` column + index
- [x] Join table = `driver_reservation_assignments`
- [ ] Raw-migration block applied post-`prisma generate` (partial indexes, GIN trigram, scope CHECKs, snapshot partial unique)
