-- Invoice draft soft delete and manual invoice payment support.

ALTER TABLE "invoices"
  ADD COLUMN "deleted_at" TIMESTAMPTZ,
  ADD COLUMN "deleted_by" UUID;

ALTER TABLE "payments"
  ALTER COLUMN "reservation_id" DROP NOT NULL;

ALTER TABLE "payments"
  DROP CONSTRAINT IF EXISTS "payments_reservation_id_fkey";

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_reservation_id_fkey"
  FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "invoices"
  DROP CONSTRAINT IF EXISTS "invoices_reservation_id_key";

CREATE UNIQUE INDEX "invoices_active_rental_reservation_id_key"
  ON "invoices" ("reservation_id")
  WHERE "type" = 'rental'
    AND "reservation_id" IS NOT NULL
    AND "deleted_at" IS NULL;

CREATE INDEX "invoices_company_id_deleted_at_idx"
  ON "invoices" ("company_id", "deleted_at");
