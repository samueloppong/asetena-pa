import { prisma } from "@/lib/db";
import { toPublicMediaUrl } from "@/lib/media-url";
import { getTrustScoresBatch } from "@/lib/trust";
import type { ChatMessageDto, ChatThreadSummary } from "@/lib/types";

/**
 * Returns (creating if needed) the single thread that ties one renter,
 * one landlord and one property together. Renters may only start a
 * thread on a property they don't own; landlords never "start" a thread,
 * they only reply.
 */
export async function getOrCreateThread(
  propertyId: string,
  renterId: string
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, landlordId: true, title: true },
  });
  if (!property) return { thread: null, error: "Property not found" as const };
  if (property.landlordId === renterId) {
    return {
      thread: null,
      error: "You can't message yourself about your own listing" as const,
    };
  }

  const thread = await prisma.chatThread.upsert({
    where: {
      propertyId_renterId_landlordId: {
        propertyId,
        renterId,
        landlordId: property.landlordId,
      },
    },
    update: {},
    create: {
      propertyId,
      renterId,
      landlordId: property.landlordId,
    },
  });

  return { thread, error: null };
}

export async function listThreadsForUser(
  userId: string
): Promise<ChatThreadSummary[]> {
  const threads = await prisma.chatThread.findMany({
    where: { OR: [{ renterId: userId }, { landlordId: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      property: { select: { id: true, title: true, media: { take: 1, orderBy: { displayOrder: "asc" } } } },
      renter: { select: { id: true, fullName: true, idVerificationStatus: true } },
      landlord: { select: { id: true, fullName: true, idVerificationStatus: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const trustScores = await getTrustScoresBatch(
    threads.map((t) => (t.landlordId === userId ? t.renterId : t.landlordId))
  );

  return threads.map((t) => {
    const isLandlordView = t.landlordId === userId;
    const other = isLandlordView ? t.renter : t.landlord;
    const lastMessage = t.messages[0];
    const unreadCount = 0; // computed separately below for accuracy
    const trust = trustScores[other.id] ?? { score: 0, label: "new_member" as const };
    return {
      id: t.id,
      property_id: t.property.id,
      property_title: t.property.title,
      property_image: t.property.media[0]
        ? toPublicMediaUrl(t.property.media[0].mediaUrl)
        : undefined,
      other_user_id: other.id,
      other_user_name: other.fullName,
      other_user_verified: other.idVerificationStatus === "verified",
      other_trust_score: trust.score,
      other_trust_label: trust.label,
      is_landlord_view: isLandlordView,
      last_message: lastMessage?.body ?? null,
      last_message_at: (lastMessage?.createdAt ?? t.createdAt).toISOString(),
      unread_count: unreadCount,
    };
  });
}

export async function getUnreadCounts(
  userId: string
): Promise<Record<string, number>> {
  const rows = await prisma.chatMessage.groupBy({
    by: ["threadId"],
    where: {
      readAt: null,
      senderId: { not: userId },
      thread: { OR: [{ renterId: userId }, { landlordId: userId }] },
    },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.threadId, r._count._all]));
}

export async function getThreadForUser(threadId: string, userId: string) {
  const thread = await prisma.chatThread.findUnique({
    where: { id: threadId },
    include: {
      property: { select: { id: true, title: true } },
      renter: { select: { id: true, fullName: true, idVerificationStatus: true } },
      landlord: {
        select: { id: true, fullName: true, idVerificationStatus: true },
      },
    },
  });
  if (!thread) return null;
  if (thread.renterId !== userId && thread.landlordId !== userId) return null;
  return thread;
}

export async function listMessages(
  threadId: string,
  currentUserId: string
): Promise<ChatMessageDto[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    thread_id: m.threadId,
    sender_id: m.senderId,
    body: m.body,
    created_at: m.createdAt.toISOString(),
    read_at: m.readAt?.toISOString(),
    mine: m.senderId === currentUserId,
  }));
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  body: string
) {
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({ data: { threadId, senderId, body } }),
    prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
  return message;
}

export async function markThreadRead(threadId: string, userId: string) {
  await prisma.chatMessage.updateMany({
    where: { threadId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
}
