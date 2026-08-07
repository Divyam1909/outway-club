"use client";

import { useRef, useState, type FormEvent } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/rate-limit";
import { messageFromResponse, networkError } from "@/lib/error-messages";

/**
 * Signup for "tell me when the next escape opens".
 *
 * `variant="dark"` is the footer treatment on pine; `variant="light"` is used
 * on cream sections such as the upcoming-escapes page.
 */
export function NewsletterForm({
  source = "footer",
  variant = "dark",
  buttonLabel = "Notify me",
}: {
  source?: "footer" | "upcoming" | "trip" | "home" | "blog";
  variant?: "dark" | "light";
  buttonLabel?: string;
}) {
  const mountedAt = useRef(Date.now());
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const dark = variant === "dark";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source,
          formStartedAt: mountedAt.current,
          [HONEYPOT_FIELD]: trap,
        }),
      });

      if (!response.ok) {
        setError(await messageFromResponse(response, "We couldn't add you just now — try again."));
        setStatus("idle");
        return;
      }

      setStatus("done");
      setEmail("");
    } catch {
      setError(networkError());
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p
        className={clsx(
          "flex items-center gap-2 text-sm font-medium",
          dark ? "text-gold" : "text-pine"
        )}
      >
        <Check size={16} /> You&apos;re on the list — we&apos;ll write before anyone else hears.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${source}-${HONEYPOT_FIELD}`}>Company website</label>
        <input
          id={`${source}-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`${source}-newsletter-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${source}-newsletter-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={clsx(
            "w-full rounded-full px-4 py-2.5 text-sm transition-colors focus:outline-none",
            dark
              ? "border border-cream-100/20 bg-cream-100/10 text-cream-100 placeholder:text-cream-100/40 focus:border-gold"
              : "border border-border bg-white text-ink placeholder:text-ink-300 focus:border-pine"
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={clsx(
            "btn shrink-0 px-6 py-2.5 text-sm",
            dark
              ? "bg-gold text-pine-700 hover:bg-gold-400 disabled:opacity-60"
              : "bg-pine text-cream-100 hover:bg-pine-600 disabled:opacity-60"
          )}
        >
          {status === "loading" ? "Adding…" : buttonLabel}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className={clsx("mt-2 text-xs", dark ? "text-clay-100" : "text-clay-600")}
        >
          {error}
        </p>
      )}
    </form>
  );
}
