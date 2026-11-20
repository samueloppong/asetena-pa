import { prisma } from "@/lib/db";
import { mapProperty } from "@/lib/mappers";
import type { Property } from "@/lib/types";

const includeAll = {
  landlord: true,
  amenities: true,
  media: true,
  reviews: { include: { reviewer: { select: { fullName: true } } } },
  priceChanges: true,
  _count: { select: { reviews: true } },
} as const;

export async function listPropertiesFromDb(): Promise<Property[]> {
  const properties = await prisma.property.findMany({
    where: { isActive: true, availability: "available" },
    include: includeAll,
    orderBy: { createdAt: "desc" },
  });
  return properties.map(mapProperty);
}

export async function getPropertyFromDb(
  id: string
): Promise<Property | null> {
  const property = await prisma.property.findUnique({
    where: { id },
    include: includeAll,
  });
  if (!property || (!property.isActive && property.availability !== "rented")) return null;
  return mapProperty(property);
}
