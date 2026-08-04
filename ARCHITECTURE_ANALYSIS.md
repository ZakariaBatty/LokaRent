# Multi-Agency Implementation: Architecture Analysis & Recommendations

**Date**: June 29, 2026  
**Scope**: Post-implementation review of Workspace section (Agencies, Members, Permissions, Teams, Invitations, Billing, Activity Logs) and Settings redesign

---

## 1. STRUCTURAL OVERVIEW

### Page Hierarchy
```
/workspace/ (Workspace-scoped, multi-agency context)
  ├── /agencies – All agencies across workspace
  ├── /members – Central user management (cross-agency)
  ├── /permissions – RBAC matrix (workspace + per-user/agency overrides)
  ├── /teams (ORPHANED - see Redundancy #1)
  ├── /users (ORPHANED - see Redundancy #1)
  ├── /invitations – Workspace-level invites
  ├── /billing – Workspace-level subscriptions + invoices
  └── /activity – Workspace-level audit logs

/(app)/ (Agency-scoped operations)
  ├── /dashboard, /cars, /reservations, /clients, /contracts, /finances, /reports
  └── /settings/ (Agency-scoped)
      ├── /agency – Profile & Branding
      ├── /pricing – Tarifs & Options
      ├── /contract-template – Modèle de contrat
      ├── /teams – Agency Teams (NEW - replaces orphaned /users)
      ├── /notifications (MISSING - stub required)
      ├── /business-rules (MISSING - stub required)
      └── /users (ORPHANED - sidebar hidden but page still exists)
```

---

## 2. REDUNDANCY ANALYSIS

### CRITICAL: Redundancy #1 – USER MANAGEMENT DUPLICATION

**Problem**: Two separate user management systems exist with overlapping scope:

1. **`/workspace/members`** (NEW)
   - **Scope**: Workspace-level; shows ALL users across ALL agencies
   - **Purpose**: Central user directory with multi-agency view
   - **Pattern**: Table + detail panel (split-layout, 80/20)
   - **Features**: CRUD (Add, Edit, Delete), bulk assign to agencies/roles
   - **Data Model**: Built on `mockGlobalUsers` + `mockMemberships` + `mockTeams`

2. **`/settings/users`** (LEGACY - NOW ORPHANED)
   - **Scope**: Originally agency-scoped but uses global scope
   - **Purpose**: Team management with plan limits
   - **Pattern**: Table + detail panel (card-based)
   - **Features**: Invite, role assignment, permissions matrix, plan-based seat limits
   - **Data Model**: Built on legacy `users-data.ts` (separate from `mock-workspaces.ts`)

3. **`/workspace/users`** (ORPHANED)
   - **Scope**: Orphaned; not accessible from navigation
   - **Purpose**: Unknown/dead code
   - **Pattern**: Table + detail panel
   - **Data Model**: Uses `mockGlobalUsers` + `mockTeams`

**Impact on Backend**:
- **Decision required**: Which is the source of truth?
- **Choice A** (Recommended): Keep `/workspace/members` as primary; deprecate `/settings/users`
- **Choice B**: Keep `/settings/users` as primary for each agency; remove `/workspace/members`

**Recommendation**: **Choice A** — Single source of truth should be workspace-scoped with agency filters. The workspace view enables cross-agency insights and bulk operations that are necessary for platform administration.

---

### CRITICAL: Redundancy #2 – PERMISSIONS MANAGEMENT DUPLICATION

**Problem**: Three overlapping permissions systems exist:

1. **`/workspace/permissions`** (NEW - COMPREHENSIVE)
   - **Scope**: Workspace-scoped with three view modes
   - **Modes**: 
     - **Par rôle**: Role-based permissions (6 roles × 9 modules)
     - **Par utilisateur**: User-scoped permissions with agency overrides
     - **Par agence**: Agency-scoped permissions for all members
   - **Pattern**: Full-width matrix table with split detail panel
   - **Features**: Inline editing, dirty-state tracking, "Enregistrer" button, per-module granularity
   - **Data Model**: `rolePermissions` (baseline) + `mockUserPermissionOverrides` (exceptions)

