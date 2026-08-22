-- Drop the pre-amendment 1:1 reservation unique index that can remain as a
-- standalone index in databases where the original constraint was already
-- detached or recreated outside pg_constraint.
--
-- Preserve:
-- - contracts_reservation_version_number_key
-- - contracts_current_per_reservation_unique_idx
-- - all contract history/supersession foreign keys

DROP INDEX IF EXISTS "contracts_reservation_id_key";
