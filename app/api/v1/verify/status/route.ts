import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { getVerificationStatus } from "@/lib/verification";

export async function GET() {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const status = await getVerificationStatus(session.user.id);
  if (!status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
