"use client";

import { CalendarDays, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { startOrOpenThread } from "@/lib/api-client";
import { ADVANCE_LABELS, formatPricePerMonth } from "@/lib/format";
import type { ListingAvailability, PaymentFrequency, RentalRequestKind } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RentalActionsProps {
  propertyId: string;
  landlordId: string;
  pricePerMonth: number;
  advancePeriod: PaymentFrequency;
  availability: ListingAvailability;
}

export function RentalActions({
  propertyId,
  landlordId,
  pricePerMonth,
  advancePeriod,
  availability,
}: RentalActionsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [kind, setKind] = useState<RentalRequestKind | null>(null);
  const [viewingAt, setViewingAt] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [advance, setAdvance] = useState<PaymentFrequency>(advancePeriod);
  const [message, setMessage] = useState("");
  const [income, setIncome] = useState("");
  const [employment, setEmployment] = useState("employed");
  const [previousName, setPreviousName] = useState("");
  const [previousPhone, setPreviousPhone] = useState("");
  const [previousNote, setPreviousNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwner = session?.user?.id === landlordId;
  const closed = availability !== "available";

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
      toast.error(err instanceof Error ? err.message : "Could not start conversation");
    } finally {
      setStarting(false);
    }
  }

  function openKind(next: RentalRequestKind) {
    if (status !== "authenticated") {
      toast.message("Sign in to continue");
      router.push("/login");
      return;
    }
    setKind(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) return;
    let viewingIso: string | undefined;
    if (kind === "tour") {
      const when = new Date(viewingAt);
      if (Number.isNaN(when.getTime())) {
        toast.error("Pick a viewing time");
        return;
      }
      viewingIso = when.toISOString();
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/rentals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message: message.trim() || undefined,
          viewingAt: viewingIso,
          moveInDate: kind === "application" ? moveInDate : undefined,
          offeredAdvance: kind === "application" ? advance : undefined,
          monthlyIncome: kind === "application" ? Number(income) : undefined,
          employmentStatus: kind === "application" ? employment : undefined,
          previousLandlordName: kind === "application" ? previousName.trim() || undefined : undefined,
          previousLandlordPhone: kind === "application" ? previousPhone.trim() || undefined : undefined,
          previousLandlordNote: kind === "application" ? previousNote.trim() || undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        toast.message("Verify your Ghana Card before requesting a home");
        router.push("/verify");
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Could not send the request");
        return;
      }
      toast.success(kind === "tour" ? "Viewing requested" : "Application sent");
      setKind(null);
      setMessage("");
      router.push("/rentals");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-bar fixed inset-x-0 bottom-16 z-40 border-t pb-[env(safe-area-inset-bottom)] sm:bottom-16">
      {kind && (
        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-3xl space-y-3 border-b border-border bg-white px-4 py-4"
        >
          <p className="text-sm font-semibold">
            {kind === "tour" ? "Request a viewing" : "Apply to rent"}
          </p>
          {kind === "tour" ? (
            <Input
              type="datetime-local"
              required
              value={viewingAt}
              onChange={(e) => setViewingAt(e.target.value)}
              className="h-11 rounded-xl"
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                type="date"
                required
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="h-11 rounded-xl"
              />
              <select
                value={advance}
                onChange={(e) => setAdvance(e.target.value as PaymentFrequency)}
                className="h-11 rounded-xl border border-input bg-white px-3 text-sm"
              >
                {(Object.keys(ADVANCE_LABELS) as PaymentFrequency[]).map((period) => (
                  <option key={period} value={period}>
                    {ADVANCE_LABELS[period]}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                required
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="Monthly income (GHS)"
                className="h-11 rounded-xl"
              />
              <select
                value={employment}
                onChange={(e) => setEmployment(e.target.value)}
                className="h-11 rounded-xl border border-input bg-white px-3 text-sm"
              >
                <option value="employed">Employed</option>
                <option value="self_employed">Self-employed</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select>
              <Input
                value={previousName}
                onChange={(e) => setPreviousName(e.target.value)}
                placeholder="Last landlord name"
                className="h-11 rounded-xl"
              />
              <Input
                value={previousPhone}
                onChange={(e) => setPreviousPhone(e.target.value)}
                placeholder="Last landlord phone"
                className="h-11 rounded-xl"
              />
            </div>
          )}
          {kind === "application" && (
            <Textarea
              value={previousNote}
              onChange={(e) => setPreviousNote(e.target.value)}
              placeholder="What should this landlord know about your last home?"
              maxLength={500}
            />
          )}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything the landlord should know"
            maxLength={1000}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="rounded-xl">
              Send request
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setKind(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">
            {formatPricePerMonth(pricePerMonth)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {closed
              ? availability === "rented"
                ? "Rented · not live"
                : availability === "held"
                  ? "Held for an applicant"
                  : "Paused by the landlord"
              : ADVANCE_LABELS[advancePeriod]}
          </p>
        </div>
        {isOwner ? (
          <Button size="lg" className="shrink-0 rounded-xl" onClick={() => router.push("/mine")}>
            Manage listing
          </Button>
        ) : (
          <>
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
              variant="outline"
              size="lg"
              className={cn("shrink-0 rounded-xl", closed && "hidden")}
              onClick={() => openKind("tour")}
            >
              <CalendarDays className="size-4" />
              Viewing
            </Button>
            <Button
              size="lg"
              className="shrink-0 rounded-xl"
              disabled={closed}
              onClick={() => openKind("application")}
            >
              Apply
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
