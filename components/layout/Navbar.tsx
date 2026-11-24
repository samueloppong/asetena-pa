"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { PageContainer } from "@/components/layout/PageContainer";
import { canListProperties } from "@/lib/listing-actor";
import { cn } from "@/lib/utils";

const centerLinks = [
  { href: "/#homes", label: "Find a Home" },
  { href: "/#homes", label: "Apartments", filter: "apartment" },
  { href: "/#homes", label: "Houses", filter: "house" },
  { href: "/#homes", label: "Short Stays", filter: "short_stay" },
] as const;

const FILTER_LABELS: Record<string, string> = {
  apartment: "Apartments",
  house: "Houses",
  short_stay: "Short Stays",
};

function NavLinksView({ activeLabel }: { activeLabel: string | null }) {
  return (
    <nav className="flex h-full items-center gap-8" aria-label="Main">
      {centerLinks.map((link) => {
        const active = link.label === activeLabel;
        return (
          <Link
            key={link.label}
            href={
              "filter" in link && link.filter
                ? `/?type=${link.filter}#homes`
                : link.href
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-full items-center text-sm font-medium transition",
              active
                ? "text-foreground after:absolute after:inset-x-0 after:bottom-[18px] after:h-0.5 after:rounded-full after:bg-gold"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Reads the route so the matching link gets the gold underline. */
function NavLinks() {
  const pathname = usePathname();
  const type = useSearchParams().get("type");
  const activeLabel =
    pathname !== "/" ? null : (type && FILTER_LABELS[type]) || "Find a Home";
  return <NavLinksView activeLabel={activeLabel} />;
}

export function Navbar({ className }: { className?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(session?.user);
  const canList = canListProperties(session?.user?.role);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 hidden border-b border-border bg-white/95 backdrop-blur-md lg:block",
          className
        )}
      >
        <PageContainer className="flex h-[72px] items-center justify-between gap-6">
          <BrandLogo compact priority />

          <Suspense fallback={<NavLinksView activeLabel={null} />}>
            <NavLinks />
          </Suspense>

          <div className="flex items-center gap-2">
            <Link
              href="/post"
              className="inline-flex h-10 items-center rounded-full bg-secondary px-4 text-sm font-semibold text-foreground transition hover:bg-border"
            >
              List Your Property
            </Link>
            {status === "loading" ? (
              <span className="h-11 w-24 animate-pulse rounded-button bg-secondary" />
            ) : signedIn ? (
              <>
                {canList ? (
                  <Link
                    href="/mine"
                    className="rounded-button px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    My listings
                  </Link>
                ) : null}
                <Link
                  href="/profile"
                  className="btn-gold inline-flex h-11 max-w-[10rem] items-center truncate rounded-button px-4 text-sm font-semibold transition"
                >
                  {session.user.name?.split(" ")[0] || "Profile"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-button px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-gold inline-flex h-11 items-center rounded-button px-4 text-sm font-semibold transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </PageContainer>
      </header>

      {/* Compact top bar on mobile when BottomNav handles primary nav */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur-md lg:hidden">
        <BrandLogo compact priority />
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-button border border-border"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="size-4" />
        </button>
      </div>

      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
