"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { HONEYPOT_FIELD } from "@/lib/rate-limit";
import { messageFromResponse } from "@/lib/error-messages";
import { site } from "@/config/site";

export function ContactForm({ tripId, tripTitle }: { tripId?: string; tripTitle?: string }) {
  const mountedAt = useRef(Date.now());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    tripTitle ? `Hi, I'd like to know more about ${tripTitle}.` : ""
  );
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          tripId: tripId ?? null,
          formStartedAt: mountedAt.current,
          [HONEYPOT_FIELD]: trap,
        }),
      });

      if (!response.ok) {
        setError(
          await messageFromResponse(
            response,
            `We couldn't send that just now. Please try again, or email us directly at ${site.email}.`
          )
        );
        setStatus("idle");
        return;
      }

      setStatus("done");
    } catch {
      setError(
        `We couldn't reach the server. Check your connection and try again — or email us directly at ${site.email}.`
      );
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6">
        <CheckCircle2 className="mb-3 text-pine" size={26} />
        <p className="font-display text-lg font-semibold text-pine-600">
          Thanks — we&apos;ve got your message.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-pine-600/85">
          A confirmation is on its way to <strong>{email}</strong>. A real person reads every
          message and replies within {site.responseTime}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {tripTitle && (
        <div className="rounded-xl bg-cream-300 px-4 py-3 text-sm text-ink-700">
          Asking about: <span className="font-semibold">{tripTitle}</span>
        </div>
      )}

      {/* Honeypot — hidden from people, irresistible to form bots. */}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">
            Name
          </label>
          <input
            id="contact-name"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="field-label">
            Phone <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="field"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="field-label">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          minLength={10}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="field"
          placeholder="Dates you're thinking about, how many of you, anything you want to check before booking…"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "loading"} className="btn-accent w-full py-3.5 text-base">
        {status === "loading" ? "Sending…" : "Send message"}
      </button>

      <p className="text-center text-xs text-ink-400">
        We only use your details to answer this message. See our{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-pine">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
