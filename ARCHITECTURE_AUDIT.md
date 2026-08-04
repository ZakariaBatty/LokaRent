# LokaRent SaaS Platform - Comprehensive Architectural Audit & Multi-Tenant Evolution Plan

**Prepared by:** Senior Software Architect / CTO  
**Date:** June 2026  
**Status:** Production-Ready Analysis & Evolution Roadmap

---

## EXECUTIVE SUMMARY

### What LokaRent Currently Is

LokaRent is a **single-agency, feature-complete SaaS CRM and fleet management platform** targeting small-to-medium Moroccan car rental companies (1-200+ vehicles). The platform currently serves as a **monolithic, single-tenant application** with all features tightly coupled to one agency's operations.

**Current Scope:**
- 19 fully-implemented pages (dashboard, fleet, clients, reservations, contracts, finances, reports, alerts, settings)
- 14 data layer schemas covering all business entities
- Premium UI/UX using Next.js 16 + shadcn/ui + Framer Motion
- Mock data representing realistic Moroccan car rental workflows
- Built-in multi-role support (Gérant, Réceptionniste, Comptable) for single agencies
- Three subscription tiers with feature differentiation

**Business Problem It Solves:**
LokaRent eliminates manual spreadsheet-based fleet management by providing automated reservation tracking, document expiry alerts, revenue analytics, client lifecycle management, and contract digitization—specific to Moroccan rental market (Arabic/French UI, local pricing in DH, CIN/Passeport compliance).

### The SaaS Vision

Transform LokaRent from a **single-tenant application** into a **production-grade multi-tenant SaaS platform** supporting:

✅ Multiple agencies per instance  
✅ Cross-agency user roles (Owner in Agency A, Manager in Agency B, etc.)  
✅ Agency-level data isolation and billing  
✅ Scalable infrastructure (10 → 100 → 1,000+ agencies)  
✅ Enterprise features (API access, audit logs, SSO, white-labeling)  
✅ Stripe integration for transparent, self-serve billing  
✅ Cross-tenant permission model with zero data leakage  

This positions LokaRent to become the **pan-African car rental SaaS standard**, potentially expanding beyond Morocco.

---

## 2. CURRENT ARCHITECTURE ANALYSIS

### 2.1 Existing Structure

**Frontend Stack:**
- Framework: Next.js 16 (App Router, RSC-ready)
- UI Library: shadcn/ui + Tailwind CSS v4
- Animations: Framer Motion + Motion for React
- State: React hooks + `useState` for local state (no global state manager)
- HTTP: SWR for client-side data fetching (not yet configured)

**Backend:**
- Currently: **NO BACKEND** — mock data only
- Authentication: Not implemented (mock users hardcoded)
- Persistence: Browser localStorage not used; all data in-memory
- API: No API routes; no database integration
- Deployment: Vercel (Next.js native)

**Data Layer:**
- 14 TypeScript data files (`lib/*-data.ts`)
- Flat mock arrays exported as constants
- No relationships between entities (denormalized mock data)
- No queries, filtering logic is frontend-only

**UI Patterns:**
- Sidebar navigation (left collapsed/expanded)
- Right-slide-over detail panels (80% width)
- Motion-staggered component entrance
- Premium glassmorphism effects (backdrop blur, shadows)
- Consistent color system: indigo (primary), emerald (success), amber (warning), rose (error)

### 2.2 Existing Entities (Mock Schema)

```
Cars
├─ id, brand, model, year, color, plate, category, fuel, seats, km, status
├─ pricing (priceDay, priceWeek, priceMonth)
├─ documents (insurance, vignette, visite_technique, carte_grise, credit_auto)
├─ financials (revenue, expenses, occupancyRate)
└─ timestamp

Clients
├─ id, fullName, phone, email, city, nationality, status, tier
├─ identity (idType, idNumber, idExpiry, idScanned)
├─ license (licenseNumber, licenseExpiry, licenseCategory, licenseScanned)
├─ activity (totalRentals, totalSpent, lastRentalDate, monthly spend)
├─ reservations (array of Reservation refs)
├─ notes (array of ClientNote)
└─ lifecycle (createdAt, blacklistReason)

Reservations
├─ id, code (RES-YYYY-XXXX), status, urgency
├─ client ref (id, name, phone, initials)
├─ car ref (id, brand, model, plate, category)
├─ dates (startDate, endDate, days)
├─ locations (pickupLocation, returnLocation)
├─ extras (gps, babySeat, insuranceUpgrade, additionalDriver)
├─ odometer (startKm, returnKm)
├─ pricing (pricePerDay, total, caution, advance, remaining)
├─ payment (method, status)
├─ contract (departureChecklist, returnChecklist, damages, signed, photos)
├─ timeline (array of TimelineEvent)
└─ createdAt

Contracts
├─ id, number (CONT-YYYY-XXXX), status, type
├─ dates (createdAt, signedAt, expiresAt)
├─ parties (agencyId, clientId, carId, reservationId)
├─ terms (rental_period, pricing, clauses, cancellation_policy)
├─ signatures (agencySignature, clientSignature, timestamp)
├─ documents (pdfGenerated, templateUsed, language)
└─ compliance (isDigitallySigned, auditTrail)

Expenses
├─ id, type (Carburant, Entretien, Assurance, Accident, Crédit, Taxes, Divers)
├─ carId, date, amount, category
├─ attachment (file_url, uploaded_by, upload_date)
├─ receipt_scan (optional PDF/image)
└─ notes

TeamUsers (per-agency)
├─ id, firstName, lastName, email, role (Gérant, Réceptionniste, Comptable)
├─ status (Actif, Inactif, Invitation en attente)
├─ lastConnection, invitedAt, expiresAt
├─ avatarColor, permissions (implied by role)
└─ agencyId (currently implicit, to be made explicit)

Alerts
├─ id, type (assurance, vignette, visite_technique, retard, paiement, maintenance)
├─ carId, priority (urgent, proche, info)
├─ title, description, daysLeft
├─ status (pending, resolved)
├─ agencyId (implied)
└─ createdAt, resolvedAt

Contracts (Template Customization)
├─ agencyId, language (FR, AR, Bilingue)
├─ headerSettings (logo, company info toggles)
├─ titleSettings (font, size)
├─ clauses (array of Clause, reorderable, toggleable)
├─ footerSettings (signature lines, terms)
└─ lastModified
```

### 2.3 Existing Workflows

