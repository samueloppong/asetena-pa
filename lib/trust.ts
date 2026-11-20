import { prisma } from "@/lib/db";
import type {
  TrustLabel,
  TrustScoreBreakdown,
  TrustScoreSummary,
  VerificationStatus,
} from "@/lib/types";

const MAX_IDENTITY_POINTS = 40;
const MAX_TENURE_POINTS = 20;
const MAX_REVIEW_POINTS = 30;
const BASELINE_POINTS = 10;
const TENURE_DAYS_PER_POINT = 15; // full 20 points at ~10 months on the app

function identityPoints(status: VerificationStatus): number {
  if (status === "verified") return MAX_IDENTITY_POINTS;
  if (status === "pending") return MAX_IDENTITY_POINTS * 0.35;
  return 0;
}

function tenurePoints(createdAt: Date): number {
  const days = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.min(MAX_TENURE_POINTS, Math.floor(days / TENURE_DAYS_PER_POINT));
}

function reviewPoints(averageRating: number | null): number {
  if (averageRating === null) return 0;
  return Math.round(((averageRating - 1) / 4) * MAX_REVIEW_POINTS);
}

function labelFor(score: number, reviewCount: number): TrustLabel {
  // Identity alone does not make someone trusted. A stay review is required.
  if (reviewCount === 0) return "new_member";
  if (score >= 80) return "highly_trusted";
  if (score >= 60) return "trusted";
  if (score >= 40) return "building_trust";
  return "new_member";
}

export async function getTrustScore(
  userId: string
): Promise<TrustScoreSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, idVerificationStatus: true, createdAt: true },
  });
  if (!user) return null;

  const reviews = await prisma.userReview.findMany({
    where: { revieweeId: userId },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { role: true } } },
  });

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0
      ? null
      : Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
        ) / 10;

  const breakdown: TrustScoreBreakdown = {
    identity_points: Math.round(identityPoints(user.idVerificationStatus)),
    tenure_points: tenurePoints(user.createdAt),
    review_points: reviewPoints(averageRating),
    baseline_points: BASELINE_POINTS,
  };

  const score = Math.min(
    100,
    breakdown.identity_points +
      breakdown.tenure_points +
      breakdown.review_points +
      breakdown.baseline_points
  );

  return {
    user_id: user.id,
    score,
    label: labelFor(score, reviewCount),
    is_id_verified: user.idVerificationStatus === "verified",
    member_since: user.createdAt.toISOString(),
    review_count: reviewCount,
    average_rating: averageRating,
    breakdown,
    recent_reviews: reviews.slice(0, 5).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reviewer_role: r.reviewer.role,
      created_at: r.createdAt.toISOString(),
    })),
  };
}

/** Cheap version for list views (chat inbox) that only needs the number + label. */
export async function getTrustScoreLite(
  userId: string
): Promise<{ score: number; label: TrustLabel }> {
  const summary = await getTrustScore(userId);
  if (!summary) return { score: 0, label: "new_member" };
  return { score: summary.score, label: summary.label };
}

/** Batched lite scores for list views showing several people at once. */
export async function getTrustScoresBatch(
  userIds: string[]
): Promise<Record<string, { score: number; label: TrustLabel }>> {
  const uniqueIds = Array.from(new Set(userIds));
  const entries = await Promise.all(
    uniqueIds.map(async (id) => [id, await getTrustScoreLite(id)] as const)
  );
  return Object.fromEntries(entries);
}
