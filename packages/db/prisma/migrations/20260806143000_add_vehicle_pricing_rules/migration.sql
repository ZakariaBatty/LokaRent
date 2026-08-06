CREATE TABLE "vehicle_pricing_rules" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "agency_id" UUID NOT NULL,
  "vehicle_id" UUID,
  "vehicle_category_id" UUID,
  "daily_rate" DECIMAL(14,4),
  "weekly_rate" DECIMAL(14,4),
  "monthly_rate" DECIMAL(14,4),
  "deposit_amount" DECIMAL(14,4),
  "mileage_limit" INTEGER,
  "extra_mileage_rate" DECIMAL(14,4),
  "currency" CHAR(3) NOT NULL,
  "valid_from" DATE NOT NULL,
  "valid_to" DATE,
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by" UUID,
  CONSTRAINT "vehicle_pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vehicle_pricing_rules_company_id_idx"
  ON "vehicle_pricing_rules"("company_id");

CREATE INDEX "vehicle_pricing_rules_agency_id_vehicle_id_is_current_idx"
  ON "vehicle_pricing_rules"("agency_id", "vehicle_id", "is_current");

CREATE INDEX "vehicle_pricing_rules_agency_id_vehicle_category_id_is_current_idx"
  ON "vehicle_pricing_rules"("agency_id", "vehicle_category_id", "is_current");

CREATE INDEX "vehicle_pricing_rules_vehicle_id_valid_from_idx"
  ON "vehicle_pricing_rules"("vehicle_id", "valid_from");

CREATE INDEX "vehicle_pricing_rules_vehicle_category_id_valid_from_idx"
  ON "vehicle_pricing_rules"("vehicle_category_id", "valid_from");

CREATE INDEX "vehicle_pricing_rules_created_at_idx"
  ON "vehicle_pricing_rules"("created_at");

ALTER TABLE "vehicle_pricing_rules"
  ADD CONSTRAINT "vehicle_pricing_rules_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "vehicle_pricing_rules"
  ADD CONSTRAINT "vehicle_pricing_rules_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "vehicle_pricing_rules"
  ADD CONSTRAINT "vehicle_pricing_rules_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_pricing_rules"
  ADD CONSTRAINT "vehicle_pricing_rules_vehicle_category_id_fkey"
  FOREIGN KEY ("vehicle_category_id") REFERENCES "vehicle_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vehicle_pricing_rules"
  ADD CONSTRAINT "vehicle_pricing_rules_exactly_one_target_check"
  CHECK (
    ("vehicle_id" IS NOT NULL AND "vehicle_category_id" IS NULL)
    OR
    ("vehicle_id" IS NULL AND "vehicle_category_id" IS NOT NULL)
  );

ALTER TABLE "vehicle_pricing_rules"
  ADD CONSTRAINT "vehicle_pricing_rules_valid_range_check"
  CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from");

CREATE UNIQUE INDEX "vehicle_pricing_rules_current_vehicle_unique_idx"
  ON "vehicle_pricing_rules" ("agency_id", "vehicle_id")
  WHERE "is_current" = true
    AND "vehicle_id" IS NOT NULL
    AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "vehicle_pricing_rules_current_category_unique_idx"
  ON "vehicle_pricing_rules" ("agency_id", "vehicle_category_id")
  WHERE "is_current" = true
    AND "vehicle_category_id" IS NOT NULL
    AND "deleted_at" IS NULL;
