import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mapProperty } from "@/lib/mappers";
import { propertyCreateSchema } from "@/lib/validations";
import { requireVerifiedLandlord } from "@/lib/auth-helpers";
import type { PropertyType, Prisma } from "@prisma/client";

const includeAll = {
  landlord: true,
  amenities: true,
  media: true,
  reviews: { include: { reviewer: { select: { fullName: true } } } },
  priceChanges: true,
  _count: { select: { reviews: true } },
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type");
    const verified = searchParams.get("verified");
    const neighborhood = searchParams.get("neighborhood");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");

    const where: Prisma.PropertyWhereInput = {
      isActive: true,
      availability: "available",
    };

    if (type && type !== "all") {
      where.propertyType = type as PropertyType;
    }
    if (verified === "true" || verified === "1") {
      where.isDirectOwnerVerified = true;
    }
    if (neighborhood) {
      where.neighborhood = { contains: neighborhood, mode: "insensitive" };
    }
    if (minPrice || maxPrice) {
      where.pricePerMonth = {};
      if (minPrice) where.pricePerMonth.gte = minPrice;
      if (maxPrice) where.pricePerMonth.lte = maxPrice;
    }
    const furnishing = searchParams.get("furnishing");
    const minBeds = searchParams.get("min_beds");
    const availableBy = searchParams.get("available_by");
    const billsIncluded = searchParams.get("bills_included");
    if (furnishing === "unfurnished" || furnishing === "semi_furnished" || furnishing === "furnished") {
      where.furnishing = furnishing;
    }
    if (minBeds) {
      where.bedrooms = { gte: Number(minBeds) };
    }
    if (availableBy) {
      where.AND = [
        {
          OR: [
            { availableFrom: null },
            { availableFrom: { lte: new Date(`${availableBy}T00:00:00.000Z`) } },
          ],
        },
      ];
    }
    if (billsIncluded === "true") {
      where.billsElectricity = "landlord";
      where.billsWater = "landlord";
      where.billsInternet = "landlord";
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { neighborhood: { contains: q, mode: "insensitive" } },
        { cityTown: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: includeAll,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      properties: properties.map(mapProperty),
    });
  } catch (error) {
    console.error("list properties error", error);
    return NextResponse.json({ error: "Failed to list properties" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireVerifiedLandlord();
  if (error || !session) return error!;

  try {
    const body = await request.json();
    const parsed = propertyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const { verifyListingGps } = await import("@/lib/ghana-locations");
    const gpsCheck = verifyListingGps({
      latitude: data.latitude,
      longitude: data.longitude,
      claimedRegion: data.region,
    });
    if (!gpsCheck.ok) {
      return NextResponse.json(
        { error: gpsCheck.message },
        { status: 400 }
      );
    }

    const { listingActorFromRole } = await import("@/lib/listing-actor");
    const property = await prisma.property.create({
      data: {
        landlordId: session.user.id,
        listingActorType: listingActorFromRole(session.user.role),
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        pricePerMonth: data.pricePerMonth,
        advancePeriod: data.advancePeriod,
        securityDeposit: data.securityDeposit,
        region: data.region,
        cityTown: data.cityTown,
        neighborhood: data.neighborhood,
        digitalAddressGhanapost: data.digitalAddressGhanapost || null,
        latitude: data.latitude,
        longitude: data.longitude,
        locationVerified: true,
        locationAccuracyMeters: data.locationAccuracyMeters || null,
        gpsCapturedAt: new Date(),
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFootage: data.squareFootage || null,
        stayDuration: data.stayDuration,
        furnishing: data.furnishing,
        availableFrom: data.availableFrom ? new Date(`${data.availableFrom}T00:00:00.000Z`) : null,
        billsElectricity: data.billsElectricity,
        billsWater: data.billsWater,
        billsInternet: data.billsInternet,
        petsAllowed: data.petsAllowed,
        smokingAllowed: data.smokingAllowed,
        maxOccupants: data.maxOccupants,
        quietHours: data.quietHours || null,
        houseRules: data.houseRules || null,
        accessInstructions: data.accessInstructions || null,
        priceChanges: { create: { pricePerMonth: data.pricePerMonth } },
        amenities: { create: data.amenities },
        media: {
          create: data.media.map((m, index) => ({
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            category: m.category,
            displayOrder: m.displayOrder ?? index,
          })),
        },
      },
      include: includeAll,
    });

    return NextResponse.json({ property: mapProperty(property) }, { status: 201 });
  } catch (err) {
    console.error("create property error", err);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
