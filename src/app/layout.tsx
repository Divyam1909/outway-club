import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SetupRequired } from "@/components/setup-required";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import { AssetPreloader } from "@/components/asset-preloader";
import { site } from "@/config/site";

/**
 * Photography uploaded through the admin console is served from Supabase
 * Storage, so the TCP + TLS handshake to that origin is worth paying for
 * before the first image element asks for it.
 */
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
})();

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  // Brand-level, not trip-level: per-trip titles come from the trip record in
  // generateMetadata on /trips/[slug], so retiring an escape can never leave a
  // dead trip name in the site-wide <title>.
  title: {
    default: `${site.name}: ${site.tagline}`,
    template: "%s · Outway Club",
  },
  description: site.description,
  metadataBase: new URL(site.url),
  applicationName: site.name,
  keywords: [
    "small group travel India",
    "group trips India",
    "fixed departure trips",
    "curated travel India",
    "weekend escapes India",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.legalName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: `${site.name}: ${site.tagline}`,
    description: site.description,
    images: [{ url: "/brand/og-default.png", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: ${site.tagline}`,
    description: site.description,
    images: ["/brand/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1E3D32",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();

  return (
    <html lang="en-IN" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
      </head>
      {/* Browser extensions (e.g. Grammarly) inject attributes on <body> before
          React hydrates, which would otherwise trigger a hydration mismatch. */}
      <body suppressHydrationWarning>
        {configured ? (
          <>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-pine focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-cream-100"
            >
              Skip to content
            </a>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <OrganizationJsonLd />
            <WebSiteJsonLd />
            <AssetPreloader />
          </>
        ) : (
          <SetupRequired />
        )}
      </body>
    </html>
  );
}
