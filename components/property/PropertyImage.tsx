"use client";

import Image, { type ImageProps } from "next/image";

function isAppMedia(src: string) {
  return (
    src.startsWith("/api/v1/media/") ||
    src.startsWith("http://localhost:") ||
    src.startsWith("http://127.0.0.1:") ||
    src.startsWith("http://minio:")
  );
}

type PropertyImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

/** Prefer unoptimized for proxied/local MinIO media (mobile-friendly). */
export function PropertyImage({
  src,
  alt,
  unoptimized,
  ...props
}: PropertyImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      unoptimized={unoptimized || isAppMedia(src)}
    />
  );
}
