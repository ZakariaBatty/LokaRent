# LokaRent — Final Architecture Review Before Prisma

> Role: Senior SaaS Database Architect.
> Mandate: Challenge every proposal. No blind approval. Optimize for Phase 5 and Phase 10, not Phase 1.
> Verdict format: **KEEP / MODIFY / REMOVE** + technical reasoning.

---

## Executive Summary

| # | Proposal | Verdict | One-line reason |
|---|----------|---------|-----------------|
| 1 | Vehicle categories → lookup table | **MODIFY** | Lookup table yes, but fix the tenancy, uniqueness, and soft-delete model |
| 2 | Contract template snapshot (JSONB) | **MODIFY** | Snapshot yes, but store `version_id + rendered HTML + structured JSONB`, not JSONB alone |
| 3 | Agency settings table | **MODIFY** | Dedicated table yes, but typed key/value with scope, not a wide column table |
| 4 | Number sequences | **KEEP** | Correct instinct. Must be DB-driven. One refinement to the locking model |
| 5 | Role safety (membership ↔ role scope) | **MODIFY** | Do not use raw CHECK across tables; use a composite FK or trigger |
| 6 | Primary agency partial unique index | **KEEP** | Correct and idiomatic. Minor nullability note |
| E1 | Credit notes | **DEFER** | Structure the table now, build UI later — but reserve the FK |
| E2 | Audit partitioning | **MODIFY → Phase 1 spec** | Do not build partitions yet, but declare the partition key now |
| E3 | Blacklist transaction docs | **KEEP as Phase 1 doc** | Cheap, correctness-critical |

**Overall:** The philosophy ("add tables, never modify") is sound, but three of your six proposals are being implemented one abstraction level too shallow. The risk is not that you are adding tables — it is that the tables you add will *themselves* need migrations in Phase 5. Below I push each one to its final form.

---

## A Word on Your Core Philosophy

Your principles are mostly correct, but two need a sharper edge:

**"Add new tables instead of modifying existing ones."**
Correct as a default, but taken literally it produces table sprawl and join-heavy reads. The real rule is: **never modify the *shape* of a table that already holds business rows in a way that requires backfilling or breaks existing reads.** Adding a *nullable* column with a default is cheap and safe in Postgres 11+ (metadata-only change, no table rewrite). Do not contort the design to avoid *all* future `ALTER TABLE` — contort it to avoid *expensive* or *breaking* ones.

**"Backward compatibility is mandatory."**
For a database this means: additive changes only on hot tables, and every enum expressed in a way that can grow. The single most common cause of painful SaaS migrations is **Postgres native ENUM types** — see the cross-cutting section at the end. This matters more than any of your six proposals.

---

## 1. Vehicle Categories — **MODIFY**

### The three options, judged

**Free text (`vehicles.category TEXT`)** — REMOVE. This is the worst option and must not survive to Prisma. It guarantees data drift ("SUV", "suv", "S.U.V", "4x4") which destroys grouping, filtering, pricing rules, and every future report. No serious multi-tenant fleet system stores category as free text.

**Native Postgres ENUM** — REMOVE. Enums feel safe but are a migration trap. Adding a value requires `ALTER TYPE ... ADD VALUE`, which until recently could not run inside a transaction and still cannot be *removed* or *reordered*. More importantly, your requirement is explicitly **per-company custom categories**. An enum is global to the database — it cannot be scoped to a tenant. Enum is architecturally disqualified by your own requirement.

**Lookup table** — KEEP the direction. This is correct. Categories are tenant-extensible business data, not a fixed code list. They need display order, descriptions, and eventually icons, default pricing, and deposit multipliers. That is a table, full stop.

### What is wrong with your proposed table

Your draft is close but has four gaps that would themselves force a migration later:

```
vehicle_categories
- id                UUID PK
- company_id        UUID NULL        -- your draft: nullable for system categories
- key               TEXT
- name              TEXT
- description       TEXT
- display_order     INT
- created_at        TIMESTAMPTZ
```

**Gap 1 — Uniqueness is undefined.** Two categories with `key = 'suv'` in the same company must be impossible. But system categories (`company_id IS NULL`) and company categories share the table. You need a **partial unique index**:

