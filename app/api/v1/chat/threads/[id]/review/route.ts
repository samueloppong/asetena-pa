import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { submitUserReview } from "@/lib/user-reviews";
import { userReviewSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = userReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a rating from 1-5" }, { status: 400 });
  }

  const result = await submitUserReview(
    id,
    session.user.id,
    parsed.data.rating,
    parsed.data.comment
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
