import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NewListingAlerts } from "@/components/alerts/NewListingAlerts";
import { BottomNav } from "@/components/nav/BottomNav";
import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
    "Browse verified direct-from-owner rentals across Accra, Kumasi, and beyond. No agent fees.",
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
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full font-sans text-foreground">
        <Providers>
          <div className="overflow-x-clip">
            <div className="mx-auto min-h-full w-full max-w-5xl pb-28">
              {children}
            </div>
          </div>
          <BottomNav />
          <NewListingAlerts />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
