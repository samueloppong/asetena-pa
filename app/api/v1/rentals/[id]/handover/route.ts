import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { saveHandover } from "@/lib/rentals";
import { handoverSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = handoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the handover amounts" }, { status: 400 });
  }

  const { error: saveError } = await saveHandover({
    requestId: id,
    actorId: session.user.id,
    conditionNote: parsed.data.conditionNote,
    deductions: parsed.data.deductions,
    returnedAmount: parsed.data.returnedAmount,
    confirm: parsed.data.confirm,
  });
  if (saveError) {
    return NextResponse.json({ error: saveError }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
