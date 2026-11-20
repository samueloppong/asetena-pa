import type { Metadata } from "next";
import { Geist_Mono, Inter, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NewListingAlerts } from "@/components/alerts/NewListingAlerts";
import { BottomNav } from "@/components/nav/BottomNav";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asetena Pa — Rent Direct from Owners in Ghana",
  description:
    "Discover beautiful homes across Ghana, directly from verified property owners. No agents. No unnecessary fees.",
  icons: {
    icon: [{ url: "/brand/asetena-pa-mark.jpg", type: "image/jpeg" }],
    apple: [{ url: "/brand/asetena-pa-mark.jpg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full font-sans text-foreground">
        <Providers>
          <div className="overflow-x-clip">
            <Navbar />
            <div className="mx-auto min-h-full w-full max-w-7xl pb-28 lg:pb-0">
              {children}
            </div>
          </div>
          <div className="lg:hidden">
            <BottomNav />
          </div>
          <NewListingAlerts />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
