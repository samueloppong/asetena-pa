import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canListProperties } from "@/lib/listing-actor";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

/** Landlord or letting agent (or admin) — anyone accountable for a listing. */
export async function requireLandlord() {
  const result = await requireSession();
  if (result.error || !result.session) return result;
  if (!canListProperties(result.session.user.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Landlord or agent account required to list properties" },
        { status: 403 }
      ),
    };
  }
  return result;
}

/** Trust gate: Ghana Card KYC must be verified before high-trust actions. */
export async function requireVerified() {
  const result = await requireSession();
  if (result.error || !result.session) return result;

  const user = await prisma.user.findUnique({
    where: { id: result.session.user.id },
    select: { idVerificationStatus: true },
  });

  if (!user || user.idVerificationStatus !== "verified") {
    return {
      session: null,
      error: NextResponse.json(
        {
          error: "Ghana Card verification required",
          code: "KYC_REQUIRED",
          id_verification_status: user?.idVerificationStatus ?? "unverified",
        },
        { status: 403 }
      ),
    };
  }

  return result;
}

export async function requireAdmin() {
  const result = await requireSession();
  if (result.error || !result.session) return result;
  if (result.session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requireVerifiedLandlord() {
  const landlord = await requireLandlord();
  if (landlord.error || !landlord.session) return landlord;
  return requireVerified();
}
