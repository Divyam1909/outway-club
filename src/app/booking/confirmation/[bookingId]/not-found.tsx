import type { Metadata } from "next";
import Link from "next/link";
import { MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Booking not found",
  robots: { index: false, follow: false },
};

/**
 * The most alarming 404 on the site: someone has just paid and the booking
 * they were sent to isn't loading.
 *
 * `getBookingById` runs under the caller's session and RLS scopes it to their
 * own rows, so this page is reached both when the id is genuinely unknown and
 * when it belongs to somebody else. Either way the customer's real question is
 * "has my money gone?" — so answer that first, before anything else.
 */
export default function BookingNotFound() {
  return (
    <MessagePage
      eyebrow="Booking not found"
      title="We can't find that booking"
      actions={
        <>
          <Link href="/account" className="btn-primary">
            See all my bookings
          </Link>
          <Link href="/contact" className="btn-outline">
            Contact us
          </Link>
        </>
      }
      footnote={
        <p>
          Email{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-medium text-pine underline underline-offset-2 hover:text-pine-600"
          >
            {site.email}
          </a>{" "}
          with your payment ID and we&apos;ll confirm it by hand the same day.
        </p>
      }
    >
      <p>
        <strong className="font-semibold text-ink-700">
          If you&apos;ve just paid, your money is safe.
        </strong>{" "}
        A payment and its booking record are never lost together, the charge is with Razorpay
        regardless of what this page shows.
      </p>
      <p className="mt-3">
        This reference either doesn&apos;t exist or belongs to a different account. Check{" "}
        <Link href="/account" className="font-medium text-pine underline underline-offset-2">
          your bookings
        </Link>{" "}
        first. If it isn&apos;t listed there, send us the payment ID from your bank or UPI app and
        we&apos;ll sort it out.
      </p>
    </MessagePage>
  );
}
