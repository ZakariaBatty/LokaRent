-- Reservation extras catalog and authorized renter drivers.

CREATE TABLE "reservation_extra_definitions" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "agency_id" UUID,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(14,4) NOT NULL,
  "currency" CHAR(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by" UUID,

  CONSTRAINT "reservation_extra_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reservation_authorized_drivers" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "agency_id" UUID NOT NULL,
  "reservation_id" UUID NOT NULL,
  "full_name" TEXT NOT NULL,
  "license_number" TEXT NOT NULL,
  "license_issued_at" DATE,
  "license_expires_at" DATE,
  "document_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by" UUID,

  CONSTRAINT "reservation_authorized_drivers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "reservation_extras"
  ADD COLUMN "definition_id" UUID,
  ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'MAD';

CREATE UNIQUE INDEX "reservation_extra_definitions_company_key_unique_idx"
  ON "reservation_extra_definitions" ("company_id", "key")
  WHERE "agency_id" IS NULL AND "deleted_at" IS NULL;

CREATE UNIQUE INDEX "reservation_extra_definitions_agency_key_unique_idx"
  ON "reservation_extra_definitions" ("company_id", "agency_id", "key")
  WHERE "agency_id" IS NOT NULL AND "deleted_at" IS NULL;

CREATE INDEX "reservation_extra_definitions_active_sort_idx"
  ON "reservation_extra_definitions" ("company_id", "agency_id", "is_active", "sort_order");

CREATE INDEX "reservation_extra_definitions_company_deleted_idx"
  ON "reservation_extra_definitions" ("company_id", "deleted_at");

CREATE INDEX "reservation_authorized_drivers_company_id_idx"
  ON "reservation_authorized_drivers" ("company_id");

CREATE INDEX "reservation_authorized_drivers_agency_id_idx"
  ON "reservation_authorized_drivers" ("agency_id");

CREATE INDEX "reservation_authorized_drivers_reservation_id_deleted_at_idx"
  ON "reservation_authorized_drivers" ("reservation_id", "deleted_at");

CREATE INDEX "reservation_extras_definition_id_idx"
  ON "reservation_extras" ("definition_id");

ALTER TABLE "reservation_extra_definitions"
  ADD CONSTRAINT "reservation_extra_definitions_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "reservation_extra_definitions"
  ADD CONSTRAINT "reservation_extra_definitions_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "reservation_authorized_drivers"
  ADD CONSTRAINT "reservation_authorized_drivers_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "reservation_authorized_drivers"
  ADD CONSTRAINT "reservation_authorized_drivers_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "reservation_authorized_drivers"
  ADD CONSTRAINT "reservation_authorized_drivers_reservation_id_fkey"
  FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservation_extras"
  ADD CONSTRAINT "reservation_extras_definition_id_fkey"
  FOREIGN KEY ("definition_id") REFERENCES "reservation_extra_definitions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "documents" DROP CONSTRAINT "documents_entity_type_check";

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
      'driver',
      'reservation'
    )
  );