```
UNIQUE (company_id, key)                    -- for company rows
UNIQUE (key) WHERE company_id IS NULL       -- for system rows
```

Without this you will get duplicate keys and the "which SUV did they mean" bug in Phase 2.

**Gap 2 — No soft delete.** A company will "delete" a category that still has 400 vehicles pointing at it. If you hard-delete, you orphan vehicles or violate the FK. You need `deleted_at` + `is_active`, and the FK from `vehicles.category_id` must be `ON DELETE RESTRICT`. Deletion becomes deactivation.

**Gap 3 — No `updated_at`.** Every mutable business table in this system has `updated_at`. This one is mutable (rename, reorder). Consistency matters for your audit story.

**Gap 4 — System-category override semantics undefined.** When a company wants "SUV" but with their own display order or name, do they clone the system row or reference it? Decide now. My recommendation: **companies always own their category rows.** On company creation, seed a copy of the system defaults into their `company_id`. This means `company_id` is `NOT NULL` and you drop the nullable-system-row complexity entirely. System categories become a *seed template*, not a runtime-shared row. This eliminates the partial-index split and the "can I edit a system row" ambiguity.

### Final recommended form

```
vehicle_categories
- id              UUID PK
- company_id      UUID NOT NULL FK → companies
- key             TEXT NOT NULL           -- stable machine key, e.g. 'suv'
- name            TEXT NOT NULL           -- display label, editable
- description     TEXT NULL
- display_order   INT NOT NULL DEFAULT 0
- is_active       BOOLEAN NOT NULL DEFAULT true
- created_at      TIMESTAMPTZ NOT NULL
- updated_at      TIMESTAMPTZ NOT NULL
- deleted_at      TIMESTAMPTZ NULL
UNIQUE (company_id, key) WHERE deleted_at IS NULL

vehicles
- category_id     UUID NOT NULL FK → vehicle_categories ON DELETE RESTRICT
```

**Verdict: MODIFY.** Lookup table is right; own-per-company + partial unique + soft delete is what makes it survive 10 years. This is the architecture that survives growth — free text drifts, enums cannot be tenant-scoped, and shared nullable system rows create edit-permission ambiguity.

---

## 2. Contract Template Snapshot — **MODIFY**

### The legal requirement, stated precisely

A signed contract must be reproducible **byte-for-byte** as the customer saw it, forever, even if:
- the template is edited afterwards,
- the template is deleted,
- the rendering engine changes,
- variable values (customer name, price) change in their source tables.

This is not a "nice to have." In a dispute, "show the court exactly what was signed" is the whole game. Your instinct to snapshot is correct and non-negotiable.

### Judging your options

**`template_id` alone (current)** — REMOVE. Fails every requirement above. If the template changes, history rewrites itself. This is the bug you correctly identified.

**`template_snapshot JSONB` alone** — INSUFFICIENT. JSONB preserves the *template definition* (blocks, variables, clauses) but not the *rendered output*. If your rendering logic changes in Phase 4 (new PDF engine, new handlebars version, a fixed whitespace bug), re-rendering the same JSONB produces a *different document* than what was signed. JSONB alone does not freeze the output.

**HTML alone** — INSUFFICIENT in the other direction. Frozen HTML reproduces the visual document perfectly but loses the structured data. In Phase 6 you will want to query "all contracts that included the winter-tire clause" or "contracts where deposit clause = 3000". Parsing frozen HTML for that is misery.

### The correct legal-safe architecture: store all three

```
contracts
- template_id            UUID NULL FK → contract_templates   -- provenance, may become null if template deleted
- template_version_id    UUID NULL FK → contract_template_versions
- rendered_html          TEXT NOT NULL      -- exactly what was displayed/printed, frozen
- rendered_pdf_url       TEXT NULL          -- immutable object-store URL, populated at signature
- content_snapshot       JSONB NOT NULL     -- structured blocks + resolved variable values
- content_hash           TEXT NOT NULL      -- SHA-256 of rendered_html, tamper-evidence
- signed_at              TIMESTAMPTZ NULL
```

Why each field:

