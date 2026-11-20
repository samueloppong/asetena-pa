import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ReportReason } from "@/lib/types";

/** Listings get auto-hidden once they collect this many distinct reports,
 * pending manual review, so a wave of scam flags takes effect immediately
 * instead of waiting on an admin to notice. */
const AUTO_HIDE_THRESHOLD = 3;

export async function createListingReport(
  propertyId: string,
  reporterId: string,
  reason: ReportReason,
  details?: string
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, landlordId: true },
  });
  if (!property) return { error: "Property not found" as const, report: null };
  if (property.landlordId === reporterId) {
    return {
      error: "You can't report your own listing" as const,
      report: null,
    };
  }

  let report;
  try {
    report = await prisma.listingReport.create({
      data: { propertyId, reporterId, reason, details },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: "You already reported this listing" as const,
        report: null,
      };
    }
    throw error;
  }

  const reportCount = await prisma.listingReport.count({
    where: { propertyId, status: { in: ["pending", "reviewing"] } },
  });

  if (reportCount >= AUTO_HIDE_THRESHOLD) {
    await prisma.property.update({
      where: { id: propertyId },
      data: { isActive: false },
    });
  }

  return { error: null, report, autoHidden: reportCount >= AUTO_HIDE_THRESHOLD };
}
