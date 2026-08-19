"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { messageFromResponse } from "@/lib/error-messages";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { site } from "@/config/site";
import type { Destination } from "@/lib/types";

const INPUT =
  "w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-pine focus:outline-none";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-700";

/** Matches MIN_SUBMISSION_CHARACTERS on the server. */
const MIN_CHARACTERS = 900;

/**
 * Write something and send it to us.
 *
 * The same editor the staff use, on purpose. A separate, simpler surface for
 * contributors would produce markup the article stylesheet has never seen, and
 * the first thing anyone would notice about reader pieces is that they look
 * broken. One editor, one sanitiser, one set of styles — which is what makes
 * "approved" and "renders correctly" the same event.
 *
 * The counter is not decoration: the server refuses anything under the same
 * threshold, and finding that out after writing for twenty minutes and pressing
 * send would be the worst moment to learn it.
 */
export function SubmissionForm({
  destinations,
  defaultAuthorName,
}: {
  destinations: Pick<Destination, "id" | "name">[];
  defaultAuthorName: string;
}) {
  const [mountedAt] = useState(() => Date.now());

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverCaption, setCoverCaption] = useState("");
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorRole, setAuthorRole] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [trap, setTrap] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const tags = tagsText
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  // Rough, and rough is the point — it tracks the server's plain-text measure
  // closely enough to be useful without re-implementing the sanitiser here.
  const characters = contentHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  const longEnough = characters >= MIN_CHARACTERS;

  async function submit() {
    setError(null);

    if (title.trim().length < 6) {
      setError("Give your piece a title first.");
      return;
    }
    if (!longEnough) {
      setError(
        `There isn't quite enough here yet — we're after a proper piece, about ${Math.round(
          MIN_CHARACTERS / 5
        )} words or more.`
      );
      return;
    }
    if (!agreed) {
      setError("Please confirm the piece is yours before sending it.");
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/blog/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle,
          excerpt,
          contentHtml,
          coverImage,
          coverCaption,
          authorName,
          authorRole,
          tags,
          destinationId: destinationId || null,
          formStartedAt: mountedAt,
          [HONEYPOT_FIELD]: trap,
        }),
      });

      if (!response.ok) {
        setError(
          await messageFromResponse(
            response,
            `We couldn't send that just now. Your writing is still on this page — try again, or email us at ${site.email}.`
          )
        );
        setStatus("idle");
        return;
      }

      setStatus("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      // A whole article is sitting in this form. Never navigate away and never
      // leave the button spinning.
      console.error("[submission-form] send failed:", caught);
      setStatus("idle");
      setError(
        "We couldn't reach the server, so nothing was sent. Your writing is still on this page — check your connection and press send again."
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6 sm:p-8">
        <CheckCircle2 className="mb-4 text-pine" size={30} aria-hidden="true" />
        <h2 className="heading-fluid text-2xl text-pine-600">It&apos;s with us.</h2>
        <p className="mt-3 max-w-xl leading-relaxed text-pine-600/85">
          <strong>{title}</strong> is in the queue, and a confirmation is on its way to your inbox.
          It isn&apos;t public and won&apos;t be until one of us has read it properly.
        </p>
        <ol className="mt-6 space-y-3 text-sm leading-relaxed text-pine-600/85">
          {[
            "A person here reads it — not a filter, and not a queue that forgets about you.",
            "We write back either way. If we're publishing, you get the link. If we're not, you get a reason.",
            "We might fix a typo or tighten a headline. We won't change what you meant.",
          ].map((line, index) => (
            <li key={line} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine text-xs font-semibold text-cream-100">
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/blog" className="btn-primary flex-1">
            Read the Journal
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-outline flex-1"
          >
            Write another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="space-y-8"
    >
      {/* Hidden from people, irresistible to form bots. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={HONEYPOT_FIELD}>Company website</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
        />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="submission-title" className={LABEL}>
              Title
            </label>
            <input
              id="submission-title"
              className={`${INPUT} !text-lg font-display font-semibold`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Three days in Udaipur, and the one I got wrong"
              maxLength={160}
              required
            />
          </div>

          <div>
            <label htmlFor="submission-subtitle" className={LABEL}>
              One line under the title <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="submission-subtitle"
              className={INPUT}
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              maxLength={220}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="heading-sm text-lg text-ink">The piece</h2>
          <p className={longEnough ? "text-xs text-pine" : "text-xs text-ink-500"}>
            {longEnough
              ? `About ${Math.round(characters / 5)} words — long enough`
              : `About ${Math.round(characters / 5)} of ${Math.round(MIN_CHARACTERS / 5)} words`}
          </p>
        </div>
        <RichTextEditor value={contentHtml} onChange={setContentHtml} resetKey="submission" />
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          Write it the way you&apos;d tell it. Specifics beat adjectives — the name of the place you
          ate, what it cost, what you&apos;d skip next time.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">A photograph</h2>
        <ImageUploader
          label="Cover image"
          hint="Yours, ideally. It sits above the piece and in every link preview. Landscape, at least 1600px wide."
          value={coverImage ? [coverImage] : []}
          onChange={(next) => setCoverImage(next[0] ?? "")}
          bucket="blog-images"
          pathPrefix="submissions"
        />
        <div className="mt-4">
          <label htmlFor="submission-caption" className={LABEL}>
            Caption <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <input
            id="submission-caption"
            className={INPUT}
            value={coverCaption}
            onChange={(event) => setCoverCaption(event.target.value)}
            maxLength={200}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">Your byline</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="submission-author" className={LABEL}>
              Name as it should appear
            </label>
            <input
              id="submission-author"
              className={INPUT}
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div>
            <label htmlFor="submission-role" className={LABEL}>
              One line about you <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="submission-role"
              className={INPUT}
              value={authorRole}
              onChange={(event) => setAuthorRole(event.target.value)}
              placeholder="Travelled on Escape 001"
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="submission-tags" className={LABEL}>
              Topics <span className="font-normal text-ink-500">(comma separated)</span>
            </label>
            <input
              id="submission-tags"
              className={INPUT}
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="udaipur, monsoon, solo travel"
            />
          </div>
          <div>
            <label htmlFor="submission-destination" className={LABEL}>
              About a place <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <select
              id="submission-destination"
              className={INPUT}
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
            >
              <option value="">Not about one in particular</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="submission-excerpt" className={LABEL}>
            Summary for the Journal grid{" "}
            <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="submission-excerpt"
            className={INPUT}
            rows={2}
            maxLength={320}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="Leave it blank and we'll use your opening lines."
          />
        </div>
      </section>

      <label
        htmlFor="submission-agreed"
        className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream-300 p-4"
      >
        <input
          id="submission-agreed"
          type="checkbox"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-pine"
        />
        <span className="text-sm leading-relaxed text-ink-700">
          This is my own writing and my own photograph, or I have the right to give them to you. I
          understand a person reads it before anything is published, that you may edit it lightly,
          and that you might not run it at all. Keeping the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="font-medium text-pine underline underline-offset-2"
          >
            terms
          </Link>{" "}
          and the{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="font-medium text-pine underline underline-offset-2"
          >
            privacy policy
          </Link>{" "}
          in mind.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border bg-cream-100/95 px-1 py-4 backdrop-blur-sm">
        <button type="submit" disabled={status === "sending"} className="btn-accent btn-lg">
          <Send size={16} /> {status === "sending" ? "Sending…" : "Send it to us"}
        </button>
        <p className="text-xs text-ink-500">
          Nothing goes live until we&apos;ve read it. You&apos;ll hear back either way.
        </p>
      </div>
    </form>
  );
}