2. **`/settings/users` → Permissions Matrix Tab** (LEGACY)
   - **Scope**: Agency-scoped; shows per-user permissions for active agency only
   - **Features**: Read-only matrix view
   - **Pattern**: Embedded in settings sidebar
   - **Data Model**: Uses `rolePermissions` from `users-data.ts`

**Impact on Backend**:
- **Decision required**: Single RBAC system or per-agency + override system?
- **Current**: Workspace permissions assume per-user + per-agency overrides; settings/users has no override capability

**Recommendation**: Consolidate to **workspace/permissions** as the single source of truth. The per-agency switcher in the "Par utilisateur" view handles agency-specific overrides. Deprecate the read-only matrix in `/settings/users`.

---

### MODERATE: Redundancy #3 – TEAMS MANAGEMENT

**Problem**: Two teams pages exist with conflicting scope:

1. **`/workspace/teams`** (NEW)
   - **Scope**: ALL teams across ALL agencies
   - **Purpose**: Workspace-level team directory
   - **Pattern**: Table + detail panel
   - **Features**: View-only; read teams, show members
   - **Data Model**: `mockTeams` (all)

2. **`/settings/teams`** (NEW)
   - **Scope**: Agency-scoped (uses `useAgency()`)
   - **Purpose**: Manage teams within the active agency
   - **Pattern**: SettingsCard + form panel + sticky-save-bar
   - **Features**: CRUD (Create, Edit, Delete), member assignment
   - **Data Model**: `mockTeams` filtered by `activeAgency`

**Analysis**: 
- **NOT technically redundant** — different scopes serve different purposes
- **Alignment issue**: `/workspace/teams` is read-only but `/settings/teams` is editable; unclear which is the primary edit interface

**Recommendation**: 
- Keep both but clarify purpose: `/workspace/teams` is a **directory** (read-only overview), `/settings/teams` is the **management interface** (CRUD only for active agency).
- Add breadcrumb or note in `/workspace/teams` stating "Edit teams in Settings → Équipes"

---

## 3. CONSISTENCY ANALYSIS

### UX Consistency: TABLE PATTERNS

**Reference**: Fleet (`/cars`), Reservations (`/reservations`), Clients (`/clients`)

| Page | Layout | Filter Bar | Search | Table Style | Detail Panel | CRUD |
|------|--------|-----------|--------|-------------|--------------|------|
| Fleet | Full-width table | Status, Type | Yes | `motion.tr` rows | Slide-over sheet (80%) | Add, Edit, Delete |
| Reservations | Full-width table | Status, Agency | Yes | `motion.tr` rows | Slide-over sheet (80%) | Add, Edit, Delete |
| Clients | Split layout (20/80) | Status, Type | Yes | `motion.tr` rows | Sticky panel (80%) | Add, Edit, Delete |
| Workspace > Agencies | Full-width table | Status, Plan | Yes | `motion.tr` rows | Slide-over sheet (80%) | View only |
| Workspace > Members | Split layout (20/80) | Role, Status, Agency | Yes | `motion.tr` rows + compact | Sticky panel (80%) | Add, Edit, Delete, Assign |
| Workspace > Teams | Full-width table | None | Yes | `motion.tr` rows | Slide-over sheet (80%) | View only |
| Workspace > Permissions | Split layout + matrix | None | Tabs | Matrix table | Inline editable | Edit inline |
| Settings > Teams | SettingsCard + form | None | None | Stacked rows | Slide-in panel | Create, Edit, Delete |

