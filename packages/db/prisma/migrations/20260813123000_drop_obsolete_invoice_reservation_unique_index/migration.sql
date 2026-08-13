-- Remove obsolete unconditional reservation uniqueness now replaced by
-- invoices_active_rental_reservation_id_key.

DROP INDEX IF EXISTS "invoices_reservation_id_key";
