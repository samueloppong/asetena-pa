import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-helpers";
import { registrationNumberSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const body = await request.json();
  const role = body.role;
  if (
    role !== "renter" &&
    role !== "landlord" &&
    role !== "agent" &&
    role !== "firm"
  ) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const companyName =
    typeof body.companyName === "string" ? body.companyName.trim() : "";
  if (role === "firm" && companyName.length < 2) {
    return NextResponse.json(
      { error: "Company name is required for firms" },
      { status: 400 }
    );
  }

  // Agents and firms must give a registration number; it stays private (never in public payloads).
  let registrationNumber: string | undefined;
  if (role === "agent" || role === "firm") {
    const parsedReg = registrationNumberSchema.safeParse(
      typeof body.registrationNumber === "string" ? body.registrationNumber : ""
    );
    if (!parsedReg.success) {
      return NextResponse.json(
        { error: parsedReg.error.issues[0]?.message ?? "Registration number is required" },
        { status: 400 }
      );
    }
    registrationNumber = parsedReg.data;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role,
      ...(role === "firm" ? { companyName } : {}),
      ...(registrationNumber ? { registrationNumber } : {}),
    },
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
