import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { ghanaCardVerificationPayloadSchema } from "@/lib/validations";
import { submitGhanaCardVerification } from "@/lib/verification";

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = ghanaCardVerificationPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid verification payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await submitGhanaCardVerification(
    session.user.id,
    parsed.data
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    overall_result: result.overallResult,
    checks: result.checks,
    id_verification_status: result.status,
    national_id_number: result.nationalIdNumber,
    session_id: result.sessionId,
  });
}
