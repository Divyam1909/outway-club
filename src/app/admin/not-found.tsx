import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

/**
 * Covers every `notFound()` in the console — editing a trip, post,
 * destination or booking that has since been deleted. Almost always means a
 * stale tab or a bookmark to something removed, so say that rather than
 * showing a bare 404.
 */
export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-white p-8 text-center shadow-card">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-300 text-ink-500">
        <SearchX size={24} />
      </span>

      <h1 className="font-display text-2xl font-semibold text-ink">That record isn&apos;t there</h1>

      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        Whatever you opened has been deleted, or the link points at an id that never existed. If
        you had this tab open for a while, someone may have removed it since.
      </p>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/admin" className="btn-primary">
          Back to dashboard
        </Link>
        <Link href="/admin/bookings" className="btn-outline">
          View bookings
        </Link>
      </div>
    </div>
  );
}
