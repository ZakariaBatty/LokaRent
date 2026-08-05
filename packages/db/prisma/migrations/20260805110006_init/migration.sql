-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'suspended', 'trial', 'cancelled');

-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deactivated');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('company', 'agency');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('available', 'rented', 'maintenance', 'inactive', 'retired');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'lpg');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('manual', 'automatic');

-- CreateEnum
CREATE TYPE "InsuranceCoverageType" AS ENUM ('third_party', 'comprehensive', 'fleet');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('pass', 'fail', 'conditional');

-- CreateEnum
CREATE TYPE "MileageSource" AS ENUM ('contract_pickup', 'contract_return', 'maintenance', 'manual');

-- CreateEnum
CREATE TYPE "AvailabilityBlockReason" AS ENUM ('maintenance', 'personal_use', 'hold', 'other');

-- CreateEnum
CREATE TYPE "VehicleMaintenanceStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('individual', 'company');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('active', 'inactive', 'blacklisted');

-- CreateEnum
CREATE TYPE "CustomerDocumentType" AS ENUM ('passport', 'national_id', 'driving_license', 'residence_permit');

-- CreateEnum
CREATE TYPE "BlacklistSeverity" AS ENUM ('warning', 'blocked', 'permanent');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('phone', 'email', 'whatsapp');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('enquiry', 'confirmed', 'active', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "InspectionEvent" AS ENUM ('pickup', 'return');

-- CreateEnum
CREATE TYPE "InspectionCondition" AS ENUM ('ok', 'scratched', 'dented', 'broken', 'missing');

-- CreateEnum
CREATE TYPE "SignerType" AS ENUM ('customer', 'agent', 'witness');

-- CreateEnum
CREATE TYPE "SignatureEvent" AS ENUM ('pickup', 'return');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'voided');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'bank_transfer', 'cheque', 'card', 'other');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('held', 'released', 'forfeited', 'partially_released');

-- CreateEnum
CREATE TYPE "DepositMethod" AS ENUM ('cash', 'cheque', 'card', 'other');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "DriverPricingType" AS ENUM ('monthly', 'hourly', 'mission');

-- CreateEnum
CREATE TYPE "DriverDocumentType" AS ENUM ('driving_license', 'national_id', 'contract', 'other');

