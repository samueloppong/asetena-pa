"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { canListProperties } from "@/lib/listing-actor";
import { cn } from "@/lib/utils";

const browseLinks = [
  { href: "/#homes", label: "Find a Home" },
  { href: "/?type=apartment#homes", label: "Apartments" },
  { href: "/?type=house#homes", label: "Houses" },
  { href: "/?type=short_stay#homes", label: "Short Stays" },
  { href: "/post", label: "List Your Property" },
] as const;

export function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(session?.user);
  const canList = canListProperties(session?.user?.role);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const accountLinks = signedIn
    ? [
        { href: "/profile", label: "Profile", primary: true },
        ...(canList ? [{ href: "/mine", label: "My listings", primary: false }] : []),
        { href: "/rentals", label: "My rentals", primary: false },
        { href: "/favorites", label: "Favorites", primary: false },
      ]
    : [
        { href: "/login", label: "Sign In", primary: false },
        { href: "/register", label: "Get Started", primary: true },
      ];

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className="absolute top-0 right-0 flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <BrandLogo compact href="/" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-button border border-border"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {browseLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={onClose}
              className="rounded-button px-3 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-2 border-t border-border" />
          {accountLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={onClose}
              className={cn(
                "rounded-button px-3 py-3 text-sm font-medium text-foreground transition hover:bg-secondary",
                link.primary && "btn-gold mt-1 text-center font-semibold"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
