"use client";

import { CalendarDays, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startOrOpenThread } from "@/lib/api-client";
import { ADVANCE_LABELS, formatPricePerMonth } from "@/lib/format";
import type { PaymentFrequency } from "@/lib/types";

interface StickyFooterProps {
  propertyId: string;
  pricePerMonth: number;
  advancePeriod: PaymentFrequency;
}

export function StickyFooter({
  propertyId,
  pricePerMonth,
  advancePeriod,
}: StickyFooterProps) {
  const { status } = useSession();
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function onChat() {
    if (status !== "authenticated") {
      toast.message("Sign in to message the owner");
      router.push("/login");
      return;
    }
    setStarting(true);
    try {
      const threadId = await startOrOpenThread(propertyId);
      router.push(`/chat/${threadId}`);
    } catch (err) {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        router.push("/login");
        return;
      }
      if (err instanceof Error && err.message === "KYC_REQUIRED") {
        toast.message("Verify your Ghana Card to chat");
        router.push("/verify");
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Could not start conversation"
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="glass-bar fixed inset-x-0 bottom-16 z-40 border-t pb-[env(safe-area-inset-bottom)] sm:bottom-16">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">
            {formatPricePerMonth(pricePerMonth)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ADVANCE_LABELS[advancePeriod]}
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="hidden shrink-0 rounded-xl sm:inline-flex"
          disabled={starting}
          onClick={onChat}
        >
          <MessageCircle className="size-4" />
          Chat
        </Button>
        <Button
          size="lg"
          className="shrink-0 rounded-xl"
          onClick={() =>
            toast.success("Tour request saved", {
              description:
                "Physical tour scheduling will connect once the backend is live.",
            })
          }
        >
          <CalendarDays className="size-4" />
          Schedule Free Tour
        </Button>
      </div>
    </div>
  );
}
