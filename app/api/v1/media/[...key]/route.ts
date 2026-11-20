import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBucket, getS3Client, readLocalObject } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ key: string[] }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { key: parts } = await context.params;
    const key = parts.map(decodeURIComponent).join("/");
    if (!key || key.includes("..")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    // Identity documents are PII — only owner or admin may fetch.
    const isPrivate =
      key.startsWith("identity-documents/") ||
      key.startsWith("ownership-documents/");
    if (isPrivate) {
      const session = await auth();
      const ownerId = key.split("/")[1];
      const isOwner = session?.user?.id === ownerId;
      const isAdmin = session?.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    try {
      const client = getS3Client();
      const result = await client.send(
        new GetObjectCommand({
          Bucket: getBucket(),
          Key: key,
        })
      );
      const bytes = await result.Body?.transformToByteArray();
      if (bytes) {
        return new NextResponse(Buffer.from(bytes), {
          status: 200,
          headers: {
            "Content-Type": result.ContentType || "application/octet-stream",
            "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=86400",
          },
        });
      }
    } catch (error) {
      console.error("media proxy storage miss", error);
    }

    const local = await readLocalObject(key);
    if (!local) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(local.bytes), {
      status: 200,
      headers: {
        "Content-Type": local.contentType,
        "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("media proxy error", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
