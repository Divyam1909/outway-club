import type { Metadata } from "next";
import Link from "next/link";
import { ContactFootnote, MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Trip not found",
  robots: { index: false, follow: false },
};

/**
 * Shown when a trip slug matches nothing, or matches a trip that has been
 * unpublished. Both are far more likely to be a sold-out or retired escape
 * than a typo, so the copy sends people to what *is* running rather than
 * telling them the URL is wrong.
 */
export default function TripNotFound() {
  return (
    <MessagePage
      eyebrow="Escape not found"
      title="This trip isn't available"
      actions={
        <>
          <Link href="/trips" className="btn-primary">
            See what&apos;s running
          </Link>
          <Link href="/trips#notify" className="btn-outline">
            Join the waitlist
          </Link>
        </>
      }
      footnote={
        <ContactFootnote
          email={site.email}
          prefix="Booked on this trip and can't find it? Email us at"
        />
      }
    >
      <p>
        We couldn&apos;t find this escape. It may have already run, or been taken down while we
        rework the dates. We only ever have a handful open at once.
      </p>
    </MessagePage>
  );
}
