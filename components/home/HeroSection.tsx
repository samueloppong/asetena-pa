"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

export type HeroHome = {
  id: string;
  title: string;
  place: string;
  priceLabel: string;
  imageUrl: string;
};

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&h=1100&fit=crop";

const VERIFIED_BADGES = [
  {
    title: "Verified Landlords",
    detail: "For a safer rental experience",
  },
  {
    title: "Verified Agents",
    detail: "Letting agents checked before they list",
  },
  {
    title: "Verified Firms",
    detail: "Estate firms and building societies, vetted",
  },
  {
    title: "Verified Renters",
    detail: "Identity checked before applying",
  },
] as const;

const BADGE_INTERVAL_MS = 6000;

export function HeroSection({
  liveCount = 0,
}: {
  /** Kept for callers that still pass featured homes; the light hero shows one photo instead. */
  homes?: HeroHome[];
  liveCount?: number;
}) {
  const [badgeIndex, setBadgeIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBadgeIndex((i) => (i + 1) % VERIFIED_BADGES.length);
    }, BADGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const badge = VERIFIED_BADGES[badgeIndex];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#eef0f3] to-background">
      {/* Pale green circle tucked behind the photo's sweeping bottom-left curve */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-[30%] hidden size-[22rem] translate-y-[45%] rounded-full bg-verified/10 lg:block"
      />

      {/* No `relative` here: on desktop the photo and badge position against the full-width section. */}
      <PageContainer className="grid items-center gap-10 pt-8 pb-28 sm:pt-12 sm:pb-32 lg:grid-cols-2 lg:gap-8 lg:pt-10 lg:pb-36">
        <div className="relative z-10 max-w-xl">
          <p
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
            suppressHydrationWarning
          >
            <span className="size-1.5 rounded-full bg-verified" aria-hidden />
            {liveCount > 0 ? `${liveCount} live` : "Browse homes"}
          </p>
          <h1 className="mt-5 font-heading text-[2.6rem] leading-[1.02] font-bold tracking-[-0.045em] text-brand sm:text-5xl lg:text-[4rem]">
            Find a place to{" "}
            <span className="whitespace-nowrap">
              <span className="text-gold">call home</span>.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            One platform for lettings accountability — landlords and agents list
            homes, renters apply, and every stay is tracked end to end.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#homes"
              className="btn-gold inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold transition"
            >
              Explore Properties
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/post"
              className="inline-flex h-12 items-center rounded-full border border-brand/70 bg-white/70 px-6 text-sm font-semibold text-brand transition hover:bg-white"
            >
              List Your Property
            </Link>
          </div>
        </div>

        {/* Stacked card on mobile; on desktop the photo bleeds to the right edge (see .hero-photo-shape). */}
        <div className="relative lg:static">
          <div className="hero-photo-shape relative h-60 overflow-hidden rounded-[1.5rem] sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[min(54%,62rem)]">
            <Image
              src={HERO_PHOTO}
              alt="Bright, furnished living room in a verified Ghana home"
              fill
              priority
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="object-cover"
            />
          </div>
          <div
            className="absolute right-3 -bottom-5 z-10 flex min-w-[15rem] items-center gap-3 rounded-[30px] bg-white px-4 py-3 shadow-[0_12px_32px_rgb(0_0_0/0.12)] sm:right-6 lg:right-10 lg:bottom-20"
            aria-live="polite"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-verified text-white"
              aria-hidden
            >
              <Check className="size-4" strokeWidth={3} />
            </span>
            {/* Keyed on the index so each badge fades in as it changes. */}
            <span key={badgeIndex} className="animate-in fade-in duration-700 leading-tight">
              <span className="block text-sm font-semibold text-brand">
                {badge.title}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {badge.detail}
              </span>
            </span>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
