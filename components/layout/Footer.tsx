import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AdinkraFooterRibbon } from "@/components/brand/AdinkraSymbols";
import { PageContainer } from "@/components/layout/PageContainer";

const explore = [
  { href: "/?type=apartment#homes", label: "Apartments" },
  { href: "/?type=house#homes", label: "Houses" },
  { href: "/?type=short_stay#homes", label: "Short Stays" },
  { href: "/?type=chamber_and_hall#homes", label: "Chamber & Hall" },
];

const owners = [
  { href: "/post", label: "List a Property" },
  { href: "/verify", label: "Verification" },
  { href: "/mine", label: "Owner Desk" },
];

const support = [
  { href: "/profile", label: "Contact Us" },
  { href: "/login", label: "FAQs" },
  { href: "/login", label: "Privacy Policy" },
  { href: "/login", label: "Terms & Conditions" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <AdinkraFooterRibbon className="border-b-0" />
      <PageContainer className="py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <BrandLogo compact />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Asetena Pa connects tenants directly with verified property owners
              across Ghana — no agents, no unnecessary fees.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              Explore
            </h3>
            <ul className="mt-3 space-y-2">
              {explore.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              For Owners
            </h3>
            <ul className="mt-3 space-y-2">
              {owners.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              Support
            </h3>
            <ul className="mt-3 space-y-2">
              {support.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          Find your next home, directly from the owner.
        </p>
      </PageContainer>
    </footer>
  );
}
