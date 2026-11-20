import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { reportModerationSchema } from "@/lib/validations";

const AUTO_HIDE_THRESHOLD = 3;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const report = await prisma.listingReport.findUnique({
    where: { id },
    select: { id: true, propertyId: true },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = reportModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (parsed.data.action === "restore_listing") {
    await prisma.property.update({
      where: { id: report.propertyId },
      data: { isActive: true },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.listingReport.update({
    where: { id },
    data: { status: parsed.data.action },
  });

  if (parsed.data.action === "dismissed") {
    const open = await prisma.listingReport.count({
      where: {
        propertyId: report.propertyId,
        status: { in: ["pending", "reviewing"] },
      },
    });
    if (open < AUTO_HIDE_THRESHOLD) {
      await prisma.property.update({
        where: { id: report.propertyId },
        data: { isActive: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