- **`rendered_html`** — the frozen visual truth. Reproduces the document without re-running any engine. This is your primary legal artifact.
- **`content_snapshot` (JSONB)** — the structured truth. Preserves resolved variables and block structure so future reporting/AI can query contract contents without HTML parsing.
- **`content_hash`** — tamper evidence. If anyone ever mutates `rendered_html`, the hash mismatch proves it. Cheap insurance for a legal document.
- **`rendered_pdf_url`** — the distribution artifact. Generated once at signature, stored in immutable object storage (not the DB). Nullable because it is produced asynchronously.
- **`template_version_id`** — provenance. Ties back to *which version* produced this, without depending on it for reproduction.

### This forces a Phase 1 dependency you have not listed

You cannot have `template_version_id` without a `contract_template_versions` table. Your Phase 1 doc keeps `contract_templates` but defers the *template editor UI*. That is fine — but the **versions table must exist in Phase 1**, even if it only ever holds one auto-created version per template. Reason: contracts created in Phase 1 must point at a version row, or you will backfill version references across historical legal documents in Phase 3 — exactly the migration you are trying to avoid.

Minimal Phase 1 addition:

```
contract_template_versions
- id             UUID PK
- template_id    UUID NOT NULL FK → contract_templates
- version_number INT NOT NULL
- body           JSONB NOT NULL      -- or TEXT if you store raw template markup
- created_at     TIMESTAMPTZ NOT NULL
- created_by     UUID NULL FK → users
UNIQUE (template_id, version_number)
```

**Verdict: MODIFY.** Snapshot yes. JSONB *alone* no. Store frozen HTML + structured JSONB + hash + version reference. And promote `contract_template_versions` into Phase 1 as a blocking dependency.

---

## 3. Agency Settings — **MODIFY**

### First, challenge the premise: agency or company?

Your proposal scopes settings to `agency_id`. Push back: many of these settings (`default_currency`, `invoice_due_days`, contract defaults) are far more likely to be set **once at the company level** and only *occasionally* overridden per agency. If you build agency-only settings, the first franchise with 20 agencies will beg you for "set it once for all my agencies." That is a Phase 5 migration.

**Design for two-level resolution from day one:** company sets defaults, agency optionally overrides. This is the same pattern you will want for Phase 8 white-label and Phase 9 CRM. Build it once.

### Second, challenge the shape: wide columns vs key/value

Your draft is a wide-column table (`default_currency`, `default_deposit`, `invoice_due_days`, ...). This is the thing you *say* you want to avoid — because every new setting is a new column, i.e. an `ALTER TABLE` on a business table every few months. That directly contradicts your stated philosophy.

But the pure key/value alternative (`key TEXT, value TEXT`) is also a trap: it loses type safety, defaults, and validation, and turns every read into a string-parse.

### The judged options

| Option | New setting cost | Type safety | Query ergonomics | Verdict |
|--------|-----------------|-------------|------------------|---------|
| Columns on `agencies` | Migration each time | Strong | Trivial | REMOVE — pollutes core table |
| Wide `agency_settings` table | Migration each time | Strong | Trivial | Weak — same migration problem, one table over |
| JSON blob on `agencies` | Free | None | Poor (no constraints) | REMOVE — no validation, no defaults |
| **Typed key/value with scope** | **Free (insert a row)** | **Per-key via `value_type`** | **Good with a resolver** | **KEEP** |

### Final recommended form

```
settings
- id            UUID PK
- company_id    UUID NOT NULL FK → companies
- agency_id     UUID NULL FK → agencies        -- NULL = company-level default
- key           TEXT NOT NULL                  -- 'invoice.due_days', 'deposit.default'
- value         TEXT NOT NULL                  -- stored as text, cast on read
- value_type    TEXT NOT NULL                  -- 'int' | 'decimal' | 'bool' | 'string' | 'uuid' | 'json'
- updated_at    TIMESTAMPTZ NOT NULL
- updated_by    UUID NULL FK → users
UNIQUE (company_id, agency_id, key)
```

Resolution order at read time: **agency row → company row → application default.** Adding a new setting in Phase 6 is an `INSERT`, never a migration. Type safety is preserved via `value_type` + a typed accessor in application code. A settings *registry* (allowed keys, defaults, validation) lives in application code, not the DB — so you get validation without schema churn.

One caveat I will flag honestly: key/value settings sacrifice DB-level `CHECK` constraints on individual values. That is an acceptable trade because settings are low-volume, admin-edited, and validated in the app layer. Do not use this pattern for high-volume business data — only for configuration.

