# AGENTS.md

> **Single entry point for every AI agent working in this repository.**
> Read this file completely before doing anything else.

This repository (LokaRent — a multi-tenant SaaS car-rental platform) already contains
**approved architecture and design documentation**. That documentation is the source of
truth. Your job is to work *within* it, not around it.

---

## Mandatory Startup Sequence

Every agent, on every task, must follow these steps in order:

1. **Read this file (`AGENTS.md`) fully.**
2. **Open [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md)** — the catalog of all existing documentation.
3. **Read only the documents required for the requested task** (see the routing table below). Do not read everything; do not read nothing.
4. **Never ignore existing architecture.** If a document covers your topic, it governs your work.
5. **Never create parallel documentation.** Extend or reference existing docs instead of writing new ones.
6. **Never contradict an approved document.** If you believe a change is needed, propose it explicitly and flag the conflict — do not silently diverge.

---

## The Golden Rules

1. **Existing documents are the source of truth.** Treat `DATABASE_SPECIFICATION.md`, `DATABASE_PHASE1.md`, `DATABASE_DOMAIN_DESIGN.md`, and `SYSTEM_BLUEPRINT.md` as authoritative.
2. **Do not duplicate.** Before writing any `.md` file, confirm via `DOCUMENTATION_INDEX.md` that the topic is not already covered. New docs are allowed **only** for genuinely missing topics.
3. **Do not rewrite approved docs** unless the task explicitly asks you to update that specific document.
4. **Respect the source-of-truth hierarchy** (see below) when documents disagree.
5. **Keep the index honest.** If you add, merge, or archive a document, update `DOCUMENTATION_INDEX.md` in the same change.

---

## Source-of-Truth Hierarchy

When two documents disagree, the higher entry wins:

1. `DATABASE_SPECIFICATION.md` + `DATABASE_PHASE1.md` — data, tables, persistence, scope.
2. `DATABASE_DOMAIN_DESIGN.md` — ownership, cascade rules, domain events, indexes.
3. `SYSTEM_BLUEPRINT.md` — workflows, user journeys, permissions, roadmap, module boundaries.
4. `ARCHITECTURE_AUDIT.md` — strategic and multi-tenant direction.
5. `API_CONTRACTS.md` — endpoint shapes (validate field names against the Database series).
6. All other documents — historical context and design rationale only.

If you find the Database series and an older analysis document in conflict, **the Database series wins** and the older doc is treated as historical.

---

## Task Routing — Read Only What You Need

| If your task involves… | Read these documents first |
|------------------------|----------------------------|
| **Database schema, tables, migrations, Prisma** | `DATABASE_SPECIFICATION.md`, `DATABASE_PHASE1.md`, then `DATABASE_DOMAIN_DESIGN.md` |
| **Data ownership, cascade/delete rules, events, indexes** | `DATABASE_DOMAIN_DESIGN.md` |
| **What ships in the MVP vs. later** | `DATABASE_PHASE1.md` |
| **Long-term data vision / future modules** | `DATABASE_ARCHITECTURE.md` (superseded scope — treat as vision) |
| **Why a schema decision was made** | `DATABASE_DEFENSE.md`, `DATABASE_FINAL_REVIEW.md` (review trail) |
| **Building a feature, workflow, or page** | `SYSTEM_BLUEPRINT.md` (journeys, workflows, module map, roadmap) |
| **Permissions / roles / RBAC** | `SYSTEM_BLUEPRINT.md` (permission matrix) + `DATABASE_DOMAIN_DESIGN.md` |
| **Backend API endpoints** | `API_CONTRACTS.md` (validate names against Database series) |
| **Multi-tenant / SaaS strategy** | `ARCHITECTURE_AUDIT.md` |
| **Workspace/settings frontend history & decisions** | `ARCHITECTURE_ANALYSIS.md`, `ARCHITECTURE_DIAGRAM.txt` |
| **Handoff, rollout, testing process** | `HANDOFF_CHECKLIST.md` |
| **Project status / high-level overview** | `README_ANALYSIS.md` |
| **Finding any document** | `DOCUMENTATION_INDEX.md` |

---

## What "Current" Means Here

Documentation was produced in three waves. Know which wave you are reading:

- **Database & System Design wave (latest, authoritative):** the six `DATABASE_*.md` files and `SYSTEM_BLUEPRINT.md`. **This is current.**
- **Platform Audit wave:** `ARCHITECTURE_AUDIT.md` — strategic direction, still valid.
- **Multi-Agency Analysis wave (June 29, 2026):** `README_ANALYSIS.md`, `ANALYSIS_SUMMARY.md`, `ANALYSIS_INDEX.md`, `ARCHITECTURE_ANALYSIS.md`, `ARCHITECTURE_DIAGRAM.txt`, `API_CONTRACTS.md`, `HANDOFF_CHECKLIST.md` — valuable context, but any data-model detail is **superseded** by the Database wave.

---

## Before You Create or Edit a Document

Ask, in order:

1. Does `DOCUMENTATION_INDEX.md` already list a document for this topic? → If yes, **edit or reference it**, do not create a new one.
2. Is this a genuinely missing topic? → Only then create a new document, and **add it to `DOCUMENTATION_INDEX.md`** in the same change.
3. Does my change contradict a higher-priority document? → If yes, **stop and surface the conflict** to the user instead of diverging.
4. Am I about to restate something already written elsewhere? → **Link to it** instead of copying it.

---

## Before You Write Code

1. Confirm the data model in `DATABASE_SPECIFICATION.md` / `DATABASE_PHASE1.md` supports what you are building.
2. Confirm the workflow and module boundaries in `SYSTEM_BLUEPRINT.md`.
3. Confirm permissions/roles against the `SYSTEM_BLUEPRINT.md` permission matrix.
4. If an API is involved, confirm shapes in `API_CONTRACTS.md` (and reconcile any naming drift with the Database series).
5. Follow the existing folder architecture described in `SYSTEM_BLUEPRINT.md`.

---

## Quick Reference

- **Start here:** `AGENTS.md` (this file)
- **Find any doc:** `DOCUMENTATION_INDEX.md`
- **Data truth:** `DATABASE_SPECIFICATION.md`, `DATABASE_PHASE1.md`
- **Build truth:** `SYSTEM_BLUEPRINT.md`
- **Strategy:** `ARCHITECTURE_AUDIT.md`

When in doubt, re-read the Golden Rules above. Do not create parallel documentation. Do not contradict approved architecture.
