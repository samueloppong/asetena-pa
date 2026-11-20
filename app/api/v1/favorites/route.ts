import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";
import { mapProperty } from "@/lib/mappers";

export async function GET() {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        include: {
          landlord: true,
          amenities: true,
          media: true,
          reviews: { include: { reviewer: { select: { fullName: true } } } },
          _count: { select: { reviews: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    properties: favorites
      .filter((f) => f.property.isActive)
      .map((f) => mapProperty(f.property)),
    ids: favorites.map((f) => f.propertyId),
  });
}
