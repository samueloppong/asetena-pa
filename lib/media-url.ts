/**
 * Rewrite absolute MinIO URLs to same-origin proxy paths so phones
 * on the LAN can load uploads (localhost:9000 is the phone itself).
 */
export function toPublicMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("/api/v1/media/")) return url;

  const minioMatch = url.match(
    /^https?:\/\/(?:localhost|127\.0\.0\.1|minio):9000\/[^/]+\/(.+)$/i
  );
  if (minioMatch?.[1]) {
    return `/api/v1/media/${minioMatch[1]}`;
  }

  const publicBase = (process.env.MINIO_PUBLIC_URL || "").replace(/\/$/, "");
  const bucket = process.env.MINIO_BUCKET || "sheltergh-media";
  if (publicBase && url.startsWith(`${publicBase}/${bucket}/`)) {
    return `/api/v1/media/${url.slice(`${publicBase}/${bucket}/`.length)}`;
  }

  return url;
}
