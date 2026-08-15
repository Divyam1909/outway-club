"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NETWORK_ERROR, friendlyError } from "@/lib/error-messages";

const MIN_PASSWORD_LENGTH = 8;

/** Never send anyone off-site on the strength of a query parameter. */
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where they were going before they were asked to make an account. Carried
  // through the confirmation link too, so the email lands them in checkout
  // rather than on an empty bookings page.
  const redirect = safeRedirect(searchParams.get("redirect"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });

      if (signUpError) {
        setError(
          friendlyError(signUpError, "account", "We couldn't create your account. Please try again.")
        );
        setLoading(false);
        return;
      }

      // Whether a session comes back is decided in the Supabase dashboard, not
      // here: with "Confirm email" ON, signUp returns a user and no session, and
      // the inbox panel below is correct. With it OFF, the account is live
      // immediately — and telling that person to go and check their email would
      // strand them on a dead-end screen waiting for a mail that never sends.
      if (data.session) {
        router.push(redirect);
        // Server components still holding the signed-out render need to be
        // rebuilt, or /account would paint as though nobody were signed in.
        router.refresh();
        return;
      }

      setDone(true);
      setLoading(false);
    } catch (caught) {
      // Rejects on both a dead connection and a rate limit — let friendlyError
      // tell them apart rather than always blaming the network.
      setError(friendlyError(caught, "account", NETWORK_ERROR));
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6">
        <MailCheck className="mb-3 text-pine" size={26} />
        <p className="heading-sm text-lg text-pine-600">Almost there</p>
        <p className="mt-2 text-sm leading-relaxed text-pine-600/85">
          Check <strong>{email}</strong> for a confirmation link to activate your account. It can
          take a minute to arrive, check spam if it doesn&apos;t.
          {redirect.startsWith("/booking/") &&
            " The link brings you straight back to your booking — your dates and traveller count are still held."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="field-label">
          Full name
        </label>
        <input
          id="signup-name"
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="field"
          placeholder="As it appears on your ID"
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="field-label">
          Email
        </label>
        <input
          id="signup-email"
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
        <label htmlFor="signup-password" className="field-label">
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={reveal ? "text" : "password"}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field pr-14"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink/5 hover:text-ink-700"
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
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs leading-relaxed text-ink-500">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-ink-500 underline underline-offset-2 hover:text-pine">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-ink-500 underline underline-offset-2 hover:text-pine">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-pine hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
