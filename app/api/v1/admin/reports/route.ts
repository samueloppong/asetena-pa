import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import type { AdminListingReport } from "@/lib/types";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await prisma.listingReport.findMany({
    where: { status: { in: ["pending", "reviewing"] } },
    include: {
      property: { select: { title: true, isActive: true } },
      reporter: { select: { fullName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const reports: AdminListingReport[] = rows.map((row) => ({
    id: row.id,
    property_id: row.propertyId,
    property_title: row.property.title,
    property_active: row.property.isActive,
    reporter_name: row.reporter.fullName,
    reason: row.reason,
    details: row.details ?? undefined,
    status: row.status,
    created_at: row.createdAt.toISOString(),
  }));

  return NextResponse.json({ reports });
}
