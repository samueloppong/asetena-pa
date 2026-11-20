-- CreateEnum
CREATE TYPE "ListingAvailability" AS ENUM ('available', 'paused', 'rented');

-- CreateEnum
CREATE TYPE "OwnershipReviewStatus" AS ENUM ('none', 'pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "RentalRequestKind" AS ENUM ('tour', 'application');

-- CreateEnum
CREATE TYPE "RentalRequestStatus" AS ENUM ('requested', 'accepted', 'declined', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "AdvanceReceiptStatus" AS ENUM ('not_recorded', 'landlord_confirmed');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "availability" "ListingAvailability" NOT NULL DEFAULT 'available';
ALTER TABLE "properties" ADD COLUMN "ownership_status" "OwnershipReviewStatus" NOT NULL DEFAULT 'none';

UPDATE "properties"
SET "ownership_status" = 'verified'
WHERE "is_direct_owner_verified" = true;

-- CreateTable
CREATE TABLE "rental_requests" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "renter_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "kind" "RentalRequestKind" NOT NULL,
    "status" "RentalRequestStatus" NOT NULL DEFAULT 'requested',
    "message" TEXT,
    "viewing_at" TIMESTAMPTZ(6),
    "move_in_date" DATE,
    "offered_advance" "PaymentFrequency",
    "advance_receipt" "AdvanceReceiptStatus" NOT NULL DEFAULT 'not_recorded',
    "landlord_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "decided_at" TIMESTAMPTZ(6),

    CONSTRAINT "rental_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_requests_property_id_idx" ON "rental_requests"("property_id");
CREATE INDEX "rental_requests_renter_id_idx" ON "rental_requests"("renter_id");
CREATE INDEX "rental_requests_landlord_id_status_idx" ON "rental_requests"("landlord_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_property_id_reviewer_id_key" ON "reviews"("property_id", "reviewer_id");
CREATE UNIQUE INDEX "listing_reports_property_id_reporter_id_key" ON "listing_reports"("property_id", "reporter_id");

-- AddForeignKey
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
