"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AdinkraFooterRibbon,
  AdinkraIcon,
  getAdinkraSymbol,
} from "@/components/brand/AdinkraSymbols";
import { cn } from "@/lib/utils";
import { useUnreadChatCount } from "@/lib/use-unread-chat-count";

const tabs = [
  {
    href: "/",
    label: "Explore",
    symbolId: "ananse-ntontan",
  },
  {
    href: "/favorites",
    label: "Favorites",
    symbolId: "akoma",
  },
  {
    href: "/post",
    label: "Post Rental",
    symbolId: "eban",
  },
  {
    href: "/chat",
    label: "Chat",
    symbolId: "mate-masie",
  },
  {
    href: "/profile",
    label: "Profile",
    symbolId: "adinkrahene",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const unreadCount = useUnreadChatCount();

  return (
    <nav className="glass-bar fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)]">
      <AdinkraFooterRibbon />
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {tabs.map(({ href, label, symbolId }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const symbol = getAdinkraSymbol(symbolId);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                title={`${symbol.name} — ${symbol.meaning}`}
              >
                <span className="relative">
                  <AdinkraIcon
                    symbol={symbol}
                    className={cn(
                      "size-5 transition-transform",
                      active && "scale-110"
                    )}
                  />
                  {href === "/chat" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
