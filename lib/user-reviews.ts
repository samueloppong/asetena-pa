import { prisma } from "@/lib/db";

export async function canReviewThread(threadId: string, userId: string) {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    select: {
      propertyId: true,
      renterId: true,
      landlordId: true,
    },
  });
  if (!thread) return { allowed: false, revieweeId: null, reason: "Thread not found" as const };
  if (thread.renterId !== userId && thread.landlordId !== userId) {
    return { allowed: false, revieweeId: null, reason: "Not your conversation" as const };
  }

  const stay = await prisma.rentalRequest.findFirst({
    where: {
      propertyId: thread.propertyId,
      renterId: thread.renterId,
      landlordId: thread.landlordId,
      kind: "application",
      status: "completed",
    },
    select: { id: true },
  });
  if (!stay) {
    return {
      allowed: false,
      revieweeId: null,
      reason: "Reviews open after a completed move-in" as const,
    };
  }

  const existing = await prisma.userReview.findUnique({
    where: { threadId_reviewerId: { threadId, reviewerId: userId } },
  });
  if (existing) {
    return { allowed: false, revieweeId: null, reason: "Already reviewed" as const };
  }

  const revieweeId = thread.renterId === userId ? thread.landlordId : thread.renterId;
  return { allowed: true, revieweeId, reason: null };
}

export async function submitUserReview(
  threadId: string,
  reviewerId: string,
  rating: number,
  comment?: string
) {
  const { allowed, revieweeId, reason } = await canReviewThread(threadId, reviewerId);
  if (!allowed || !revieweeId) {
    return { error: reason ?? "Can't review this conversation" as const };
  }

  await prisma.userReview.create({
    data: { threadId, reviewerId, revieweeId, rating, comment },
  });

  return { error: null };
}