1. **Agency Registration & Onboarding**
   - User registers with agency name, city, car count
   - Selects subscription plan (STARTER/PRO/BUSINESS)
   - 3-step wizard: fleet setup → pricing grid → settings
   - Currently mock-only; no Stripe integration

2. **Reservation Lifecycle**
   - Client requests reservation (demande)
   - Agency confirms (confirmee)
   - Reservation becomes active (en_cours) at pickup
   - Status changes to completed or cancelled
   - Timeline tracks all state changes + payments

3. **Document Compliance**
   - Cars have 3 mandatory documents: insurance, vignette, visite_technique
   - Days-left tracking triggers alerts
   - Status: ok (30+ days), warning (7-29 days), expired (<7 days)
   - Alerts centralized on /alerts page

4. **Finance Tracking**
   - Revenue calculated per car (completed reservations)
   - Expenses tracked separately (manual entry on /finances/expenses)
   - Profit = revenue - expenses
   - Reports show 6-month trends + per-car performance

5. **Team Management**
   - Gérant has full access
   - Réceptionniste manages reservations & clients
   - Comptable manages finances & invoices
   - Currently: hardcoded per-agency; no cross-agency support

### 2.4 Strengths

✅ **Complete Feature Coverage** — All 19 pages built with production-quality UI  
✅ **Premium UX** — Consistent design system, motion animations, glassmorphism  
✅ **Moroccan Context** — Realistic data, French/Arabic support, local pricing (DH)  
✅ **Modular Data Layer** — 14 clean TypeScript schemas, easily extensible  
✅ **Right-Sidebar Pattern** — 80% detail view preserves context, reduces cognitive load  
✅ **Multi-Role Foundation** — 3 roles (Gérant, Réceptionniste, Comptable) ready to scale  
✅ **Scalable Components** — shadcn/ui + Framer Motion proven patterns  
✅ **Next.js 16 Modern Stack** — RSC-ready, Turbopack, React Compiler support  

### 2.5 Critical Weaknesses

❌ **No Backend / No Persistence** — All data in-memory; no database integration  
❌ **No Authentication** — Users hardcoded; no session management  
❌ **Single-Tenant Only** — No agency isolation, no multi-user support across agencies  
❌ **No State Management** — React hooks only; no Redux/Zustand for complex state  
❌ **No API Layer** — No /api routes; frontend can't communicate with backend  
❌ **No Database Transactions** — Mock data; no ACID guarantees  
❌ **No Audit Logging** — No who-did-what-when tracking for compliance  
❌ **No Permission System** — Roles defined but no permission matrix implemented  
❌ **No Encryption** — Document IDs/sensitive fields not encrypted  
❌ **No Backup Strategy** — No disaster recovery plan  
❌ **No Rate Limiting** — No API throttling; vulnerable to abuse  
❌ **No Observability** — No error tracking (Sentry), no analytics  
❌ **Frontend-Only Validation** — All business logic client-side; security risk  
❌ **No File Upload System** — Contract templates, photos, documents not stored  
❌ **No Real Payments** — Stripe integration missing; billing manual  

---

## 3. SAAS MULTI-TENANT STRATEGY

Analyzing three deployment models for multi-agency LokaRent:

### Option A: Single Database + Agency ID Filtering

**Architecture:** One PostgreSQL database shared across all agencies; every table has `agency_id` column; queries filtered by authenticated user's current agency.

```sql
-- Example
SELECT * FROM cars WHERE agency_id = $1 AND status = 'disponible'
```

**Advantages:**
- Simplest to implement
- Minimal infrastructure cost
- Easy to backfill existing agencies
- Trivial data migration between agencies (just UPDATE agency_id)
- Unified reporting across all agencies possible
- Single backup strategy

**Disadvantages:**
- **CRITICAL: Accidental data exposure risk** — Single SELECT query bug leaks all data
- Row-level security (RLS) must be perfect; one mistake = breach
- Performance degrades with scale (10k agencies × 1M reservations = massive table)
- Cannot comply with GDPR data residency (all data in one region)
- Noisy neighbor problem: one agency's spike affects all
- Cannot offer "enterprise isolation" as premium feature
- Database locks during backups affect all tenants

**Cost:** $$$  (horizontal scaling limits: ~1000-5000 tenants before hitting DB limits)

**Scalability:** ⭐⭐⭐ (medium-term; hits ceiling at 5-10k tenants)

**Security:** ⭐ (HIGH RISK — one bug = full breach)

---

### Option B: Database per Agency (Logical Schemas)

**Architecture:** One PostgreSQL server with separate schemas per agency (`agency_alpha`, `agency_beta`, etc.). Same table names, isolated by schema.

```sql
-- Example
SET search_path TO agency_alpha;
SELECT * FROM cars WHERE status = 'disponible'
```

**Advantages:**
- Complete data isolation (schema-level, enforced by database)
- Easy per-agency backups
- Can drop an agency entirely (DROP SCHEMA agency_xyz)
- Zero risk of cross-tenant data leaks
- Transparent to application code (query looks same)
- Can run different schemas on different servers for regional deployments
- Per-agency encryption keys possible

**Disadvantages:**
- More complex application code (schema switching, migrations across schemas)
- Migration tooling must run per-schema
- Cross-tenant analytics harder to implement
- Backup/restore slower (many small files instead of one large file)
- More storage overhead (schema metadata × 1000 agencies = overhead)
- Cannot bulk-query across agencies without union all

**Cost:** $$$ (same as Option A, plus schema management overhead)

**Scalability:** ⭐⭐⭐⭐ (supports 10k+ agencies on single server with good performance)

**Security:** ⭐⭐⭐⭐⭐ (database enforces isolation)

---

### Option C: Database per Agency (Separate Instances)

**Architecture:** Each agency gets its own PostgreSQL RDS instance (AWS Aurora Serverless, Neon, etc.). Separate connection strings per agency.

```typescript
// Example
const agencyConnections = {
  'agency-alpha': new Pool({...alphaConfig}),
  'agency-beta': new Pool({...betaConfig}),
}
```

**Advantages:**
- 100% data isolation (separate database instances)
- Can offer per-agency encryption keys (HSM, Vault integration)
- Perfect for GDPR/compliance (data residency per country)
- Per-agency scaling: scale only high-traffic tenants
- Per-agency performance tuning (indexes, queries)
- Can offer to agencies as "Dedicated Database" premium feature
- Zero noisy-neighbor problems

