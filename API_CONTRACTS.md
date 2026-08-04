# Backend API Contracts for Multi-Agency Implementation

**Frontend Ready**: June 29, 2026  
**Target Completion**: Week of July 6, 2026

---

## Overview

These are the API endpoints required to replace mock data with real database queries. All endpoints follow REST conventions and return JSON.

---

## 1. USERS MANAGEMENT

### GET /api/workspace/members
**Purpose**: Fetch all workspace members (cross-agency)

**Query Parameters**:
```
?search=string          // Filter by name/email
?role=OWNER|ADMIN|...   // Filter by role
?status=active|pending  // Filter by status
?agency_id=uuid         // Filter by agency
?page=1&limit=50        // Pagination
```

**Response**:
```json
{
  "data": [
    {
      "id": "user_1",
      "firstName": "Ahmed",
      "lastName": "Bennani",
      "email": "ahmed@lokarent.ma",
      "phone": "+212 661 234 567",
      "createdAt": "2024-01-15T10:00:00Z",
      "lastLoginAt": "2026-06-24T14:30:00Z",
      "memberships": [
        {
          "id": "membership_1",
          "agencyId": "agency_mkh",
          "agencyName": "LokaRent Marrakech",
          "role": "OWNER",
          "status": "active",
          "joinedAt": "2024-01-15T10:00:00Z"
        }
      ],
      "teamsCount": 2
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 50
}
```

---

### POST /api/workspace/members
**Purpose**: Create new workspace member (invite)

**Request Body**:
```json
{
  "firstName": "Meryem",
  "lastName": "Alaoui",
  "email": "meryem@lokarent.ma",
  "phone": "+212 667 890 123",
  "agencies": [
    {
      "agencyId": "agency_casa",
      "role": "ADMIN"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "id": "user_new",
  "firstName": "Meryem",
  "lastName": "Alaoui",
  "email": "meryem@lokarent.ma",
  "memberships": [
    {
      "id": "membership_new",
      "agencyId": "agency_casa",
      "role": "ADMIN",
      "status": "pending",
      "joinedAt": "2026-06-29T10:00:00Z"
    }
  ]
}
```

---

### PUT /api/workspace/members/:userId
**Purpose**: Update member (name, phone, role assignments)

**Request Body**:
```json
{
  "firstName": "Ahmed",
  "lastName": "Bennani",
  "phone": "+212 661 234 567",
  "memberships": [
    {
      "id": "membership_1",
      "role": "MANAGER"  // Changed from OWNER
    },
    {
      "id": "membership_2",
      "role": "EMPLOYEE"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "id": "user_1",
  "firstName": "Ahmed",
  "lastName": "Bennani",
  "phone": "+212 661 234 567",
  "memberships": [
    {
      "id": "membership_1",
      "agencyId": "agency_mkh",
      "role": "MANAGER"
    }
  ]
}
```

---

### DELETE /api/workspace/members/:userId
**Purpose**: Remove user from workspace (revoke all memberships)

**Request Body**:
```json
{
  "reason": "Left company"  // Optional audit note
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User removed from workspace",
  "auditLogId": "audit_xyz"
}
```

---

### POST /api/workspace/members/:userId/agencies/:agencyId
**Purpose**: Assign user to agency with role

**Request Body**:
```json
{
  "role": "TEAM_LEAD"
}
```

**Response** (201 Created):
```json
{
  "id": "membership_new",
  "userId": "user_1",
  "agencyId": "agency_casa",
  "role": "TEAM_LEAD",
  "status": "active"
}
```

---

