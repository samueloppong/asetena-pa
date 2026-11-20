"use client";

import { useEffect, useState } from "react";
import { Compass, LocateFixed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExperienceCard } from "@/components/experience/ExperienceCard";
import { Button } from "@/components/ui/button";
import type { Experience } from "@/lib/experience-types";

interface ExperiencesNearbyProps {
  initialExperiences: Experience[];
  searchQuery: string;
}

export function ExperiencesNearby({
  initialExperiences,
  searchQuery,
}: ExperiencesNearbyProps) {
  const [experiences, setExperiences] =
    useState<Experience[]>(initialExperiences);
  const [loading, setLoading] = useState(false);
  const [usingGps, setUsingGps] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        params.set("limit", "12");
        const res = await fetch(`/api/v1/experiences?${params.toString()}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!cancelled) {
          setExperiences(data.experiences);
          setUsingGps(false);
        }
      } catch {
        if (!cancelled && !searchQuery.trim()) {
          setExperiences(initialExperiences);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchQuery, initialExperiences]);

  function detectNearby() {
    if (!navigator.geolocation) {
      toast.error("GPS is not available on this device");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const params = new URLSearchParams({
            lat: String(pos.coords.latitude),
            lng: String(pos.coords.longitude),
            limit: "12",
          });
          if (searchQuery.trim()) params.set("q", searchQuery.trim());
          const res = await fetch(`/api/v1/experiences?${params}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed");
          setExperiences(data.experiences);
          setUsingGps(true);
          toast.success("Showing experiences nearest to you");
        } catch {
          toast.error("Could not load nearby experiences");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("Allow location access to find experiences near you");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand">
            <Compass className="size-5 text-primary" />
            Explore experiences nearby
          </h2>
          <p className="text-sm text-muted-foreground">
            {usingGps
              ? "Sorted by distance from your GPS"
              : searchQuery.trim()
                ? `Things to do around “${searchQuery.trim()}”`
                : "Food, culture, beaches, and more across Ghana"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={detectNearby}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LocateFixed className="size-3.5" />
          )}
          Near me
        </Button>
      </div>

      {loading && experiences.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Finding experiences…
        </p>
      ) : experiences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/80 px-4 py-10 text-center text-sm text-muted-foreground">
          No experiences match this area yet. Try another region or Near me.
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none">
          <div className="flex w-max gap-3">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
