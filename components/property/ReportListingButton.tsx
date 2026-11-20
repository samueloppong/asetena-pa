"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { reportListing } from "@/lib/api-client";
import type { ReportReason } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "not_owner", label: "Lister isn't the owner" },
  { value: "stolen_photos", label: "Photos are from another site" },
  { value: "price_too_good", label: "Price looks like a scam" },
  { value: "already_rented", label: "Already rented / unavailable" },
  { value: "wrong_location", label: "Location doesn't match" },
  { value: "requested_upfront_payment", label: "Asked for money before a tour" },
  { value: "other", label: "Something else" },
];

interface ReportListingButtonProps {
  propertyId: string;
}

export function ReportListingButton({ propertyId }: ReportListingButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function onOpen() {
    if (status !== "authenticated") {
      toast.message("Sign in to report a listing");
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      toast.error("Choose a reason");
      return;
    }
    setSubmitting(true);
    try {
      await reportListing(propertyId, reason, details.trim() || undefined);
      setSent(true);
      setOpen(false);
      toast.success("Report submitted — our team will review this listing");
    } catch (err) {
      if (err instanceof Error && err.message === "KYC_REQUIRED") {
        toast.message("Verify your Ghana Card to report listings");
        router.push("/verify");
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Could not submit report"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="text-xs text-muted-foreground">
        Thanks — you reported this listing.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
      >
        <Flag className="size-3.5" />
        Report this listing
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-border bg-white p-4"
    >
      <p className="text-sm font-semibold text-foreground">
        What&apos;s wrong with this listing?
      </p>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setReason(r.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              reason === r.value
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-white text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <Textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Any extra details (optional)"
        className="min-h-16 text-sm"
        maxLength={1000}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          disabled={submitting}
          className="rounded-full"
        >
          Submit report
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
