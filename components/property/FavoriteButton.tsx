"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchFavorites, toggleFavoriteApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  propertyId: string;
}

export function FavoriteButton({ propertyId }: FavoriteButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setFavorited(false);
      return;
    }
    fetchFavorites()
      .then((data) => setFavorited(data.ids.includes(propertyId)))
      .catch(() => setFavorited(false));
  }, [propertyId, status]);

  async function onClick() {
    if (status !== "authenticated") {
      toast.message("Sign in to save homes");
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      const next = await toggleFavoriteApi(propertyId, favorited);
      setFavorited(next);
    } catch {
      toast.error("Could not update favorite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      disabled={busy}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm"
    >
      <Heart
        className={cn("size-4", favorited && "fill-red-500 text-red-500")}
      />
    </button>
  );
}
