import type { Metadata } from "next";
import Link from "next/link";
import { ContactFootnote, MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Trip not available",
  robots: { index: false, follow: false },
};

/**
 * Someone reached checkout for a trip that no longer resolves. Nothing has
 * been charged at this point — say so plainly, because "booking" in the URL
 * makes people assume otherwise.
 */
export default function BookingTripNotFound() {
  return (
    <MessagePage
      eyebrow="Can't book this"
      title="This trip isn't open for booking"
      actions={
        <>
          <Link href="/trips" className="btn-primary">
            See what&apos;s running
          </Link>
          <Link href="/upcoming" className="btn-outline">
            Join the waitlist
          </Link>
        </>
      }
      footnote={
        <ContactFootnote email={site.email} prefix="Think this is wrong? Reach us at" />
      }
    >
      <p>
        <strong className="font-semibold text-ink-700">You haven&apos;t been charged.</strong> The
        escape you tried to book has either already run or been closed while we rework its dates.
      </p>
    </MessagePage>
  );
}
