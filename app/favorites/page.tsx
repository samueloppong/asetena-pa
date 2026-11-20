"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { fetchFavorites } from "@/lib/api-client";
import type { Property } from "@/lib/types";

export default function FavoritesPage() {
  const { status } = useSession();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      setFavorites([]);
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;
    setLoading(true);
    fetchFavorites()
      .then((data) => setFavorites(data.properties))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <main className="px-4 py-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand">
          Favorites
        </h1>
        <p className="text-sm text-muted-foreground">
          Homes you saved to your Asetena Pa account
        </p>
      </div>

      {status === "unauthenticated" ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/80 px-6 py-16 text-center">
          <Heart className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-medium text-foreground">Sign in to see favorites</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      ) : loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading favorites…
        </p>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/80 px-6 py-16 text-center">
          <Heart className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-medium text-foreground">No favorites yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on a listing to save it here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Explore homes
          </Link>
        </div>
      ) : (
        <PropertyGrid properties={favorites} />
      )}
    </main>
  );
}
