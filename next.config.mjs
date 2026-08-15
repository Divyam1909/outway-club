import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Content-Security-Policy.
 *
 * Deliberately not a maximal policy. Next.js injects inline bootstrap scripts,
 * and locking those down means threading a per-request nonce through the whole
 * app — worth doing eventually, but a mistake there breaks Razorpay's checkout
 * silently, and a broken checkout costs more than this policy buys.
 *
 * What it does buy, with no breakage risk: the page can't be framed by an
 * attacker, forms can't post off-site, <base> can't be hijacked to re-point
 * every relative URL, and plugins are off. Those close the clickjacking and
 * form-hijack routes, which are the ones that matter for a payment page.
 *
 * The allowed hosts are: Razorpay (checkout script + the iframe it opens),
 * Supabase (REST, auth, realtime, storage), and Cloudflare Web Analytics.
 * Fonts are self-hosted by next/font at build time, so no font CDN is needed.
 *
 * Cloudflare injects its analytics beacon into every response at the edge, so
 * the script arrives whether or not this policy allows it — omitting the host
 * does not prevent the request, it only guarantees the browser blocks it and
 * logs a CSP violation on every page load while the analytics silently collect
 * nothing. Two hosts are needed and they are not the same one: the script is
 * served from `static.cloudflareinsights.com`, and it POSTs its beacon to
 * `cloudflareinsights.com/cdn-cgi/rum`. Allow only the script host and the
 * dashboard stays empty.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `script-src 'self' 'unsafe-inline' ${
    process.env.NODE_ENV === "development" ? "'unsafe-eval' " : ""
  }https://checkout.razorpay.com https://*.razorpay.com https://static.cloudflareinsights.com`,
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://cloudflareinsights.com",
  "frame-src https://*.razorpay.com",
]
  .join("; ")
  .concat(";");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,

  // There is a stray package-lock.json in the home directory above this one.
  // Left alone, Next walks up, finds it, and treats C:\Users\divya as the
  // workspace root — which means file tracing looks for the app's files in the
  // wrong place and a deployed build can come out missing pieces. Pin the root
  // to this project.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),

  images: {
    // Supabase Storage is where real trip photography lives once uploaded
    // through the admin trip editor. Local /public/images paths need no entry.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [400, 640, 828, 1080, 1200, 1600, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30,

    // Next's image optimizer is a Vercel platform feature, not part of Next
    // itself. On Cloudflare Workers there is no free equivalent, and leaving
    // this false there does not degrade gracefully — every <Image> requests a
    // /_next/image route that cannot serve it. Set CF_BUILD=1 in the Cloudflare
    // build only, so the Vercel deploy keeps optimising while both run.
    //
    // What stops this being a straight downgrade is that uploads are now
    // downscaled in the browser first (src/lib/resize-image.ts), so the stored
    // original is already roughly what we would have served anyway. Photos
    // uploaded BEFORE that change are still full size — worth re-uploading the
    // handful on the homepage and the live trip.
    unoptimized: process.env.CF_BUILD === "1",
  },

  async redirects() {
    return [
      // Retired during the Escape 001 relaunch — everything lives on /trips now.
      { source: "/group-trips", destination: "/trips", permanent: true },
      { source: "/escapes", destination: "/trips", permanent: true },
      { source: "/reviews", destination: "/testimonials", permanent: true },
      // Slugs moved from edition-numbered to destination-led when the site
      // became a catalogue — nobody searches "escape 001".
      {
        source: "/trips/escape-001-udaipur-mount-abu",
        destination: "/trips/udaipur-mount-abu",
        permanent: true,
      },
      { source: "/cancellation-policy", destination: "/refund-policy", permanent: true },
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
