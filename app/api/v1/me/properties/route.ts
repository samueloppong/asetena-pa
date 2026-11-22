import { NextResponse } from "next/server";
import { requireVerifiedLandlord } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import type { ManagedProperty } from "@/lib/types";

export async function GET() {
  const { session, error } = await requireVerifiedLandlord();
  if (error || !session) return error!;

  const rows = await prisma.property.findMany({
    where: { landlordId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const properties: ManagedProperty[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    neighborhood: row.neighborhood,
    city_town: row.cityTown,
    price_per_month: Number(row.pricePerMonth),
    availability: row.availability,
    is_active: row.isActive,
    is_direct_owner_verified: row.isDirectOwnerVerified,
    listing_actor_type: row.listingActorType,
    ownership_status: row.ownershipStatus,
    land_title_document_url: row.landTitleDocumentUrl ?? undefined,
    security_deposit: Number(row.securityDeposit),
    advance_period: row.advancePeriod,
    digital_address_ghanapost: row.digitalAddressGhanapost ?? undefined,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    description: row.description,
    stay_duration: row.stayDuration,
    furnishing: row.furnishing,
    available_from: row.availableFrom ? row.availableFrom.toISOString().slice(0, 10) : undefined,
    bills_electricity: row.billsElectricity,
    bills_water: row.billsWater,
    bills_internet: row.billsInternet,
    pets_allowed: row.petsAllowed,
    smoking_allowed: row.smokingAllowed,
    max_occupants: row.maxOccupants ?? undefined,
    quiet_hours: row.quietHours ?? undefined,
    house_rules: row.houseRules ?? undefined,
    access_instructions: row.accessInstructions ?? undefined,
  }));

  return NextResponse.json({ properties });
}
