import { NextRequest, NextResponse } from "next/server";
import { requireVerified } from "@/lib/auth-helpers";
import { createListingReport } from "@/lib/reports";
import { listingReportSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { session, error } = await requireVerified();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = listingReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a reason" }, { status: 400 });
  }

  const { error: reportError, report } = await createListingReport(
    id,
    session.user.id,
    parsed.data.reason,
    parsed.data.details
  );
  if (reportError || !report) {
    return NextResponse.json({ error: reportError }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