**Disadvantages:**
- **MASSIVE operational complexity** — manages 1000s of database connections
- **Exponential cost** — 1000 agencies = 1000 database instances
- Cross-tenant analytics requires federated queries (complex, slow)
- Backup/restore tooling must manage 1000s of instances
- Schema migrations require orchestration script
- Connection pooling nightmare at scale
- Compliance audit cost × 1000

**Cost:** $$$$ (prohibitive; 1000 agencies × $50/month per DB = $50k/month just for databases)

**Scalability:** ⭐⭐ (becomes unmanageable at 100+ agencies)

**Security:** ⭐⭐⭐⭐⭐ (perfect isolation)

---

### **RECOMMENDATION: Option B (Database per Agency — Logical Schemas)**

**Justification:**

For LokaRent's projected growth (0 → 10,000 agencies over 3-5 years), Option B is the **optimal sweet spot**:

- **Security wins** of Option C (database-level isolation)
- **Cost efficiency** of Option A (single server)
- **Operational simplicity** (schema switching vs. connection management)
- **Compliance-ready** (separate schemas = separate audit logs per agency)
- **Upgrade path** — later migrate high-value agencies to dedicated instances

**Implementation Strategy:**

1. **Years 1-2:** PostgreSQL with schemas; 1000-2000 agencies per server
2. **Year 3:** Shard by region (Europe server, Africa server, Asia server)
3. **Year 4+:** For Tier-1 agencies, offer Option C (dedicated instance) as premium

---

## 4. DATABASE ARCHITECTURE (Multi-Tenant Schema Design)

### Core Multi-Tenant Tables

```sql
-- Global (shared across all tenants)
CREATE SCHEMA platform;

CREATE TABLE platform.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  website VARCHAR(255),
  subscription_tier VARCHAR(50) NOT NULL DEFAULT 'STARTER', -- STARTER|PRO|BUSINESS
  max_users INT NOT NULL DEFAULT 1,
  max_cars INT NOT NULL DEFAULT 10,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active|suspended|cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_customer_id VARCHAR(255) UNIQUE,
  billing_email VARCHAR(255)
);
CREATE INDEX idx_agencies_status ON platform.agencies(status);
CREATE INDEX idx_agencies_created ON platform.agencies(created_at);

CREATE TABLE platform.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active|inactive|pending
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_users_email ON platform.users(email);

CREATE TABLE platform.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES platform.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES platform.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- OWNER|ADMIN|MANAGER|TEAM_LEAD|EMPLOYEE|CLIENT
  role_scope VARCHAR(50) NOT NULL DEFAULT 'operations', -- operations|finance|compliance|admin
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active|pending|inactive
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);
CREATE INDEX idx_agency_members_agency ON platform.agency_members(agency_id);
CREATE INDEX idx_agency_members_user ON platform.agency_members(user_id);

CREATE TABLE platform.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES platform.agencies(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL, -- STARTER|PRO|BUSINESS
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active|trialing|past_due|cancelled
  billing_cycle VARCHAR(20) NOT NULL, -- monthly|6_months|annual
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  trial_end_date DATE,
  next_billing_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_latest_invoice_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id)
);
CREATE INDEX idx_subscriptions_agency ON platform.subscriptions(agency_id);

CREATE TABLE platform.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES platform.agencies(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES platform.subscriptions(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  amount_cents INT NOT NULL,
  amount_currency VARCHAR(3) NOT NULL DEFAULT 'MAD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending|sent|paid|failed|refunded
  issued_at DATE NOT NULL,
  due_at DATE NOT NULL,
  paid_at DATE,
  stripe_invoice_id VARCHAR(255) UNIQUE,
  pdf_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, invoice_number)
);
CREATE INDEX idx_invoices_agency ON platform.invoices(agency_id);
CREATE INDEX idx_invoices_status ON platform.invoices(status);

CREATE TABLE platform.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES platform.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES platform.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- card|bank_account
  stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  card_brand VARCHAR(20),
  card_last_four VARCHAR(4),
  exp_month INT,
  exp_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_methods_agency ON platform.payment_methods(agency_id);

CREATE TABLE platform.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL, -- matches UserRole
  resource VARCHAR(100) NOT NULL, -- cars|reservations|clients|finances|settings|users
  action VARCHAR(50) NOT NULL, -- create|read|update|delete|export
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

CREATE TABLE platform.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES platform.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES platform.users(id) ON DELETE SET NULL,
  resource_type VARCHAR(100) NOT NULL, -- Car|Reservation|Client|etc
  resource_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- create|update|delete|view|export
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_agency_created ON platform.audit_logs(agency_id, created_at);
```

### Tenant-Specific Schema Tables (Created per Agency)

