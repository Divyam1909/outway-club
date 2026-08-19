import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * Private, transactional or single-use pages. Nothing here belongs in an index,
 * and several would leak booking references.
 *
 * `/blog/write` is deliberately NOT here even though it carries `noindex`.
 * Disallowing a page means the crawler never fetches it and therefore never
 * reads the noindex — so a URL linked from /blog can still surface as a bare
 * result with no title. Letting it be crawled is what actually gets it dropped,
 * and there is nothing private to protect: the private half of that page only
 * renders for a signed-in reader, and a crawler never is one.
 */
const DISALLOW = [
  "/admin",
  "/admin/",
  "/account",
  "/api/",
  "/booking/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
];

/**
 * Crawlers that get an explicit rule of their own.
 *
 * The wildcard rule below already allows all of these — a bot with no named
 * block falls through to `*` and is let in. They are named anyway because
 * several of the non-Google engines behave better with an explicit entry:
 *
 *   - Bingbot backs off hard on ambiguity, and it is the index behind Bing,
 *     DuckDuckGo, Ecosia, Yahoo and a large share of what Brave shows before
 *     its own index has seen a site. It also honours `crawl-delay`, which we
 *     deliberately do not set — this site is eleven pages and a CDN.
 *   - Bravebot is Brave's own crawler. Brave Search runs a genuinely
 *     independent index, and the only way into it is being crawled; there is no
 *     submission form. An explicit allow plus a sitemap is the whole lever.
 *   - DuckDuckBot crawls for DDG's own results alongside its Bing licence.
 *   - Yandex and Seznam are the two other engines IndexNow reaches, so being
 *     crawlable by them makes the ping below worth sending.
 *   - Applebot is what Safari, Siri and Spotlight suggestions read.
 *
 * The AI crawlers are allowed on purpose rather than by omission: a small
 * operator's problem is being unknown, not being quoted.
 */
const NAMED_CRAWLERS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Bravebot",
  "DuckDuckBot",
  "Yandex",
  "Applebot",
  "Applebot-Extended",
  "SeznamBot",
  "Slurp",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Telegrambot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Amazonbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...NAMED_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
