import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDateRange, seatsLeft, CATEGORY_LABELS } from "@/lib/utils";
import type { TripWithDepartures } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  open: "Seats open",
  filling_fast: "Filling fast",
  sold_out: "Sold out",
};

const STATUS_TONE: Record<string, "pine" | "clay" | "ink"> = {
  open: "pine",
  filling_fast: "clay",
  sold_out: "ink",
};

export function GroupTripCard({ trip }: { trip: TripWithDepartures }) {
  const nextDeparture = trip.departures[0];

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-card sm:grid-cols-[16rem_1fr]"
    >
      <div className="relative aspect-[4/3] sm:aspect-auto">
        <Image
          src={trip.hero_image}
          alt={trip.title}
          fill
          sizes="(min-width: 640px) 16rem, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="pine">{CATEGORY_LABELS[trip.category] ?? trip.category}</Badge>
          <span className="font-display text-lg font-semibold text-ink">
            {formatINR(trip.discounted_price ?? trip.price_per_person)}
            <span className="ml-1 text-xs font-normal text-ink-400">/ person</span>
          </span>
        </div>

        <h3 className="font-display text-xl font-semibold text-ink group-hover:text-pine">
          {trip.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={14} /> {trip.destination.name} · {trip.duration_days}D/{trip.duration_nights}N
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {trip.departures.slice(0, 3).map((departure) => (
            <div
              key={departure.id}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs"
            >
              <Calendar size={13} className="text-ink-400" />
              <span className="font-medium text-ink-700">
                {formatDateRange(departure.start_date, departure.end_date)}
              </span>
              <span className="h-1 w-1 rounded-full bg-ink-300" />
              <span className="flex items-center gap-1 text-ink-500">
                <Users size={12} /> {seatsLeft(departure.total_seats, departure.seats_booked)} left
              </span>
              <Badge tone={STATUS_TONE[departure.status]} className="!px-2 !py-0.5">
                {STATUS_LABEL[departure.status]}
              </Badge>
            </div>
          ))}
          {trip.departures.length === 0 && (
            <p className="text-xs text-ink-400">No upcoming departures — check back soon.</p>
          )}
        </div>

        {nextDeparture && (
          <p className="mt-auto pt-2 text-xs text-ink-400">
            {trip.departures.length} upcoming departure{trip.departures.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
