"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Star } from "lucide-react";
import { toast } from "sonner";
import {
  fetchThreadMessages,
  sendChatMessage,
  submitThreadReview,
} from "@/lib/api-client";
import type { ChatMessageDto, ChatThreadHeader } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrustBadge } from "@/components/trust/TrustBadge";
import { cn } from "@/lib/utils";

const POLL_MS = 4000;

interface ChatWindowProps {
  threadId: string;
}

export function ChatWindow({ threadId }: ChatWindowProps) {
  const { status } = useSession();
  const router = useRouter();
  const [header, setHeader] = useState<ChatThreadHeader | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    async function load() {
      try {
        const data = await fetchThreadMessages(threadId);
        if (cancelled) return;
        setHeader(data.thread);
        setMessages(data.messages);
        setLoaded(true);
      } catch {
        if (!cancelled) {
          toast.error("Couldn't load this conversation");
          router.push("/chat");
        }
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [threadId, status, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      const message = await sendChatMessage(threadId, body);
      setMessages((prev) => [...prev, message]);
    } catch {
      toast.error("Message failed to send");
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  async function onSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewRating) {
      toast.error("Pick a star rating");
      return;
    }
    setReviewSubmitting(true);
    try {
      await submitThreadReview(threadId, reviewRating, reviewComment.trim() || undefined);
      setHeader((h) => (h ? { ...h, already_reviewed: true } : h));
      setReviewOpen(false);
      toast.success("Thanks — that helps keep Ashesi Pa trustworthy");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  const showReviewPrompt =
    header && header.can_review && !header.already_reviewed;

  return (
    <main className="flex min-h-[100dvh] flex-col pb-16">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/80 bg-white/90 px-3 py-3 backdrop-blur-xl">
        <Link
          href="/chat"
          className="inline-flex size-9 items-center justify-center rounded-full text-foreground"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {header?.other_user_name ?? "Conversation"}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {header && (
              <TrustBadge score={header.other_trust_score} label={header.other_trust_label} />
            )}
            {header ? (
              <Link
                href={`/properties/${header.property_id}`}
                className="truncate text-xs text-primary underline-offset-2 hover:underline"
              >
                {header.property_title}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {!loaded && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        )}
        {loaded && messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            Say hello 👋 — ask about availability, utilities or move-in dates.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                m.mine
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-muted text-foreground"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}

        {showReviewPrompt && !reviewOpen && (
          <div className="mx-auto mt-4 flex max-w-xs flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-white p-4 text-center">
            <p className="text-xs text-muted-foreground">
              You completed a move-in with {header!.other_user_name}.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setReviewOpen(true)}
            >
              Rate this tenancy
            </Button>
          </div>
        )}

        {reviewOpen && (
          <form
            onSubmit={onSubmitReview}
            className="mx-auto mt-4 max-w-sm space-y-3 rounded-2xl border border-border bg-white p-4"
          >
            <p className="text-sm font-semibold text-foreground">
              Rate {header?.other_user_name}
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setReviewRating(n)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "size-6",
                      n <= reviewRating ? "fill-rating text-rating" : "text-border"
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Optional — what should others know?"
              className="min-h-16 text-sm"
              maxLength={500}
            />
            <div className="flex justify-center gap-2">
              <Button type="submit" size="sm" className="rounded-full" disabled={reviewSubmitting}>
                Submit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => setReviewOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSend}
        className="sticky bottom-0 flex items-center gap-2 border-t border-border/80 bg-white/95 px-3 py-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon-lg"
          className="rounded-full"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </main>
  );
}
