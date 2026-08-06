import Image from "next/image";
import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDateRange } from "@/lib/utils";
import type { Booking } from "@/lib/types";

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  confirmed: "pine",
  pending: "gold",
  cancelled: "ink",
  completed: "ink",
};

export function BookingListItem({ booking }: { booking: Booking }) {
  if (!booking.trip) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-28">
        <Image src={booking.trip.hero_image} alt={booking.trip.title} fill sizes="120px" className="object-cover" />
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/trips/${booking.trip.slug}`} className="font-display text-lg font-semibold text-ink hover:text-pine">
            {booking.trip.title}
          </Link>
          <Badge tone={STATUS_TONE[booking.status] ?? "ink"} className="capitalize">
            {booking.status}
          </Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
          {booking.departure && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> {formatDateRange(booking.departure.start_date, booking.departure.end_date)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={13} /> {booking.num_travelers} traveler{booking.num_travelers !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="font-display text-lg font-semibold text-ink">{formatINR(booking.total_amount)}</p>
        <p className="text-xs capitalize text-ink-400">{booking.payment_status}</p>
      </div>
    </div>
  );
}
