"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NETWORK_ERROR, friendlyError } from "@/lib/error-messages";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionState, setSessionState] = useState<"checking" | "valid" | "invalid">("checking");

  // The recovery link lands on /auth/callback, which exchanges the code for a
  // session and forwards here. If someone opens this page cold there is no
  // session to update, so say that plainly instead of failing on submit.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSessionState(data.session ? "valid" : "invalid");
      })
      // An unhandled rejection here would leave the page on "Checking your
      // reset link…" indefinitely. Treat an unreadable session as no session:
      // the invalid branch tells them what to do and offers a fresh link.
      .catch(() => setSessionState("invalid"));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(
          friendlyError(updateError, "account", "We couldn't update your password. Please try again.")
        );
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
      router.refresh();
    } catch (caught) {
      // Rejects on both a dead connection and a rate limit — let friendlyError
      // tell them apart rather than always blaming the network.
      setError(friendlyError(caught, "account", NETWORK_ERROR));
      setLoading(false);
    }
  }

  if (sessionState === "checking") {
    return <p className="text-sm text-ink-400">Checking your reset link…</p>;
  }

  if (sessionState === "invalid") {
    return (
      <div className="rounded-2xl border border-clay-100 bg-clay-50 p-6">
        <p className="font-display text-lg font-semibold text-clay-600">This link has expired</p>
        <p className="mt-2 text-sm leading-relaxed text-clay-700/80">
          Password reset links are valid for one hour and can only be used once. Request a fresh one
          and it&apos;ll be in your inbox in a few seconds.
        </p>
        <Link href="/forgot-password" className="btn-accent mt-6 w-full">
          Send a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6">
        <CheckCircle2 className="mb-3 text-pine" size={26} />
        <p className="font-display text-lg font-semibold text-pine-600">Password updated</p>
        <p className="mt-2 text-sm leading-relaxed text-pine-600/85">
          You&apos;re signed in on this device. Any other devices have been signed out.
        </p>
        <Link href="/account" className="btn-primary mt-6 w-full">
          Go to my bookings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="field-label">
          New password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={reveal ? "text" : "password"}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field pr-11"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
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

      <div>
        <label htmlFor="confirm-password" className="field-label">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type={reveal ? "text" : "password"}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="field"
          placeholder="Type it again"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
