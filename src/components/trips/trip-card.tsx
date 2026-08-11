import Link from "next/link";
import { MapPin, Clock, CalendarDays, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR, editionLabel, CATEGORY_LABELS } from "@/lib/utils";
import { format } from "date-fns";
import type { Departure, Trip } from "@/lib/types";

/** Within this many days of departure, the card starts nudging urgency. */
const URGENCY_WINDOW_DAYS = 14;

/** "Only 6 days left", "Only 1 day left", "Departing today" — or nothing. */
function urgencyLabel(nextDeparture: Departure | undefined): string | null {
  if (!nextDeparture) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(nextDeparture.start_date);
  const daysLeft = Math.round((start.getTime() - today.getTime()) / 86_400_000);

  if (daysLeft < 0 || daysLeft > URGENCY_WINDOW_DAYS) return null;
  if (daysLeft === 0) return "Departing today";
  if (daysLeft === 1) return "Only 1 day left";
  return `Only ${daysLeft} days left`;
}

/**
 * The catalogue's unit. Given a trip that carries its departures, the card
 * also advertises the next few dates: one trip running four weekends should
 * read as four chances to go, not one ambiguous listing.
 */
export function TripCard({ trip }: { trip: Trip & { departures?: Departure[] } }) {
  const hasDiscount = Boolean(
    trip.discounted_price && trip.discounted_price < trip.price_per_person
  );
  const hasReviews = trip.review_count > 0;
  const edition = editionLabel(trip);

  const departures = trip.departures ?? [];
  const upcoming = departures.slice(0, 3);
  const moreCount = Math.max(departures.length - upcoming.length, 0);
  const soldOut = departures.length === 0 && trip.is_group_trip;
  const urgency = urgencyLabel(upcoming[0]);

  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="card-lift group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <SmartImage
          src={trip.hero_image}
          alt={trip.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
          fallbackLabel={trip.destination?.name}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {edition ? (
            <Badge tone="gold" className="bg-white/95 text-pine-700 shadow-soft">
              {edition}
            </Badge>
          ) : (
            <Badge tone="pine" className="bg-white/95 text-pine-600 shadow-soft">
              {CATEGORY_LABELS[trip.category] ?? trip.category}
            </Badge>
          )}
        </div>
        {(urgency || hasDiscount) && (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {urgency && (
              <span className="flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream-100 shadow-soft animate-pulse-slow">
                <Flame size={11} className="text-gold" /> {urgency}
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-full bg-clay px-3 py-1 text-xs font-bold text-cream-100 shadow-soft">
                Save {formatINR(trip.price_per_person - (trip.discounted_price ?? 0))}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-500">
          <MapPin size={13} />
          {trip.destination?.name ?? trip.destination?.region}
        </div>

        <h3 className="heading-sm text-lg leading-snug text-ink group-hover:text-pine">
          {trip.title}
        </h3>

        <div className="flex items-center gap-3 text-sm text-ink-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {trip.duration_days}D/{trip.duration_nights}N
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-200" />
          <span className="capitalize">{trip.difficulty}</span>
        </div>

        {upcoming.length > 0 && (
          <div className="flex items-start gap-1.5 text-sm text-ink-500">
            <CalendarDays size={14} className="mt-0.5 shrink-0 text-clay" />
            <span>
              {upcoming.map((d) => format(new Date(d.start_date), "d MMM")).join(" · ")}
              {moreCount > 0 && (
                <span className="text-ink-500"> +{moreCount} more</span>
              )}
            </span>
          </div>
        )}

        {soldOut && (
          <p className="text-sm text-ink-500">No dates open, join the waitlist</p>
        )}

        {hasReviews && (
          <div className="flex items-center gap-2">
            <RatingStars rating={trip.rating} />
            <span className="text-xs text-ink-500">
              {trip.rating.toFixed(1)} ({trip.review_count})
            </span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-ink-500">From</p>
            <div className="flex items-baseline gap-2">
              <span className="heading-sm text-xl text-ink">
                {formatINR(trip.discounted_price ?? trip.price_per_person)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-ink-400 line-through">
                  {formatINR(trip.price_per_person)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-500">per person</p>
          </div>
          <span className="btn-ghost btn-sm">View trip</span>
        </div>
      </div>
    </Link>
  );
}
