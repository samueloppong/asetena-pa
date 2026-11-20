"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchChatThreads } from "@/lib/api-client";

const POLL_MS = 15000;

/** Total unread messages across all of the current user's chat threads. */
export function useUnreadChatCount(): number {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const threads = await fetchChatThreads();
        if (!cancelled) {
          setCount(threads.reduce((sum, t) => sum + t.unread_count, 0));
        }
      } catch {
        // ignore transient errors, keep last known count
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status]);

  return status === "authenticated" ? count : 0;
}
