"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { ContactFootnote, MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

/**
 * Catches anything thrown while rendering a page — most often a Supabase query
 * failing, since every loader in src/lib/data.ts rethrows.
 *
 * Without this file Next.js shows its own error screen: in production a bare
 * "Application error: a server-side exception has occurred" plus a digest hash,
 * which reads as a crash and gives the visitor nothing to do. This says what
 * happened, offers a retry, and keeps the way out visible.
 *
 * The underlying error is deliberately not rendered — it can carry table names
 * and query fragments. It goes to the console (and to the platform's logs in
 * production) where it's useful, with the digest shown so a customer can quote
 * it to us.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <MessagePage
      eyebrow="Something broke"
      title="This page didn't load"
      actions={
        <>
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCw size={16} /> Try again
          </button>
          <Link href="/" className="btn-outline">
            Back to home
          </Link>
        </>
      }
      footnote={
        <>
          <ContactFootnote
            email={site.email}
            prefix="If trying again doesn't help, email us at"
          />
          {error.digest && (
            <p className="mt-2">
              Quoting this reference helps us find it fast:{" "}
              <code className="rounded bg-cream-300 px-1.5 py-0.5 font-mono text-[11px] text-ink-500">
                {error.digest}
              </code>
            </p>
          )}
        </>
      }
    >
      <p>
        The problem is on our side, not yours, and nothing you were doing has been lost. Most of
        the time this clears on a retry.
      </p>
      <p className="mt-3">
        If you were in the middle of a booking, no payment has been taken — check{" "}
        <Link href="/account" className="font-medium text-pine underline underline-offset-2">
          your bookings
        </Link>{" "}
        before trying again.
      </p>
    </MessagePage>
  );
}
