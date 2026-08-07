"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NETWORK_ERROR, friendlyError } from "@/lib/error-messages";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      // Deliberately don't surface "no such user" — that would let anyone probe
      // which email addresses have accounts. Rate limiting is handled upstream
      // by Supabase Auth.
      if (resetError && !/user not found/i.test(resetError.message)) {
        setError(
          friendlyError(resetError, "account", "We couldn't send that link. Please try again.")
        );
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (caught) {
      // Rejects on both a dead connection and a rate limit — let friendlyError
      // tell them apart rather than always blaming the network.
      setError(friendlyError(caught, "account", NETWORK_ERROR));
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6">
        <MailCheck className="mb-3 text-pine" size={26} />
        <p className="font-display text-lg font-semibold text-pine-600">Check your inbox</p>
        <p className="mt-2 text-sm leading-relaxed text-pine-600/85">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your
          password. It expires in one hour.
        </p>
        <p className="mt-4 text-sm text-pine-600/70">
          Nothing after a few minutes? Check spam, then{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-pine underline underline-offset-2"
          >
            try another address
          </button>
          .
        </p>
        <Link href="/login" className="btn-outline mt-6 w-full">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reset-email" className="field-label">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
          placeholder="you@email.com"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "Sending link…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-ink-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-pine hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
