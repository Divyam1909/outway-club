"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Star, Video } from "lucide-react";
import { clsx } from "clsx";

const RATING_LABELS = ["", "Not good", "Could be better", "Fine", "Really good", "Genuinely great"];

export function ReviewForm({
  tripId,
  tripTitle,
  defaultAuthorName,
}: {
  tripId: string;
  tripTitle: string;
  defaultAuthorName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const shown = hovered || rating;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, rating, authorName, title, body, videoUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Couldn't save your review. Please try again.");
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-pine-100 bg-pine-50 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-pine" size={34} />
        <h2 className="font-display text-2xl font-semibold text-pine-600">Thank you — genuinely.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-pine-600/85">
          Your review is with us. We read every one before it goes live, which usually takes a day,
          and we publish it exactly as you wrote it. We never edit a review to be kinder.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/testimonials" className="btn-primary">
            See what others said
          </Link>
          <Link href="/account" className="btn-outline">
            Back to my bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset>
        <legend className="field-label">How was {tripTitle}?</legend>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHovered(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                aria-pressed={rating === value}
                className="rounded-full p-1 transition-transform hover:scale-110 motion-reduce:hover:scale-100"
              >
                <Star
                  size={30}
                  className={clsx(
                    "transition-colors",
                    value <= shown ? "fill-gold text-gold" : "fill-transparent text-ink-300"
                  )}
                />
              </button>
            ))}
          </div>
          {shown > 0 && (
            <span className="text-sm font-medium text-ink-500">{RATING_LABELS[shown]}</span>
          )}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-author" className="field-label">
          Name to show on the review
        </label>
        <input
          id="review-author"
          required
          maxLength={80}
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          className="field"
          placeholder="Ananya I."
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Most people use a first name and last initial. Your email is never published.
        </p>
      </div>

      <div>
        <label htmlFor="review-title" className="field-label">
          Headline <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <input
          id="review-title"
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="field"
          placeholder="The Dilwara stop was worth the whole weekend"
        />
      </div>

      <div>
        <label htmlFor="review-body" className="field-label">
          Your review
        </label>
        <textarea
          id="review-body"
          required
          rows={6}
          minLength={20}
          maxLength={4000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="field"
          placeholder="What was actually good? What would you tell a friend to expect? Be honest — a critical review is more useful to us than a polite one."
        />
        <p className="mt-1.5 text-xs text-ink-400">{body.length} / 4000</p>
      </div>

      <div>
        <label htmlFor="review-video" className="field-label">
          <span className="inline-flex items-center gap-1.5">
            <Video size={15} className="text-clay" />
            Video testimonial link <span className="font-normal text-ink-400">(optional)</span>
          </span>
        </label>
        <input
          id="review-video"
          type="url"
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          className="field"
          placeholder="https://youtube.com/watch?v=…"
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Shot something on the trip? Upload it to YouTube or Vimeo and paste the link — we&apos;ll
          feature it on the testimonials page.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <div className="rounded-2xl bg-cream-300/70 px-5 py-4 text-xs leading-relaxed text-ink-500">
        Reviews are checked for authenticity and abuse only. We never remove a review for being
        critical, and we never publish one that didn&apos;t come from a real booking. You can ask us
        to take yours down at any time.
      </div>

      <button type="submit" disabled={status === "loading"} className="btn-accent w-full py-3.5 text-base">
        {status === "loading" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