### DELETE /api/workspace/members/:userId/agencies/:agencyId
**Purpose**: Remove user from agency (revoke membership)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Membership revoked"
}
```

---

## 2. PERMISSIONS MANAGEMENT

### GET /api/workspace/permissions/roles
**Purpose**: Fetch role permission matrix

**Response**:
```json
{
  "data": [
    {
      "role": "OWNER",
      "label": "Propriétaire",
      "permissions": {
        "dashboard": ["read"],
        "cars": ["read", "create", "update", "delete", "export"],
        "reservations": ["read", "create", "update", "delete", "export"],
        "clients": ["read", "create", "update", "delete", "export"],
        "contracts": ["read", "create", "update", "delete"],
        "finances": ["read", "create", "update", "delete", "export"],
        "reports": ["read", "export"],
        "settings": ["read", "create", "update", "delete"],
        "workspace": ["read", "create", "update", "delete"]
      }
    }
  ]
}
```

---

### GET /api/workspace/permissions/user/:userId
**Purpose**: Fetch user's effective permissions (baseline + overrides)

**Query Parameters**:
```
?agency_id=uuid  // Filter by agency (required)
```

**Response**:
```json
{
  "userId": "user_1",
  "agencyId": "agency_mkh",
  "role": "MANAGER",
  "baseline": { ... },  // Role baseline from rolePermissions
  "overrides": [
    {
      "id": "override_1",
      "module": "finances",
      "actions": ["read"],
      "grantedBy": "user_admin",
      "grantedAt": "2024-06-01T10:00:00Z",
      "note": "Special access for monthly audit"
    }
  ],
  "effective": {
    // Merged: baseline + overrides
    "finances": ["read"]  // Override only
  }
}
```

---

### PUT /api/workspace/permissions/user/:userId
**Purpose**: Update user's permission overrides (add/remove exceptions)

**Request Body**:
```json
{
  "agencyId": "agency_mkh",
  "overrides": [
    {
      "module": "finances",
      "actions": ["read", "export"],
      "grantedBy": "user_admin",
      "note": "Q2 audit access"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "userId": "user_1",
  "agencyId": "agency_mkh",
  "overrides": [ ... ]
}
```

---

### DELETE /api/workspace/permissions/overrides/:overrideId
**Purpose**: Remove a permission override

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Override removed"
}
```

---

### GET /api/workspace/permissions/check
**Purpose**: Check if current user has permission (for frontend)

**Query Parameters**:
```
?module=cars&action=create&agency_id=uuid
```

**Response**:
```json
{
  "allowed": true,
  "reason": "MANAGER role permits this action"
}
```

---

## 3. TEAMS MANAGEMENT

### GET /api/workspace/teams
**Purpose**: Fetch all workspace teams

**Query Parameters**:
```
?agency_id=uuid  // Optional: filter by agency
?search=string   // Filter by name
```

**Response**:
```json
{
  "data": [
    {
      "id": "team_ops_mkh",
      "agencyId": "agency_mkh",
      "name": "Opérations",
      "description": "Gestion flotte et réservations",
      "memberCount": 3,
      "members": [
        {
          "id": "membership_1",
          "userId": "user_1",
          "firstName": "Ahmed",
          "lastName": "Bennani"
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z",
      "createdBy": "user_admin"
    }
  ]
}
```

---

### GET /api/agencies/:agencyId/teams
**Purpose**: Fetch teams for a specific agency (scoped)

**Response**: Same as above

---

### POST /api/agencies/:agencyId/teams
**Purpose**: Create team in agency

**Request Body**:
```json
{
  "name": "Maintenance",
  "description": "Vehicle maintenance and repairs",
  "memberIds": ["membership_1", "membership_2"]
}
```

**Response** (201 Created):
```json
{
  "id": "team_maint",
  "agencyId": "agency_mkh",
  "name": "Maintenance",
  "description": "Vehicle maintenance and repairs",
  "members": [ ... ]
}
```

---

### PUT /api/agencies/:agencyId/teams/:teamId
**Purpose**: Update team

**Request Body**:
```json
{
  "name": "Maintenance & Support",
  "description": "...",
  "memberIds": ["membership_1", "membership_2", "membership_3"]
}
```

**Response** (200 OK): Updated team object

---

### DELETE /api/agencies/:agencyId/teams/:teamId
**Purpose**: Delete team

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Team deleted"
}
```

---

## 4. INVITATIONS

### GET /api/workspace/invitations
**Purpose**: Fetch pending invitations

**Query Parameters**:
```
?status=pending|accepted|expired
?agency_id=uuid
```

**Response**:
```json
{
  "data": [
    {
      "id": "invite_1",
      "email": "new@lokarent.ma",
      "firstName": "Hassan",
      "lastName": "El Amrani",
      "role": "TEAM_LEAD",
      "agencyId": "agency_casa",
      "status": "pending",
      "createdAt": "2026-06-20T10:00:00Z",
      "expiresAt": "2026-06-27T10:00:00Z",
      "invitedBy": "user_1"
    }
  ]
}
```

---

### POST /api/workspace/invitations
**Purpose**: Send invitation to new user

**Request Body**:
```json
{
  "email": "new@lokarent.ma",
  "firstName": "Hassan",
  "lastName": "El Amrani",
  "role": "TEAM_LEAD",
  "agencyId": "agency_casa",
  "message": "Welcome to our team!"
}
```

**Response** (201 Created):
```json
{
  "id": "invite_1",
  "email": "new@lokarent.ma",
  "status": "pending"
}
```

---

### POST /api/workspace/invitations/:inviteId/accept
**Purpose**: Accept invitation (user action)

**Request Body**:
```json
{
  "password": "SecurePassword123!",
  "token": "invite_token_abc123"
}
```

**Response** (200 OK):
```json
{
  "userId": "user_new",
  "membershipId": "membership_new",
  "message": "Invitation accepted"
}
```

---

### DELETE /api/workspace/invitations/:inviteId
**Purpose**: Revoke invitation

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Invitation revoked"
}
```

---

## 5. AGENCIES

### GET /api/workspace/agencies
**Purpose**: Fetch all agencies in workspace

**Query Parameters**:
```
?search=string
?status=active|suspended
?page=1&limit=50
```

**Response**:
```json
{
  "data": [
    {
      "id": "agency_mkh",
      "name": "LokaRent Marrakech",
      "city": "Marrakech",
      "plan": "PRO",
      "status": "active",
      "revenue": 125000,
      "memberCount": 5,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 3
}
```

---

### GET /api/workspace/agencies/:agencyId
**Purpose**: Fetch single agency details

**Response**:
```json
{
  "id": "agency_mkh",
  "name": "LokaRent Marrakech",
  "city": "Marrakech",
  "plan": "PRO",
  "status": "active",
  "contactName": "Ahmed Bennani",
  "contactPhone": "+212 661 234 567",
  "contractStart": "2024-01-15T00:00:00Z",
  "revenue": 125000,
  "expenses": 45000,
  "vehicleCount": 5,
  "reservationCount": 12,
  "members": [ ... ],
  "subscriptions": [ ... ],
  "auditLog": [ ... ]
}
```

---

## 6. AUDIT LOGS

### GET /api/workspace/activity
**Purpose**: Fetch workspace audit logs

**Query Parameters**:
```
?agency_id=uuid
?user_id=uuid
?action=create|update|delete|export
?resource=reservation|client
?search=string
?page=1&limit=50
```

**Response**:
```json
{
  "data": [
    {
      "id": "audit_1",
      "agencyId": "agency_mkh",
      "userId": "user_1",
      "action": "create",
      "resource": "reservation",
      "resourceId": "res_123",
      "details": "Created reservation for Ahmed Hassan",
      "createdAt": "2026-06-29T10:00:00Z"
    }
  ],
  "total": 1247
}
```

---

### GET /api/agencies/:agencyId/activity
**Purpose**: Fetch agency-scoped audit logs

**Query Parameters**: Same as above

---

## 7. BILLING

### GET /api/workspace/subscriptions
**Purpose**: Fetch all workspace subscriptions

**Response**:
```json
{
  "data": [
    {
      "id": "sub_1",
      "agencyId": "agency_mkh",
      "agencyName": "LokaRent Marrakech",
      "plan": "PRO",
      "amount": 599,
      "status": "active",
      "billingPeriodStart": "2026-06-01T00:00:00Z",
      "billingPeriodEnd": "2026-07-01T00:00:00Z",
      "autoRenew": true
    }
  ]
}
```

---

### GET /api/workspace/invoices
**Purpose**: Fetch all invoices

**Query Parameters**:
```
?status=unpaid|paid|overdue
?agency_id=uuid
```

**Response**:
```json
{
  "data": [
    {
      "id": "inv_1",
      "agencyId": "agency_mkh",
      "subscriptionId": "sub_1",
      "amount": 599,
      "status": "paid",
      "issueDate": "2026-06-01T00:00:00Z",
      "dueDate": "2026-06-15T00:00:00Z",
      "paidAt": "2026-06-10T10:00:00Z"
    }
  ]
}
```

---

## Error Responses

All endpoints follow this error format:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "User does not have permission to perform this action",
    "details": {
      "required": ["delete"],
      "available": ["read"]
    }
  }
}
```

### Common Error Codes
- `NOT_FOUND` (404) – Resource not found
- `UNAUTHORIZED` (401) – No auth token
- `FORBIDDEN` (403) – Auth token invalid
- `PERMISSION_DENIED` (403) – Insufficient permissions
- `VALIDATION_ERROR` (400) – Invalid request body
- `CONFLICT` (409) – Resource already exists
- `RATE_LIMITED` (429) – Too many requests
- `INTERNAL_ERROR` (500) – Server error

---

## Authentication

All endpoints require bearer token in `Authorization` header:

```
Authorization: Bearer eyJhbGc...
```

Token contains:
- `userId`
- `agencyId` (current agency context)
- `roles` (array of roles across all agencies)
- `permissions` (computed effective permissions)

---

## Pagination

List endpoints support pagination:

```json
{
  "data": [ ... ],
  "total": 1247,
  "page": 1,
  "limit": 50,
  "totalPages": 25
}
```

---

## Implementation Notes

1. **Permissions Check**: Every endpoint must verify the user has the required permission before returning data
2. **Audit Logging**: Every write operation (POST, PUT, DELETE) must create an audit log entry
3. **Email Invitations**: When creating invitations, send email with acceptance link
4. **Soft Deletes**: Consider soft-deletes for users/agencies to preserve audit trail
5. **Caching**: Cache role permissions (TTL: 1 hour) to reduce database queries
6. **Rate Limiting**: Implement rate limiting per user/IP to prevent abuse

---

## Test Cases for Backend Team

### User Management
- [ ] Create user and verify membership created
- [ ] Update user and verify changes reflected
- [ ] Delete user and verify all memberships revoked
- [ ] Assign user to agency and verify membership
- [ ] Remove user from agency and verify permission denied

### Permissions
- [ ] Check baseline permissions for role
- [ ] Add override and verify effective permissions
- [ ] Remove override and verify baseline restored
- [ ] Verify permission check endpoint works

### Teams
- [ ] Create team and verify members assigned
- [ ] Update team members and verify changes
- [ ] Delete team and verify cleanup
- [ ] List teams by agency

### Audit
- [ ] Verify create action logged
- [ ] Verify update action logged
- [ ] Verify delete action logged
- [ ] Filter audit logs by user/action/resource

---

**Ready for development.** Contact frontend team with questions about expected data shapes.