**Verdict: MODIFY.** Dedicated table yes. Wide columns no (they reintroduce the migration problem). Use scoped, typed key/value with company→agency resolution.

---

## 4. Number Sequences — **KEEP**

### You are right, and here is why it is not negotiable

Generating `RES-2026-00001` in application code has a fatal concurrency bug: two reservations created in the same millisecond both read `current_number = 41`, both write `42`. You get a duplicate business code on a legal/financial document. Under load (and a channel manager in Phase 7 *will* create bursts), this is not a theoretical race — it is a guaranteed incident.

Numbering must be **database-serialized.** Keep the table.

### Refine the concurrency model

Your table is good. The critical design decision is *how* you increment, and there are two correct approaches — pick deliberately:

**Option A — Row lock (`SELECT ... FOR UPDATE`)**
```
BEGIN;
SELECT current_number FROM number_sequences
  WHERE company_id = $1 AND entity = 'reservation'
  FOR UPDATE;                          -- serializes concurrent callers
UPDATE number_sequences SET current_number = current_number + 1 ...;
COMMIT;
```
Pro: gapless (no skipped numbers), which accountants and tax authorities often *require* for invoices. Con: the row lock serializes all creation of that entity within a company — fine at LokaRent's scale, a bottleneck only at extreme throughput.

**Option B — Postgres native `SEQUENCE`**
Fast and lock-free, but **produces gaps** on rollback and cannot be easily scoped per-company-per-year with custom reset policies. Disqualified for invoices where gapless numbering is a legal requirement in many jurisdictions (including Morocco/France-style sequential invoice numbering).

**Recommendation: Option A (row lock).** At thousands of companies each incrementing *their own* row, contention is per-tenant and negligible. Gaplessness is worth the lock. This is the standard pattern for invoice numbering in serious ERP systems.

### One addition to your table

Add a **`reset_policy` enum** (you have it) and a **`period_key`** column so yearly reset is atomic:

```
number_sequences
- id             UUID PK
- company_id     UUID NOT NULL FK → companies
- entity         TEXT NOT NULL          -- 'reservation','contract','invoice','client','vehicle'
- prefix         TEXT NOT NULL          -- 'RES','CTR','INV','CLI','VEH'
- period_key     TEXT NOT NULL          -- '2026' for yearly, 'ALL' for never-reset
- current_number BIGINT NOT NULL DEFAULT 0
- padding        INT NOT NULL DEFAULT 5
- reset_policy   TEXT NOT NULL          -- 'yearly' | 'never' | 'monthly'
- updated_at     TIMESTAMPTZ NOT NULL
UNIQUE (company_id, entity, period_key)
```

Including `period_key` in the unique constraint means the 2027 sequence is a *different row* — the yearly reset is just "insert a new row starting at 0," with no race against the 2026 row. Clean.

**Verdict: KEEP.** DB-driven numbering is mandatory. Use row-lock increment for gaplessness, and put `period_key` in the unique key so resets are atomic.

---

## 5. Role Safety — **MODIFY**

### The requirement

`company_memberships.role_id` must only point at company-scoped roles. `agency_memberships.role_id` must only point at agency-scoped roles. A user must never be assigned an agency role at company level or vice versa.

### Judging the enforcement options

**Application validation only** — REMOVE as the *sole* mechanism. It works until one code path, one background job, one data import, or one Phase 7 API integration forgets to check. Then you have a privilege-escalation bug in your permission system — the worst possible place for a silent data-integrity failure. App validation is necessary but not sufficient.

**Raw CHECK constraint** — REMOVE. A `CHECK` constraint in Postgres **cannot reference another table.** You cannot write `CHECK (role.scope = 'company')` from `company_memberships`. People try to fake it with a subquery in a CHECK — Postgres disallows subqueries in CHECK, and even where it appears to work it is not re-validated when the referenced row changes. Dead end.

**Composite foreign key (the elegant answer)** — KEEP. This is the idiomatic, zero-trigger, fully-enforced solution. Denormalize `scope` into the roles table's key and make it part of the FK:

