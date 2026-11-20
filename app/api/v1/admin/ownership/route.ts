import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import type { AdminOwnershipClaim } from "@/lib/types";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await prisma.property.findMany({
    where: { ownershipStatus: "pending" },
    include: { landlord: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const claims: AdminOwnershipClaim[] = rows
    .filter((row) => row.landTitleDocumentUrl)
    .map((row) => ({
      property_id: row.id,
      title: row.title,
      landlord_name: row.landlord.fullName,
      landlord_email: row.landlord.email,
      document_url: row.landTitleDocumentUrl!,
      ownership_status: row.ownershipStatus,
    }));

  return NextResponse.json({ claims });
}