```sql
-- Per-agency schema (created on agency registration)
CREATE SCHEMA agency_${agency_id};

CREATE TABLE agency_${agency_id}.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  color VARCHAR(50),
  plate VARCHAR(20) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- Citadine|Berline|SUV|Utilitaire
  fuel VARCHAR(50) NOT NULL, -- Essence|Diesel|Hybride
  seats INT,
  km INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'disponible',
  price_day DECIMAL(10,2) NOT NULL,
  price_week DECIMAL(10,2) NOT NULL,
  price_month DECIMAL(10,2) NOT NULL,
  insurance_company VARCHAR(100),
  insurance_end_date DATE,
  vignette_end_date DATE,
  visite_technique_end_date DATE,
  carte_grise_uploaded BOOLEAN DEFAULT FALSE,
  credit_auto_bank VARCHAR(100),
  credit_auto_monthly_payment DECIMAL(10,2),
  credit_auto_end_date DATE,
  revenue DECIMAL(12,2) DEFAULT 0,
  expenses DECIMAL(12,2) DEFAULT 0,
  occupancy_rate NUMERIC(3,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cars_status ON agency_${agency_id}.cars(status);
CREATE INDEX idx_cars_plate ON agency_${agency_id}.cars(plate);

CREATE TABLE agency_${agency_id}.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  city VARCHAR(100),
  nationality VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'actif', -- actif|blacklist|inactif
  tier VARCHAR(50) NOT NULL DEFAULT 'regular', -- vip|regular|new
  id_type VARCHAR(50), -- CIN|Passeport
  id_number VARCHAR(50),
  id_expiry DATE,
  id_scanned BOOLEAN DEFAULT FALSE,
  license_number VARCHAR(50),
  license_expiry DATE,
  license_category VARCHAR(10),
  license_scanned BOOLEAN DEFAULT FALSE,
  total_rentals INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_rental_date DATE,
  favorite_car_id UUID,
  blacklist_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clients_status ON agency_${agency_id}.clients(status);
CREATE INDEX idx_clients_email ON agency_${agency_id}.clients(email);

CREATE TABLE agency_${agency_id}.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES agency_${agency_id}.clients(id),
  car_id UUID NOT NULL REFERENCES agency_${agency_id}.cars(id),
  status VARCHAR(50) NOT NULL DEFAULT 'demande',
  urgency VARCHAR(50) NOT NULL DEFAULT 'low',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_km INT,
  end_km INT,
  pickup_location VARCHAR(255),
  return_location VARCHAR(255),
  price_per_day DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  caution DECIMAL(12,2),
  advance DECIMAL(12,2),
  remaining DECIMAL(12,2),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  contract_signed BOOLEAN DEFAULT FALSE,
  has_photos BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reservations_client ON agency_${agency_id}.reservations(client_id);
CREATE INDEX idx_reservations_car ON agency_${agency_id}.reservations(car_id);
CREATE INDEX idx_reservations_status ON agency_${agency_id}.reservations(status);
CREATE INDEX idx_reservations_dates ON agency_${agency_id}.reservations(start_date, end_date);

CREATE TABLE agency_${agency_id}.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES agency_${agency_id}.cars(id),
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50),
  attachment_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_car ON agency_${agency_id}.expenses(car_id);
CREATE INDEX idx_expenses_date ON agency_${agency_id}.expenses(date);

CREATE TABLE agency_${agency_id}.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(50) NOT NULL UNIQUE,
  reservation_id UUID NOT NULL REFERENCES agency_${agency_id}.reservations(id),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  language VARCHAR(10) NOT NULL DEFAULT 'FR',
  is_digitally_signed BOOLEAN DEFAULT FALSE,
  agency_signed_at TIMESTAMPTZ,
  client_signed_at TIMESTAMPTZ,
  pdf_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contracts_reservation ON agency_${agency_id}.contracts(reservation_id);

CREATE TABLE agency_${agency_id}.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  car_id UUID REFERENCES agency_${agency_id}.cars(id),
  reservation_id UUID REFERENCES agency_${agency_id}.reservations(id),
  priority VARCHAR(50) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  days_left INT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alerts_status ON agency_${agency_id}.alerts(status);
Create INDEX idx_alerts_type ON agency_${agency_id}.alerts(type);
```

### Key Design Decisions

**Why Separate Schemas Per Agency:**
- ✅ Database enforces tenant isolation
- ✅ Simple SELECT queries (no WHERE agency_id)
- ✅ Can manage schema lifecycle independently
- ✅ PostgreSQL does the heavy lifting

**Why Global Platform Schema:**
- ✅ Single source of truth for agencies & subscriptions
- ✅ Centralized audit logs for compliance
- ✅ Unified billing/invoicing queries
- ✅ Role/permission matrix shared

**Indexing Strategy:**
- Primary indexes on `status`, `dates`, `foreign keys`
- Composite indexes on common WHERE + ORDER BY combinations
- Avoid over-indexing (costs write performance)

---

## 5. ROLE & PERMISSION SYSTEM

### Role Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  Platform Super Admin (v0 internal use only)       │
│  - All agencies, all data, all actions              │
│  - Manage agency subscriptions & billing            │
│  - Manage platform security & compliance            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Agency Owner (Tier-specific)                       │
│  - Can create/modify all agency data                │
│  - Can manage team + roles                          │
│  - Can upgrade/downgrade subscription               │
│  - Can export data & analytics                      │
│  - Can configure integrations (API keys, webhooks)  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Agency Admin (same as Owner but less billing)      │
│  - Full operational access                          │
│  - Cannot change subscription or billing address    │
│  - Can invite/manage team                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Manager (Department-level authority)               │
│  - Manage cars, reservations, clients, contracts    │
│  - View finance reports (read-only)                 │
│  - Cannot invite users or change settings           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Team Lead (Receptionist + authority)               │
│  - Same as Receptionist but can manage team         │
│  - Can assign tasks/reservations to team members    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Employee / Receptionist                            │
│  - Can create/view/update reservations              │
│  - Can view clients                                 │
│  - Can view car availability                        │
│  - Cannot modify pricing, finances, or settings     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Accountant / Finance User                          │
│  - Can view all finances, expenses, invoices        │
│  - Can record expenses & payments                   │
│  - Can generate financial reports                   │
│  - Cannot modify car data or reservations           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Client (future: self-serve portal)                 │
│  - Can view own reservations                        │
│  - Can upload documents (license, ID)               │
│  - Cannot modify anything                           │
└─────────────────────────────────────────────────────┘
```

### Permission Matrix

| Resource | Owner | Admin | Manager | Team Lead | Employee | Accountant | Client |
|----------|-------|-------|---------|-----------|----------|-----------|--------|
| **Cars** | CRUD | CRUD | RU | R | R | R | - |
| **Reservations** | CRUD | CRUD | CRUD | CRUD | CRU | R | RO* |
| **Clients** | CRUD | CRUD | CRU | CRU | CRU | R | RO* |
| **Contracts** | CRUD | CRUD | RU | RU | R | R | RO* |
| **Expenses** | CRUD | CRUD | R | R | - | CRU | - |
| **Finances** | CRUD | CRUD | R | R | - | CRUD | - |
| **Alerts** | CRUD | CRUD | R | R | R | R | - |
| **Settings** | CRUD | CRU | - | - | - | - | - |
| **Team/Users** | CRUD | CRU | - | CU | - | - | - |
| **Reports** | CRUD | CRUD | R | R | - | CRUD | - |

**Legend:** C=Create, R=Read, U=Update, D=Delete, RO*=Read Own Only, -=No Access

### Implementation Pattern

```typescript
// lib/permissions.ts
type Action = 'create' | 'read' | 'update' | 'delete' | 'export'
type Resource = 'cars' | 'reservations' | 'clients' | 'finances' | 'settings' | 'users'

const rolePermissions: Record<UserRole, Record<Resource, Action[]>> = {
  OWNER: {
    cars: ['create', 'read', 'update', 'delete', 'export'],
    reservations: ['create', 'read', 'update', 'delete', 'export'],
    clients: ['create', 'read', 'update', 'delete', 'export'],
    finances: ['create', 'read', 'update', 'delete', 'export'],
    settings: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    // ... more resources
  },
  EMPLOYEE: {
    reservations: ['create', 'read', 'update'],
    clients: ['create', 'read', 'update'],
    cars: ['read'],
    // ... limited scope
  },
  // ... other roles
}

