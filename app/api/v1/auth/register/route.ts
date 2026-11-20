import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { mapUser } from "@/lib/mappers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, phoneNumber, fullName, password, role } = parsed.data;
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { phoneNumber }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or phone number already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phoneNumber,
        fullName,
        passwordHash,
        role,
      },
    });

    return NextResponse.json(
      { user: mapUser(user) },
      { status: 201 }
    );
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
