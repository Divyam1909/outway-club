import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { BlogComment, BlogCommentWithPost, BlogPost } from "@/lib/types";

// Same contract as src/lib/data.ts: every read falls back to empty/null when
// Supabase isn't configured, so route segments never throw while the setup
// guard decides what to render.

const POST_COLUMNS =
  "*, destination:destinations(name, slug), trip:trips(title, slug, hero_image)";

/** Published posts, newest first. `tag` filters on the tags array. */
export async function getPublishedPosts(options: { tag?: string; limit?: number } = {}): Promise<
  BlogPost[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();

  let query = supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  // tags is jsonb, so containment needs a JSON array literal — handing
  // supabase-js a JS array would serialise to the Postgres `{a,b}` form
  // instead, which silently matches nothing against jsonb.
  if (options.tag) query = query.contains("tags", JSON.stringify([options.tag]));
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as BlogPost[]) ?? [];
}

/** The post pinned to the top of /blog — newest featured, else newest. */
export async function getFeaturedPost(): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as BlogPost) ?? null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as BlogPost) ?? null;
}

/** Approved comments on a post, oldest first so a thread reads top to bottom. */
export async function getApprovedComments(postId: string): Promise<BlogComment[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("blog_comments")
    .select("*")
    .eq("post_id", postId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as BlogComment[]) ?? [];
}

/**
 * Posts to read next: same destination first, then anything else recent.
 * Never returns the post being read.
 */
export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("status", "published")
    .neq("id", post.id)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(12);

  if (error) throw error;

  const candidates = (data as unknown as BlogPost[]) ?? [];
  const tags = new Set(post.tags ?? []);

  // Score by shared destination, then shared tags — a stable sort keeps
  // recency as the tie-breaker.
  const scored = candidates.map((candidate) => {
    let score = 0;
    if (post.destination_id && candidate.destination_id === post.destination_id) score += 3;
    score += (candidate.tags ?? []).filter((tag) => tags.has(tag)).length;
    return { candidate, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/**
 * Slugs for `generateStaticParams`. Never throws — see the note on
 * `getPublishedTripSlugs` in src/lib/data.ts.
 */
export async function getPublishedPostSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select("slug")
      .eq("status", "published");
    return (data ?? []).map((row) => row.slug as string);
  } catch (error) {
    console.error("[blog] post slugs unavailable at build:", error);
    return [];
  }
}

/** Every tag in use on published posts, with counts, most used first. */
export async function getPostTags(): Promise<{ tag: string; count: number }[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("tags")
    .eq("status", "published");

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of (data as { tags: string[] }[]) ?? []) {
    for (const tag of row.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Bumps the view counter. Fire-and-forget: a failed count must never break
 * the article render, and it runs through the service role because readers
 * have no update rights on blog_posts.
 */
export async function recordPostView(slug: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await createAdminClient().rpc("increment_post_views", { p_slug: slug });
  } catch (error) {
    console.error("[blog] view count failed:", error);
  }
}

// ---------------------------------------------------------------------------
// Admin console queries — drafts included.
// ---------------------------------------------------------------------------

export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BlogPost[]) ?? [];
}

export async function getPostByIdForAdmin(id: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as BlogPost) ?? null;
}

/** Every comment, pending first, so moderation has an obvious starting point. */
export async function getCommentsForAdmin(): Promise<BlogCommentWithPost[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_comments")
    .select("*, post:blog_posts(title, slug)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BlogCommentWithPost[]) ?? [];
}

export async function getPendingCommentCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();

  const { count } = await supabase
    .from("blog_comments")
    .select("*", { count: "exact", head: true })
    .eq("is_approved", false);

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Reader submissions
// ---------------------------------------------------------------------------

/** Everything waiting on a decision, oldest first — a queue, not a feed. */
export async function getSubmissionsForAdmin(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data as unknown as BlogPost[]) ?? [];
}

export async function getPendingSubmissionCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();

  const { count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "submitted");

  return count ?? 0;
}

/**
 * One writer's own pieces, at whatever status.
 *
 * Read through the cookie-bound client rather than the service role on
 * purpose: RLS already says "your own rows, or published ones", so the
 * database enforces the boundary rather than this query remembering to. Pass
 * the wrong id and you get nothing back, not somebody else's drafts.
 */
export async function getMySubmissions(userId: string): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_COLUMNS)
    .eq("author_id", userId)
    .eq("source", "community")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as BlogPost[]) ?? [];
}
