-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('ghana_card', 'passport', 'drivers_license');

-- CreateTable
CREATE TABLE "identity_verification_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "document_type" "VerificationDocumentType" NOT NULL,
    "id_number" VARCHAR(30) NOT NULL,
    "id_photo_url" TEXT NOT NULL,
    "selfie_url" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "reviewer_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(6),

    CONSTRAINT "identity_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "identity_verification_requests_user_id_idx" ON "identity_verification_requests"("user_id");

-- CreateIndex
CREATE INDEX "identity_verification_requests_status_idx" ON "identity_verification_requests"("status");

-- AddForeignKey
ALTER TABLE "identity_verification_requests" ADD CONSTRAINT "identity_verification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
