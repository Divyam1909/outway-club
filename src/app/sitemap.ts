import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { site } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/trips", priority: 0.9, changeFrequency: "daily" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/testimonials", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.4, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  if (!isSupabaseConfigured()) return entries;

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

    for (const trip of trips ?? []) {
      entries.push({
        url: `${site.url}/trips/${trip.slug}`,
        lastModified: new Date(trip.created_at),
        changeFrequency: "weekly",
        priority: 0.95,
      });
    }

    for (const destination of destinations ?? []) {
      entries.push({
        url: `${site.url}/destinations/${destination.slug}`,
        lastModified: new Date(destination.created_at),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    for (const post of posts ?? []) {
      entries.push({
        url: `${site.url}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch (error) {
    // A database blip must not produce an invalid sitemap — serve the static
    // routes rather than a 500.
    console.error("[sitemap] dynamic routes unavailable:", error);
  }

  return entries;
}
