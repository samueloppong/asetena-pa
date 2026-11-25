import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";
import { registrationNumberSchema } from "@/lib/validations";

/**
 * The signed-in agent's or firm's own registration number.
 * Private: it is only ever returned to its owner (and to admins in the verification queue) —
 * never in public listing or user payloads.
 */
export async function GET() {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { registrationNumber: true },
  });
  return NextResponse.json({
    registration_number: user?.registrationNumber ?? null,
  });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  if (session.user.role !== "agent" && session.user.role !== "firm") {
    return NextResponse.json(
      { error: "Only agent and firm accounts have a registration number" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = registrationNumberSchema.safeParse(
    typeof body.registrationNumber === "string" ? body.registrationNumber : ""
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid registration number" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { registrationNumber: parsed.data },
    select: { registrationNumber: true },
  });
  return NextResponse.json({ registration_number: user.registrationNumber });
}
