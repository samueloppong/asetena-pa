import { NextRequest, NextResponse } from "next/server";
import { requireSession, requireVerified } from "@/lib/auth-helpers";
import {
  getThreadForUser,
  listMessages,
  markThreadRead,
  sendMessage,
} from "@/lib/chat";
import { getTrustScoreLite } from "@/lib/trust";
import { canReviewThread } from "@/lib/user-reviews";
import { chatMessageCreateSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { id } = await context.params;
  const thread = await getThreadForUser(id, session.user.id);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  await markThreadRead(id, session.user.id);
  const messages = await listMessages(id, session.user.id);

  const other =
    thread.landlordId === session.user.id ? thread.renter : thread.landlord;
  const [trust, reviewCheck] = await Promise.all([
    getTrustScoreLite(other.id),
    canReviewThread(id, session.user.id),
  ]);

  return NextResponse.json({
    thread: {
      id: thread.id,
      property_id: thread.property.id,
      property_title: thread.property.title,
      other_user_name: other.fullName,
      other_user_verified: other.idVerificationStatus === "verified",
      other_trust_score: trust.score,
      other_trust_label: trust.label,
      can_review: reviewCheck.allowed,
      already_reviewed: reviewCheck.reason === "Already reviewed",
    },
    messages,
  });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireVerified();
  if (error || !session) return error!;

  const { id } = await context.params;
  const thread = await getThreadForUser(id, session.user.id);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = chatMessageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const message = await sendMessage(id, session.user.id, parsed.data.body);
  return NextResponse.json({
    message: {
      id: message.id,
      thread_id: message.threadId,
      sender_id: message.senderId,
      body: message.body,
      created_at: message.createdAt.toISOString(),
      mine: true,
    },
  });
}
