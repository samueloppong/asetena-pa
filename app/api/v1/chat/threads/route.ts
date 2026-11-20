import { NextRequest, NextResponse } from "next/server";
import { requireSession, requireVerified } from "@/lib/auth-helpers";
import {
  getOrCreateThread,
  getUnreadCounts,
  listThreadsForUser,
  sendMessage,
} from "@/lib/chat";
import { chatThreadCreateSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const [threads, unread] = await Promise.all([
    listThreadsForUser(session.user.id),
    getUnreadCounts(session.user.id),
  ]);

  return NextResponse.json({
    threads: threads.map((t) => ({ ...t, unread_count: unread[t.id] ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireVerified();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = chatThreadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { thread, error: threadError } = await getOrCreateThread(
    parsed.data.propertyId,
    session.user.id
  );
  if (threadError || !thread) {
    return NextResponse.json({ error: threadError }, { status: 400 });
  }

  if (parsed.data.message) {
    await sendMessage(thread.id, session.user.id, parsed.data.message);
  }

  return NextResponse.json({ threadId: thread.id });
}
