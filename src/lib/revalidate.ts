import "server-only";

import { revalidatePath } from "next/cache";
import { pingIndexNow } from "@/lib/indexnow";

/**
 * Purges the cached pages affected by an admin edit.
 *
 * Public pages are prerendered and revalidate on a timer, which is what makes
 * the site fast — but on its own it means approving a comment or publishing a
 * trip appears to do nothing for up to five minutes. To an operator that reads
 * as a broken admin console, and the obvious "fix" is to turn caching off
 * again. This is the piece that lets both things be true: cached for readers,
 * immediate for editors.
 *
 * **Purge one page, not a whole segment.** `revalidatePath("/blog/[slug]",
 * "page")` is the tempting shortcut and it is genuinely expensive: it drops
 * every prerendered page under that segment, and each one then has to be
 * rebuilt from the database on next request. Measured against the blog suite it
 * turned a 1.1 minute run into 3.4 minutes and pushed one test past its
 * timeout. Every caller here knows the slug it just wrote — pass it.
 *
 * The list pages are purged unconditionally because a title, price or date
 * change moves the cards on them, and there is exactly one of each.
 */
export type ContentScope =
  | "trip"
  | "destination"
  | "post"
  | "comment"
  | "review"
  | "promo";

/**
 * Fixed pages to purge per scope. The detail page is added separately from the
 * slug, so a caller that has lost track of it still refreshes the listings
 * rather than silently refreshing nothing.
 */
const LIST_PATHS: Record<ContentScope, string[]> = {
  // A trip's title, price and dates appear on the homepage hero, the catalogue
  // and the destination index (which carries a live trip count).
  trip: ["/", "/trips", "/destinations", "/sitemap.xml"],
  destination: ["/", "/destinations", "/trips", "/sitemap.xml"],
  post: ["/blog", "/sitemap.xml"],
  // A comment changes nothing outside the article it sits on.
  comment: [],
  // Reviews surface on the trip page, the homepage strip and /testimonials.
  review: ["/", "/testimonials"],
  // An auto-applying code changes the price printed on the homepage hero, the
  // catalogue cards and every trip page. Those are prerendered, so creating an
  // offer and not purging them means the site quietly keeps quoting the old
  // number — which reads as the promo feature being broken.
  promo: ["/", "/trips"],
};

/** Where a scope's detail page lives, for building the slug-specific path. */
const DETAIL_PREFIX: Partial<Record<ContentScope, string>> = {
  trip: "/trips",
  destination: "/destinations",
  post: "/blog",
  comment: "/blog",
  review: "/trips",
  // A code names the trips it runs on, so the caller passes each of those slugs
  // in turn — the price on a trip page is the number the offer changes.
  promo: "/trips",
};

export function revalidateContent(scope: ContentScope, slug?: string | null): void {
  const paths = [...LIST_PATHS[scope]];

  const prefix = DETAIL_PREFIX[scope];
  if (prefix && slug) paths.push(`${prefix}/${slug}`);

  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      // A failed purge must never fail the write that already succeeded. The
      // page just stays stale until its timer expires, which is the old
      // behaviour rather than a new failure.
      console.error(`[revalidate] ${path} failed:`, error);
    }
  }

  // Same event, different audience: the purge tells our own cache, this tells
  // Bing, Yandex, Seznam and Naver — and through Bing, DuckDuckGo, Ecosia and
  // a good deal of what Brave shows. Google is not in that list and does not
  // need to be; it discovers by crawling and the sitemap is what it reads.
  //
  // Deliberately not awaited. Publishing a post must not wait on, or fail
  // because of, a search engine's API.
  const indexable = paths.filter(
    (path) => !path.endsWith(".xml") && !path.startsWith("/api")
  );
  void pingIndexNow(indexable);
}

export function isContentScope(value: unknown): value is ContentScope {
  return typeof value === "string" && value in LIST_PATHS;
}
