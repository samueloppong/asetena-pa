"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyImage } from "@/components/property/PropertyImage";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

export type HeroHome = {
  id: string;
  title: string;
  place: string;
  priceLabel: string;
  imageUrl: string;
};

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=1000&fit=crop";

export function HeroSection({
  homes = [],
  liveCount = 0,
}: {
  homes?: HeroHome[];
  liveCount?: number;
}) {
  const previews = homes.slice(0, 2);

  return (
    <section className="relative overflow-hidden bg-[#171717] text-white">
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={HERO_PHOTO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-ken object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171717]/92 via-[#171717]/70 to-[#171717]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171717]/80 via-transparent to-[#171717]/30" />
        {/* Subtle Adinkra watermark */}
        <div
          className="absolute right-[2%] bottom-[4%] size-36 opacity-[0.12] sm:size-44"
          style={{
            backgroundImage: "url(/brand/adinkra/01.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            filter: "invert(1)",
          }}
        />
      </div>

      <PageContainer className="relative grid items-end gap-10 pt-10 pb-28 sm:pt-14 sm:pb-32 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:pt-16 lg:pb-36">
        <div className="max-w-xl">
          <p
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur"
            suppressHydrationWarning
          >
            <span className="size-1.5 rounded-full bg-[#e9a92f]" aria-hidden />
            {liveCount > 0 ? `${liveCount} live` : "Browse homes"}
          </p>
          <h1 className="mt-5 font-heading text-[2.5rem] leading-[1.02] font-extrabold tracking-[-0.045em] sm:text-5xl lg:text-[3.75rem]">
            Find a place to{" "}
            <span className="bg-gradient-to-r from-[#fff6d8] via-[#e9a92f] to-[#d4921f] bg-clip-text text-transparent">
              call home.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-[0.95rem]">
            One platform for lettings accountability — landlords and agents list
            homes, renters apply, and every stay is tracked end to end.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#homes"
              className="btn-gold inline-flex h-12 items-center gap-2 rounded-[0.75rem] px-6 text-sm font-bold tracking-[-0.01em] transition"
            >
              Explore Properties
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/post"
              className="inline-flex h-12 items-center rounded-[0.75rem] border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              List Your Property
            </Link>
          </div>
        </div>

        {previews.length > 0 ? (
          <div className="relative hidden h-[22rem] lg:block">
            {previews.map((home, index) => (
              <Link
                key={home.id}
                href={`/properties/${home.id}`}
                className={cn(
                  "group absolute overflow-hidden rounded-[1.1rem] border border-white/20 bg-white/5 shadow-[0_20px_50px_rgb(0_0_0/0.35)] backdrop-blur",
                  index === 0 && "top-2 right-0 z-20 h-64 w-[78%] rotate-2",
                  index === 1 && "bottom-2 left-2 z-30 h-44 w-[58%] -rotate-3"
                )}
                aria-label={`${home.title}, ${home.place}, ${home.priceLabel}`}
              >
                <span
                  className="hero-float block h-full w-full"
                  style={{ animationDelay: `${index * 0.7}s` }}
                >
                  <span className="relative block h-full w-full overflow-hidden">
                    <PropertyImage
                      src={home.imageUrl}
                      alt=""
                      fill
                      sizes="360px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pt-10 pb-3">
                      <span className="block text-[11px] font-medium tracking-wide text-white/80 uppercase">
                        {home.place}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-white">
                        {home.priceLabel}
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </PageContainer>
    </section>
  );
}
