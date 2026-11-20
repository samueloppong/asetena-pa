-- CreateEnum
CREATE TYPE "ExperienceCategory" AS ENUM ('food', 'culture', 'nature', 'nightlife', 'history', 'market', 'beach', 'adventure');

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ExperienceCategory" NOT NULL,
    "host_name" VARCHAR(100) NOT NULL,
    "region" VARCHAR(50) NOT NULL,
    "city_town" VARCHAR(50) NOT NULL,
    "neighborhood" VARCHAR(50),
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "price_ghs" DECIMAL(10,2) NOT NULL,
    "duration_hours" DOUBLE PRECISION NOT NULL,
    "image_url" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiences_region_idx" ON "experiences"("region");

-- CreateIndex
CREATE INDEX "experiences_city_town_idx" ON "experiences"("city_town");
