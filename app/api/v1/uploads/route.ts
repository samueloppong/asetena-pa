import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { uploadObject } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { session, error } = await requireSession();
  if (error || !session) return error!;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const category = String(form.get("category") || "exterior");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Only image or video uploads are allowed" },
        { status: 400 }
      );
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 15MB" },
        { status: 400 }
      );
    }

    const purpose = String(form.get("purpose") || "listing");
    const buffer = Buffer.from(await file.arrayBuffer());
    const folder =
      purpose === "ownership"
        ? `ownership-documents/${session.user.id}`
        : `properties/${category}`;
    if (purpose === "ownership" && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Ownership documents must be a photo" },
        { status: 400 }
      );
    }
    const uploaded = await uploadObject(
      buffer,
      file.type || "application/octet-stream",
      folder
    );

    return NextResponse.json({
      url: uploaded.url,
      key: uploaded.key,
      mediaType: file.type.startsWith("video/") ? "video" : "image",
      category,
    });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
