CREATE UNIQUE INDEX "contract_templates_single_default_agency_idx"
  ON "contract_templates" ("company_id", "agency_id")
  WHERE "is_default" = true
    AND "deleted_at" IS NULL
    AND "agency_id" IS NOT NULL;
