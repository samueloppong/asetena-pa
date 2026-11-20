"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchUserTrustScore } from "@/lib/api-client";
import type { TrustScoreSummary } from "@/lib/types";
import { TrustBadge } from "@/components/trust/TrustBadge";

export function MyTrustScoreCard() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<TrustScoreSummary | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    fetchUserTrustScore(session.user.id)
      .then(setSummary)
      .catch(() => {});
  }, [session?.user.id]);

  if (!summary) return null;

  const rows = [
    { label: "Identity verification", points: summary.breakdown.identity_points, max: 40 },
    { label: "Time on Asetena Pa", points: summary.breakdown.tenure_points, max: 20 },
    { label: "Community reviews", points: summary.breakdown.review_points, max: 30 },
    { label: "Member baseline", points: summary.breakdown.baseline_points, max: 10 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Your trust score</p>
        <TrustBadge score={summary.score} label={summary.label} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {summary.review_count > 0
          ? `Based on ${summary.review_count} review${summary.review_count === 1 ? "" : "s"} from people you've chatted with, averaging ${summary.average_rating}/5.`
          : "No stay reviews yet. Your label stays New member until someone reviews a completed move-in."}
      </p>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-xs">
            <span className="w-40 shrink-0 text-muted-foreground">{r.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(r.points / r.max) * 100}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-medium text-foreground">
              {r.points}/{r.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
