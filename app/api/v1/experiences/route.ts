import { NextResponse } from "next/server";
import { listExperiences } from "@/lib/experiences";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const limit = searchParams.get("limit");

    const experiences = await listExperiences({
      q,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      limit: limit ? Number(limit) : 16,
    });

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error("list experiences error", error);
    return NextResponse.json(
      { error: "Failed to list experiences" },
      { status: 500 }
    );
  }
}
