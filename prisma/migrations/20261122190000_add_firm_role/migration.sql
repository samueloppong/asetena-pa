-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'firm';

-- AlterEnum ListingActorType
ALTER TYPE "ListingActorType" ADD VALUE IF NOT EXISTS 'firm';

-- AlterTable
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "company_name" VARCHAR(150);