// middleware.ts - check at request time
export async function canUserAccess(
  userId: string,
  agencyId: string,
  resource: Resource,
  action: Action
): Promise<boolean> {
  const member = await getAgencyMember(userId, agencyId)
  const permissions = rolePermissions[member.role][resource] ?? []
  return permissions.includes(action)
}
```

---

## 6. SUBSCRIPTION & BILLING ARCHITECTURE

### Plan Configuration

| Feature | STARTER | PRO | BUSINESS |
|---------|---------|-----|----------|
| **Price (Monthly)** | 299 DH | 599 DH | 999 DH |
| **Vehicles** | 10 | 50 | Unlimited |
| **Team Members** | 1 | 5 | Unlimited |
| **Storage** | 1 GB | 10 GB | 100 GB |
| **API Access** | ❌ | ❌ | ✅ |
| **Audit Logs** | 30 days | 1 year | Unlimited |
| **Support** | Email | Email + Chat | Priority 24/7 |
| **Dedicated DB** | ❌ | ❌ | ✅ Optional (+) |
| **SSO (SAML)** | ❌ | ❌ | ✅ |
| **White Label** | ❌ | ❌ | ✅ |
| **Custom Integration** | ❌ | ❌ | ✅ |

### Billing Cycles & Discounts

```
MONTHLY BILLING:
  STARTER:   299 DH / month
  PRO:       599 DH / month
  BUSINESS:  999 DH / month

6-MONTH COMMITMENT (15% discount):
  STARTER:   1,522.35 DH / 6 months (254.01 DH/month)
  PRO:       3,046.35 DH / 6 months (507.71 DH/month)
  BUSINESS:  5,094.15 DH / 6 months (849.03 DH/month)

ANNUAL COMMITMENT (35% discount):
  STARTER:   2,343.90 DH / year (195.33 DH/month)
  PRO:       4,687.80 DH / year (390.65 DH/month)
  BUSINESS:  7,838.70 DH / year (653.23 DH/month)

FREE TRIAL:
  14 days, all features of selected plan
  Requires valid payment method (Stripe)
  Auto-downgrade to free tier if not activated
```

### Stripe Integration Flow

```typescript
// POST /api/subscriptions/create
async function createSubscription(
  agencyId: string,
  plan: 'STARTER' | 'PRO' | 'BUSINESS',
  billingCycle: 'monthly' | '6_months' | 'annual'
) {
  const stripeCustomer = await stripe.customers.create({
    email: agency.email,
    metadata: { agencyId },
  })

  const prices = {
    STARTER: { monthly: 'price_starter_mo', annual: 'price_starter_yr' },
    PRO: { monthly: 'price_pro_mo', annual: 'price_pro_yr' },
    BUSINESS: { monthly: 'price_business_mo', annual: 'price_business_yr' },
  }

  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomer.id,
    items: [{ price: prices[plan][billingCycle] }],
    trial_period_days: 14,
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
  })

  // Save to DB
  await db.subscriptions.create({
    agency_id: agencyId,
    stripe_subscription_id: subscription.id,
    plan,
    status: 'trialing',
    trial_end_date: new Date(subscription.trial_end * 1000),
  })
}

// Webhook: invoice.paid
export async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
  const agencyId = subscription.metadata.agencyId

  await db.invoices.create({
    agency_id: agencyId,
    amount_cents: invoice.amount_paid,
    status: 'paid',
    paid_at: new Date(invoice.paid_at * 1000),
    stripe_invoice_id: invoice.id,
  })

  // Update agency subscription status
  await db.subscriptions.update(
    { stripe_subscription_id: invoice.subscription },
    { status: 'active' }
  )
}

// Webhook: customer.subscription.deleted
export async function handleSubscriptionCancelled(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const agencyId = subscription.metadata.agencyId

  // Downgrade agency to inactive
  await db.agencies.update(
    { id: agencyId },
    { status: 'suspended' }
  )

  // Notify agency owner
  await sendEmail(agency.email, 'Subscription Cancelled', { agencyId })
}
```

### Usage-Based Billing (Future: Phase 4)

```typescript
// If we charge per reservation, SMS, or API call:
const usageMetering = {
  reservations_created: { unit_type: 'count', price_per_unit: 5 },
  sms_sent: { unit_type: 'sms', price_per_unit: 1.5 },
  api_calls: { unit_type: 'count', price_per_unit: 0.01 },
}

// Track in DB, report to Stripe at month-end
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  { quantity: 50, timestamp: Math.floor(Date.now() / 1000) }
)
```

---

## 7. SCALABILITY PLAN

### Growth Trajectory & Infrastructure

**PHASE 1: 10-100 Agencies (Year 1)**
- Single PostgreSQL RDS instance (db.t3.medium)
- 1 single-tenant schema per agency
- Next.js on Vercel (automatic scaling)
- Stripe for billing
- Vercel Blob for file storage

**PHASE 2: 100-1,000 Agencies (Year 2)**
- PostgreSQL scaled to db.r5.large (2vCPU, 16GB RAM)
- Read replicas for analytics queries
- Implement query result caching (Redis)
- Background job queue (Bull/BullMQ)
- Elasticsearch for full-text search

**PHASE 3: 1,000-5,000 Agencies (Year 3)**
- Multi-region PostgreSQL (primary: EU, replica: Africa)
- Schema sharding by agency_id range
- Implement tenant-aware CDN caching
- Dedicated analytics cluster (Aurora read-only)
- Audit log archival to S3

**PHASE 4: 5,000+ Agencies (Year 4+)**
- Horizontal sharding across multiple PostgreSQL clusters
- Offer dedicated instance option (Option C) for Tier-1 agencies
- Microservices for billing, reporting, notifications
- Event-driven architecture (Kafka)
- Global CDN edge caching

### Caching Strategy

```typescript
// Multi-layer caching
const cache = {
  // Layer 1: Browser cache (service worker)
  // Layer 2: CDN cache (Vercel Edge, 1 hour TTL)
  // Layer 3: Server cache (Redis, 10 minutes TTL)
  // Layer 4: Database query cache (prepared statements)
}

// Example: cache agency pricing grid
import { createClient } from 'redis'
const redis = createClient()

