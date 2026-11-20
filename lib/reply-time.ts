import { prisma } from "@/lib/db";

export async function landlordReplyLabel(landlordId: string) {
  const threads = await prisma.chatThread.findMany({
    where: { landlordId },
    orderBy: { lastMessageAt: "desc" },
    take: 20,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { senderId: true, createdAt: true },
      },
    },
  });

  const deltas: number[] = [];
  for (const thread of threads) {
    const incoming = thread.messages.find((message) => message.senderId !== landlordId);
    if (!incoming) continue;
    const reply = thread.messages.find(
      (message) =>
        message.senderId === landlordId && message.createdAt.getTime() > incoming.createdAt.getTime()
    );
    if (!reply) continue;
    deltas.push(reply.createdAt.getTime() - incoming.createdAt.getTime());
  }
  if (deltas.length === 0) return null;

  deltas.sort((a, b) => a - b);
  const hours = deltas[Math.floor(deltas.length / 2)] / 3_600_000;
  if (hours < 1) return "Usually replies within an hour";
  if (hours < 24) return "Usually replies the same day";
  if (hours < 48) return "Usually replies within a day";
  return "Usually replies within a few days";
}
