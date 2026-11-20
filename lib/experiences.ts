import { prisma } from "@/lib/db";
import type { Experience } from "@/lib/experience-types";
import type { Experience as DbExperience, Prisma } from "@prisma/client";

function mapExperience(
  row: DbExperience,
  distanceKm?: number
): Experience {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    host_name: row.hostName,
    region: row.region,
    city_town: row.cityTown,
    neighborhood: row.neighborhood ?? undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    price_ghs: Number(row.priceGhs),
    duration_hours: row.durationHours,
    image_url: row.imageUrl,
    rating: row.rating,
    review_count: row.reviewCount,
    distance_km: distanceKm,
  };
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function listExperiences(params?: {
  q?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}): Promise<Experience[]> {
  const where: Prisma.ExperienceWhereInput = { isActive: true };
  const q = params?.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
      { cityTown: { contains: q, mode: "insensitive" } },
      { neighborhood: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.experience.findMany({
    where,
    orderBy: { rating: "desc" },
    take: params?.limit ?? 24,
  });

  let mapped = rows.map((row) => {
    if (params?.lat != null && params?.lng != null) {
      const distance = haversineKm(
        params.lat,
        params.lng,
        Number(row.latitude),
        Number(row.longitude)
      );
      return mapExperience(row, Math.round(distance * 10) / 10);
    }
    return mapExperience(row);
  });

  if (params?.lat != null && params?.lng != null) {
    mapped = mapped.sort(
      (a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999)
    );
  }

  return mapped;
}

export async function getExperienceById(
  id: string
): Promise<Experience | null> {
  const row = await prisma.experience.findUnique({ where: { id } });
  if (!row || !row.isActive) return null;
  return mapExperience(row);
}
