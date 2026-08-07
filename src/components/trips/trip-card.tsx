import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR, CATEGORY_LABELS } from "@/lib/utils";
import type { Trip } from "@/lib/types";

export function TripCard({ trip }: { trip: Trip }) {
  const hasDiscount = Boolean(trip.discounted_price && trip.discounted_price < trip.price_per_person);
  const hasReviews = trip.review_count > 0;

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
          <Badge tone="pine" className="bg-white/95 text-pine-600 shadow-soft">
            {CATEGORY_LABELS[trip.category] ?? trip.category}
          </Badge>
          {trip.is_group_trip && (
            <Badge tone="gold" className="bg-white/95 shadow-soft">
              Small group
            </Badge>
          )}
        </div>
        {hasDiscount && (
          <div className="absolute right-3 top-3 rounded-full bg-clay px-3 py-1 text-xs font-bold text-cream-100 shadow-soft">
            Save {formatINR(trip.price_per_person - (trip.discounted_price ?? 0))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
          <MapPin size={13} />
          {trip.destination?.name ?? trip.destination?.region}
        </div>

        <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-pine">
          {trip.title}
        </h3>

        <div className="flex items-center gap-3 text-sm text-ink-500">
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {trip.duration_days}D/{trip.duration_nights}N
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-300" />
          <span className="capitalize">{trip.difficulty}</span>
        </div>

        {hasReviews && (
          <div className="flex items-center gap-2">
            <RatingStars rating={trip.rating} />
            <span className="text-xs text-ink-400">
              {trip.rating.toFixed(1)} ({trip.review_count})
            </span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-ink-400">From</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-semibold text-ink">
                {formatINR(trip.discounted_price ?? trip.price_per_person)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-ink-300 line-through">
                  {formatINR(trip.price_per_person)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-400">per person</p>
          </div>
          <span className="btn-ghost !px-3 !py-1.5 text-xs">View trip</span>
        </div>
      </div>
    </Link>
  );
}
