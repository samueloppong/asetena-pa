"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { fetchChatThreads } from "@/lib/api-client";
import type { ChatThreadSummary } from "@/lib/types";
import { TrustBadge } from "@/components/trust/TrustBadge";

const POLL_MS = 6000;

export function ChatThreadList() {
  const { status } = useSession();
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    async function load() {
      try {
        const data = await fetchChatThreads();
        if (!cancelled) setThreads(data);
      } catch {
        if (!cancelled) setThreads([]);
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, router]);

  if (status !== "authenticated" || threads === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading conversations…
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <MessageCircle className="size-8" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-brand">
          No conversations yet
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Open a listing and tap “Chat with Owner” to ask about availability,
          utilities or move-in dates directly — no phone number needed until
          you&apos;re comfortable.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Browse listings
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/80">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`/chat/${t.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-muted/60"
          >
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
              {t.property_image ? (
                <Image
                  src={t.property_image}
                  alt={t.property_title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1">
                    {t.other_user_name}
                    {t.other_user_verified ? (
                      <ShieldCheck
                        className="size-3.5 shrink-0 text-verified"
                        aria-label="Verified"
                      />
                    ) : null}
                  </span>
                  {t.is_landlord_view ? (
                    <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Renter
                    </span>
                  ) : null}
                </p>
                {t.unread_count > 0 && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {t.unread_count}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {t.property_title}
              </p>
              <div className="mt-0.5">
                <TrustBadge
                  score={t.other_trust_score}
                  label={t.other_trust_label}
                />
              </div>
              <p
                className={
                  "truncate text-xs " +
                  (t.unread_count > 0
                    ? "font-medium text-foreground"
                    : "text-muted-foreground")
                }
              >
                {t.last_message ?? "Say hello 👋"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
