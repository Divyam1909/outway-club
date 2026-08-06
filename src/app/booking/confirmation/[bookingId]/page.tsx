import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Calendar, Users, Receipt } from "lucide-react";
import { Container } from "@/components/ui/container";
import { getBookingById } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatINR, formatDate, formatDateRange } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking confirmed" };

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
              A confirmation has been recorded against your account. Reference:{" "}
              <span className="font-mono text-ink-700">{booking.id.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>

          <div className="mt-8 flex gap-4 border-t border-border pt-6">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl">
              <Image src={booking.trip.hero_image} alt={booking.trip.title} fill sizes="96px" className="object-cover" />
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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/account" className="btn-primary flex-1">
              View my bookings
            </Link>
            <Link href="/trips" className="btn-outline flex-1">
              Browse more trips
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