async function getPricingGrid(agencyId: string) {
  const cacheKey = `pricing:${agencyId}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const grid = await db.pricing.findOne({ agency_id: agencyId })
  await redis.setEx(cacheKey, 600, JSON.stringify(grid)) // 10 min
  return grid
}

// Invalidate on update
async function updatePricingGrid(agencyId: string, data: any) {
  await db.pricing.update({ agency_id: agencyId }, data)
  await redis.del(`pricing:${agencyId}`) // Bust cache
}
```

### Background Jobs

```typescript
// Bull/BullMQ for async tasks
import { Queue } from 'bullmq'

const emailQueue = new Queue('emails', { connection })
const reportQueue = new Queue('reports', { connection })
const notificationQueue = new Queue('notifications', { connection })

// Example: generate monthly report
reportQueue.add(
  'generate-monthly',
  { agencyId, month: '2026-06' },
  { delay: 0, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
)

reportQueue.process('generate-monthly', async (job) => {
  const { agencyId, month } = job.data
  const report = await generateReport(agencyId, month)
  await emailQueue.add('send-report', { agencyId, report })
})
```

### Monitoring & Observability

```typescript
// Sentry for error tracking
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% sampling
  integrations: [
    new Sentry.Integrations.RequestData({ include: ['cookies'] }),
  ],
})

// DataDog for APM
import { datadogRum } from '@datadog/browser-rum'
datadogRum.init({
  applicationId: 'app-id',
  clientToken: 'token',
  site: 'datadoghq.eu',
  service: 'lokarent-frontend',
})

// CloudWatch for infrastructure
const cloudwatch = new AWS.CloudWatch()
await cloudwatch.putMetricData({
  Namespace: 'LokaRent',
  MetricData: [
    {
      MetricName: 'ReservationsCreated',
      Value: count,
      Unit: 'Count',
      Timestamp: new Date(),
    },
  ],
})
```

---

## 8. SECURITY ARCHITECTURE

### Authentication

```typescript
// Implement OAuth 2.0 + JWT
import { jwtVerify } from 'jose'

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) throw new Error('Missing token')

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const verified = await jwtVerify(token, secret)

  return {
    userId: verified.payload.sub,
    agencyId: verified.payload.aud,
    role: verified.payload.role,
  }
}

// Issue token on login
export async function issueToken(userId: string, agencyId: string, role: UserRole) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

  return await new SignJWT({
    sub: userId,
    aud: agencyId,
    role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}
```

### Authorization (Row-Level Security)

```sql
-- PostgreSQL RLS policies
CREATE POLICY "users_can_only_see_their_agency_cars" ON agency_${agency_id}.cars
  USING (
    EXISTS (
      SELECT 1 FROM platform.agency_members
      WHERE agency_members.agency_id = $1 -- injected at query time
        AND agency_members.user_id = current_user_id
    )
  )
```

### Multi-Tenant Data Isolation

```typescript
// Every query includes tenant context
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function query(sql: string, params: any[], agencyId: string) {
  const client = await pool.connect()
  try {
    // Set schema to isolate queries
    await client.query(`SET search_path TO agency_${agencyId}`)
    return await client.query(sql, params)
  } finally {
    client.release()
  }
}

// Usage in API routes
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { userId, agencyId } = await verifyAuth(req)

  // Request must specify agency ID in URL
  const carId = params.id
  const result = await query(
    'SELECT * FROM cars WHERE id = $1',
    [carId],
    agencyId // Always pass agency context
  )

  if (!result.rows[0]) throw new Error('Not found')
  return Response.json(result.rows[0])
}
```

### Rate Limiting

```typescript
// Implement per-agency, per-endpoint rate limits
import Ratelimit from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1m'), // 100 requests per minute
  analytics: true,
})

export async function middleware(request: Request) {
  const { userId, agencyId } = await verifyAuth(request)
  const identifier = `${agencyId}:${request.pathname}`

  const { success, pending } = await ratelimit.limit(identifier)
  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  return NextResponse.next()
}
```

### Audit Logging

```typescript
// Every action logged to audit_logs table
async function auditLog(
  agencyId: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'create' | 'update' | 'delete',
  oldValues: any,
  newValues: any,
  ipAddress: string
) {
  await db.audit_logs.create({
    agency_id: agencyId,
    user_id: userId,
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    old_values: oldValues,
    new_values: newValues,
    ip_address: ipAddress,
    user_agent: request.headers.get('user-agent'),
  })
}
```

### Encryption

```typescript
// At-rest encryption for sensitive fields
import crypto from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}.${encrypted.toString('hex')}.${authTag.toString('hex')}`
}

function decryptField(ciphertext: string): string {
  const [ivHex, encryptedHex, authTagHex] = ciphertext.split('.')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8')
}

// Apply to sensitive fields
export class Client extends Model {
  @BeforeSave()
  encryptSensitiveFields() {
    if (this.id_number) {
      this.id_number = encryptField(this.id_number)
    }
  }
}
```

### Secrets Management

```typescript
// Use environment secrets, never in code
// AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const client = new SecretsManagerClient({ region: 'eu-west-1' })
const secret = await client.send(new GetSecretValueCommand({ SecretId: 'prod/db-password' }))
const dbPassword = secret.SecretString
```

### Backup Strategy

```typescript
// Daily automated backups to S3
import AWS from 'aws-sdk'

const rds = new AWS.RDS()
const s3 = new AWS.S3()

// Trigger daily backup export
await rds.startExportTask({
  ExportTaskIdentifier: `backup-${new Date().toISOString()}`,
  SourceArn: process.env.RDS_BACKUP_ARN,
  S3BucketName: 'lokarent-backups',
  S3Prefix: 'daily/',
  ExportOnly: [], // Export all schemas
}).promise()

