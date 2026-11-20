import { NextResponse } from "next/server";
import { getTrustScore } from "@/lib/trust";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const summary = await getTrustScore(id);
  if (!summary) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ summary });
}
