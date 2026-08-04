# Documentation Index

> Single catalog of every approved document in this repository.
> This file **references** existing documentation — it does not replace it.
> If you are an AI agent, read [`AGENTS.md`](AGENTS.md) first, then return here.

**Last inventoried:** July 5, 2026
**Documents catalogued:** 15 (14 Markdown + 1 text diagram)
**New documents created during inventory:** 2 (`AGENTS.md`, `DOCUMENTATION_INDEX.md`)

---

## 1. How This Repository's Documentation Is Organized

Documentation was produced in three waves, which is why filenames are not yet numbered:

1. **Multi-Agency Analysis wave** (June 29, 2026) — a 7-document suite analyzing the workspace/settings frontend and specifying the first backend contracts.
2. **Platform Audit wave** (June 2026) — a single CTO-level audit describing the single-tenant → multi-tenant SaaS evolution.
3. **Database & System Design wave** (latest, definitive) — a 6-document database series plus a full system blueprint. This wave is the **current source of truth** for data modeling.

The numbering system proposed in Section 4 groups these into stable categories **without renaming files yet** — renames are recommendations only, pending owner approval.

---

## 2. Documentation Inventory

### Category: Project Overview

#### `README_ANALYSIS.md`
- **Purpose:** Executive summary of the multi-agency frontend implementation.
- **Summary:** High-level status of all 33 pages, architecture quality indicators, data-model consolidation decisions, and the path to backend implementation. Best first read for non-database context.
- **Category:** 01 — Project
- **Priority:** High (entry point for the multi-agency work)
- **Recommendation:** **Keep** — rename to `01-project-overview.md` under the proposed scheme.

---

### Category: Architecture

#### `ARCHITECTURE_AUDIT.md`
- **Purpose:** CTO-level architectural audit and multi-tenant SaaS evolution roadmap.
- **Summary:** Describes what LokaRent currently is (single-tenant Next.js 16 app, 19 pages, 14 data schemas), the SaaS vision (multi-agency, cross-agency roles, billing, isolation), and the evolution plan. The strategic "why" behind the whole platform.
- **Category:** 02 — Architecture
- **Priority:** High (strategic direction)
- **Recommendation:** **Keep** — rename to `02-architecture-audit.md`.

#### `SYSTEM_BLUEPRINT.md`
- **Purpose:** Full system blueprint — journeys, workflows, modules, roadmap.
- **Summary:** 15-section blueprint covering high-level architecture, 7 user journeys, 6 business workflows, module map, dashboard/KPI strategy, permission matrix, lifecycle diagrams, automation flows, background jobs, folder architecture, and an 11-phase development roadmap. The operational companion to the database series.
- **Category:** 02 — Architecture
- **Priority:** High (implementation-defining)
- **Recommendation:** **Keep** — rename to `02-system-blueprint.md`.

#### `ARCHITECTURE_ANALYSIS.md`
- **Purpose:** Deep technical analysis of the workspace/settings frontend.
- **Summary:** Documents 3 redundancies (user management, permissions, teams) and their resolutions, consistency analysis, orphaned/missing pages, and backend schema recommendations for the workspace domain.
- **Category:** 02 — Architecture
- **Priority:** Medium (largely resolved; historical rationale)
- **Recommendation:** **Keep** — rename to `02-architecture-analysis-workspace.md`. Its schema section is superseded by the Database series (see Section 3).

#### `ARCHITECTURE_DIAGRAM.txt`
- **Purpose:** Visual (ASCII) architecture diagram of navigation and data flow.
- **Summary:** Navigation hierarchy, per-page detail for workspace/settings, data-flow layers, permission layers, and component reusability map. Referenced heavily by the analysis suite.
- **Category:** 02 — Architecture
- **Priority:** Medium (visual aid)
- **Recommendation:** **Keep** — rename to `02-architecture-diagram.txt`.

---

### Category: Database

> These six documents form one evolutionary series. Read them newest-authority-first.
> `DATABASE_SPECIFICATION.md` + `DATABASE_PHASE1.md` are the **current source of truth**.
> The earlier documents are retained for the design rationale and review trail.

#### `DATABASE_SPECIFICATION.md`
- **Purpose:** Complete, build-ready database specification.
- **Summary:** Global rules (UUID v7, tenant scoping, money, timestamps, soft delete), per-table specification, transactions, concurrency/race-condition patterns, validation, constraints, performance, security, and migration strategy. Ends with a pre-Prisma checklist. **Status: ready for Prisma generation.**
- **Category:** 03 — Database
- **Priority:** Critical (authoritative)
- **Recommendation:** **Keep** — rename to `03-database-specification.md`.

#### `DATABASE_PHASE1.md`
- **Purpose:** Phase 1 (MVP) database scope — the 55 tables to build first.
- **Summary:** Defines exactly which tables ship in Phase 1 vs. which are postponed, with a table-by-table explanation, ERD, future-module roadmap, and evolution examples showing zero-modification extensibility.
- **Category:** 03 — Database
- **Priority:** Critical (defines build scope)
- **Recommendation:** **Keep** — rename to `03-database-phase1.md`.

