-- CreateEnum
CREATE TYPE "StayDuration" AS ENUM ('long_stay', 'short_stay');

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "stay_duration" "StayDuration" NOT NULL DEFAULT 'long_stay';

-- Backfill: former short_stay property type → short stay duration
UPDATE "properties"
SET "stay_duration" = 'short_stay'
WHERE "property_type" = 'short_stay';
