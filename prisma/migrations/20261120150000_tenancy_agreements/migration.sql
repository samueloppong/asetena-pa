CREATE TABLE "tenancy_agreements" (
  "id" UUID NOT NULL,
  "rental_request_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "landlord_signed_name" VARCHAR(100) NOT NULL,
  "landlord_signed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "renter_signed_name" VARCHAR(100),
  "renter_signed_at" TIMESTAMPTZ(6),
  CONSTRAINT "tenancy_agreements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenancy_agreements_rental_request_id_key" ON "tenancy_agreements"("rental_request_id");

ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_rental_request_id_fkey" FOREIGN KEY ("rental_request_id") REFERENCES "rental_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