-- CreateEnum
CREATE TYPE "DriverRole" AS ENUM ('primary', 'additional');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "timezone" TEXT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "plan_id" UUID NOT NULL,
    "status" "CompanyStatus" NOT NULL,
    "trial_ends_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country_code" CHAR(2),
    "timezone" TEXT,
    "currency" CHAR(3),
    "phone" TEXT,
    "email" TEXT,
    "address" JSONB,
    "status" "AgencyStatus" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "locale" TEXT DEFAULT 'fr',
    "timezone" TEXT,
    "status" "UserStatus" NOT NULL,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "RoleScope" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_memberships" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "role_scope" "RoleScope" NOT NULL DEFAULT 'company',
    "status" "MembershipStatus" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_memberships" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "role_scope" "RoleScope" NOT NULL DEFAULT 'agency',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "MembershipStatus" NOT NULL,
    "joined_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "agency_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_overrides" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "agency_membership_id" UUID NOT NULL,
    "permission_key" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "email" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_categories" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "vin" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" SMALLINT NOT NULL,
    "color" TEXT,
    "fuel_type" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "seats" SMALLINT,
    "status" "VehicleStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_insurances" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "coverage_type" "InsuranceCoverageType",
    "starts_at" DATE NOT NULL,
    "expires_at" DATE NOT NULL,
    "premium_amount" DECIMAL(14,4),
    "currency" CHAR(3),
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "vehicle_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_registrations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "registration_number" TEXT NOT NULL,
    "issued_at" DATE,
    "expires_at" DATE NOT NULL,
    "issuing_authority" TEXT,
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_vignettes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "tax_year" SMALLINT NOT NULL,
    "paid_at" DATE NOT NULL,
    "expires_at" DATE NOT NULL,
    "amount" DECIMAL(14,4),
    "currency" CHAR(3),
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_vignettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_inspections" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "inspected_at" DATE NOT NULL,
    "expires_at" DATE NOT NULL,
    "result" "InspectionResult" NOT NULL,
    "center" TEXT,
    "cost" DECIMAL(14,4),
    "currency" CHAR(3),
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_mileage_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "mileage" INTEGER NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL,
    "source" "MileageSource" NOT NULL,
    "reference_id" UUID,
    "recorded_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_mileage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenances" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "status" "VehicleMaintenanceStatus" NOT NULL DEFAULT 'scheduled',
    "type" TEXT NOT NULL,
    "performed_at" DATE NOT NULL,
    "mileage_at_service" INTEGER,
    "description" TEXT,
    "cost" DECIMAL(14,4),
    "currency_code" CHAR(3),
    "provider" TEXT,
    "next_due_at" DATE,
    "next_due_mileage" INTEGER,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "vehicle_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_availability_blocks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "reason" "AvailabilityBlockReason" NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "reservation_id" UUID,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "vehicle_availability_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "CustomerStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_individuals" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" DATE,
    "nationality" CHAR(2),
    "driving_license_number" TEXT,
    "driving_license_expires_at" DATE,
    "driving_license_country" CHAR(2),
    "cin_number" TEXT,
    "cin_expires_at" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_individuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_businesses" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "registration_number" TEXT,
    "tax_id" TEXT,
    "contact_person_name" TEXT,
    "contact_person_phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_documents" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "CustomerDocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "issued_at" DATE,
    "expires_at" DATE,
    "issuing_country" CHAR(2),
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "customer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_blacklist" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" "BlacklistSeverity" NOT NULL,
    "added_by" UUID NOT NULL,
    "lifted_at" TIMESTAMPTZ,
    "lifted_by" UUID,
    "lift_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_sources" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_external" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "assigned_agent_id" UUID,
    "status" "ReservationStatus" NOT NULL DEFAULT 'enquiry',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "pickup_location" TEXT,
    "return_location" TEXT,
    "days" SMALLINT NOT NULL,
    "price_per_day" DECIMAL(14,4) NOT NULL,
    "extras_total" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "discount_reason" TEXT,
    "total_amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "deposit_amount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "advance_amount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "internal_notes" TEXT,
    "cancellation_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_by" UUID,
    "confirmed_at" TIMESTAMPTZ,
    "activated_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_pricing_snapshots" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "supersedes_id" UUID,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "price_per_day" DECIMAL(14,4) NOT NULL,
    "days" SMALLINT NOT NULL,
    "extras_total" DECIMAL(14,4) NOT NULL,
    "discount_amount" DECIMAL(14,4) NOT NULL,
    "total_amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "locked_at" TIMESTAMPTZ NOT NULL,
    "locked_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reservation_pricing_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_extras" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "unit_price" DECIMAL(14,4) NOT NULL,
    "quantity" SMALLINT NOT NULL DEFAULT 1,
    "total_price" DECIMAL(14,4) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_timeline_events" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "description" TEXT,
    "performed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_templates" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "name" TEXT NOT NULL,
    "version" SMALLINT NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_template_versions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "contract_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "reservation_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "template_id" UUID,
    "template_version_id" UUID,
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "pickup_mileage" INTEGER NOT NULL,
    "return_mileage" INTEGER,
    "pickup_fuel_level" SMALLINT,
    "return_fuel_level" SMALLINT,
    "pickup_at" TIMESTAMPTZ NOT NULL,
    "returned_at" TIMESTAMPTZ,
    "notes" TEXT,
    "rendered_html" TEXT NOT NULL,
    "rendered_pdf_url" TEXT,
    "content_snapshot" JSONB NOT NULL,
    "content_hash" TEXT NOT NULL,
    "signed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_inspection_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "event" "InspectionEvent" NOT NULL,
    "zone" TEXT NOT NULL,
    "condition" "InspectionCondition" NOT NULL,
    "notes" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "contract_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "contract_id" UUID NOT NULL,
    "signer_type" "SignerType" NOT NULL,
    "signer_name" TEXT NOT NULL,
    "event" "SignatureEvent" NOT NULL,
    "signed_at" TIMESTAMPTZ NOT NULL,
    "signature_data" TEXT,
    "ip_address" TEXT,
    "signed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "reservation_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "customer_business_id" UUID,
    "status" "InvoiceStatus" NOT NULL,
    "subtotal" DECIMAL(14,4) NOT NULL,
    "tax_amount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "issued_at" DATE,
    "due_at" DATE,
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_price" DECIMAL(14,4) NOT NULL,
    "total_price" DECIMAL(14,4) NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "invoice_id" UUID,
    "customer_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "method" "DepositMethod" NOT NULL,
    "collected_at" TIMESTAMPTZ NOT NULL,
    "collected_by" UUID NOT NULL,
    "status" "DepositStatus" NOT NULL,
    "released_at" TIMESTAMPTZ,
    "released_by" UUID,
    "released_amount" DECIMAL(14,4),
    "forfeiture_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "original_invoice_id" UUID NOT NULL,
    "replacement_invoice_id" UUID,
    "amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "reason" TEXT,
    "issued_by" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "reservation_id" UUID,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "occurred_at" DATE NOT NULL,
    "method" "PaymentMethod",
    "reference" TEXT,
    "document_url" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_payments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "driver_pricing_rule_id" UUID NOT NULL,
    "reservation_id" UUID,
    "gross_amount" DECIMAL(14,4) NOT NULL,
    "tax_withheld_amount" DECIMAL(14,4),
    "net_amount" DECIMAL(14,4),
    "currency" CHAR(3) NOT NULL,
    "period_start" DATE,
    "period_end" DATE,
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,
    "recorded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "home_agency_id" UUID NOT NULL,
    "reference" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_pricing_rules" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "pricing_type" "DriverPricingType" NOT NULL,
    "monthly_rate" DECIMAL(14,4),
    "hourly_rate" DECIMAL(14,4),
    "mission_rate" DECIMAL(14,4),
    "currency" CHAR(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "driver_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_documents" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "type" "DriverDocumentType" NOT NULL,
    "document_number" TEXT,
    "issued_at" DATE,
    "expires_at" DATE,
    "document_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_reservation_assignments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "role" "DriverRole" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "driver_reservation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "value_type" TEXT NOT NULL,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "sequence_key" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "last_value" BIGINT NOT NULL DEFAULT 0,
    "prefix" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "limit_key" TEXT NOT NULL,
    "limit_value" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "feature_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "storage_url" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by" UUID,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "agency_id" UUID,
    "user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "verb" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_plan_id_idx" ON "companies"("plan_id");

-- CreateIndex
CREATE INDEX "companies_created_at_idx" ON "companies"("created_at");

-- CreateIndex
CREATE INDEX "agencies_company_id_idx" ON "agencies"("company_id");

-- CreateIndex
CREATE INDEX "agencies_created_at_idx" ON "agencies"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_company_id_code_key" ON "agencies"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "roles_company_id_idx" ON "roles"("company_id");

-- CreateIndex
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_id_scope_key" ON "roles"("id", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_id_name_scope_key" ON "roles"("company_id", "name", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_key_key" ON "role_permissions"("role_id", "permission_key");

-- CreateIndex
CREATE INDEX "company_memberships_company_id_idx" ON "company_memberships"("company_id");

-- CreateIndex
CREATE INDEX "company_memberships_role_id_role_scope_idx" ON "company_memberships"("role_id", "role_scope");

-- CreateIndex
CREATE INDEX "company_memberships_created_at_idx" ON "company_memberships"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_user_id_company_id_key" ON "company_memberships"("user_id", "company_id");

-- CreateIndex
CREATE INDEX "agency_memberships_company_id_idx" ON "agency_memberships"("company_id");

-- CreateIndex
CREATE INDEX "agency_memberships_agency_id_idx" ON "agency_memberships"("agency_id");

-- CreateIndex
CREATE INDEX "agency_memberships_role_id_role_scope_idx" ON "agency_memberships"("role_id", "role_scope");

-- CreateIndex
CREATE INDEX "agency_memberships_is_primary_idx" ON "agency_memberships"("is_primary");

-- CreateIndex
CREATE INDEX "agency_memberships_created_at_idx" ON "agency_memberships"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agency_memberships_user_id_agency_id_key" ON "agency_memberships"("user_id", "agency_id");

-- CreateIndex
CREATE INDEX "user_permission_overrides_user_id_idx" ON "user_permission_overrides"("user_id");

-- CreateIndex
CREATE INDEX "user_permission_overrides_agency_membership_id_idx" ON "user_permission_overrides"("agency_membership_id");

-- CreateIndex
CREATE INDEX "user_permission_overrides_created_at_idx" ON "user_permission_overrides"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_company_id_idx" ON "invitations"("company_id");

-- CreateIndex
CREATE INDEX "invitations_agency_id_idx" ON "invitations"("agency_id");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_expires_at_idx" ON "invitations"("expires_at");

-- CreateIndex
CREATE INDEX "invitations_created_at_idx" ON "invitations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_company_id_email_key" ON "invitations"("company_id", "email");

-- CreateIndex
CREATE INDEX "vehicle_categories_company_id_idx" ON "vehicle_categories"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_categories_created_at_idx" ON "vehicle_categories"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_categories_company_id_name_key" ON "vehicle_categories"("company_id", "name");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE INDEX "vehicles_agency_id_idx" ON "vehicles"("agency_id");

-- CreateIndex
CREATE INDEX "vehicles_created_at_idx" ON "vehicles"("created_at");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_category_id_idx" ON "vehicles"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_company_id_plate_key" ON "vehicles"("company_id", "plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_company_id_code_key" ON "vehicles"("company_id", "code");

-- CreateIndex
CREATE INDEX "vehicle_insurances_company_id_idx" ON "vehicle_insurances"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_insurances_agency_id_idx" ON "vehicle_insurances"("agency_id");

-- CreateIndex
CREATE INDEX "vehicle_insurances_created_at_idx" ON "vehicle_insurances"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_insurances_vehicle_id_expires_at_idx" ON "vehicle_insurances"("vehicle_id", "expires_at");

-- CreateIndex
CREATE INDEX "vehicle_registrations_company_id_idx" ON "vehicle_registrations"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_registrations_agency_id_idx" ON "vehicle_registrations"("agency_id");

-- CreateIndex
CREATE INDEX "vehicle_registrations_created_at_idx" ON "vehicle_registrations"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_registrations_vehicle_id_expires_at_idx" ON "vehicle_registrations"("vehicle_id", "expires_at");

-- CreateIndex
CREATE INDEX "vehicle_vignettes_company_id_idx" ON "vehicle_vignettes"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_vignettes_agency_id_idx" ON "vehicle_vignettes"("agency_id");

-- CreateIndex
CREATE INDEX "vehicle_vignettes_created_at_idx" ON "vehicle_vignettes"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_vignettes_vehicle_id_expires_at_idx" ON "vehicle_vignettes"("vehicle_id", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_vignettes_vehicle_id_tax_year_key" ON "vehicle_vignettes"("vehicle_id", "tax_year");

-- CreateIndex
CREATE INDEX "vehicle_inspections_company_id_idx" ON "vehicle_inspections"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_inspections_agency_id_idx" ON "vehicle_inspections"("agency_id");

-- CreateIndex
CREATE INDEX "vehicle_inspections_created_at_idx" ON "vehicle_inspections"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_inspections_vehicle_id_expires_at_idx" ON "vehicle_inspections"("vehicle_id", "expires_at");

-- CreateIndex
CREATE INDEX "vehicle_mileage_logs_company_id_idx" ON "vehicle_mileage_logs"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_mileage_logs_created_at_idx" ON "vehicle_mileage_logs"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_mileage_logs_vehicle_id_recorded_at_idx" ON "vehicle_mileage_logs"("vehicle_id", "recorded_at");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_company_id_idx" ON "vehicle_maintenances"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_agency_id_idx" ON "vehicle_maintenances"("agency_id");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_created_at_idx" ON "vehicle_maintenances"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_vehicle_id_status_idx" ON "vehicle_maintenances"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "vehicle_availability_blocks_company_id_idx" ON "vehicle_availability_blocks"("company_id");

-- CreateIndex
CREATE INDEX "vehicle_availability_blocks_agency_id_idx" ON "vehicle_availability_blocks"("agency_id");

-- CreateIndex
CREATE INDEX "vehicle_availability_blocks_created_at_idx" ON "vehicle_availability_blocks"("created_at");

-- CreateIndex
CREATE INDEX "vehicle_availability_blocks_vehicle_id_starts_at_ends_at_idx" ON "vehicle_availability_blocks"("vehicle_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE INDEX "customers_agency_id_status_idx" ON "customers"("agency_id", "status");

-- CreateIndex
CREATE INDEX "customers_type_idx" ON "customers"("type");

-- CreateIndex
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_company_id_code_key" ON "customers"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "customer_individuals_customer_id_key" ON "customer_individuals"("customer_id");

-- CreateIndex
CREATE INDEX "customer_individuals_company_id_idx" ON "customer_individuals"("company_id");

-- CreateIndex
CREATE INDEX "customer_individuals_driving_license_expires_at_idx" ON "customer_individuals"("driving_license_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_businesses_customer_id_key" ON "customer_businesses"("customer_id");

-- CreateIndex
CREATE INDEX "customer_businesses_company_id_idx" ON "customer_businesses"("company_id");

-- CreateIndex
CREATE INDEX "customer_businesses_tax_id_idx" ON "customer_businesses"("tax_id");

-- CreateIndex
CREATE INDEX "customer_contacts_company_id_idx" ON "customer_contacts"("company_id");

-- CreateIndex
CREATE INDEX "customer_contacts_customer_id_type_idx" ON "customer_contacts"("customer_id", "type");

-- CreateIndex
CREATE INDEX "customer_documents_company_id_idx" ON "customer_documents"("company_id");

-- CreateIndex
CREATE INDEX "customer_documents_customer_id_type_expires_at_idx" ON "customer_documents"("customer_id", "type", "expires_at");

-- CreateIndex
CREATE INDEX "customer_blacklist_company_id_idx" ON "customer_blacklist"("company_id");

-- CreateIndex
CREATE INDEX "customer_blacklist_customer_id_idx" ON "customer_blacklist"("customer_id");

-- CreateIndex
CREATE INDEX "customer_blacklist_created_at_idx" ON "customer_blacklist"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_sources_key_key" ON "reservation_sources"("key");

-- CreateIndex
CREATE INDEX "reservations_agency_id_status_idx" ON "reservations"("agency_id", "status");

-- CreateIndex
CREATE INDEX "reservations_vehicle_id_starts_at_ends_at_idx" ON "reservations"("vehicle_id", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "reservations_customer_id_status_idx" ON "reservations"("customer_id", "status");

-- CreateIndex
CREATE INDEX "reservations_starts_at_idx" ON "reservations"("starts_at");

-- CreateIndex
CREATE INDEX "reservations_ends_at_idx" ON "reservations"("ends_at");

-- CreateIndex
CREATE INDEX "reservations_created_at_idx" ON "reservations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_company_id_code_key" ON "reservations"("company_id", "code");

-- CreateIndex
CREATE INDEX "reservation_pricing_snapshots_reservation_id_created_at_idx" ON "reservation_pricing_snapshots"("reservation_id", "created_at");

-- CreateIndex
CREATE INDEX "reservation_extras_company_id_idx" ON "reservation_extras"("company_id");

-- CreateIndex
CREATE INDEX "reservation_extras_reservation_id_idx" ON "reservation_extras"("reservation_id");

-- CreateIndex
CREATE INDEX "reservation_timeline_events_company_id_idx" ON "reservation_timeline_events"("company_id");

-- CreateIndex
CREATE INDEX "reservation_timeline_events_reservation_id_created_at_idx" ON "reservation_timeline_events"("reservation_id", "created_at");

-- CreateIndex
CREATE INDEX "contract_templates_company_id_idx" ON "contract_templates"("company_id");

-- CreateIndex
CREATE INDEX "contract_templates_agency_id_idx" ON "contract_templates"("agency_id");

-- CreateIndex
CREATE INDEX "contract_template_versions_template_id_idx" ON "contract_template_versions"("template_id");

-- CreateIndex
CREATE INDEX "contract_template_versions_company_id_idx" ON "contract_template_versions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_template_versions_template_id_version_number_key" ON "contract_template_versions"("template_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_reservation_id_key" ON "contracts"("reservation_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_template_version_id_idx" ON "contracts"("template_version_id");

-- CreateIndex
CREATE INDEX "contracts_company_id_idx" ON "contracts"("company_id");

-- CreateIndex
CREATE INDEX "contracts_agency_id_idx" ON "contracts"("agency_id");

-- CreateIndex
CREATE INDEX "contracts_customer_id_idx" ON "contracts"("customer_id");

-- CreateIndex
CREATE INDEX "contracts_vehicle_id_idx" ON "contracts"("vehicle_id");

-- CreateIndex
CREATE INDEX "contracts_created_at_idx" ON "contracts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_company_id_code_key" ON "contracts"("company_id", "code");

-- CreateIndex
CREATE INDEX "contract_inspection_items_company_id_idx" ON "contract_inspection_items"("company_id");

-- CreateIndex
CREATE INDEX "contract_inspection_items_contract_id_idx" ON "contract_inspection_items"("contract_id");

-- CreateIndex
CREATE INDEX "contract_signatures_contract_id_signer_type_idx" ON "contract_signatures"("contract_id", "signer_type");

-- CreateIndex
CREATE INDEX "contract_signatures_company_id_idx" ON "contract_signatures"("company_id");

-- CreateIndex
CREATE INDEX "expense_categories_company_id_idx" ON "expense_categories"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_company_id_name_key" ON "expense_categories"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_reservation_id_key" ON "invoices"("reservation_id");

-- CreateIndex
CREATE INDEX "invoices_agency_id_status_idx" ON "invoices"("agency_id", "status");

-- CreateIndex
CREATE INDEX "invoices_due_at_idx" ON "invoices"("due_at");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_customer_business_id_idx" ON "invoices"("customer_business_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_company_id_code_key" ON "invoices"("company_id", "code");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoice_line_items_company_id_idx" ON "invoice_line_items"("company_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_agency_id_created_at_idx" ON "payments"("agency_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_company_id_idx" ON "payments"("company_id");

-- CreateIndex
CREATE INDEX "deposits_reservation_id_status_idx" ON "deposits"("reservation_id", "status");

-- CreateIndex
CREATE INDEX "deposits_company_id_idx" ON "deposits"("company_id");

-- CreateIndex
CREATE INDEX "credit_notes_original_invoice_id_idx" ON "credit_notes"("original_invoice_id");

-- CreateIndex
CREATE INDEX "credit_notes_company_id_idx" ON "credit_notes"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_company_id_code_key" ON "credit_notes"("company_id", "code");

-- CreateIndex
CREATE INDEX "expenses_agency_id_occurred_at_idx" ON "expenses"("agency_id", "occurred_at");

-- CreateIndex
CREATE INDEX "expenses_vehicle_id_occurred_at_idx" ON "expenses"("vehicle_id", "occurred_at");

-- CreateIndex
CREATE INDEX "expenses_company_id_idx" ON "expenses"("company_id");

-- CreateIndex
CREATE INDEX "driver_payments_driver_id_created_at_idx" ON "driver_payments"("driver_id", "created_at");

-- CreateIndex
CREATE INDEX "driver_payments_reservation_id_idx" ON "driver_payments"("reservation_id");

-- CreateIndex
CREATE INDEX "driver_payments_company_id_idx" ON "driver_payments"("company_id");

-- CreateIndex
CREATE INDEX "drivers_home_agency_id_status_idx" ON "drivers"("home_agency_id", "status");

-- CreateIndex
CREATE INDEX "drivers_company_id_idx" ON "drivers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_company_id_reference_key" ON "drivers"("company_id", "reference");

-- CreateIndex
CREATE INDEX "driver_pricing_rules_driver_id_is_current_idx" ON "driver_pricing_rules"("driver_id", "is_current");

-- CreateIndex
CREATE INDEX "driver_pricing_rules_driver_id_valid_from_idx" ON "driver_pricing_rules"("driver_id", "valid_from");

-- CreateIndex
CREATE INDEX "driver_pricing_rules_company_id_idx" ON "driver_pricing_rules"("company_id");

-- CreateIndex
CREATE INDEX "driver_documents_driver_id_type_expires_at_idx" ON "driver_documents"("driver_id", "type", "expires_at");

-- CreateIndex
CREATE INDEX "driver_documents_company_id_idx" ON "driver_documents"("company_id");

-- CreateIndex
CREATE INDEX "driver_reservation_assignments_reservation_id_role_idx" ON "driver_reservation_assignments"("reservation_id", "role");

-- CreateIndex
CREATE INDEX "driver_reservation_assignments_driver_id_created_at_idx" ON "driver_reservation_assignments"("driver_id", "created_at");

-- CreateIndex
CREATE INDEX "driver_reservation_assignments_company_id_idx" ON "driver_reservation_assignments"("company_id");

-- CreateIndex
CREATE INDEX "settings_company_id_idx" ON "settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_company_id_agency_id_key_key" ON "settings"("company_id", "agency_id", "key");

-- CreateIndex
CREATE INDEX "number_sequences_company_id_idx" ON "number_sequences"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_company_id_agency_id_sequence_key_period_k_key" ON "number_sequences"("company_id", "agency_id", "sequence_key", "period_key");

-- CreateIndex
CREATE INDEX "plan_limits_plan_id_idx" ON "plan_limits"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_plan_id_limit_key_key" ON "plan_limits"("plan_id", "limit_key");

-- CreateIndex
CREATE INDEX "plan_features_plan_id_idx" ON "plan_features"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_key_key" ON "plan_features"("plan_id", "feature_key");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "documents_company_id_deleted_at_idx" ON "documents"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_entity_type_entity_id_idx" ON "audit_logs"("company_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_user_id_idx" ON "audit_logs"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_company_id_entity_type_entity_id_idx" ON "activity_logs"("company_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_company_id_created_at_idx" ON "activity_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_agency_id_created_at_idx" ON "activity_logs"("agency_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "permissions"("key") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_role_id_role_scope_fkey" FOREIGN KEY ("role_id", "role_scope") REFERENCES "roles"("id", "scope") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_role_id_role_scope_fkey" FOREIGN KEY ("role_id", "role_scope") REFERENCES "roles"("id", "scope") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_agency_membership_id_fkey" FOREIGN KEY ("agency_membership_id") REFERENCES "agency_memberships"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_key_fkey" FOREIGN KEY ("permission_key") REFERENCES "permissions"("key") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_categories" ADD CONSTRAINT "vehicle_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "vehicle_categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_registrations" ADD CONSTRAINT "vehicle_registrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_registrations" ADD CONSTRAINT "vehicle_registrations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_registrations" ADD CONSTRAINT "vehicle_registrations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_vignettes" ADD CONSTRAINT "vehicle_vignettes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_vignettes" ADD CONSTRAINT "vehicle_vignettes_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_vignettes" ADD CONSTRAINT "vehicle_vignettes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_mileage_logs" ADD CONSTRAINT "vehicle_mileage_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_mileage_logs" ADD CONSTRAINT "vehicle_mileage_logs_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_mileage_logs" ADD CONSTRAINT "vehicle_mileage_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_availability_blocks" ADD CONSTRAINT "vehicle_availability_blocks_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_individuals" ADD CONSTRAINT "customer_individuals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_individuals" ADD CONSTRAINT "customer_individuals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_businesses" ADD CONSTRAINT "customer_businesses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_businesses" ADD CONSTRAINT "customer_businesses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_blacklist" ADD CONSTRAINT "customer_blacklist_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_blacklist" ADD CONSTRAINT "customer_blacklist_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_blacklist" ADD CONSTRAINT "customer_blacklist_lifted_by_fkey" FOREIGN KEY ("lifted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_blacklist" ADD CONSTRAINT "customer_blacklist_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "reservation_sources"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_pricing_snapshots" ADD CONSTRAINT "reservation_pricing_snapshots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_pricing_snapshots" ADD CONSTRAINT "reservation_pricing_snapshots_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_pricing_snapshots" ADD CONSTRAINT "reservation_pricing_snapshots_supersedes_id_fkey" FOREIGN KEY ("supersedes_id") REFERENCES "reservation_pricing_snapshots"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_pricing_snapshots" ADD CONSTRAINT "reservation_pricing_snapshots_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_timeline_events" ADD CONSTRAINT "reservation_timeline_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_timeline_events" ADD CONSTRAINT "reservation_timeline_events_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_timeline_events" ADD CONSTRAINT "reservation_timeline_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_versions" ADD CONSTRAINT "contract_template_versions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_versions" ADD CONSTRAINT "contract_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_template_versions" ADD CONSTRAINT "contract_template_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "contract_template_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_inspection_items" ADD CONSTRAINT "contract_inspection_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_inspection_items" ADD CONSTRAINT "contract_inspection_items_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_business_id_fkey" FOREIGN KEY ("customer_business_id") REFERENCES "customer_businesses"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_original_invoice_id_fkey" FOREIGN KEY ("original_invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_replacement_invoice_id_fkey" FOREIGN KEY ("replacement_invoice_id") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_driver_pricing_rule_id_fkey" FOREIGN KEY ("driver_pricing_rule_id") REFERENCES "driver_pricing_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_payments" ADD CONSTRAINT "driver_payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_home_agency_id_fkey" FOREIGN KEY ("home_agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_pricing_rules" ADD CONSTRAINT "driver_pricing_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_pricing_rules" ADD CONSTRAINT "driver_pricing_rules_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_reservation_assignments" ADD CONSTRAINT "driver_reservation_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_reservation_assignments" ADD CONSTRAINT "driver_reservation_assignments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_reservation_assignments" ADD CONSTRAINT "driver_reservation_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