#### `DATABASE_DOMAIN_DESIGN.md`
- **Purpose:** Domain-level data design — ownership, cascade, events, indexes.
- **Summary:** 11 domains with entity relationships, row-level ownership rules, delete/cascade rules, UUID strategy, settings ownership, 61 domain events, file ownership, and index strategy.
- **Category:** 03 — Database
- **Priority:** High (design authority for ownership/events)
- **Recommendation:** **Keep** — rename to `03-database-domain-design.md`.

#### `DATABASE_ARCHITECTURE.md`
- **Purpose:** Original full business-domain & database blueprint.
- **Summary:** The first comprehensive schema across all domains including multi-tenancy, subscriptions, RBAC, and every future module. Broader than Phase 1; portions are superseded by the Phase 1 + Specification split.
- **Category:** 03 — Database
- **Priority:** Medium (superseded scope, useful for long-term vision)
- **Recommendation:** **Keep, mark superseded** — rename to `03-database-architecture-full-vision.md`. Consider **merging** its still-unique long-term-vision sections into `DATABASE_PHASE1.md`'s roadmap, then archiving.

#### `DATABASE_DEFENSE.md`
- **Purpose:** Table-by-table architecture defense/challenge.
- **Summary:** Challenges every Phase 1 table ("is this really needed today?") and surfaces three blocking issues before Prisma. A review artifact, not a schema definition.
- **Category:** 03 — Database
- **Priority:** Low (review trail; conclusions folded into Specification)
- **Recommendation:** **Archive** — rename to `03-database-defense-review.md` and move to an `archive/` section once its findings are confirmed resolved in `DATABASE_SPECIFICATION.md`.

#### `DATABASE_FINAL_REVIEW.md`
- **Purpose:** Final architecture review before Prisma, with verdicts.
- **Summary:** Reviews six schema proposals with keep/modify verdicts and flags the three unrecoverable risks (native enums, float money, missing per-row currency). Review artifact.
- **Category:** 03 — Database
- **Priority:** Low (review trail; conclusions folded into Specification)
- **Recommendation:** **Archive** — rename to `03-database-final-review.md`. Keep accessible; its verdicts justify decisions in the Specification.

---

### Category: Development / Handoff

#### `API_CONTRACTS.md`
- **Purpose:** Backend API endpoint specifications for the multi-agency frontend.
- **Summary:** 50+ REST endpoints (users, permissions, teams, invitations, agencies, billing, audit) with query params, request/response shapes, status codes, and error formats.
- **Category:** 05 — Development
- **Priority:** High (backend contract)
- **Recommendation:** **Keep** — rename to `05-api-contracts.md`. Validate against the current Database series before implementation (naming drift possible: e.g. `workspace_memberships` vs. current membership tables).

#### `HANDOFF_CHECKLIST.md`
- **Purpose:** Frontend→backend handoff checklist and rollout plan.
- **Summary:** Pre-backend verification, 3-phase backend plan, database-schema checklist, permission-enforcement points, testing strategy, security checklist, and rollout plan.
- **Category:** 05 — Development
- **Priority:** Medium (process guide)
- **Recommendation:** **Keep** — rename to `05-handoff-checklist.md`.

---

### Category: Reference / Navigation

#### `ANALYSIS_INDEX.md`
- **Purpose:** Navigation guide for the Multi-Agency Analysis suite.
- **Summary:** Reading paths by role, cross-references, and document statistics for the 7-document analysis wave.
- **Category:** 07 — Reference
- **Priority:** Low (now superseded by this file)
- **Recommendation:** **Merge → archive.** Its navigation role is replaced by `DOCUMENTATION_INDEX.md`. Fold any still-useful role-based reading paths into `AGENTS.md`, then archive.

#### `ANALYSIS_SUMMARY.md`
- **Purpose:** Analysis summary + post-implementation checklist for multi-agency work.
- **Summary:** Overlaps heavily with `README_ANALYSIS.md` — same status, decisions, redundancy resolutions, and roadmap, with an added post-implementation testing checklist.
- **Category:** 01 — Project (overlaps README_ANALYSIS)
- **Priority:** Low (duplicate content)
- **Recommendation:** **Merge** into `README_ANALYSIS.md` (keep the unique post-implementation testing checklist), then archive.

---

## 3. Detected Overlaps & Duplication

| Overlap | Documents | Action |
|---------|-----------|--------|
| Multi-agency executive summary stated 3× | `README_ANALYSIS.md`, `ANALYSIS_SUMMARY.md`, `ANALYSIS_INDEX.md` | Keep `README_ANALYSIS.md` as canonical; merge unique bits from the other two; archive them. |
| Backend schema defined in multiple places | `ARCHITECTURE_ANALYSIS.md` (workspace SQL), `ANALYSIS_SUMMARY.md` (SQL), Database series | Database series (`DATABASE_SPECIFICATION.md` + `DATABASE_PHASE1.md`) is authoritative. Mark the analysis-wave SQL as historical. |
| Database design iterated across 6 files | All `DATABASE_*.md` | Keep Specification + Phase1 + Domain Design as active; archive Defense + Final Review; mark Architecture (full vision) as superseded. |
| Navigation/index role | `ANALYSIS_INDEX.md` vs `DOCUMENTATION_INDEX.md` | This file supersedes `ANALYSIS_INDEX.md`. |

