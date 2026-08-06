"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-5 text-sm text-pine-600">
        Almost there — check <strong>{email}</strong> for a confirmation link to activate your
        account.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Full name</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-pine focus:outline-none"
          placeholder="Ananya Iyer"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-pine focus:outline-none"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-pine focus:outline-none"
          placeholder="At least 6 characters"
        />
      </div>

      {error && <p className="text-sm text-clay-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-pine hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
