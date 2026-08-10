# AGENTS.md

> **Single entry point for every AI agent working in this repository.**
> Read this file before doing anything else.

LokaRent is a production-grade multi-tenant SaaS ERP for car rental companies.

The architecture is frozen.

Your responsibility is to implement the project without changing the approved architecture.

---

# Current Project Status

The following phases are COMPLETE and MUST NOT be recreated unless explicitly requested.

✅ Architecture

✅ Prisma Schema

✅ Prisma Audit

✅ Prisma Migrations

✅ Raw SQL Constraints

✅ Seed

✅ Repository Layer

✅ Services

✅ Authentication

✅ Current Company Context

✅ Current Agency Context

✅ Permissions

✅ Onboarding

✅ Clients CRUD

✅ Cars CRUD

✅ Vehicle Pricing Rules

✅ Vehicle Photos

✅ Drivers CRUD

✅ Reservations CRUD

✅ Contracts CRUD

Current implementation phase:

➡ Finances CRUD

Upcoming phases:

- Workspace / Settings integration
- Alerts / Calendar / Reports integration
- Dashboard
- Notifications
- Billing
- Production

Never regenerate completed phases unless explicitly instructed.

---

# Mandatory Startup Sequence

Every agent must follow these steps.

1. Read `AGENTS.md` completely.

2. Open `DOCUMENTATION_INDEX.md`.

3. Read ONLY the documents required for the requested task.

4. Never reread the whole documentation unless absolutely necessary.

5. Inspect the existing implementation before creating or replacing anything.

6. Reuse the existing implementation whenever possible.

7. Never contradict the approved architecture.

---

# Efficient Reading Policy

Do NOT reread every architecture document for every task.

Always read:

- `AGENTS.md`

Then inspect only the files directly related to the requested task.

Use the existing implementation as the primary reference for already implemented features and approved UI.

Only return to architecture documents if:

- the requested task changes architecture
- there is a real ambiguity
- two documents conflict
- a persistence/schema decision is required
- AGENTS.md explicitly instructs you to read a specific document

Avoid wasting context window by rereading large documentation unnecessarily.

---

# The Golden Rules

The architecture is frozen.

Do NOT redesign it.

Do NOT simplify it.

Do NOT modernize it.

Do NOT replace it with your preferred architecture.

Implement exactly what already exists.

Never invent:

- new folders
- new architectural patterns
- new repositories
- new services
- new DTO patterns
- new workflows
- new permissions
- replacement UI
- parallel implementations

unless explicitly requested or genuinely required by the approved architecture.

Before creating something new, verify that an equivalent implementation does not already exist.

---

# Source of Truth Hierarchy

Higher priority wins.

When documents disagree, follow this order:

1. `FINAL_DATABASE_SOURCE_OF_TRUTH.md`

2. `PRISMA_IMPLEMENTATION_PLAN.md`

3. `DATABASE_SPECIFICATION.md`
   `DATABASE_PHASE1.md`

4. `DATABASE_DOMAIN_DESIGN.md`

5. `SYSTEM_BLUEPRINT.md`

6. `ARCHITECTURE_AUDIT.md`

7. `API_CONTRACTS.md`

8. Everything else

The current certified Prisma schema and applied migrations are the implementation truth for the database after approved schema changes have been completed.

If a documentation conflict would require an architecture, schema, security, or business-rule decision:

STOP.

Explain the conflict.

Do NOT invent a solution.

---

# Task Routing

## Prisma / Database

Read only when required:

- `FINAL_DATABASE_SOURCE_OF_TRUTH.md`
- `PRISMA_IMPLEMENTATION_PLAN.md`
- `DATABASE_SPECIFICATION.md`
- `DATABASE_PHASE1.md`
- `DATABASE_DOMAIN_DESIGN.md`

Always inspect the current Prisma schema and migrations.

---

## Repository Layer

Read:

- `SYSTEM_BLUEPRINT.md`
- Existing Repository implementation
- Prisma schema

---

## Services

Read:

- `SYSTEM_BLUEPRINT.md`
- Existing Service implementation
- Repository implementation

---

## Authentication

Read:

- `SYSTEM_BLUEPRINT.md`
- Existing Authentication implementation

