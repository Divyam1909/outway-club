import { htmlToPlainText, readingMinutes, sanitizeHtml } from "@/lib/sanitize-html";
import { sanitizeText } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

/**
 * Turns whatever the blog editor posted into a row the database will accept.
 *
 * Shared by the create and update handlers so a draft and a published post can
 * never be validated by two subtly different sets of rules. Anything derived —
 * the excerpt, reading time, the slug — is computed here rather than trusted
 * from the client.
 */

export interface BlogPostPayload {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  content_html: string;
  cover_image: string | null;
  cover_caption: string | null;
  author_name: string;
  author_role: string | null;
  tags: string[];
  destination_id: string | null;
  trip_id: string | null;
  reading_minutes: number;
  status: "draft" | "published";
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export type PayloadResult = { payload: BlogPostPayload } | { error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalUuid(value: unknown): string | null {
  const text = sanitizeText(value, 64);
  return UUID_PATTERN.test(text) ? text : null;
}

function optionalUrl(value: unknown): string | null {
  const text = sanitizeText(value, 1000);
  if (!text) return null;
  if (text.startsWith("/")) return text;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const entry of value) {
    const tag = sanitizeText(entry, 40).toLowerCase();
    if (tag.length >= 2) seen.add(tag);
    if (seen.size >= 8) break;
  }
  return [...seen];
}

export function buildBlogPostPayload(body: Record<string, unknown>): PayloadResult {
  const title = sanitizeText(body.title, 160);
  if (title.length < 3) {
    return { error: "Give the post a title." };
  }

  const contentHtml = sanitizeHtml(body.contentHtml);
  const plain = htmlToPlainText(contentHtml);

  const status = body.status === "published" ? "published" : "draft";

  // A draft can be half-written; a published post cannot.
  if (status === "published" && plain.length < 120) {
    return { error: "There isn't enough written here to publish yet. Save it as a draft instead." };
  }

  const slug = slugify(sanitizeText(body.slug, 120) || title).slice(0, 120);
  if (!slug) {
    return { error: "That title doesn't produce a usable web address. Set the slug by hand." };
  }

  // An empty excerpt is filled from the opening of the article rather than
  // left blank — it's what the cards and the meta description use.
  const excerpt = sanitizeText(body.excerpt, 320) || plain.slice(0, 220).trim();

  return {
    payload: {
      slug,
      title,
      subtitle: sanitizeText(body.subtitle, 220) || null,
      excerpt,
      content_html: contentHtml,
      cover_image: optionalUrl(body.coverImage),
      cover_caption: sanitizeText(body.coverCaption, 200) || null,
      author_name: sanitizeText(body.authorName, 80) || "Outway Club",
      author_role: sanitizeText(body.authorRole, 80) || null,
      tags: parseTags(body.tags),
      destination_id: optionalUuid(body.destinationId),
      trip_id: optionalUuid(body.tripId),
      reading_minutes: readingMinutes(contentHtml),
      status,
      is_featured: body.isFeatured === true,
      seo_title: sanitizeText(body.seoTitle, 70) || null,
      seo_description: sanitizeText(body.seoDescription, 180) || null,
    },
  };
}
