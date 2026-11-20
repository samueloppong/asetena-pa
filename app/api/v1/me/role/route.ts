import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const body = await request.json();
  const role = body.role;
  if (role !== "renter" && role !== "landlord") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { role },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.fullName,
    },
    note: "Sign out and back in to refresh session role claims",
  });
}
