-- Add explicit grant/deny semantics for agency-membership-scoped permission overrides.
CREATE TYPE "PermissionEffect" AS ENUM ('grant', 'deny');

ALTER TABLE "user_permission_overrides"
ADD COLUMN "effect" "PermissionEffect" NOT NULL DEFAULT 'grant';

CREATE UNIQUE INDEX "user_permission_overrides_agency_membership_id_permission_key_key"
ON "user_permission_overrides"("agency_membership_id", "permission_key");
