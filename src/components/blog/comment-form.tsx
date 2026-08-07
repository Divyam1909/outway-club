"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { clsx } from "clsx";
import { HONEYPOT_FIELD } from "@/lib/rate-limit";
import { messageFromResponse, networkError } from "@/lib/error-messages";

const RATING_LABELS = ["", "Not for me", "Some of it landed", "Useful", "Really good", "Sending this to a friend"];

/**
 * Reader response to a journal post: a comment, optionally with a star rating.
 *
 * No account required — the rating is about the writing, not a verified trip,
 * so gating it behind sign-up would just mean nobody ever leaves one. Spam is
 * handled by the honeypot, the rate limiter and moderation instead.
 */
export function CommentForm({
  postId,
  defaultAuthorName,
  defaultAuthorEmail,
}: {
  postId: string;
  defaultAuthorName: string;
  defaultAuthorEmail: string;
}) {
  const mountedAt = useRef(Date.now());
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorEmail, setAuthorEmail] = useState(defaultAuthorEmail);
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const shown = hovered || rating;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const response = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          rating: rating || null,
          authorName,
          authorEmail,
          body,
          formStartedAt: mountedAt.current,
          [HONEYPOT_FIELD]: trap,
        }),
      });

      if (!response.ok) {
        setError(
          await messageFromResponse(response, "Couldn't post your comment. Please try again.")
        );
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch {
      setError(networkError());
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-7 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-pine" size={30} />
        <h3 className="font-display text-xl font-semibold text-pine-600">Thanks for reading properly.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-pine-600/85">
          Your comment is with us. We read every one before it goes up (usually within a day) and
          we publish it as you wrote it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 sm:p-7">
      <h3 className="font-display text-xl font-semibold text-ink">Leave a comment</h3>
      <p className="mt-1.5 text-sm text-ink-500">
        No account needed. Comments are moderated for spam and abuse only.
      </p>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`comment-${HONEYPOT_FIELD}`}>Company website</label>
        <input
          id={`comment-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="field-label">
          Rate this piece <span className="font-normal text-ink-400">(optional)</span>
        </legend>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-0.5" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(rating === value ? 0 : value)}
                onMouseEnter={() => setHovered(value)}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                aria-pressed={rating === value}
                className="rounded-full p-1 transition-transform hover:scale-110 motion-reduce:hover:scale-100"
              >
                <Star
                  size={26}
                  className={clsx(
                    "transition-colors",
                    value <= shown ? "fill-gold text-gold" : "fill-transparent text-ink-300"
                  )}
                />
              </button>
            ))}
          </div>
          {shown > 0 && <span className="text-sm font-medium text-ink-500">{RATING_LABELS[shown]}</span>}
        </div>
      </fieldset>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="comment-name" className="field-label">
            Your name
          </label>
          <input
            id="comment-name"
            required
            maxLength={80}
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            className="field"
            placeholder="Ananya I."
          />
        </div>
        <div>
          <label htmlFor="comment-email" className="field-label">
            Email
          </label>
          <input
            id="comment-email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            className="field"
            placeholder="you@email.com"
          />
          <p className="mt-1.5 text-xs text-ink-400">Never published. Only used if we reply.</p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="comment-body" className="field-label">
          Your comment
        </label>
        <textarea
          id="comment-body"
          required
          rows={5}
          minLength={10}
          maxLength={3000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="field"
          placeholder="Been to this place? Disagree with something here? Say so, we'd rather know."
        />
        <p className="mt-1.5 text-xs text-ink-400">{body.length} / 3000</p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-accent mt-5 w-full py-3 sm:w-auto sm:px-8">
        {status === "loading" ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
