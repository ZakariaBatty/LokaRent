-- Contract amendment/history support.
-- Existing contracts are preserved as version 1/current and linked to the
-- best available pricing snapshot for their reservation.

ALTER TABLE "contracts"
  DROP CONSTRAINT IF EXISTS "contracts_reservation_id_key";

ALTER TABLE "contracts"
  ADD COLUMN "pricing_snapshot_id" UUID,
  ADD COLUMN "supersedes_contract_id" UUID,
  ADD COLUMN "version_number" SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN "is_current" BOOLEAN NOT NULL DEFAULT true;

UPDATE "contracts" AS "contract"
SET "pricing_snapshot_id" = (
  SELECT "snapshot"."id"
  FROM "reservation_pricing_snapshots" AS "snapshot"
  WHERE "snapshot"."reservation_id" = "contract"."reservation_id"
    AND "snapshot"."company_id" = "contract"."company_id"
  ORDER BY "snapshot"."is_current" DESC, "snapshot"."created_at" DESC, "snapshot"."id" ASC
  LIMIT 1
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "contracts"
    WHERE "pricing_snapshot_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add contracts.pricing_snapshot_id: at least one existing contract has no reservation pricing snapshot.';
  END IF;
END $$;

ALTER TABLE "contracts"
  ALTER COLUMN "pricing_snapshot_id" SET NOT NULL;

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_pricing_snapshot_id_fkey"
  FOREIGN KEY ("pricing_snapshot_id")
  REFERENCES "reservation_pricing_snapshots" ("id")
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

ALTER TABLE "contracts"
  ADD CONSTRAINT "contracts_supersedes_contract_id_fkey"
  FOREIGN KEY ("supersedes_contract_id")
  REFERENCES "contracts" ("id")
  ON DELETE NO ACTION
  ON UPDATE CASCADE;

CREATE UNIQUE INDEX "contracts_reservation_version_number_key"
  ON "contracts" ("reservation_id", "version_number");

CREATE UNIQUE INDEX "contracts_current_per_reservation_unique_idx"
  ON "contracts" ("reservation_id")
  WHERE "is_current" = true
    AND "deleted_at" IS NULL;

CREATE INDEX "contracts_reservation_id_created_at_idx"
  ON "contracts" ("reservation_id", "created_at");

CREATE INDEX "contracts_pricing_snapshot_id_idx"
  ON "contracts" ("pricing_snapshot_id");

CREATE INDEX "contracts_supersedes_contract_id_idx"
  ON "contracts" ("supersedes_contract_id");
