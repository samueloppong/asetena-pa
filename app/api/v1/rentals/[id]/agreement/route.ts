import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { signTenancyAgreement } from "@/lib/agreements";
import { agreementSignSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = agreementSignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Type your full name to sign" }, { status: 400 });
  }

  const { error: signError } = await signTenancyAgreement({
    requestId: id,
    actorId: session.user.id,
    signedName: parsed.data.signedName,
  });
  if (signError) {
    return NextResponse.json({ error: signError }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
