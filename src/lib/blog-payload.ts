import { htmlToPlainText, readingMinutes, sanitizeHtml } from "@/lib/sanitize-html";
import type { PostStatus } from "@/lib/types";
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
  /**
   * Widened to the full set so `SubmissionPayload` can narrow it to
   * `submitted`. `buildBlogPostPayload` still only ever produces draft or
   * published — an editor's save is not a review decision, and the two paths
   * that *are* (the review route and the editor's publish button) go through
   * the same notifier in @/lib/blog-review.
   */
  status: PostStatus;
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

// ---------------------------------------------------------------------------
// Reader submissions
// ---------------------------------------------------------------------------

/**
 * The same article, written by someone who does not work here.
 *
 * A separate builder rather than a flag on the one above, because the
 * difference is not a field or two — it is which fields a writer is allowed to
 * decide at all. `status` is forced to `submitted`, so there is no request body
 * that publishes anything. `is_featured` is forced off, so a submission cannot
 * pin itself to the top of the Journal. The slug is derived, never accepted, so
 * a submission cannot be aimed at an existing post's URL. And the byline comes
 * from the signed-in account, not from the payload.
 *
 * Everything that is left — the writing, the photograph, the topics — is the
 * writer's, and an editor can change any of it before it goes live.
 */
export interface SubmissionPayload extends BlogPostPayload {
  status: "submitted";
  source: "community";
  submitter_email: string;
}

/** A submission has to be an article, not a paragraph. */
export const MIN_SUBMISSION_CHARACTERS = 900;

export function buildSubmissionPayload(
  body: Record<string, unknown>,
  author: { id: string; email: string; name: string }
): { payload: SubmissionPayload } | { error: string } {
  const title = sanitizeText(body.title, 160);
  if (title.length < 6) {
    return { error: "Give your piece a title — at least a few words." };
  }

  const contentHtml = sanitizeHtml(body.contentHtml);
  const plain = htmlToPlainText(contentHtml);

  if (plain.length < MIN_SUBMISSION_CHARACTERS) {
    return {
      error: `There isn't enough here to send yet — we're looking for a proper piece, around ${Math.round(
        MIN_SUBMISSION_CHARACTERS / 5
      )} words or more. You have about ${Math.round(plain.length / 5)}.`,
    };
  }

  const slug = slugify(title).slice(0, 110);
  if (!slug) {
    return { error: "That title doesn't produce a usable web address. Try wording it differently." };
  }

  const excerpt = sanitizeText(body.excerpt, 320) || plain.slice(0, 220).trim();
  const authorName = sanitizeText(body.authorName, 80) || author.name || "Outway reader";

  return {
    payload: {
      slug,
      title,
      subtitle: sanitizeText(body.subtitle, 220) || null,
      excerpt,
      content_html: contentHtml,
      cover_image: optionalUrl(body.coverImage),
      cover_caption: sanitizeText(body.coverCaption, 200) || null,
      author_name: authorName,
      author_role: sanitizeText(body.authorRole, 80) || null,
      tags: parseTags(body.tags),
      destination_id: optionalUuid(body.destinationId),
      trip_id: optionalUuid(body.tripId),
      reading_minutes: readingMinutes(contentHtml),
      // Not negotiable, and deliberately not read from the body.
      status: "submitted",
      source: "community",
      is_featured: false,
      seo_title: null,
      seo_description: null,
      submitter_email: author.email,
    },
  };
}
