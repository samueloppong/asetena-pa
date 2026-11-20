import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { listPendingVerifications } from "@/lib/identity-verification";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const requests = await listPendingVerifications();
  return NextResponse.json({ requests });
}
