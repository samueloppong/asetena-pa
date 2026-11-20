import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { listRentalRequestsForUser } from "@/lib/rentals";

export async function GET() {
  const { session, error } = await requireSession();
  if (error || !session) return error!;
  const requests = await listRentalRequestsForUser(session.user.id);
  return NextResponse.json({ requests });
}
