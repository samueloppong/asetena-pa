import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { updateRentalRequest } from "@/lib/rentals";
import { rentalRequestActionSchema } from "@/lib/validations";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = rentalRequestActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error: actionError, request: rental } = await updateRentalRequest({
    requestId: id,
    actorId: session.user.id,
    action: parsed.data.action,
    landlordNote: parsed.data.landlordNote,
  });
  if (actionError || !rental) {
    return NextResponse.json({ error: actionError }, { status: 400 });
  }
  return NextResponse.json({ request: rental });
}
