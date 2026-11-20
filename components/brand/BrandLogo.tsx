import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  href?: string | null;
  /** Smaller lockup for the hero, auth, and profile screens */
  compact?: boolean;
  /** Light wordmark for dark backgrounds */
  tone?: "ink" | "light";
  /** Hide wordmark and show the mark only */
  symbolOnly?: boolean;
  priority?: boolean;
}

/**
 * Asetena Pa lockup: Adinkra-inspired mark + Space Grotesk wordmark.
 */
export function BrandLogo({
  className,
  href = "/",
  compact = false,
  tone = "ink",
  symbolOnly = false,
  priority = false,
}: BrandLogoProps) {
  const onLight = tone === "light";
  const content = (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2.5 sm:gap-3",
        className
      )}
    >
      <Image
        src="/brand/asetena-pa-mark.jpg"
        alt=""
        width={compact ? 44 : 64}
        height={compact ? 44 : 64}
        priority={priority}
        className={cn(
          "shrink-0 rounded-[0.85rem] object-cover shadow-[0_8px_24px_rgb(0_0_0/0.18)]",
          compact ? "size-10 sm:size-11" : "size-14 sm:size-16"
        )}
        aria-hidden
      />
      {!symbolOnly && (
        <span
          className={cn(
            "font-heading font-bold tracking-[-0.04em]",
            onLight ? "text-white" : "text-brand",
            compact
              ? "text-[1.35rem] sm:text-2xl"
              : "text-3xl sm:text-4xl md:text-5xl"
          )}
        >
          Asetena Pa
        </span>
      )}
    </span>
  );

  if (href === null) return content;

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 items-center"
      aria-label="Asetena Pa home"
    >
      {content}
    </Link>
  );
}
