import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Calendar, PenLine, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { formatINR, formatDateRange } from "@/lib/utils";
import { refundPercentFor } from "@/config/site";
import type { Booking } from "@/lib/types";

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  confirmed: "pine",
  pending: "gold",
  cancelled: "ink",
  completed: "ink",
};

const PAYMENT_LABEL: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  refund_pending: "Refund processing",
  refunded: "Refunded",
  failed: "Payment failed",
};

export function BookingListItem({ booking }: { booking: Booking }) {
  if (!booking.trip) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = booking.departure ? new Date(booking.departure.start_date) : null;
  const endDate = booking.departure ? new Date(booking.departure.end_date) : null;

  const daysBeforeDeparture = startDate ? differenceInCalendarDays(startDate, today) : null;

  const isActive = booking.status === "confirmed" || booking.status === "pending";
  const hasDeparted = endDate ? endDate < today : false;

  const canCancel = isActive && !hasDeparted;
  const canReview = booking.payment_status === "paid" && isActive && hasDeparted;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-soft sm:flex-row sm:items-center">
      <Link
        href={`/trips/${booking.trip.slug}`}
        className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28"
      >
        <SmartImage
          src={booking.trip.hero_image}
          alt={booking.trip.title}
          fill
          sizes="(min-width: 640px) 112px, 100vw"
          className="object-cover"
        />
      </Link>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/trips/${booking.trip.slug}`}
            className="font-display text-lg font-semibold text-ink hover:text-pine"
          >
            {booking.trip.title}
          </Link>
          <Badge tone={STATUS_TONE[booking.status] ?? "ink"} className="capitalize">
            {booking.status}
          </Badge>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
          {booking.departure && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />{" "}
              {formatDateRange(booking.departure.start_date, booking.departure.end_date)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={13} /> {booking.num_travelers} traveller
            {booking.num_travelers !== 1 ? "s" : ""}
          </span>
          <span className="font-mono text-xs uppercase text-ink-400">
            {booking.id.slice(0, 8)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {canReview && (
            <Link
              href={`/trips/${booking.trip.slug}/review`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-clay hover:underline"
            >
              <PenLine size={13} /> Write a review
            </Link>
          )}
          {canCancel && (
            <CancelBookingButton
              bookingId={booking.id}
              tripTitle={booking.trip.title}
              totalAmount={Number(booking.total_amount)}
              refundPercent={
                booking.payment_status === "paid" ? refundPercentFor(daysBeforeDeparture ?? 999) : 0
              }
              daysBeforeDeparture={daysBeforeDeparture}
            />
          )}
        </div>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <p className="font-display text-lg font-semibold text-ink">
          {formatINR(booking.total_amount)}
        </p>
        <p className="text-xs text-ink-400">
          {PAYMENT_LABEL[booking.payment_status] ?? booking.payment_status}
        </p>
        {booking.status === "cancelled" && booking.refund_amount !== null && (
          <p className="mt-1 text-xs font-medium text-pine">
            {formatINR(Number(booking.refund_amount))} refunded
          </p>
        )}
      </div>
    </div>
  );
}
