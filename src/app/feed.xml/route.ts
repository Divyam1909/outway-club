import { getPublishedPosts } from "@/lib/blog";
import { site } from "@/config/site";

export const revalidate = 3600;

/**
 * An RSS feed for the Journal.
 *
 * Not nostalgia. A feed is a discovery surface the sitemap isn't: readers
 * subscribe in Feedly and Inoreader, aggregators and newsletter tools poll it,
 * and several non-Google crawlers treat an `application/rss+xml` link in the
 * head as a strong signal that a site publishes regularly and is worth
 * recrawling. For a small operator trying to appear anywhere other than Google,
 * that is worth more than the twenty lines it costs.
 *
 * Full-text is deliberately not published — `description` carries the excerpt
 * and the link goes to the article, so the canonical version stays the one on
 * our own domain.
 */
export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];

  try {
    posts = await getPublishedPosts({ limit: 30 });
  } catch (error) {
    // A database blip should serve an empty-but-valid feed, not a 500. A feed
    // reader that gets a 500 backs off; one that gets valid XML with no new
    // items simply tries again later.
    console.error("[feed] posts unavailable:", error);
  }

  const updated = posts[0]?.updated_at ?? new Date().toISOString();

  const items = posts
    .map((post) => {
      const url = `${site.url}/blog/${post.slug}`;
      const published = post.published_at ?? post.created_at;

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(published).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
      <dc:creator>${escapeXml(post.author_name)}</dc:creator>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>The Outway Journal</title>
    <link>${site.url}/blog</link>
    <description>Field notes from the road: destination guides, honest trip write-ups and the reasoning behind how we plan an Outway escape.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