```
roles
- id      UUID
- scope   TEXT NOT NULL            -- 'company' | 'agency'
- ...
UNIQUE (id, scope)                 -- required to be an FK target

company_memberships
- role_id     UUID NOT NULL
- role_scope  TEXT NOT NULL DEFAULT 'company'
    CHECK (role_scope = 'company')                     -- single-table CHECK, allowed
  FOREIGN KEY (role_id, role_scope) REFERENCES roles (id, scope)

agency_memberships
- role_id     UUID NOT NULL
- role_scope  TEXT NOT NULL DEFAULT 'agency'
    CHECK (role_scope = 'agency')
  FOREIGN KEY (role_id, role_scope) REFERENCES roles (id, scope)
```

Now the database *physically cannot* store an agency role in a company membership: the composite FK would fail because no `(role_id, 'company')` pair exists for an agency role. The single-table `CHECK` on `role_scope` is legal because it references only the local column. This is enforced at the storage layer, works for every code path including raw SQL and imports, and needs no trigger.

**Trigger** — only if Prisma cannot express the composite FK cleanly. Prisma *can* model composite relations via `@relation(fields: [...], references: [...])` with a compound `@@unique([id, scope])` on `roles`. So you should not need a trigger. Keep triggers as the fallback, not the primary.

**Verdict: MODIFY.** Do not rely on app validation alone, and do not attempt a cross-table CHECK (impossible). Use a **composite foreign key** on `(role_id, role_scope)` — database-enforced, trigger-free, Prisma-expressible.

---

## 6. Primary Agency — **KEEP**

### The requirement

A user has many agency memberships; at most one is `is_primary = true`.

### Judgment

Partial unique index is exactly right and is the canonical Postgres solution:

```
CREATE UNIQUE INDEX one_primary_agency_per_user
  ON agency_memberships (user_id)
  WHERE is_primary = true;
```

This permits many `is_primary = false` (or NULL) rows and exactly one `true` per user. Idiomatic, cheap, enforced at storage layer.

### Two refinements

**1. Use `false` default, not nullable.** If `is_primary` is nullable, a partial index `WHERE is_primary = true` still works, but you invite three-valued-logic bugs in application queries (`WHERE is_primary` behaves oddly with NULL). Make it `BOOLEAN NOT NULL DEFAULT false`. Cleaner semantics.

**2. Consider whether "primary" belongs on the membership at all.** Alternative architecture: store `primary_agency_id` on the `users` table (or a user-preferences row) as a single nullable FK. Compare:

| Approach | Enforces "one primary" | Extra write on switch | Read cost |
|----------|------------------------|----------------------|-----------|
| `is_primary` + partial index | Yes, at storage | Must flip old row false, new row true (2 writes, needs transaction) | Join to find it |
| `users.primary_agency_id` FK | Yes, trivially (one column) | Single update | Already on user row |

The `users.primary_agency_id` approach is arguably *simpler*: setting primary is a one-column update with no need to clear a previous flag, and the FK guarantees it points at a real agency. The only care needed: an `ON DELETE SET NULL` so removing the agency membership nulls the preference.

I would still accept your partial-index approach — it is correct. But if you want the *simplest* thing that scales, `users.primary_agency_id` with `ON DELETE SET NULL` wins on write simplicity. Your call; both survive 10 years.

**Verdict: KEEP** (partial unique index is correct), with a nudge toward `users.primary_agency_id` if you value write simplicity over co-locating the flag on the membership.

---

## Existing Suggestions — Re-judged

### E1. Credit Notes — **DEFER, but reserve the shape**

A credit note is a financial reversal of an invoice (partial refund, cancellation adjustment, goodwill). You do *not* need the workflow in Phase 1 — but you must not let Phase 1 invoices become un-reversible in a way that forces a schema change later.

**Phase 1 action:** Do **not** build the credit-notes UI or table now. **Do** ensure `invoices` has a nullable self-reference `parent_invoice_id UUID NULL FK → invoices` and a `document_type` field (`'invoice' | 'credit_note'`). This means a credit note is just an invoice with `document_type = 'credit_note'` and a `parent_invoice_id`. When you build the feature in Phase 4, it is pure application logic — zero migration. This is the cheapest possible future-proofing and directly serves your "reference existing UUIDs" principle.

