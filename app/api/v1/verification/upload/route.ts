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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed" },
        { status: 400 }
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Namespaced per-user so the media proxy can enforce that only the
    // owner (or an admin) may ever fetch it back.
    const uploaded = await uploadObject(
      buffer,
      file.type,
      `identity-documents/${session.user.id}`
    );

    return NextResponse.json({ url: uploaded.url, key: uploaded.key });
  } catch (err) {
    console.error("verification upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
