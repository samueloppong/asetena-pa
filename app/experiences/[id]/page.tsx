import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Star, UserRound } from "lucide-react";
import { getExperienceById } from "@/lib/experiences";
import { formatGhs } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  culture: "Culture",
  nature: "Nature",
  nightlife: "Nightlife",
  history: "History",
  market: "Market",
  beach: "Beach",
  adventure: "Adventure",
};

export default async function ExperienceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const experience = await getExperienceById(id);
  if (!experience) notFound();

  return (
    <main className="pb-24">
      <div className="relative aspect-[5/4] bg-secondary sm:aspect-[16/9] sm:px-4 sm:pt-4">
        <div className="relative h-full overflow-hidden sm:rounded-2xl">
          <Image
            src={experience.image_url}
            alt={experience.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized={experience.image_url.startsWith("/")}
          />
        </div>
        <Link
          href="/"
          className="absolute top-4 left-4 z-10 inline-flex size-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm sm:top-8 sm:left-8"
          aria-label="Back to explore"
        >
          <ArrowLeft className="size-4" />
        </Link>
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {CATEGORY_LABELS[experience.category] ?? experience.category}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand">
            {experience.title}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            {[experience.neighborhood, experience.city_town, experience.region]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="inline-flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-rating text-rating" />
            {experience.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({experience.review_count} reviews)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <UserRound className="size-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Hosted by {experience.host_name}
            </p>
            <p className="text-xs text-muted-foreground">
              Local experience · {experience.duration_hours} hours
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-white px-3 py-3 text-center">
            <Clock className="mx-auto size-4 text-primary" />
            <p className="mt-1 text-xs font-medium">
              {experience.duration_hours} hours
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white px-3 py-3 text-center">
            <p className="text-sm font-bold text-primary">
              {formatGhs(experience.price_ghs)}
            </p>
            <p className="text-[11px] text-muted-foreground">per guest</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-brand">About this experience</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {experience.description}
          </p>
        </section>
      </div>
    </main>
  );
}
