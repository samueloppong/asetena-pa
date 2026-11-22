-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'agent';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ListingActorType" AS ENUM ('owner', 'agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "properties"
ADD COLUMN IF NOT EXISTS "listing_actor_type" "ListingActorType" NOT NULL DEFAULT 'owner';
