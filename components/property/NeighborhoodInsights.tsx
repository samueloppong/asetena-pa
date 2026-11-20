"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Droplet, Shield, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { fetchNeighborhoodInsights, submitInsight } from "@/lib/api-client";
import type { NeighborhoodInsightSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NeighborhoodInsightsProps {
  neighborhood: string;
  cityTown: string;
}

const METRICS = [
  { key: "avg_power_rating" as const, label: "Power (ECG / dumsor)", icon: Zap },
  { key: "avg_water_rating" as const, label: "Water supply", icon: Droplet },
  { key: "avg_safety_rating" as const, label: "Safety at night", icon: Shield },
];

export function NeighborhoodInsights({
  neighborhood,
  cityTown,
}: NeighborhoodInsightsProps) {
  const { status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<NeighborhoodInsightSummary | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [ratings, setRatings] = useState({ power: 0, water: 0, safety: 0 });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchNeighborhoodInsights(neighborhood, cityTown)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [neighborhood, cityTown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.message("Sign in to share what you know about this area");
      router.push("/login");
      return;
    }
    if (!ratings.power || !ratings.water || !ratings.safety) {
      toast.error("Rate power, water and safety to submit");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await submitInsight({
        neighborhood,
        cityTown,
        powerRating: ratings.power,
        waterRating: ratings.water,
        safetyRating: ratings.safety,
        comment: comment.trim() || undefined,
      });
      setSummary(updated);
      setFormOpen(false);
      setComment("");
      setRatings({ power: 0, water: 0, safety: 0 });
      toast.success("Thanks — that helps other renters");
    } catch (err) {
      if (err instanceof Error && err.message === "KYC_REQUIRED") {
        toast.message("Verify your Ghana Card to share insights");
        router.push("/verify");
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Could not submit your rating"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasData = summary && summary.sample_size > 0;

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-brand">
          Living in {neighborhood}
        </h2>
        {hasData && (
          <span className="text-xs text-muted-foreground">
            {summary.sample_size} renter
            {summary.sample_size === 1 ? "" : "s"} shared
          </span>
        )}
      </div>

      {hasData ? (
        <div className="space-y-2.5">
          {METRICS.map((m) => (
            <MetricBar
              key={m.key}
              icon={<m.icon className="size-3.5" />}
              label={m.label}
              value={summary![m.key]}
            />
          ))}
          {summary!.recent_comments.length > 0 && (
            <div className="space-y-2 pt-1">
              {summary!.recent_comments.slice(0, 2).map((c) => (
                <p
                  key={c.id}
                  className="rounded-xl bg-muted/60 p-2.5 text-xs leading-relaxed text-foreground"
                >
                  “{c.comment}”
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Nobody has shared what this area is actually like yet — power
          reliability, water pressure, night safety. Photos won&apos;t tell you
          that, but past renters can.
        </p>
      )}

      {!formOpen ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setFormOpen(true)}
        >
          {hasData ? "Add your experience" : "Be the first to rate this area"}
        </Button>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3 pt-1">
          <StarPicker
            label="Power reliability"
            value={ratings.power}
            onChange={(v) => setRatings((r) => ({ ...r, power: v }))}
          />
          <StarPicker
            label="Water supply"
            value={ratings.water}
            onChange={(v) => setRatings((r) => ({ ...r, water: v }))}
          />
          <StarPicker
            label="Safety at night"
            value={ratings.safety}
            onChange={(v) => setRatings((r) => ({ ...r, safety: v }))}
          />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything future renters should know? (optional)"
            className="min-h-16 text-sm"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting} className="rounded-full">
              Submit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function MetricBar({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-32 shrink-0 text-xs text-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-xs font-semibold text-foreground">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star
              className={cn(
                "size-5",
                n <= value ? "fill-rating text-rating" : "text-border"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
