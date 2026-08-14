"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Save, Send, X } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { messageFromResponse } from "@/lib/error-messages";
import { slugify } from "@/lib/utils";
import { site } from "@/config/site";
import type { BlogPost, Destination, Trip } from "@/lib/types";

const INPUT =
  "w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-pine focus:outline-none";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-700";

/**
 * Compose / edit a journal post.
 *
 * Unlike the trip editor, this saves through /api/admin/blog/posts rather than
 * straight to Supabase from the browser: the article body has to pass the HTML
 * sanitiser, and that only counts if it runs somewhere the author can't skip.
 */
export function PostEditorForm({
  post,
  destinations,
  trips,
  defaultAuthorName,
}: {
  post?: BlogPost;
  destinations: Pick<Destination, "id" | "name">[];
  trips: Pick<Trip, "id" | "title">[];
  defaultAuthorName: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [contentHtml, setContentHtml] = useState(post?.content_html ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [coverCaption, setCoverCaption] = useState(post?.cover_caption ?? "");
  const [authorName, setAuthorName] = useState(post?.author_name ?? defaultAuthorName);
  const [authorRole, setAuthorRole] = useState(post?.author_role ?? "");
  const [tagsText, setTagsText] = useState((post?.tags ?? []).join(", "));
  const [destinationId, setDestinationId] = useState(post?.destination_id ?? "");
  const [tripId, setTripId] = useState(post?.trip_id ?? "");
  const [isFeatured, setIsFeatured] = useState(post?.is_featured ?? false);
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<null | "draft" | "published">(null);

  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  async function save(status: "draft" | "published") {
    setError(null);
    setSaving(status);

    const payload = {
      title,
      slug: slug || slugify(title),
      subtitle,
      excerpt,
      contentHtml,
      coverImage,
      coverCaption,
      authorName,
      authorRole,
      tags,
      destinationId: destinationId || null,
      tripId: tripId || null,
      status,
      isFeatured,
      seoTitle,
      seoDescription,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/blog/posts/${post!.id}` : "/api/admin/blog/posts",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      setSaving(null);

      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't save the post. Please try again."));
        return;
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (caught) {
      // A whole article is sitting in this form. Never navigate away and never
      // leave the button spinning — say what happened and keep the draft on
      // screen so nothing typed is lost.
      console.error("[post-editor] save failed:", caught);
      setSaving(null);
      setError(
        "We couldn't reach the server, so nothing was saved. Your writing is still on this page, check your connection and press save again."
      );
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(post?.status === "published" ? "published" : "draft");
      }}
      className="space-y-8"
    >
      {/* --- Headline ------------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="post-title" className={LABEL}>
              Title
            </label>
            <input
              id="post-title"
              className={`${INPUT} !text-lg font-display font-semibold`}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              placeholder="Why we put Mount Abu after Udaipur, not before"
              required
            />
          </div>

          <div>
            <label htmlFor="post-subtitle" className={LABEL}>
              Standfirst <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="post-subtitle"
              className={INPUT}
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder="One line under the headline that makes someone keep reading."
              maxLength={220}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-slug" className={LABEL}>
                Web address
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border px-3.5 focus-within:border-pine">
                <span className="shrink-0 text-sm text-ink-500">/blog/</span>
                <input
                  id="post-slug"
                  className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugTouched(true);
                  }}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="post-tags" className={LABEL}>
                Topics <span className="font-normal text-ink-500">(comma separated, max 8)</span>
              </label>
              <input
                id="post-tags"
                className={INPUT}
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="udaipur, monsoon, planning"
              />
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.slice(0, 8).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cream-300 px-2.5 py-1 text-[11px] font-medium capitalize text-ink-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Body ----------------------------------------------------------- */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="heading-sm text-lg text-ink">The article</h2>
          <p className="text-xs text-ink-500">
            Styled exactly as readers will see it
          </p>
        </div>
        <RichTextEditor value={contentHtml} onChange={setContentHtml} resetKey={post?.id ?? "new"} />
      </section>

      {/* --- Cover ---------------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">Cover photo</h2>
        <ImageUploader
          label="Cover image"
          hint="Sits above the article, on the journal grid and in every link preview. Landscape, at least 1600px wide."
          value={coverImage ? [coverImage] : []}
          onChange={(next) => setCoverImage(next[0] ?? "")}
          bucket="blog-images"
        />
        <div className="mt-4">
          <label htmlFor="post-cover-caption" className={LABEL}>
            Photo caption <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <input
            id="post-cover-caption"
            className={INPUT}
            value={coverCaption}
            onChange={(event) => setCoverCaption(event.target.value)}
            placeholder="Lake Pichola at 6am, before the boats start."
            maxLength={200}
          />
        </div>
      </section>

      {/* --- Attribution & links -------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">Byline &amp; links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="post-author" className={LABEL}>
              Author name
            </label>
            <input
              id="post-author"
              className={INPUT}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="post-author-role" className={LABEL}>
              Author role <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="post-author-role"
              className={INPUT}
              value={authorRole}
              onChange={(event) => setAuthorRole(event.target.value)}
              placeholder="Trip planner, Outway Club"
            />
          </div>
          <div>
            <label htmlFor="post-destination" className={LABEL}>
              About a destination <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <select
              id="post-destination"
              className={INPUT}
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
            >
              <option value="">Not tied to one</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="post-trip" className={LABEL}>
              About a trip <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <select
              id="post-trip"
              className={INPUT}
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
            >
              <option value="">Not tied to one</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-500">
              Adds a &ldquo;see the trip&rdquo; card at the end of the article.
            </p>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          Pin to the top of the journal
        </label>
      </section>

      {/* --- Search appearance ---------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1.5 heading-sm text-lg text-ink">Search appearance</h2>
        <p className="mb-5 text-sm text-ink-500">
          Leave these blank and the title and summary below are used instead.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="post-excerpt" className={LABEL}>
              Summary
            </label>
            <textarea
              id="post-excerpt"
              className={INPUT}
              rows={2}
              maxLength={320}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Shown on the journal grid. If you leave it blank we'll use the opening of the article."
            />
            <p className="mt-1.5 text-xs text-ink-500">{excerpt.length} / 320</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-seo-title" className={LABEL}>
                Search title override
              </label>
              <input
                id="post-seo-title"
                className={INPUT}
                maxLength={70}
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
              />
              <p className="mt-1.5 text-xs text-ink-500">{seoTitle.length} / 70</p>
            </div>
            <div>
              <label htmlFor="post-seo-description" className={LABEL}>
                Search description override
              </label>
              <input
                id="post-seo-description"
                className={INPUT}
                maxLength={180}
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
              />
              <p className="mt-1.5 text-xs text-ink-500">{seoDescription.length} / 180</p>
            </div>
          </div>

          {/* Live preview of the Google result. */}
          <div className="rounded-xl border border-border bg-cream-300 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              How this looks in search
            </p>
            <p className="truncate text-xs text-ink-500">{site.host} › blog › {slug || "…"}</p>
            <p className="mt-0.5 truncate text-[17px] text-[#1a0dab]">
              {seoTitle || title || "Post title"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-500">
              {seoDescription || excerpt || "A summary of the post appears here."}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      {/* --- Actions --------------------------------------------------------- */}
      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border bg-cream-300 px-1 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => save("published")}
          disabled={saving !== null}
          className="btn-primary px-6 py-3"
        >
          <Send size={15} />
          {saving === "published"
            ? "Publishing…"
            : post?.status === "published"
              ? "Save & keep live"
              : "Publish"}
        </button>

        <button
          type="button"
          onClick={() => save("draft")}
          disabled={saving !== null}
          className="btn-outline px-5 py-3"
        >
          <Save size={15} />
          {saving === "draft" ? "Saving…" : post?.status === "published" ? "Unpublish to draft" : "Save draft"}
        </button>

        {post?.status === "published" && (
          <Link href={`/blog/${post.slug}`} target="_blank" className="btn-ghost px-4 py-3">
            <Eye size={15} /> View live <ExternalLink size={13} />
          </Link>
        )}

        <Link href="/admin/blog" className="btn-ghost ml-auto px-4 py-3 text-ink-500">
          <X size={15} /> Cancel
        </Link>
      </div>
    </form>
  );
}
