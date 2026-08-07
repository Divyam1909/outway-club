import type { Metadata } from "next";
import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Calendar, Mail, Users, Receipt } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getBookingById } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatINR, formatDate, formatDateRange } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/login?redirect=/booking/confirmation/${bookingId}`);

  const booking = await getBookingById(bookingId);
  if (!booking || !booking.trip) notFound();

  const receiptEmail = booking.contact_email ?? currentUser.user.email;

  return (
    <div className="py-14">
      <Container className="max-w-2xl">
        <div className="rounded-3xl border border-border bg-white p-8 shadow-card sm:p-10">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine-50 text-pine">
              <CheckCircle2 size={30} />
            </span>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Booking confirmed
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Your seat is paid for and held. Reference:{" "}
              <span className="font-mono font-semibold text-ink-700">
                {booking.id.slice(0, 8).toUpperCase()}
              </span>
            </p>
            {receiptEmail && (
              <p className="mt-3 flex items-center gap-2 rounded-full bg-pine-50 px-4 py-2 text-xs text-pine-600">
                <Mail size={13} /> A receipt is on its way to {receiptEmail}
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-4 border-t border-border pt-6">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
              <SmartImage src={booking.trip.hero_image} alt={booking.trip.title} fill sizes="96px" className="object-cover" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink">{booking.trip.title}</p>
              <p className="text-sm text-ink-500">
                {booking.trip.duration_days} days / {booking.trip.duration_nights} nights
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
            {booking.departure && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <Calendar size={14} /> Departure
                </span>
                <span className="font-medium text-ink-700">
                  {formatDateRange(booking.departure.start_date, booking.departure.end_date)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink-500">
                <Users size={14} /> Travelers
              </span>
              <span className="font-medium text-ink-700">{booking.num_travelers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-ink-500">
                <Receipt size={14} /> Booked on
              </span>
              <span className="font-medium text-ink-700">{formatDate(booking.created_at)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
            <span className="font-semibold text-ink">Amount paid</span>
            <span className="font-display text-2xl font-semibold text-ink">
              {formatINR(booking.total_amount)}
            </span>
          </div>

          <div className="mt-7 rounded-2xl bg-cream-300/70 p-5">
            <p className="text-sm font-semibold text-ink">What happens next</p>
            <ol className="mt-2.5 space-y-2 text-sm leading-relaxed text-ink-500">
              <li>1. Keep this reference — it&apos;s what we&apos;ll ask for.</li>
              <li>
                2. A few days before departure we&apos;ll email the reporting point, timings and
                your trip captain&apos;s number.
              </li>
              <li>
                3. Pack an original government photo ID. It&apos;s mandatory at hotel check-in and
                a photo on your phone won&apos;t do.
              </li>
            </ol>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/account" className="btn-primary flex-1">
              View my bookings
            </Link>
            <Link href="/faq" className="btn-outline flex-1">
              Read the FAQs
            </Link>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-ink-400">
            Need to change or cancel? You can do it yourself from My bookings, and you&apos;ll see
            the exact refund first.{" "}
            <Link href="/refund-policy" className="underline underline-offset-2 hover:text-pine">
              Cancellation policy
            </Link>
            .
          </p>
        </div>
      </Container>
    </div>
  );
}
