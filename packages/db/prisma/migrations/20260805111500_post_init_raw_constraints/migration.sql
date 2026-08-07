-- PostgreSQL-only constraints and indexes that Prisma schema syntax cannot express.
-- Sources: FINAL_DATABASE_SOURCE_OF_TRUTH.md, DATABASE_DOMAIN_DESIGN.md, DATABASE_PHASE1.md.

-- Trigram search support for documented customer search indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Partial unique indexes.
CREATE UNIQUE INDEX "reservation_pricing_snapshots_current_unique_idx"
  ON "reservation_pricing_snapshots" ("reservation_id")
  WHERE "is_current" = true;

CREATE UNIQUE INDEX "driver_pricing_rules_current_unique_idx"
  ON "driver_pricing_rules" ("driver_id")
  WHERE "is_current" = true
    AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "settings_company_key_unique_idx"
  ON "settings" ("company_id", "key")
  WHERE "agency_id" IS NULL;

CREATE UNIQUE INDEX "number_sequences_company_sequence_period_unique_idx"
  ON "number_sequences" ("company_id", "sequence_key", "period_key")
  WHERE "agency_id" IS NULL;

CREATE UNIQUE INDEX "agency_memberships_primary_user_unique_idx"
  ON "agency_memberships" ("user_id")
  WHERE "is_primary" = true
    AND "deleted_at" IS NULL;

-- Role scope invariants for structurally safe membership-role assignment.
ALTER TABLE "company_memberships"
  ADD CONSTRAINT "company_memberships_role_scope_company_check"
  CHECK ("role_scope" = 'company');

ALTER TABLE "agency_memberships"
  ADD CONSTRAINT "agency_memberships_role_scope_agency_check"
  CHECK ("role_scope" = 'agency');

-- Canonical polymorphic document entity type allow-list.
ALTER TABLE "documents"
  ADD CONSTRAINT "documents_entity_type_check"
  CHECK (
    "entity_type" IN (
      'vehicle',
      'vehicle_maintenance',
      'customer',
      'customer_document',
      'contract',
      'invoice',
      'expense',
      'insurance',
      'inspection',
      'driver'
    )
  );

-- Documented GIN/trigram search indexes.
CREATE INDEX "customer_individuals_name_trgm_idx"
  ON "customer_individuals"
  USING GIN (("first_name" || ' ' || "last_name") gin_trgm_ops);

CREATE INDEX "customer_businesses_company_name_trgm_idx"
  ON "customer_businesses"
  USING GIN ("company_name" gin_trgm_ops);

-- Documented DESC indexes for recent lists and audit/activity feeds.
CREATE INDEX "reservations_created_at_desc_idx"
  ON "reservations" ("created_at" DESC);

CREATE INDEX "audit_logs_created_at_desc_idx"
  ON "audit_logs" ("created_at" DESC);

CREATE INDEX "activity_logs_company_created_at_desc_idx"
  ON "activity_logs" ("company_id", "created_at" DESC);

-- Documented partial cleanup/tenant query index for active documents.
CREATE INDEX "documents_company_active_idx"
  ON "documents" ("company_id")
  WHERE "deleted_at" IS NULL;
