import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireLandlord, requireVerifiedLandlord } from "@/lib/auth-helpers";
import { mapProperty } from "@/lib/mappers";
import { propertyUpdateSchema } from "@/lib/validations";

const includeAll = {
  landlord: true,
  amenities: true,
  media: true,
  reviews: { include: { reviewer: { select: { fullName: true } } } },
  priceChanges: true,
  _count: { select: { reviews: true } },
} as const;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: includeAll,
    });
    if (!property || (!property.isActive && property.availability !== "rented")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ property: mapProperty(property) });
  } catch (error) {
    console.error("get property error", error);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, error } = await requireVerifiedLandlord();
  if (error || !session) return error!;

  const { id } = await context.params;
  const existing = await prisma.property.findUnique({
    where: { id },
    select: { landlordId: true },
  });
  if (!existing || existing.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = propertyUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const previous = await prisma.property.findUnique({
    where: { id },
    select: { pricePerMonth: true },
  });
  const property = await prisma.property.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      pricePerMonth: data.pricePerMonth,
      advancePeriod: data.advancePeriod,
      securityDeposit: data.securityDeposit,
      digitalAddressGhanapost: data.digitalAddressGhanapost,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      availability: data.availability,
      isActive:
        data.availability === "rented"
          ? false
          : data.availability === "available"
            ? true
            : undefined,
      stayDuration: data.stayDuration,
      furnishing: data.furnishing,
      availableFrom:
        data.availableFrom === undefined
          ? undefined
          : data.availableFrom
            ? new Date(`${data.availableFrom}T00:00:00.000Z`)
            : null,
      billsElectricity: data.billsElectricity,
      billsWater: data.billsWater,
      billsInternet: data.billsInternet,
      petsAllowed: data.petsAllowed,
      smokingAllowed: data.smokingAllowed,
      maxOccupants: data.maxOccupants,
      quietHours: data.quietHours,
      houseRules: data.houseRules,
      accessInstructions: data.accessInstructions,
      priceChanges:
        data.pricePerMonth != null &&
        previous &&
        Number(previous.pricePerMonth) !== data.pricePerMonth
          ? { create: { pricePerMonth: data.pricePerMonth } }
          : undefined,
      amenities: data.amenities
        ? {
            upsert: {
              create: data.amenities,
              update: data.amenities,
            },
          }
        : undefined,
    },
    include: includeAll,
  });

  return NextResponse.json({ property: mapProperty(property) });
}

/**
 * Permanently delete one of your own listings (photos, reviews, chats and requests for it go
 * with it). Refused while a tenant or applicant is in play, so live tenancies are never lost.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const { session, error } = await requireLandlord();
  if (error || !session) return error!;

  const { id } = await context.params;
  const existing = await prisma.property.findUnique({
    where: { id },
    select: {
      landlordId: true,
      availability: true,
      rentalRequests: {
        where: {
          OR: [
            { status: { in: ["requested", "accepted"] } },
            { kind: "application", status: "completed" },
          ],
        },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!existing || existing.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.availability === "held" || existing.rentalRequests.length > 0) {
    return NextResponse.json(
      {
        error:
          "This listing has open requests or a tenancy. Resolve them first, or pause the listing instead.",
      },
      { status: 409 }
    );
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
