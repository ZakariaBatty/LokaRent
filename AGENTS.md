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

Current implementation phase:

➡ Repository Layer

Upcoming phases:

- Services
- Authentication
- Current Company Context
- Current Agency Context
- Permissions
- Onboarding
- CRUD Modules
- Dashboard
- Notifications
- Billing
- Production

Never regenerate completed phases unless explicitly instructed.

---

# Mandatory Startup Sequence

Every agent must follow these steps.

1. Read AGENTS.md completely.

2. Open DOCUMENTATION_INDEX.md.

3. Read ONLY the documents required for the requested task.

4. Never reread the whole documentation unless absolutely necessary.

5. Reuse the existing implementation whenever possible.

6. Never contradict the approved architecture.

---

# Efficient Reading Policy

Do NOT reread every architecture document for every task.

Always read:

- AGENTS.md

Then inspect only the files directly related to the requested task.

Use the existing implementation as the primary reference.

Only return to architecture documents if:

- the requested task changes architecture
- there is a real ambiguity
- two documents conflict
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
- new patterns
- new repositories
- new services
- new DTOs
- new workflows
- new permissions

unless explicitly requested.

---

# Source of Truth Hierarchy

Highest priority wins.

1.

DATABASE_SPECIFICATION.md

DATABASE_PHASE1.md

2.

DATABASE_DOMAIN_DESIGN.md

3.

SYSTEM_BLUEPRINT.md

4.

ARCHITECTURE_AUDIT.md

5.

API_CONTRACTS.md

6.

Everything else

If documents conflict:

STOP

Explain the conflict.

Do NOT invent a solution.

---

# Task Routing

## Prisma / Database

Read:

- DATABASE_SPECIFICATION.md
- DATABASE_PHASE1.md
- DATABASE_DOMAIN_DESIGN.md

---

## Repository Layer

Read:

- SYSTEM_BLUEPRINT.md
- Existing Repository implementation
- Prisma schema

---

## Services

Read:

- SYSTEM_BLUEPRINT.md
- Repository implementation

---

## Authentication

Read:

- SYSTEM_BLUEPRINT.md

---

## Permissions / RBAC

Read:

- SYSTEM_BLUEPRINT.md
- DATABASE_DOMAIN_DESIGN.md

---

## CRUD Modules

Read:

- SYSTEM_BLUEPRINT.md
- Existing module implementation

---

## Dashboard

Read:

- SYSTEM_BLUEPRINT.md

---

## Notifications

Read:

- SYSTEM_BLUEPRINT.md

---

## Billing

Read:

- SYSTEM_BLUEPRINT.md

---

## Production

Read:

- SYSTEM_BLUEPRINT.md

---

## API

Read:

- API_CONTRACTS.md

Always validate field names against the Prisma schema.

---

## Multi-Tenant

Read:

- ARCHITECTURE_AUDIT.md

---

## Finding documentation

Read:

- DOCUMENTATION_INDEX.md

---

# Global Implementation Rules

The following implementation decisions are frozen.

## General

Use:

- TypeScript
- Functional programming

Do NOT use:

- classes
- inheritance
- abstract repositories
- BaseRepository
- GenericRepository

Repositories are simple functions.

---

## Repository Layer

Repositories only perform database access.

Repositories NEVER contain:

- business logic
- validation
- authorization
- permissions
- notifications

Repositories receive:

- prisma
- companyId
- agencyId when required

Repositories return plain data.

---

## Services

Services own:

- business rules
- workflows
- transactions
- orchestration
- authorization checks

Services call repositories.

Repositories never call services.

---

## Prisma

Prisma schema is frozen.

Do NOT modify:

schema.prisma

unless explicitly requested.

Do NOT regenerate migrations.

Do NOT regenerate seed.

unless explicitly requested.

Use the shared Prisma client only.

---

## Multi-Tenant Rules

Every tenant query must be scoped.

Company data:

companyId

Agency data:

companyId + agencyId

Never query tenant data without tenant scope.

Never bypass tenant isolation.

---

## Naming Rules

Respect existing naming.

Never rename:

- folders
- models
- DTOs
- services
- repositories

Use existing naming conventions.

---

## Folder Rules

Never create a parallel architecture.

Reuse existing folders.

Only create files where they belong.

---

# Documentation Rules

Before creating a new document:

1.

Check DOCUMENTATION_INDEX.md.

2.

If documentation exists:

update it.

3.

Never duplicate documentation.

4.

Always update DOCUMENTATION_INDEX.md if a new document is created.

---

# Before Writing Code

Always verify:

- Prisma schema
- Existing implementation
- Folder architecture
- Module boundaries
- Permissions
- Tenant rules

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

---

# Current Development Roadmap

Completed

✅ Architecture

✅ Prisma

✅ Migration

✅ Raw SQL Constraints

✅ Seed

Current

➡ Repository Layer

Next

- Services
- Authentication
- Company Context
- Agency Context
- Permissions
- Onboarding
- CRUD Modules
- Dashboard
- Notifications
- Billing
- Production

Never jump ahead unless explicitly instructed.

---

# Final Rule

When unsure:

1.

Read AGENTS.md again.

2.

Inspect existing code.

3.

Read only the relevant documentation.

4.

Implement without changing architecture.

The architecture already exists.

Your job is to build it, not redesign it.
