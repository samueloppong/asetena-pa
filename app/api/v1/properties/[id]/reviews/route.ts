import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireVerified } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { renterHasCompletedStay } from "@/lib/rentals";
import { stayReviewSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireVerified();
  if (error || !session) return error!;

  const { id } = await context.params;
  const stayed = await renterHasCompletedStay(id, session.user.id);
  if (!stayed) {
    return NextResponse.json(
      { error: "You can review a home after you move in" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = stayReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a rating from 1 to 5" }, { status: 400 });
  }

  try {
    await prisma.review.create({
      data: {
        propertyId: id,
        reviewerId: session.user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "You already reviewed this home" }, { status: 400 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