If you would rather keep invoices strictly single-purpose, then at minimum reserve the column names now. Adding a nullable FK later is technically a metadata-only change in Postgres, so this is a *soft* requirement — but reserving it costs nothing and removes all doubt.

**Verdict: DEFER the feature, adopt `document_type` + `parent_invoice_id` on `invoices` now.**

### E2. Audit Partitioning — **MODIFY to a Phase 1 declaration, not a Phase 1 build**

Do **not** build partitions in Phase 1. At low volume they add operational complexity (partition maintenance, `pg_partman` or manual DDL) for no benefit. Premature partitioning is as bad as premature sharding.

**But** — converting a large, populated table to a partitioned table later is a genuinely painful migration (you cannot `ALTER TABLE ... PARTITION BY` an existing table in place; you create a new partitioned table and copy). So make **one** cheap Phase 1 decision: declare `audit_logs` and `activity_logs` with `created_at` as an intended partition key and *document* that they will become `PARTITION BY RANGE (created_at)` when they cross ~50M rows. If you want to be truly safe, you can create them partitioned-from-day-one with a single default partition — Prisma does not manage this well, so I would instead **document the trigger and the plan** and keep the tables plain until the threshold.

**Verdict: keep tables plain in Phase 1, but write the partition key and 50M-row trigger into the Phase 1 spec so the future migration is planned, not discovered.**

### E3. Blacklist Transaction Documentation — **KEEP as Phase 1 requirement**

When a customer is blacklisted, two things must happen atomically: the `customer_blacklist` row is inserted **and** the customer's status is updated **and** an audit entry is written. If these are not in one transaction, a crash mid-operation leaves a customer flagged in one table and clean in another — a correctness and liability hole. This costs nothing (it is a documentation + code-review requirement, not a schema change) and prevents a class of bug in a legally sensitive feature.

**Verdict: KEEP.** Make "blacklist mutations are transactional" a written Phase 1 invariant.

---

## Full Re-Scan: Other Migration Landmines Before Prisma

You asked me to look through the *entire* architecture again. Here are the issues I would fix **before** generating Prisma models, ordered by how painful they become if deferred.

### CRITICAL-1 — Native Postgres ENUMs anywhere

This is the single biggest 10-year risk and it is bigger than any of your six proposals. Every status field (`reservation.status`, `payment.status`, `contract.status`, `vehicle.status`, `document_type`, `value_type`, `reset_policy`, `role.scope`, reservation source, etc.) is a candidate for a native `enum`. **Do not use native Postgres enums for anything that might grow.**

Reasons: you cannot remove or reorder enum values, adding values historically fought transactions, and Prisma enum changes generate fragile migrations. When you add a reservation status `'awaiting_deposit'` in Phase 3, a native enum makes it a schema migration on a hot table; a `TEXT` + `CHECK` (or a lookup table) makes it trivial.

**Rule:**
- Small, stable, app-controlled sets (`role.scope`, `value_type`) → `TEXT` + single-table `CHECK`.
- Sets that are business-extensible or tenant-visible (reservation source, vehicle category, alert type, payment method) → **lookup table**.
- Avoid native `enum` type entirely. In Prisma, model these as `String` with app-level validation or as relations to lookup tables.

This one decision prevents more migrations than everything else in this document combined.

### CRITICAL-2 — Money stored as float

If any monetary column (`price_per_day`, `total`, `deposit`, `late_fee`, invoice amounts) is a floating-point type, you have a rounding-error time bomb that corrupts financial reports and never fully goes away. Verify every money column is `NUMERIC(12,2)` (or `BIGINT` minor units). This is nearly impossible to migrate cleanly once real transactions exist because you cannot retroactively recover the correct rounding. Fix before Prisma.

### CRITICAL-3 — No currency column next to money

You have `default_currency` in settings, but individual financial rows (invoices, payments, reservation pricing snapshots) should each carry their own `currency CHAR(3)`. The moment a company operates in two countries (your Phase-10 multi-country goal), a global currency setting is wrong and backfilling currency onto historical financial rows is a nightmare. Add `currency` to every money-bearing table now, defaulted from settings.

### HIGH-1 — `updated_at` / soft-delete consistency