---

## Permissions / RBAC

Read:

- `SYSTEM_BLUEPRINT.md`
- `DATABASE_DOMAIN_DESIGN.md`
- Existing RBAC implementation

---

## CRUD Modules

Read:

- `SYSTEM_BLUEPRINT.md`
- Existing module implementation
- Relevant Prisma models

The existing approved UI is the primary presentation/UX reference.

---

## Contracts

Read:

- `SYSTEM_BLUEPRINT.md`
- Relevant Contract database documentation
- Existing Contract module implementation
- Reservation pricing snapshot implementation

Contract implementation must preserve historical/legal integrity.

---

## Finances

Read:

- `SYSTEM_BLUEPRINT.md`
- Relevant Finance database documentation
- Existing Finance module implementation

Use Decimal-safe monetary calculations.

---

## Dashboard

Read:

- `SYSTEM_BLUEPRINT.md`

---

## Notifications

Read:

- `SYSTEM_BLUEPRINT.md`

---

## Billing

Read:

- `SYSTEM_BLUEPRINT.md`

---

## Production

Read:

- `SYSTEM_BLUEPRINT.md`

---

## API

Read:

- `API_CONTRACTS.md`

Always validate field names against the Prisma schema.

---

## Multi-Tenant

Read:

- `ARCHITECTURE_AUDIT.md`
- Existing Current Company / Current Agency Context implementation

---

## Finding Documentation

Read:

- `DOCUMENTATION_INDEX.md`

---

# Global Implementation Rules

The following implementation decisions are frozen.

## General

Use:

- TypeScript
- Functional programming
- Existing project patterns
- Existing utilities
- Existing module boundaries

Do NOT use:

- classes
- inheritance
- abstract repositories
- BaseRepository
- GenericRepository
- DI containers unless already explicitly approved

Repositories and Services are function-based.

---

# Repository Layer

Repositories only perform database access.

Repositories NEVER contain:

- business logic
- validation
- authorization
- permissions
- notifications
- UI logic

Repositories receive trusted/scoped parameters such as:

- prisma / transaction client
- companyId
- agencyId when required

Repositories return plain data.

Repositories must never bypass tenant scope.

---

# Services

Services own:

- business rules
- workflows
- transactions
- orchestration
- lifecycle rules
- domain validation
- coordination between repositories

Services call repositories.

Repositories never call services.

Services must not contain:

- React
- UI state
- toast logic
- HTTP-specific presentation logic
- translated user-facing prose

Use stable error codes and translate them at the presentation boundary.

---

# Prisma

Prisma schema is frozen by default.

Do NOT modify:

- `schema.prisma`
- existing migrations
- seed

unless explicitly requested or an approved task specifically requires the schema change.

For an approved schema change:

1. Verify the change is actually required.
2. Keep it minimal.
3. Create a NEW migration.
4. Never edit an already applied migration.
5. Never use `db push` as a migration substitute.
6. Never reset production/shared databases.
7. Run Prisma format.
8. Run Prisma validate.
9. Run Prisma generate when required.
10. Apply migration through the approved migration workflow.
11. Verify migration status.
12. Verify the resulting database objects directly when appropriate.
13. Update the relevant authoritative database documentation.

Use the shared Prisma client only.

---

# IDs

Primary keys generated by the application use the canonical UUID v7 strategy.

Use the existing:

`createId()`

Rules:

- Services/factories generate IDs for new business entities.
- UI must not generate trusted entity primary keys.
- Browser payloads must not control new primary keys.
- Do not introduce autoincrement or UUID v4 for application entities unless explicitly approved.
- Better Auth must continue using the approved shared ID strategy where configured.

---

# Transactions

Multi-repository business workflows must use the existing transaction abstraction.

Keep atomic operations atomic.

Examples include:

- reservation confirmation
- pricing snapshot creation
- contract lifecycle mutations
- payment/deposit mutations
- permission overrides
- onboarding completion
- multi-table entity creation

Audit/activity/timeline writes that belong to a mutation must occur in the same transaction where required.

Do not perform external network/storage/email calls inside database transactions.

---

# Multi-Tenant Rules

Every tenant query must be scoped.

Company data:

