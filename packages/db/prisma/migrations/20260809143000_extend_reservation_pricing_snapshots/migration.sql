ALTER TABLE "reservation_pricing_snapshots"
  ADD COLUMN "pricing_rule_id" UUID,
  ADD COLUMN "starts_at" TIMESTAMPTZ,
  ADD COLUMN "ends_at" TIMESTAMPTZ,
  ADD COLUMN "duration_value" SMALLINT,
  ADD COLUMN "duration_unit" TEXT,
  ADD COLUMN "discount_reason" TEXT,
  ADD COLUMN "mileage_limit" INTEGER,
  ADD COLUMN "extra_mileage_rate" DECIMAL(14,4),
  ADD COLUMN "deposit_amount" DECIMAL(14,4);

CREATE INDEX "reservation_pricing_snapshots_pricing_rule_id_idx"
  ON "reservation_pricing_snapshots" ("pricing_rule_id");

ALTER TABLE "reservation_pricing_snapshots"
  ADD CONSTRAINT "reservation_pricing_snapshots_pricing_rule_id_fkey"
  FOREIGN KEY ("pricing_rule_id")
  REFERENCES "vehicle_pricing_rules" ("id")
  ON DELETE NO ACTION
  ON UPDATE CASCADE;