**Findings**:
- ✅ **Consistent**: All workspace pages use `motion.tr` rows, proper filtering, same empty states
- ✅ **Consistent**: Detail panels are either slide-over (80%) or sticky (20/80 split)
- ⚠️ **Inconsistent**: Settings teams uses `SettingsCard` pattern (enterprise admin UI) vs. workspace teams uses `WorkspacePageHeader` (SaaS UI)
- ⚠️ **Inconsistent**: Workspace permissions is a matrix (not a typical list table)

**Recommendation**: This is acceptable — Settings uses a different visual language (cards, sticky-save-bar) which is appropriate for admin configuration. Workspace uses the standard table pattern for operations.

---

### Navigation Consistency

| Level | Entry Point | Scope | Sidebar |
|-------|------------|-------|---------|
| **Main App** | `/dashboard` | Agency-scoped | AppSidebar (Cars, Reservations, Clients, …, Settings, Workspace) |
| **Workspace** | `/workspace` | Multi-agency | WorkspaceSidebar (Agencies, Members, Permissions, Invitations, Billing, Activity) |
| **Settings** | `/settings` | Agency-scoped | SettingsSidebar (Profile & Branding, Tarifs & Options, Modèle de contrat, Équipes, Notifications*, Règles métier*) |

**Findings**:
- ✅ **Consistent**: Three separate navigation contexts (AppSidebar, WorkspaceSidebar, SettingsSidebar)
- ✅ **Consistent**: AppSidebar includes Workspace link (crown icon) for admin access
- ⚠️ **Incomplete**: Notifications and Business Rules tabs exist in SettingsSidebar but pages don't exist

**Recommendation**: Create stub pages for `/settings/notifications` and `/settings/business-rules` to prevent broken links. These can be placeholder SettingsCards initially.

---

### Design Consistency

| Component | Pattern | Used In |
|-----------|---------|---------|
| Page Header | `WorkspacePageHeader` (icon, breadcrumb, title, description) | Workspace pages |
| Page Header | Settings heading (no component) | Settings pages |
| Detail Panel | Slide-over sheet (fixed 80%, right-aligned, overlays) | Agencies, Invitations, Teams (workspace) |
| Detail Panel | Sticky panel (20/80 split, collapses list) | Members, Permissions |
| Settings Container | `SettingsCard` (rounded, border, shadow) | Settings pages |
| Save Bar | `StickySaveBar` (sticky bottom, Sauvegarder/Réinitialiser) | Settings > Teams |
| Filter Bar | Search input + status pills + dropdowns | Most pages |
| Empty State | Icon + heading + description | Workspace pages |
| Avatar | Gradient circle + initials | Users, Members |
| Badges | Role, Status pills | Member rows, Permission rows |

**Findings**:
- ✅ **Consistent**: Color system (indigo/violet primary, status colors)
- ✅ **Consistent**: Typography (font-sans, consistent sizing)
- ✅ **Consistent**: Spacing (gap-4, p-4, etc.)
- ✅ **Consistent**: Motion (AnimatePresence, motion.tr entry animations)
- ⚠️ **Minor**: Settings pages don't use `WorkspacePageHeader`; instead use plain `<h1>` + `<p>` (acceptable for admin UI)

**Recommendation**: This is acceptable. The Settings section intentionally uses a different visual language (enterprise admin) vs. workspace (SaaS operations).

---

## 4. ARCHITECTURAL ISSUES

### Issue #1: Orphaned Pages (Dead Code)

**Affected Pages**:
- `/settings/users` – sidebar link removed, page still exists, components still built
- `/workspace/users` – never added to sidebar, orphaned
- `/workspace/teams` – read-only, unclear purpose vs. `/settings/teams`

**Backend Impact**:
- DB schema needs to decide: are team memberships stored globally or per-agency?
- Current mock data suggests per-agency (teams have `agencyId` + `memberIds` array)

**Recommendation**:
1. Delete `/app/workspace/users/page.tsx` (dead code)
2. Delete `/app/workspace/teams/page.tsx` (or repurpose as read-only directory)
3. Keep `/settings/users/page.tsx` but hide from sidebar (for backward compatibility during transition)

