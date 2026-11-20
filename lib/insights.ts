import { prisma } from "@/lib/db";
import type { NeighborhoodInsightSummary } from "@/lib/types";

export async function getNeighborhoodInsights(
  neighborhood: string,
  cityTown: string
): Promise<NeighborhoodInsightSummary> {
  const rows = await prisma.neighborhoodInsight.findMany({
    where: {
      neighborhood: { equals: neighborhood, mode: "insensitive" },
      cityTown: { equals: cityTown, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
  });

  const sampleSize = rows.length;
  const avg = (pick: (r: (typeof rows)[number]) => number) =>
    sampleSize === 0
      ? 0
      : Math.round((rows.reduce((s, r) => s + pick(r), 0) / sampleSize) * 10) /
        10;

  return {
    neighborhood,
    city_town: cityTown,
    sample_size: sampleSize,
    avg_power_rating: avg((r) => r.powerRating),
    avg_water_rating: avg((r) => r.waterRating),
    avg_safety_rating: avg((r) => r.safetyRating),
    recent_comments: rows
      .filter((r) => r.comment && r.comment.trim().length > 0)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        comment: r.comment as string,
        created_at: r.createdAt.toISOString(),
        power_rating: r.powerRating,
        water_rating: r.waterRating,
        safety_rating: r.safetyRating,
      })),
  };
}

export async function submitNeighborhoodInsight(
  reporterId: string,
  data: {
    neighborhood: string;
    cityTown: string;
    powerRating: number;
    waterRating: number;
    safetyRating: number;
    comment?: string;
  }
) {
  return prisma.neighborhoodInsight.create({
    data: { reporterId, ...data },
  });
}
