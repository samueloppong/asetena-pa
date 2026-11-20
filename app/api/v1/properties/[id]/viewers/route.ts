import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  countListingViewers,
  leaveListingViewer,
  touchListingViewer,
} from "@/lib/listing-viewers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function readViewerId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const viewerId = (body as { viewerId?: unknown }).viewerId;
  if (typeof viewerId !== "string") return null;
  const trimmed = viewerId.trim();
  if (trimmed.length < 8 || trimmed.length > 80) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json({ watching: countListingViewers(id) });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const viewerId = readViewerId(body);
  if (!viewerId) {
    return NextResponse.json({ error: "viewerId required" }, { status: 400 });
  }

  const action =
    body && typeof body === "object" && "action" in body
      ? (body as { action?: unknown }).action
      : "heartbeat";

  const watching =
    action === "leave"
      ? leaveListingViewer(id, viewerId)
      : touchListingViewer(id, viewerId);

  return NextResponse.json({ watching });
}
