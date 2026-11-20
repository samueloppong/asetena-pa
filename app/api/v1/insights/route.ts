import { NextRequest, NextResponse } from "next/server";
import { requireVerified } from "@/lib/auth-helpers";
import { getNeighborhoodInsights, submitNeighborhoodInsight } from "@/lib/insights";
import { neighborhoodInsightSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const neighborhood = req.nextUrl.searchParams.get("neighborhood");
  const cityTown = req.nextUrl.searchParams.get("cityTown");
  if (!neighborhood || !cityTown) {
    return NextResponse.json(
      { error: "neighborhood and cityTown are required" },
      { status: 400 }
    );
  }

  const summary = await getNeighborhoodInsights(neighborhood, cityTown);
  return NextResponse.json({ summary });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireVerified();
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = neighborhoodInsightSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  await submitNeighborhoodInsight(session.user.id, parsed.data);
  const summary = await getNeighborhoodInsights(
    parsed.data.neighborhood,
    parsed.data.cityTown
  );
  return NextResponse.json({ summary });
}
