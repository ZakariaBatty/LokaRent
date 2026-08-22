-- Support reservation-independent manual invoices while preserving one rental
-- invoice per reservation.

CREATE TYPE "InvoiceType" AS ENUM ('rental', 'manual');

ALTER TABLE "invoices"
  ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'rental',
  ALTER COLUMN "reservation_id" DROP NOT NULL;

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_type_reservation_check"
  CHECK (
    ("type" = 'rental' AND "reservation_id" IS NOT NULL)
    OR
    ("type" = 'manual' AND "reservation_id" IS NULL)
  );