Confirm **every** business table has the full lifecycle quartet: `created_at`, `updated_at`, `deleted_at`, and (where relevant) `created_by` / `deleted_by`. Adding `deleted_at` later is cheap; the expensive part is retrofitting the *query layer* to respect it. Decide the global soft-delete convention now and apply it uniformly so Prisma middleware can enforce it in one place.

### HIGH-2 — Reservation source as text vs lookup

If reservation `source` (walk-in, phone, website, Booking.com, marketplace) is free text or a native enum, your Phase 7 channel manager will force a migration. Make it a **lookup table** (`reservation_sources`) now — it is exactly the "reference existing UUIDs" pattern you want, and channel manager integrations become inserts.

### HIGH-3 — Polymorphic `documents` table lacks a composite index

The `documents` table uses `entity_type + entity_id`. Confirm there is a composite index `(entity_type, entity_id)` and, for tenancy, `(company_id, entity_type, entity_id)`. Without it, "show all documents for this vehicle" becomes a sequential scan once the table has millions of rows across all tenants. Cheap now, painful (and blocking) later.

### MEDIUM-1 — Timezone: `TIMESTAMPTZ` everywhere

Verify no column is `TIMESTAMP` (without time zone). A multi-country platform with `TIMESTAMP` columns produces off-by-hours bugs in reservations that span DST or cross borders. Converting the column type later requires knowing the original zone of every stored value — often unrecoverable. All datetimes `TIMESTAMPTZ`, stored in UTC.

### MEDIUM-2 — Tenant scoping index discipline

Every business table has `company_id`. Confirm each one has an index that *leads* with `company_id` (usually a composite like `(company_id, created_at)` or `(company_id, status)`). A `company_id` that is only an FK without a supporting index means every tenant-scoped query scans cross-tenant data. At thousands of companies this is the difference between 2ms and 2s. This is the most common performance regression in multi-tenant SaaS.

### MEDIUM-3 — `key` immutability on lookup/settings tables

For `vehicle_categories.key`, `settings.key`, etc., decide now that `key` is immutable after creation (rename `name`, never `key`). If keys are editable, every place that references a key by string breaks. Document it; optionally enforce with a trigger. Cheap now.

---

## Final Verdict Table

| Item | Verdict | Must-fix before Prisma? |
|------|---------|--------------------------|
| 1. Vehicle categories | MODIFY (own-per-company lookup + partial unique + soft delete) | Yes |
| 2. Contract snapshot | MODIFY (HTML + JSONB + hash + version; promote versions table to Phase 1) | Yes |
| 3. Agency settings | MODIFY (scoped typed key/value, company→agency) | Yes |
| 4. Number sequences | KEEP (row-lock + period_key) | Yes |
| 5. Role safety | MODIFY (composite FK, not CHECK, not app-only) | Yes |
| 6. Primary agency | KEEP (partial unique; consider users.primary_agency_id) | No, but decide |
| E1. Credit notes | DEFER feature, add `document_type`+`parent_invoice_id` now | Recommended |
| E2. Audit partitioning | DECLARE plan now, build at 50M rows | Doc only |
| E3. Blacklist transactions | KEEP as Phase 1 invariant | Doc only |
| C1. No native enums | NEW — critical | **Yes** |
| C2. Money = NUMERIC | NEW — critical | **Yes** |
| C3. Per-row currency | NEW — critical | **Yes** |
| H1. Soft-delete uniformity | NEW — high | Yes |
| H2. Reservation source lookup | NEW — high | Yes |
| H3. documents composite index | NEW — high | Yes |
| M1. TIMESTAMPTZ everywhere | NEW — medium | Yes |
| M2. company_id-leading indexes | NEW — medium | Yes |
| M3. Immutable keys | NEW — medium | Recommended |

## Bottom Line

Your six proposals are directionally correct — you have good architectural instincts. But four of six were pitched one level too shallow and would have needed their *own* migrations in Phase 5. The bigger finding: **the three biggest 10-year risks are not in your proposal list at all** — native enums, float money, and missing per-row currency. Fix those three plus the modified versions of your six, and this schema will realistically survive 5–10 years of growth with only additive, non-breaking migrations.

**Do not generate Prisma models until CRITICAL-1, CRITICAL-2, and CRITICAL-3 are resolved.** Everything else can be layered in, but those three are effectively unrecoverable once production data exists.
