-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "gps_captured_at" TIMESTAMPTZ(6),
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "location_accuracy_meters" DOUBLE PRECISION,
ADD COLUMN     "location_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "longitude" DECIMAL(10,7);