---

### Issue #2: Missing Settings Pages

**Affected Routes**:
- `/settings/notifications` – not implemented
- `/settings/business-rules` – not implemented

**Current State**: Sidebar links exist but routes are broken (404)

**Recommendation**: Create stub pages:
```tsx
// app/(app)/settings/notifications/page.tsx
export default function NotificationsPage() {
  return (
    <SettingsCard title="Notifications" description="En cours de développement">
      <div className="text-center text-slate-500">
        Configuration des notifications à venir
      </div>
    </SettingsCard>
  )
}
```

---

### Issue #3: Data Model Fragmentation

**Current State**: Two separate data sources:

1. **`/lib/mock-workspaces.ts`** (NEW - Multi-agency focus)
   - `mockGlobalUsers`, `mockMemberships`, `mockAgencies`
   - `mockTeams` (with `agencyId`)
   - `mockAuditLogs`, `rolePermissions`, `mockUserPermissionOverrides`
   - Types: `GlobalUser`, `AgencyMembership`, `AgencyTeam`, `UserRole`

2. **`/lib/users-data.ts`** (LEGACY - Agency-scoped focus)
   - `users` array (no agency association)
   - `planConfig` (seat limits, plan metadata)
   - Types: `TeamUser`, `UserRole` (different from workspaces)

**Backend Impact**:
- Database schema must choose: single users table with memberships, or separate tables per context?
- Recommended: Single `users` table + `workspace_memberships` join table
- All mock data should migrate to `mock-workspaces.ts`

**Recommendation**:
- Consolidate to `/lib/mock-workspaces.ts` as the single source of truth
- Remove `/lib/users-data.ts` or use it only for plan metadata (non-user data)
- Update `/settings/users` to read from `mock-workspaces` instead

---

### Issue #4: Permission Scoping Ambiguity

**Current State**: Permissions can be defined at three levels:

1. **Role-based** (baseline)
   - `rolePermissions[role].cars` = array of actions
   - Example: `rolePermissions['MANAGER'].cars = ['read', 'update']`

2. **User-based override**
   - `mockUserPermissionOverrides[]` – per user + agency
   - Example: "Youssef can read finances in Marrakech (exception)"

3. **Per-agency baseline**
   - Not implemented – assumed all agencies share the same role matrix

**Backend Impact**:
- Need to define: at what level should permissions be managed in DB?
- Option A: Single role matrix (current)
- Option B: Role matrix + per-agency overrides
- Option C: Per-user + per-agency matrix (most flexible, most complex)

**Recommendation**: Implement **Option B** at backend:
- `roles` table with `permissions` JSONB column
- `user_role_overrides` table for exceptions
- Query pattern: `SELECT permissions FROM roles WHERE role = 'MANAGER' UNION SELECT permissions FROM user_role_overrides WHERE user_id = 'x' AND agency_id = 'y'`

---

## 5. MISSING IMPLEMENTATIONS

### High Priority

1. **`/settings/notifications` page** – Broken sidebar link
2. **`/settings/business-rules` page** – Broken sidebar link
3. **Workspace API routes** – `/api/workspace/*` for CRUD operations
4. **Member invitation flow** – Email sending, invitation tokens
5. **Permission enforcement** – Backend middleware to check user permissions on requests

### Medium Priority

1. **Team member bulk operations** – Add/remove multiple members at once
2. **Audit log filtering by user** – Already exists in UI; needs backend query
3. **Export functionality** – Settings > Teams, Workspace > Members CSV export
4. **Agency switching persistence** – Save active agency to user preferences

### Low Priority

1. **Teams directory search** – `/workspace/teams` is read-only; could add filtering
2. **Permission templates** – Preset role configurations for common scenarios
3. **Batch permission changes** – Update multiple users' permissions at once

---

## 6. BACKEND SCHEMA RECOMMENDATIONS

### Core Tables Required

