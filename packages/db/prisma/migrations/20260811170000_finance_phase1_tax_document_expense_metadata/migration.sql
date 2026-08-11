-- Phase-1 Finance schema preparation.
-- Existing historical rows are left NULL because their exact accepted tax basis
-- cannot be truthfully reconstructed after the fact.

ALTER TABLE "reservation_pricing_snapshots"
  ADD COLUMN "tax_rate" DECIMAL(14,4);

ALTER TABLE "invoice_line_items"
  ADD COLUMN "tax_rate" DECIMAL(14,4),
  ADD COLUMN "tax_amount" DECIMAL(14,4);

ALTER TABLE "invoices"
  ADD COLUMN "document_url" TEXT;

ALTER TABLE "expenses"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "internal_note" TEXT;
