import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { setLedgerStatus } from "@/lib/rentals";
import { ledgerStatusSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = ledgerStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown ledger update" }, { status: 400 });
  }

  const { error: saveError } = await setLedgerStatus({
    requestId: id,
    actorId: session.user.id,
    entryId: parsed.data.entryId,
    status: parsed.data.status,
  });
  if (saveError) {
    return NextResponse.json({ error: saveError }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
