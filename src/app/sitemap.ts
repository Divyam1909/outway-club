import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { site } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const revalidate = 3600;

/**
 * `lastModified` is omitted rather than guessed.
 *
 * This route used to stamp `new Date()` on every static entry, which meant each
 * hourly regeneration told Google that all eleven pages had changed in the last
 * hour. Google's documented response to lastmod values it finds unreliable is to
 * stop trusting the field for the whole site — which would have thrown away the
 * genuine dates on the trip and Journal entries along with the invented ones.
 *
 * So a route only carries a date when a real one exists:
 *
 *   - `collection` pages take the newest date in the thing they list, because
 *     that is exactly when the page's content last changed.
 *   - Detail pages take their own row's date.
 *   - Everything else — /about, /terms, the policy pages — carries no date at
 *     all. The field is optional, and omitting it is what Google asks for when
 *     the answer isn't known. They change when someone edits the file, which
 *     the database cannot see.
 */
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  /** Which collection's newest row dates this page, if any. */
  collection?: "trips" | "destinations" | "posts" | "all";
}[] = [
  { path: "/", priority: 1, changeFrequency: "daily", collection: "all" },
  { path: "/trips", priority: 0.9, changeFrequency: "daily", collection: "trips" },
  {
    path: "/destinations",
    priority: 0.8,
    changeFrequency: "weekly",
    collection: "destinations",
  },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly", collection: "posts" },
  { path: "/testimonials", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.4, changeFrequency: "yearly" },
];

/** Newest of a set of timestamps, or undefined if there are none to compare. */
function newest(dates: Date[]): Date | undefined {
  if (dates.length === 0) return undefined;
  return dates.reduce((latest, date) => (date > latest ? date : latest));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = (dates: Partial<Record<"trips" | "destinations" | "posts" | "all", Date>>) =>
    STATIC_ROUTES.map((route) => ({
      url: `${site.url}${route.path}`,
      ...(route.collection && dates[route.collection]
        ? { lastModified: dates[route.collection] }
        : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  if (!isSupabaseConfigured()) return staticEntries({});

  // A plain anon client rather than the cookie-bound server client: the
  // sitemap has no user context, and reading cookies would opt this route out
  // of static generation and caching entirely.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    const [{ data: trips }, { data: destinations }, { data: posts }] = await Promise.all([
      supabase.from("trips").select("slug, created_at").eq("is_published", true),
      supabase.from("destinations").select("slug, created_at"),
      supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("status", "published"),
    ]);

    // trips and destinations only carry created_at — there is no updated_at
    // column on either table, so an edit to a live trip does not move its date.
    // Still an honest answer, and a stale-but-true date is worth more to Google
    // than a fresh invented one.
    const tripDates = (trips ?? []).map((trip) => new Date(trip.created_at));
    const destinationDates = (destinations ?? []).map((d) => new Date(d.created_at));
    const postDates = (posts ?? []).map((post) => new Date(post.updated_at));

    const entries = staticEntries({
      trips: newest(tripDates),
      destinations: newest(destinationDates),
      posts: newest(postDates),
      all: newest([...tripDates, ...destinationDates, ...postDates]),
    });

    for (const [index, trip] of (trips ?? []).entries()) {
      entries.push({
        url: `${site.url}/trips/${trip.slug}`,
        lastModified: tripDates[index],
        changeFrequency: "weekly",
        priority: 0.95,
      });
    }

    for (const [index, destination] of (destinations ?? []).entries()) {
      entries.push({
        url: `${site.url}/destinations/${destination.slug}`,
        lastModified: destinationDates[index],
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const [index, post] of (posts ?? []).entries()) {
      entries.push({
        url: `${site.url}/blog/${post.slug}`,
        lastModified: postDates[index],
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    return entries;
  } catch (error) {
    // A database blip must not produce an invalid sitemap — serve the static
    // routes rather than a 500. Undated, because the dates lived in the query
    // that just failed.
    console.error("[sitemap] dynamic routes unavailable:", error);
    return staticEntries({});
  }
}