---

## 4. Detected Missing Documentation

| Missing Topic | Why It Matters | Status |
|---------------|----------------|--------|
| **Single AI-agent entry point** | No file told agents where to start or which doc is authoritative. | ✅ Created: `AGENTS.md` |
| **Master documentation catalog** | No single index spanning all three doc waves. | ✅ Created: this file |
| **Business rules as standalone doc (04)** | Business rules currently live inside `SYSTEM_BLUEPRINT.md` §8. | Not yet needed — reference the blueprint section. Extract only if it grows. |
| **AI/LLM integration doc (06)** | No AI features documented yet. | Not applicable until AI features are planned. |

No other documents should be created. All remaining topics are already covered by the existing files above.

---

## 5. Proposed Standardized Numbering System

Filenames are **not yet changed** — this is the recommended target once an owner approves. Each existing document maps to exactly one category.

```
01 - Project
     README_ANALYSIS.md            → 01-project-overview.md
     (ANALYSIS_SUMMARY.md merged into the above)

02 - Architecture
     ARCHITECTURE_AUDIT.md         → 02-architecture-audit.md
     SYSTEM_BLUEPRINT.md           → 02-system-blueprint.md
     ARCHITECTURE_ANALYSIS.md      → 02-architecture-analysis-workspace.md
     ARCHITECTURE_DIAGRAM.txt      → 02-architecture-diagram.txt

03 - Database
     DATABASE_SPECIFICATION.md     → 03-database-specification.md      (SOURCE OF TRUTH)
     DATABASE_PHASE1.md            → 03-database-phase1.md             (SOURCE OF TRUTH)
     DATABASE_DOMAIN_DESIGN.md     → 03-database-domain-design.md
     DATABASE_ARCHITECTURE.md      → 03-database-architecture-full-vision.md (superseded)
     DATABASE_DEFENSE.md           → archive/03-database-defense-review.md
     DATABASE_FINAL_REVIEW.md      → archive/03-database-final-review.md

04 - Business
     (covered by SYSTEM_BLUEPRINT.md §8 — no separate file yet)

05 - Development
     API_CONTRACTS.md              → 05-api-contracts.md
     HANDOFF_CHECKLIST.md          → 05-handoff-checklist.md

06 - AI
     AGENTS.md                     → entry point (kept at repo root, not renamed)

07 - Reference
     DOCUMENTATION_INDEX.md        → this file (kept at repo root, not renamed)
     (ANALYSIS_INDEX.md merged into this file, then archived)
```

> **Note:** `AGENTS.md` and `DOCUMENTATION_INDEX.md` stay at the repository root with their conventional names so tools and agents can find them automatically. They are not renamed into the numbered scheme.

---

## 6. Source-of-Truth Hierarchy

When two documents disagree, follow this order:

1. `DATABASE_SPECIFICATION.md` and `DATABASE_PHASE1.md` — for anything about data, tables, or persistence.
2. `DATABASE_DOMAIN_DESIGN.md` — for ownership, cascade, events, and indexes.
3. `SYSTEM_BLUEPRINT.md` — for workflows, permissions, roadmap, and module boundaries.
4. `ARCHITECTURE_AUDIT.md` — for strategic/multi-tenant direction.
5. `API_CONTRACTS.md` — for endpoint shapes (validate names against the Database series).
6. Everything else — historical context and rationale only.

---

## 7. Change Log

| Date | Change |
|------|--------|
| July 5, 2026 | Initial inventory of 15 documents; created `AGENTS.md` and `DOCUMENTATION_INDEX.md`; proposed numbering scheme and merge/archive recommendations. No existing document was modified. |
| July 8, 2026 | Pre-Prisma domain expansion. Updated `DATABASE_DOMAIN_DESIGN.md`, `DATABASE_PHASE1.md`, and `DATABASE_ARCHITECTURE.md` with: (1) Customer Management — added `customer` types (individual / company), `customer_contacts` table, `customer_businesses` as billing entity on invoices, ownership and invoice-relation rules; (2) Finance Domain — added invoice lifecycle states, invoice ownership, numbering strategy (`INV-{AGENCY_CODE}-{YEAR}-{SEQ}`), and relations to customers/companies/reservations/payments; (3) Driver Domain — new domain with 5 tables (`drivers`, `driver_pricing_rules`, `driver_payments`, `driver_documents`, `driver_reservation_assignments`), three pricing models (monthly / hourly / mission), payment history, document tracking, and reservation assignment. Domain count grew from 11 to 13; table count grew from 49 to 56 in domain design, 52 to 59 in Phase 1 scope. |