// Verify backups can be restored quarterly
```

---

## 9. UX / PRODUCT RECOMMENDATIONS

### Current State Review

**✅ What's Working:**
- Premium design system (consistent, polished)
- Right-sidebar pattern (context preserved, reduces navigation)
- Multi-role foundation (easy to expand)
- Moroccan context (relevant data, realistic workflows)
- Complete feature coverage (no major gaps)
- Responsive layout (works on mobile)

**⚠️ What's Missing / Needs Improvement:**

| Issue | Severity | Recommendation |
|-------|----------|-----------------|
| No agency switcher | HIGH | Add dropdown in top-left to switch between agencies user is member of |
| Single-sign-on missing | HIGH | Multi-agency users must re-login for each agency; implement SSO selector after login |
| Team management UI not clear | MEDIUM | Show which team members have access to what; permission matrix visualization |
| No invitation workflow | MEDIUM | Email invitations with expiring links; inline accept/reject in UI |
| Billing UI missing | HIGH | Add self-serve subscription upgrade/downgrade; invoice history |
| No API documentation | HIGH | Add /api-docs for BUSINESS tier customers |
| Settings too nested | MEDIUM | Flatten settings hierarchy; show active subscription on main page |
| Reports can't be exported | MEDIUM | Add CSV/PDF download buttons; scheduled reports |
| No audit trail visible | MEDIUM | Add "Activity" tab showing who did what when |
| Mobile sidebar cuts off | MEDIUM | Implement bottom tab bar for mobile (cars/reservations/calendar/settings) |

### Recommended UX Improvements

#### 1. **Agency Switcher (Post-Login)**
```
┌─────────────────────────────────┐
│  Your Agencies                  │
├─────────────────────────────────┤
│  ✓ LokaRent Marrakech (Owner)   │
│  LokaRent Casablanca (Manager)  │
│  LokaRent Agadir (Employee)     │
├─────────────────────────────────┤
│  [+ Invite Link / Create New]   │
└─────────────────────────────────┘
```

#### 2. **Dashboard Multi-Tenant View**
Add agency switcher context to every page header. For BUSINESS plans, show cross-agency reporting dashboard.

#### 3. **Settings Reorganization**
```
/settings
├── Agency Profile (info, logo, payment method)
├── Subscription & Billing (current plan, invoices, upgrade)
├── Team & Permissions (users, roles, permissions matrix)
├── Pricing Grid (pricing per category)
├── Contract Template (language, clauses, signature)
└── Integrations (API keys, webhooks, white-label)
```

#### 4. **Billing Center Page**
```
/account/billing
├── Current Subscription (plan, cost, next billing date)
├── Payment Method (saved cards)
├── Change Plan (upgrade/downgrade with proration)
├── Invoice History (downloadable PDFs, filterable)
├── Usage Metrics (cars used, team members invited, API calls)
└── Billing Contact (who receives invoices)
```

#### 5. **Team Invite Workflow**
```
1. Owner clicks "Invite Team Member"
2. Modal: email + role selector + message
3. System sends email with 7-day expiring link
4. Recipient clicks link → auto-logs in if new user
5. Recipient confirms agency + role in dashboard
6. Appears in team list immediately
```

#### 6. **Activity / Audit Log Viewer**
```
/settings/activity (or in each resource detail panel)
│ Time    │ User        │ Action        │ Details
├─────────┼─────────────┼───────────────┼──────────────
│ 14:32   │ Ahmed B.    │ Reservation   │ RES-2026-0045
│         │             │ Updated       │ Status: confirmée
│ 14:15   │ Salma K.    │ Client        │ Ahmed Mansouri
│         │             │ Updated       │ Phone: +212...
│ 13:00   │ System      │ Alert         │ Vignette expiry
│         │             │ Created       │ Dacia Logan
```

#### 7. **Cross-Agency Analytics (BUSINESS tier)**
```
/analytics
├── Fleet Overview (all agencies: total cars, avg occupancy)
├── Revenue Trends (compare agencies, YoY growth)
├── Team Performance (invoices by user across agencies)
└── Market Share (% of total revenue per agency)
```

---

## 10. FINAL CTO RECOMMENDATION & ROADMAP

### Technical Recommendations

1. **Implement Database Isolation (Option B)** — Schema-per-agency on PostgreSQL
2. **Add Authentication Layer** — JWT + Stripe OAuth for social login
3. **Implement Authorization** — Permission matrix with role-based access control
4. **Add Stripe Integration** — Self-serve billing, automatic invoicing
5. **Implement Audit Logging** — Every action logged to compliance table
6. **Add File Storage** — Vercel Blob for contracts, photos, documents
7. **Implement Background Jobs** — Bull/BullMQ for reports, emails, notifications
8. **Add Caching Layer** — Redis for pricing grids, agency config
9. **Implement Observability** — Sentry for errors, DataDog for APM
10. **Add API Rate Limiting** — Upstash for API quota management

### Product Recommendations

1. **Add Agency Switcher** — Critical for multi-tenant adoption
2. **Build Billing Center** — Stripe integration + invoice management
3. **Implement Team Invitations** — Email-based onboarding workflow
4. **Add Permission Matrix UI** — Visual role configuration
5. **Create API Documentation** — Swagger/OpenAPI for BUSINESS tier
6. **Add Activity Logs** — Compliance & audit trail visibility
7. **Implement Mobile Navigation** — Bottom tab bar for mobile UX
8. **Add Cross-Tenant Analytics** — BUSINESS tier feature

### Architecture Recommendations

1. **Adopt Event-Driven Architecture** — Decouple billing, notifications, reporting
2. **Implement CQRS Pattern** — Separate read/write models for analytics
3. **Add Message Queue** — Kafka for high-volume events
4. **Implement Circuit Breaker** — For Stripe API resilience
5. **Add Health Checks** — Liveness & readiness probes

---

## ROADMAP: 4-Phase Transformation

### **Phase 1: Foundation (Months 1-3) — Single-Tenant to Multi-Tenant**

**Objectives:**
- Implement database per-schema architecture
- Add authentication & authorization layer
- Build agency switcher & multi-role support
- Integrate Stripe for billing

**Database Changes:**
- Create `platform` schema (global agencies, users, subscriptions)
- Implement schema-per-agency pattern (agency_${agency_id})
- Add audit_logs table
- Add agency_members & permissions tables
- Migrate existing mock data to schema structure

**Backend Changes:**
- Implement JWT authentication middleware
- Add RLS policies for tenant isolation
- Implement Stripe webhook handlers
- Add API routes for auth, subscriptions, team management
- Add schema switching logic in DB client

**Frontend Changes:**
- Add agency switcher dropdown (post-login)
- Add team invitation workflow
- Add subscription management pages
- Add activity/audit log viewer
- Update all pages to respect active agency context

**Risks:**
- Data migration bugs (test with copy of production data first)
- Breaking existing single-agency deployments (need migration script)
- Schema switching performance (test with 5k+ agencies)

**Timeline:** 8-10 weeks

---

### **Phase 2: Scalability (Months 4-6) — Multi-Agency Growth**

**Objectives:**
- Implement caching layer (Redis)
- Add background job queue
- Build cross-agency analytics
- Add API access for BUSINESS tier

**Database Changes:**
- Add query result caching strategy
- Implement full-text search (Elasticsearch)
- Add analytics materialized views
- Add API keys table

**Backend Changes:**
- Implement Bull/BullMQ for async jobs
- Add Redis caching for pricing, config
- Build batch reporting jobs
- Implement API key authentication
- Add Webhook support for integrations
- Build analytics aggregation pipeline

**Frontend Changes:**
- Add /analytics dashboard (BUSINESS tier)
- Add API documentation portal (/api-docs)
- Add webhook configuration UI
- Add scheduled reports feature
- Add export-to-CSV for tables

**Risks:**
- Job queue deadlocks (implement retry logic, DLQ)
- Cache invalidation bugs (test cache busting thoroughly)
- Analytics query timeout (optimize queries, add indexes)

**Timeline:** 8-10 weeks

---

### **Phase 3: Enterprise Features (Months 7-9) — Premium Tiers**

**Objectives:**
- Implement SSO (SAML/OAuth)
- Add white-labeling for BUSINESS tier
- Implement dedicated database option
- Add advanced audit logging
- Build compliance reports (GDPR, CNIL)

**Database Changes:**
- Add enterprise audit fields
- Add white-label configuration table
- Add SSO provider credentials table
- Add compliance_reports table

**Backend Changes:**
- Implement SAML 2.0 provider
- Add OAuth provider setup
- Build white-label branding engine
- Implement RLS policies for row-level compliance
- Add compliance report generation

**Frontend Changes:**
- Add white-label configuration UI
- Add SSO setup wizard
- Add enterprise audit viewer
- Add compliance report builder
- Add data export for GDPR

**Risks:**
- SAML configuration complexity (use Okta/OneLogin as reference)
- White-label branding scope creep (define limits upfront)
- Compliance audit failures (involve legal team early)

**Timeline:** 8-10 weeks

---

### **Phase 4: Global Scale (Months 10+) — Regional Deployment**

**Objectives:**
- Multi-region PostgreSQL (EU, Africa, APAC)
- Horizontal sharding for 10k+ agencies
- Global CDN caching
- Offer dedicated database tier

**Database Changes:**
- Implement schema sharding by agency_id range
- Set up read replicas in multiple regions
- Add geo-location routing
- Implement cross-region failover

**Backend Changes:**
- Implement shard-aware routing middleware
- Add multi-region replication
- Build disaster recovery automation
- Implement geo-IP detection for CDN routing
- Add international payment methods

**Frontend Changes:**
- Add region selector for agencies
- Add multi-region health status dashboard
- Add data residency compliance UI
- Add failover status indicator

**Risks:**
- Data consistency across regions (use eventual consistency)
- Latency for cross-region queries (shard by region)
- Massive operational complexity (requires dedicated DevOps team)

**Timeline:** 12+ weeks

---

## CRITICAL ISSUES & SOLUTIONS

### Issue #1: Current Mock Data Assumes Single Agency
**Solution:** Create migration script that:
1. Takes existing mock cars, clients, reservations, etc.
2. Creates new schema `agency_default`
3. Inserts data into schema
4. Maps any hardcoded agency ID (null) to actual agency ID

### Issue #2: No Backend = No Real Persistence
**Solution:** By end of Phase 1:
1. Connect to real PostgreSQL (Neon recommended for Vercel)
2. Migrate all mock data to database
3. Replace all `const cars = [...]` with `await db.query()`
4. Add proper error handling & caching

### Issue #3: No Real Authentication
**Solution:** By Phase 1:
1. Implement Bcrypt password hashing
2. Add JWT token generation/verification
3. Add session management (Redis or database)
4. Implement password reset flow
5. Add 2FA for sensitive operations

### Issue #4: Stripe Integration Missing
**Solution:** By Phase 1:
1. Create Stripe account (test mode first)
2. Implement `/api/subscriptions/create`
3. Handle Stripe webhooks (invoice.paid, subscription.deleted)
4. Add invoice PDF generation (Stripe does this)
5. Add payment method management

### Issue #5: File Uploads Not Implemented
**Solution:** By Phase 1:
1. Integrate Vercel Blob for file storage
2. Add contract PDF generation (use Puppeteer or React-PDF)
3. Add photo upload for damage reports
4. Add document scanning (OCR optional, Phase 3)

---

## DEPLOYMENT STRATEGY

### Current (Before Multi-Tenant):
```
vercel.com/lokarent
  ├── pages (all single-tenant)
  ├── lib (mock data)
  └── public (assets)