`companyId`

Agency data:

`companyId + agencyId`

Never query tenant data without tenant scope.

Never bypass tenant isolation.

Never trust browser-provided tenant scope.

Actions/Controllers derive trusted scope from:

- authenticated session
- Current Company Context
- Current Agency Context

Browser payloads must never be authoritative for:

- companyId
- agencyId
- actor userId
- createdBy
- updatedBy
- cancelledBy
- ownership IDs

Entity IDs received from the browser are operation targets only and must be verified against trusted tenant scope server-side.

---

# Authorization / RBAC

Server-side authorization is mandatory.

Hiding a button in React is NOT authorization.

Use the existing permission registry and exact canonical permission keys.

Do NOT invent permission keys.

Permission resolution must preserve:

- trusted context
- role permissions
- active permission overrides
- GRANT overrides
- DENY overrides
- expiry handling
- default deny behavior

DENY/GRANT behavior must remain consistent with the approved RBAC implementation.

---

# Naming Rules

Respect existing naming.

Never rename existing:

- folders
- models
- DTOs
- services
- repositories
- actions
- permission keys
- enums

without explicit approval.

Use existing naming conventions.

---

# Folder Rules

Never create a parallel architecture.

Reuse existing folders.

Only create files where they belong.

Before creating a file:

1. Search for an existing equivalent.
2. Inspect the current module.
3. Reuse or extend existing code where appropriate.

Do not create:

- V2 implementations
- temporary parallel modules
- duplicate repositories
- duplicate services
- alternate form systems
- replacement components

unless explicitly requested.

---

# Existing UI Is Frozen

Existing pages, components, layouts, workflows, and visual designs are product-approved.

When connecting a module to the backend:

- reuse the existing UI
- replace mock data/handlers only
- preserve the approved workflow
- preserve the existing design
- preserve the existing layout
- preserve existing interactions
- preserve existing animations
- preserve existing responsive behavior
- preserve step order
- preserve drawers/dialogs/sheets
- preserve field grouping unless explicitly requested otherwise

Do NOT redesign.

Do NOT create replacement components.

Do NOT create parallel V2 implementations.

Do NOT change workflow or step order.

A UI redesign is allowed ONLY when explicitly requested by the user.

---

# UI Preservation Rules

Before creating ANY page or React component:

1. Search the existing repository for an equivalent implementation.
2. Inspect the current module UI and its existing components.
3. Check git history/diff when a previously existing implementation may have been replaced.
4. Determine whether the requested task is backend integration rather than UI creation.

For backend integration tasks:

- Existing UI is the canonical product UI.
- Replace mock data and mock handlers only.
- Connect existing UI to Actions/Services/Repositories.
- Do not recreate an existing page.
- Do not approximate an existing design with a new component.
- Do not remove existing fields because persistence is missing.
- Do not silently change user workflow.

If an existing UI field has no persistence support:

STOP that specific field integration.

Report the persistence gap.

Do not silently remove the field.

Do not fake persistence in React.

Do not invent a schema change unless approved.

Creating a new page/component for an existing feature requires explicit user approval.

---

# UI ↔ Backend Field Integrity

Before integrating an existing form with the backend, audit every field through:

UI
→ Validator
→ Action/Controller
→ Service
→ Repository
→ Prisma
→ Edit preload
→ Details readback

No user-editable field may be silently discarded.

Verify that:

- Create persists it.
- Edit preloads it.
- Update persists it.
- Details reads the same canonical value.
- Filters use the canonical persisted field.
- Search uses server-side persisted fields.

If a UI field has no canonical persistence:

- do not remove it silently
- do not fake persistence in React state
- report the exact persistence gap
- request approval before changing the schema when a product decision is required

Create, Edit, and Details must remain consistent with the same persisted source of truth.

---

# Server-Side Data Rules

For DB-backed modules, operations such as:

- search
- filtering
- sorting
- pagination

must run server-side when operating over persisted datasets.

Do not fetch entire tenant datasets and then perform business filtering/pagination in React.

Client-side filtering is allowed only for small, explicitly local UI-only datasets.

Use:

- narrow database selects
- deterministic sorting
- server pagination
- stable query parameters
- lightweight table loading states

