import { NextResponse } from "next/server";
import { requireVerifiedLandlord } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ownershipClaimSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireVerifiedLandlord();
  if (error || !session) return error!;

  const { id } = await context.params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { landlordId: true },
  });
  if (!property || property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ownershipClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A document photo is required" }, { status: 400 });
  }

  const expectedPrefix = `/api/v1/media/ownership-documents/${session.user.id}/`;
  if (!parsed.data.landTitleDocumentUrl.startsWith(expectedPrefix)) {
    return NextResponse.json(
      { error: "Upload the document from your listing desk" },
      { status: 400 }
    );
  }

  await prisma.property.update({
    where: { id },
    data: {
      landTitleDocumentUrl: parsed.data.landTitleDocumentUrl,
      ownershipStatus: "pending",
      isDirectOwnerVerified: false,
    },
  });

  return NextResponse.json({ ok: true });
}
