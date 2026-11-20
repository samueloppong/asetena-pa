import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import {
  getMyVerificationStatus,
  submitVerification,
} from "@/lib/identity-verification";
import { verificationSubmitSchema } from "@/lib/validations";

export async function GET() {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const status = await getMyVerificationStatus(session.user.id);
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const body = await req.json().catch(() => null);
  const parsed = verificationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  try {
    const { error: submitError } = await submitVerification(
      session.user.id,
      parsed.data
    );
    if (submitError) {
      return NextResponse.json({ error: submitError }, { status: 400 });
    }
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err && "code" in err && err.code === "P2002"
        ? "That ID number is already registered to another account"
        : "Could not submit your verification";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const status = await getMyVerificationStatus(session.user.id);
  return NextResponse.json(status);
}