```sql
-- Users (global workspace scope)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Agencies
CREATE TABLE agencies (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  city VARCHAR,
  plan VARCHAR DEFAULT 'PRO', -- STARTER, PRO, ENTERPRISE
  status VARCHAR DEFAULT 'active', -- active, suspended, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cross-agency memberships
CREATE TABLE workspace_memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agency_id UUID REFERENCES agencies(id),
  role VARCHAR NOT NULL, -- OWNER, ADMIN, MANAGER, TEAM_LEAD, EMPLOYEE, CLIENT
  status VARCHAR DEFAULT 'active', -- active, pending, suspended
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP
);

-- Teams (agency-scoped)
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Team memberships
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  added_at TIMESTAMP DEFAULT NOW()
);

-- Role-based permissions (baseline)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role VARCHAR NOT NULL UNIQUE,
  permissions JSONB NOT NULL -- { "cars": ["read", "create", ...], ... }
);

-- Permission overrides (per-user + agency)
CREATE TABLE permission_overrides (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agency_id UUID REFERENCES agencies(id),
  module VARCHAR NOT NULL, -- cars, reservations, etc.
  actions VARCHAR[] NOT NULL, -- ['read', 'create', ...]
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  note TEXT
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR NOT NULL, -- create, read, update, delete, export, sign
  resource VARCHAR NOT NULL, -- reservation, client, contract, etc.
  resource_id VARCHAR,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions & Billing
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  plan VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'active',
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2),
  status VARCHAR DEFAULT 'unpaid',
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. RECOMMENDATIONS SUMMARY

### Before Backend Implementation

| Item | Status | Action | Priority |
|------|--------|--------|----------|
| Delete `/workspace/users` orphaned page | Ready | Delete file | High |
| Confirm `/settings/users` deprecation | Ready | Keep but hide sidebar link | High |
| Create `/settings/notifications` stub | Ready | Create page | High |
| Create `/settings/business-rules` stub | Ready | Create page | High |
| Consolidate `users-data.ts` → `mock-workspaces.ts` | Design | Migrate legacy data | High |
| Clarify `/workspace/teams` vs `/settings/teams` scope | Design | Document purposes | Medium |
| Design permission override system (backend) | Design | Schema review | High |
| Create workspace API routes | Implementation | `/api/workspace/*` | High |
| Implement email invitation system | Implementation | Nodemailer integration | Medium |
| Add permission middleware | Implementation | Check perms on requests | High |

---

## 8. VISUAL CONSISTENCY CHECKLIST

- ✅ All workspace pages use `WorkspacePageHeader` with consistent icon, breadcrumb, title, description
- ✅ All tables use `motion.tr` for animated row entry
- ✅ All detail panels use either slide-over (80%, fixed right) or split-layout (20/80)
- ✅ All empty states use consistent icon + heading + description
- ✅ All avatars use consistent gradient circles + initials
- ✅ All badges use consistent role/status colors
- ✅ All buttons use consistent primary/secondary/destructive styles
- ✅ All modals/sheets use consistent backdrop + animation
- ✅ All filter bars use consistent search + pills + dropdowns
- ⚠️ Settings uses different header pattern (no `SettingsPageHeader` component; uses plain headings) — acceptable for admin UI

---

## 9. CONCLUSION

The multi-agency implementation is **architecturally sound** with clear separation of concerns:
- **Workspace** = Multi-agency operations (centralized admin)
- **App** = Agency-scoped operations (individual agency management)
- **Settings** = Agency-scoped configuration (admin settings)

**Critical Issues to Resolve Before Backend**:
1. Consolidate user management (keep `/workspace/members` as primary)
2. Consolidate permissions (keep `/workspace/permissions` as primary)
3. Remove dead code (`/workspace/users`, `/workspace/teams`)
4. Create stub pages for missing settings routes
5. Finalize backend schema for roles, permissions, and overrides

**The application is ready for backend implementation** after resolving these items.
