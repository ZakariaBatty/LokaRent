CREATE TABLE "vehicle_photos" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "agency_id" UUID NOT NULL,
  "vehicle_id" UUID NOT NULL,
  "url" TEXT NOT NULL,
  "public_id" TEXT,
  "mime_type" TEXT,
  "size_bytes" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  "deleted_at" TIMESTAMPTZ,
  "deleted_by" UUID,
  CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vehicle_photos_vehicle_id_sort_order_key"
  ON "vehicle_photos"("vehicle_id", "sort_order");

CREATE INDEX "vehicle_photos_company_id_idx"
  ON "vehicle_photos"("company_id");

CREATE INDEX "vehicle_photos_agency_id_vehicle_id_idx"
  ON "vehicle_photos"("agency_id", "vehicle_id");

CREATE INDEX "vehicle_photos_vehicle_id_is_primary_idx"
  ON "vehicle_photos"("vehicle_id", "is_primary");

CREATE INDEX "vehicle_photos_created_at_idx"
  ON "vehicle_photos"("created_at");

ALTER TABLE "vehicle_photos"
  ADD CONSTRAINT "vehicle_photos_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "vehicle_photos"
  ADD CONSTRAINT "vehicle_photos_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "vehicle_photos"
  ADD CONSTRAINT "vehicle_photos_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
