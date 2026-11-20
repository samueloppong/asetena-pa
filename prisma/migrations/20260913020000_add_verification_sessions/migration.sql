-- CreateEnum
CREATE TYPE "VerificationOverallResult" AS ENUM ('PASSED', 'FLAGGED_FOR_REVIEW', 'REJECTED');

-- CreateTable
CREATE TABLE "verification_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "overall_result" "VerificationOverallResult" NOT NULL,
    "checks" JSONB NOT NULL,
    "mrz_document_number" VARCHAR(20),
    "national_id_number" VARCHAR(20),
    "face_match_score" DOUBLE PRECISION,
    "liveness_passed" BOOLEAN,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_sessions_session_id_key" ON "verification_sessions"("session_id");

-- CreateIndex
CREATE INDEX "verification_sessions_user_id_idx" ON "verification_sessions"("user_id");

-- AddForeignKey
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