Avoid repeated request loops caused by unstable effects or URL synchronization.

---

# Loading / UX Rules

Do not introduce unnecessary full-page loading states for simple table/filter operations.

For server-driven search/filter/sort/pagination:

- keep page shell visible
- keep toolbar visible
- show lightweight table/content skeletons
- avoid layout shifts
- avoid repeated navigation loops
- debounce remote search where appropriate
- cancel/ignore stale client requests where applicable

Do not change existing loading UX unless necessary for backend integration or explicitly requested.

---

# Upload / Storage Rules

Reuse the existing shared storage abstraction:

`shared/storage/*`

Do NOT create a second upload architecture.

Upload flow must remain:

UI
→ Server Action
→ shared storage abstraction
→ returned URL/metadata
→ Service
→ Repository
→ database

Rules:

- no provider secrets in client code
- no direct Cloudinary/storage-provider calls from React
- validate MIME/type server-side
- validate size server-side
- generate safe filenames
- do not store base64 files in business tables
- persist canonical URLs/metadata only where schema supports them

If a UI upload has no canonical persistence model/field, report the gap instead of faking it.

---

# Monetary / Decimal Rules

Money must be Decimal-safe.

Never use JavaScript floating-point arithmetic for authoritative monetary calculations.

Use the existing Decimal conventions.

Preserve:

- precision
- currency
- immutable financial/pricing snapshots
- historical values

Do not reconstruct historical legal/financial amounts from mutable current pricing.

---

# Historical / Immutable Records

Append-only or historical records must remain historical.

Examples include:

- reservation timeline
- pricing snapshots
- pricing history
- contract versions
- audit logs
- activity logs
- document history where designed as append/history
- financial history

Do not mutate historical records in place when the architecture requires supersession/history.

Soft delete must be used where the architecture requires history preservation.

---

# Contract / Legal Integrity

Reservations, pricing snapshots, Contracts, and Finance must preserve enough historical data to reconstruct the agreed transaction.

Future Contract architecture must remain compatible with online signing.

The intended future direction is:

Reservation confirmed
→ immutable pricing snapshot
→ Contract generated from a specific template/version
→ Contract content frozen
→ secure signing flow
→ signer validation
→ signature stored with timestamp and relevant metadata
→ signed Contract remains historically immutable

Do NOT implement online signing unless it is the current approved task.

Do not introduce Reservation or Contract behavior that would prevent this future flow.

---

# Documentation Rules

Before creating a new document:

1. Check `DOCUMENTATION_INDEX.md`.

2. If relevant documentation already exists:
   update it.

3. Never duplicate documentation.

4. Always update `DOCUMENTATION_INDEX.md` if a genuinely new document is created.

If an approved database/model change is implemented:

- update the relevant authoritative DB documentation
- do not rewrite unrelated documents
- keep documentation synchronized with the certified implementation

---

# Before Writing Code

Always verify:

- Current phase
- Prisma schema
- Existing implementation
- Existing UI
- Folder architecture
- Module boundaries
- Permissions
- Tenant rules
- Existing utilities
- Relevant translations

For CRUD/backend integration:

also verify the UI ↔ backend field mapping before implementation.

Implement only what the current phase requires.

---

# Code Quality Rules

Write production-ready code.

Avoid overengineering.

Prefer readability.

Keep functions focused.

Keep files consistent.

Reuse utilities.

Avoid duplication.

No dead code.

No TODO placeholders unless explicitly requested.

Do not leave fake/mock persistence in completed DB-backed modules.

Do not claim a module is production-ready when a known critical correctness/security blocker remains.

---

# Localization (Mandatory)

Every new OR modified user-visible text introduced by a task MUST be localized.

This includes ALL:

- validation messages
- error messages
- success messages
- toast messages
- confirmation dialogs
- modal titles
- modal descriptions
- button labels
- table labels
- form labels
- placeholders
- empty states
- loading texts
- badges
- status labels
- tooltips
- dropdown labels
- filter labels
- search placeholders
- skeleton/loading captions
- permission errors
- plan limit errors
- lifecycle/status errors
- notifications
- document labels
- pricing labels

Rules:

