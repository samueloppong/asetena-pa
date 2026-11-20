import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";

interface RouteContext {
  params: Promise<{ propertyId: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { propertyId } = await context.params;
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_propertyId: {
        userId: session.user.id,
        propertyId,
      },
    },
    create: { userId: session.user.id, propertyId },
    update: {},
  });

  return NextResponse.json({ favorited: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { propertyId } = await context.params;
  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, propertyId },
  });

  return NextResponse.json({ favorited: false });
}
