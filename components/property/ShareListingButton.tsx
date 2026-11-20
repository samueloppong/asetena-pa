"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareListingButtonProps {
  title: string;
}

export function ShareListingButton({ title }: ShareListingButtonProps) {
  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share this listing");
    }
  }

  return (
    <button
      type="button"
      className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm"
      aria-label="Share listing"
      onClick={onShare}
    >
      <Share2 className="size-4" />
    </button>
  );
}
