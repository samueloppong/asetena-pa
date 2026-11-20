import { NextResponse } from "next/server";
import { requireVerified } from "@/lib/auth-helpers";
import { createRentalRequest } from "@/lib/rentals";
import { rentalRequestCreateSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { session, error } = await requireVerified();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = rentalRequestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the viewing or move-in details" }, { status: 400 });
  }

  const { error: requestError, request: rental } = await createRentalRequest({
    propertyId: id,
    renterId: session.user.id,
    ...parsed.data,
  });
  if (requestError || !rental) {
    return NextResponse.json({ error: requestError }, { status: 400 });
  }
  return NextResponse.json({ request: rental }, { status: 201 });
}
