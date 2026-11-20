-- AlterEnum
ALTER TYPE "ListingAvailability" ADD VALUE IF NOT EXISTS 'held';

-- CreateEnum
CREATE TYPE "Furnishing" AS ENUM ('unfurnished', 'semi_furnished', 'furnished');
CREATE TYPE "BillPayer" AS ENUM ('tenant', 'landlord', 'shared');
CREATE TYPE "LedgerStatus" AS ENUM ('expected', 'received', 'late');

-- AlterTable
ALTER TABLE "properties"
  ADD COLUMN "furnishing" "Furnishing" NOT NULL DEFAULT 'unfurnished',
  ADD COLUMN "available_from" DATE,
  ADD COLUMN "bills_electricity" "BillPayer" NOT NULL DEFAULT 'tenant',
  ADD COLUMN "bills_water" "BillPayer" NOT NULL DEFAULT 'tenant',
  ADD COLUMN "bills_internet" "BillPayer" NOT NULL DEFAULT 'tenant',
  ADD COLUMN "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "smoking_allowed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "max_occupants" INTEGER,
  ADD COLUMN "quiet_hours" VARCHAR(80),
  ADD COLUMN "house_rules" TEXT,
  ADD COLUMN "access_instructions" TEXT;

ALTER TABLE "rental_requests"
  ADD COLUMN "monthly_income" DECIMAL(12,2),
  ADD COLUMN "employment_status" VARCHAR(30),
  ADD COLUMN "previous_landlord_name" VARCHAR(100),
  ADD COLUMN "previous_landlord_phone" VARCHAR(20),
  ADD COLUMN "previous_landlord_note" TEXT,
  ADD COLUMN "agreed_price" DECIMAL(10,2),
  ADD COLUMN "agreed_deposit" DECIMAL(10,2),
  ADD COLUMN "agreed_advance" "PaymentFrequency",
  ADD COLUMN "agreed_move_in" DATE,
  ADD COLUMN "agreed_rules" TEXT,
  ADD COLUMN "hold_until" TIMESTAMPTZ(6);

CREATE TABLE "price_changes" (
  "id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "price_per_month" DECIMAL(10,2) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_changes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rent_ledger_entries" (
  "id" UUID NOT NULL,
  "rental_request_id" UUID NOT NULL,
  "label" VARCHAR(80) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "due_date" DATE NOT NULL,
  "status" "LedgerStatus" NOT NULL DEFAULT 'expected',
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "rent_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deposit_handovers" (
  "id" UUID NOT NULL,
  "rental_request_id" UUID NOT NULL,
  "condition_note" TEXT,
  "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "returned_amount" DECIMAL(10,2),
  "landlord_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "renter_confirmed" BOOLEAN NOT NULL DEFAULT false,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "deposit_handovers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deposit_handovers_rental_request_id_key" ON "deposit_handovers"("rental_request_id");
CREATE INDEX "price_changes_property_id_idx" ON "price_changes"("property_id");
CREATE INDEX "rent_ledger_entries_rental_request_id_idx" ON "rent_ledger_entries"("rental_request_id");

ALTER TABLE "price_changes" ADD CONSTRAINT "price_changes_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rent_ledger_entries" ADD CONSTRAINT "rent_ledger_entries_rental_request_id_fkey" FOREIGN KEY ("rental_request_id") REFERENCES "rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deposit_handovers" ADD CONSTRAINT "deposit_handovers_rental_request_id_fkey" FOREIGN KEY ("rental_request_id") REFERENCES "rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "price_changes" ("id", "property_id", "price_per_month", "created_at")
SELECT gen_random_uuid(), "id", "price_per_month", "created_at" FROM "properties";
