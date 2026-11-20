"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StayReviewFormProps {
  propertyId: string;
}

export function StayReviewForm({ propertyId }: StayReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      toast.error("Pick a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save the review");
        return;
      }
      toast.success("Review saved");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-white p-4">
      <p className="text-sm font-semibold">You lived here. How was the home?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "size-6",
                n <= rating ? "fill-rating text-rating" : "text-border"
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Power, water, the landlord, anything the photos missed"
        maxLength={1000}
      />
      <Button type="submit" disabled={submitting} className="rounded-xl">
        Submit stay review
      </Button>
    </form>
  );
}
