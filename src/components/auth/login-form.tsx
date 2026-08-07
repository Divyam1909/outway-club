"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NETWORK_ERROR, friendlyError } from "@/lib/error-messages";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const linkError = safeLinkMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(
          friendlyError(signInError, "account", "We couldn't sign you in. Please try again.")
        );
        setLoading(false);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (caught) {
      // signInWithPassword rejects rather than returning an error for network
      // failures *and* for rate limiting. Without this the button would sit on
      // "Signing in…" forever; friendlyError then tells the two apart, so a
      // throttled sign-in isn't blamed on the user's connection.
      setError(friendlyError(caught, "account", NETWORK_ERROR));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {linkError && !error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {linkError}
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="field-label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
          placeholder="you@email.com"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="login-password" className="field-label !mb-0">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-pine hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={reveal ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field pr-11"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "Signing in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-ink-500">
        New to Outway Club?{" "}
        <Link href="/signup" className="font-medium text-pine hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

/** Never bounce a signed-in user to an off-site URL supplied in a query param. */
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

/**
 * `?error=` is written by /auth/callback, which already translates provider
 * wording into our own copy. But anyone can craft that URL, and whatever it
 * says appears above a password field wearing our styling — prime real estate
 * for "call this number to verify your account".
 *
 * React escapes the text so there's no injection risk; the risk is social. A
 * length cap keeps it to a sentence, and anything with a link or a phone
 * number in it is replaced rather than shown.
 */
function safeLinkMessage(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const looksLikeLure = /https?:\/\/|www\.|@|\+?\d[\d\s().-]{7,}/i.test(trimmed);
  if (looksLikeLure || trimmed.length > 200) {
    return "That link didn't work. Please sign in below, or request a new one.";
  }

  return trimmed;
}
