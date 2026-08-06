import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SetupRequired } from "@/components/setup-required";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Outway Club — Trips worth leaving home for",
    template: "%s · Outway Club",
  },
  description:
    "Small-group and private trips across India — full itineraries, honest pricing, real trip leaders. Plan your next escape with Outway Club.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {configured ? (
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        ) : (
          <SetupRequired />
        )}
      </body>
    </html>
  );
}
