import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NewListingAlerts } from "@/components/alerts/NewListingAlerts";
import { BottomNav } from "@/components/nav/BottomNav";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ashesi Pa — Accountable Lettings in Ghana",
  description:
    "Discover homes across Ghana from landlords and letting agents — one platform for accountable lettings.",
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
