import type { Metadata } from "next";
import Link from "next/link";
import { ContactFootnote, MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/**
 * Replaces Next.js's stock black-on-white "404 · This page could not be
 * found", which tells a visitor nothing except that something is broken.
 *
 * Segments with a more specific story — a trip, a journal post, a destination —
 * have their own not-found.tsx nearer the route and never reach this one.
 */
export default function NotFound() {
  return (
    <MessagePage
      eyebrow="Nothing here"
      title="We couldn't find that page"
      actions={
        <>
          <Link href="/trips" className="btn-primary">
            Browse the escapes
          </Link>
          <Link href="/" className="btn-outline">
            Back to home
          </Link>
        </>
      }
      footnote={<ContactFootnote email={site.email} prefix="Followed a link that should work? Tell us at" />}
    >
      <p>
        The address you opened doesn&apos;t match anything on the site. It may have been moved or
        renamed since the link was made, or there may be a typo in it.
      </p>
    </MessagePage>
  );
}