- Never hardcode user-visible text inside React components, Services, Actions, or Controllers.
- Every new or modified visible string must use the existing translation system.
- Every new translation key must be added to BOTH:
  - `translations/en.ts`
  - `translations/fr.ts`
- Reuse existing translation keys whenever possible.
- Stable backend error codes should be translated at the presentation boundary.
- Report newly added translation keys in the final report.

The implementation is NOT considered complete if any new or modified visible string remains hardcoded.

---

# Testing / Validation Rules

Do not consider implementation complete based only on compilation.

Use the appropriate checks for the task.

Where relevant:

- Prisma format
- Prisma validate
- Prisma generate
- migration deploy
- migration status
- focused TypeScript
- full TypeScript
- build
- focused DB verification
- rollback tests
- tenant isolation tests
- permission tests
- lifecycle tests
- transaction rollback tests

Separate:

- errors introduced by the current task
- pre-existing unrelated errors

Do not hide current-task errors by labeling them pre-existing without verification.

Clean temporary test data after executable DB checks.

---

# Performance Rules

Avoid premature optimization, but fix proven inefficiencies.

Check for:

- N+1 queries
- overfetching
- duplicate requests
- unstable `useEffect` dependencies
- repeated URL navigation
- repeated tenant-context resolution
- loading entire histories in list pages
- client-side post-pagination filtering
- unnecessary rerenders

Prefer:

- narrow selects
- server-side pagination
- server-side filtering
- parallel independent reads
- lazy loading for heavy detail/history sections
- stable serialized query parameters
- request-scoped reuse

Do not introduce unsafe global caches containing tenant/user-specific data.

---

# Security Rules

Security boundaries are server-side.

Never trust the browser for:

- tenant ownership
- agency ownership
- permissions
- role
- actor identity
- lifecycle authorization
- plan limits
- pricing authority
- availability authority

Validate operation targets against trusted context.

Do not leak cross-tenant existence through unsafe queries.

Do not expose secrets to React/client bundles.

Do not perform authorization only in UI.

Use stable errors without leaking sensitive internal information.

---

# Current Development Roadmap

Completed:

✅ Architecture  
✅ Prisma Schema  
✅ Prisma Audit  
✅ Prisma Migrations  
✅ Raw SQL Constraints  
✅ Seed  
✅ Repository Layer  
✅ Services  
✅ Authentication  
✅ Current Company Context  
✅ Current Agency Context  
✅ Permissions / RBAC  
✅ Onboarding  
✅ Clients CRUD  
✅ Cars CRUD  
✅ Vehicle Pricing Rules  
✅ Vehicle Photos  
✅ Drivers CRUD
✅ Reservations CRUD
✅ Contracts CRUD

Current:

➡ Finances CRUD

Next:

⬜ Workspace / Settings integration  
⬜ Alerts / Calendar / Reports integration  
⬜ Dashboard  
⬜ Notifications  
⬜ Billing  
⬜ Production

Never jump ahead unless explicitly instructed.

Never mark the current phase complete while a critical blocker remains unresolved.

---

# Phase Completion Rule

A phase may be marked complete only when:

- required persistence works
- tenant isolation is verified
- permissions are enforced server-side
- create/edit/details are consistent
- relevant lifecycle rules work
- required transactions are atomic
- localization is complete
- focused TypeScript passes
- build passes
- required DB verification passes
- no known critical blocker remains

If a critical issue remains:

keep the current phase active.

Report the blocker.

Do not move AGENTS.md to the next phase.

---

# Final Report Rules

Final implementation reports should be concise and factual.

Report:

- files/areas changed
- behavior implemented
- schema/migration changes
- security/tenant verification
- permissions
- transactions
- localization
- DB verification
- TypeScript/build result
- remaining blockers
- readiness for the next phase

Do not claim production readiness when known blockers remain.

---

# Final Rule

When unsure:

1. Read `AGENTS.md` again.
2. Inspect existing code.
3. Search for an existing implementation.
4. Read only the relevant documentation.
5. Validate against Prisma.
6. Preserve existing UI/workflow.
7. Implement without changing architecture.

The architecture already exists.

The product UI already exists where implemented.

Your job is to connect and complete it, not redesign it.

---

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