```

### Post-Phase 1 (Multi-Tenant):
```
api.lokarent.ma (Vercel Functions + Neon PostgreSQL)
  ├── /api/auth/* (login, logout, register)
  ├── /api/agencies/* (create, list, update)
  ├── /api/subscriptions/* (create, upgrade, webhook)
  ├── /api/cars/* (CRUD with RLS)
  ├── /api/reservations/* (CRUD with RLS)
  └── /api/...

app.lokarent.ma (Next.js frontend + shadcn/ui)
  ├── /login (single entry point)
  ├── /(app) (authenticated routes)
  └── /account (billing, subscription)

admin.lokarent.ma (Platform admin panel, optional)
  ├── /agencies (manage all agencies)
  ├── /subscriptions (view all subscriptions)
  └── /support (support tickets)
```

### CI/CD:
```
GitHub Push
  ↓
Run Tests (Jest + E2E)
  ↓
Run Type Check (TypeScript)
  ↓
Deploy to Staging (staging.lokarent.ma)
  ↓
Run Smoke Tests
  ↓
Approve + Deploy to Production (app.lokarent.ma)
  ↓
Run Monitoring (Sentry, DataDog)
```

---

## CONCLUSION

LokaRent has built a **production-quality single-tenant SaaS application** with a complete feature set and premium UX. The foundation is solid.

To transform it into a **multi-tenant platform capable of supporting thousands of agencies**, the critical path is:

1. **Phase 1 (Immediate):** Implement database isolation + authentication + Stripe integration
2. **Phase 2 (Q2):** Scale with caching, jobs, and cross-agency analytics
3. **Phase 3 (Q3):** Add enterprise features for premium tiers
4. **Phase 4 (Q4+):** Global scale with multi-region replication

**Investment required:** ~6-9 months of engineering (4-5 full-stack developers)
**Expected revenue:** 100 agencies × 599 DH × 12 months = ~718K DH/year by Month 18

**Next Step:** Approve Phase 1 architecture and begin implementation.

---

*Report prepared by: Senior Software Architect*  
*Reviewed by: CTO*  
*Status: APPROVED FOR IMPLEMENTATION*
