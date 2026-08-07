"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Admin-side error boundary.
 *
 * The audience here is the person running the business, not a customer, so
 * this one names the likely cause and shows the digest without being asked —
 * an admin can act on "your session expired" or hand a reference to us, where
 * a traveller can only be alarmed by it. The raw message is still withheld
 * from the page and sent to the console instead.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-clay-100 bg-white p-8 text-center shadow-card">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
        <AlertTriangle size={24} />
      </span>

      <h1 className="font-display text-2xl font-semibold text-ink">This screen didn&apos;t load</h1>

      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        The console couldn&apos;t read from the database. Nothing has been changed or deleted —
        this is a read failure, not a write one.
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        The usual causes are an expired sign-in or a brief Supabase outage. Try again first; if it
        persists, sign out and back in.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCw size={16} /> Try again
        </button>
        <Link href="/admin" className="btn-outline">
          Back to dashboard
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-ink-400">
          Reference:{" "}
          <code className="rounded bg-cream-300 px-1.5 py-0.5 font-mono text-[11px]">
            {error.digest}
          </code>
        </p>
      )}
    </div>
  );
}
