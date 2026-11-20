import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ownershipDecisionSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true, ownershipStatus: true },
  });
  if (!property || property.ownershipStatus !== "pending") {
    return NextResponse.json({ error: "No claim waiting" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ownershipDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose approve or reject" }, { status: 400 });
  }

  const verified = parsed.data.decision === "verified";
  await prisma.property.update({
    where: { id },
    data: {
      ownershipStatus: verified ? "verified" : "rejected",
      isDirectOwnerVerified: verified,
    },
  });

  return NextResponse.json({ ok: true });
}
